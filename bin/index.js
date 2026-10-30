#! /usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import fs from "node:fs";
import inquirer from "inquirer";
import ora from "ora";
import { prepareImage, encodeImage, decodeImage, discardPreparation } from "../lib/steg.js";

const controller = new AbortController();
const prompt = inquirer.createPromptModule({ input: process.stdin, output: process.stderr, skipTTYChecks: false });
let quiet = false;
let verbose = false;
let commandExecuted = false;
// The shared Chalk instance also controls Inquirer's prompt colors.
if (Object.hasOwn(process.env, "NO_COLOR") || !process.stderr.isTTY) chalk.level = 0;
const primary = chalk.hex("#B4FA72");
const cancellation = () => Object.assign(new Error("Operation cancelled. No result was saved."), { code: "CANCELLED" });
const helpText = "Prompts require terminal stdin and stderr. Keys: Up/Down selects; Enter confirms; Ctrl+C cancels. No scripted secret-input flags. NO_COLOR disables color. Progress goes to stderr; results go to stdout. This version creates and recovers only the current protected-image format. Earlier protected images are not supported. Old images and plain images can produce the same recovery failure; a failed recovery does not identify which kind of image you selected.";

function terminalText(value, multiline = false) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/g, (character) => {
    if (multiline && character === "\n") return "\n";
    return `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

function checkCancelled() {
  if (controller.signal.aborted) throw cancellation();
}

function requireTerminal() {
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    throw new Error("This action needs a terminal for message and password prompts. Run it in a terminal; use --help for available flags. Scripted secret input is not supported.");
  }
}

function configure(argv) {
  quiet = Boolean(argv.quiet);
  verbose = Boolean(argv.verbose);
  commandExecuted = true;
}

function task(name) {
  process.stderr.write(`${primary("Task:")} ${name}. Ctrl+C cancels.\n`);
}

async function ask(questions) {
  requireTerminal();
  checkCancelled();
  const pending = prompt(questions);
  return new Promise((resolve, reject) => {
    const abort = () => {
      if (pending.ui.answers) {
        pending.ui.answers.password = null;
        pending.ui.answers.confirmPassword = null;
      }
      pending.ui.rl.line = "";
      pending.ui.close();
      reject(cancellation());
    };
    // Inquirer's default SIGINT handler writes to stdout and exits before cleanup.
    pending.ui.rl.removeListener("SIGINT", pending.ui.onForceClose);
    pending.ui.rl.on("SIGINT", () => controller.abort());
    controller.signal.addEventListener("abort", abort, { once: true });
    pending.then(resolve, reject).finally(() => controller.signal.removeEventListener("abort", abort));
    if (controller.signal.aborted) abort();
  });
}

function validatePassword(value) {
  if (!value.length) return "Enter a password.";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return "Enter a valid Unicode password.";
    } else if (code >= 0xdc00 && code <= 0xdfff) return "Enter a valid Unicode password.";
  }
  return Buffer.byteLength(value, "utf8") <= 1024 || "Password must be at most 1,024 UTF-8 bytes.";
}

const passwordQuestion = {
  type: "password", name: "password", message: "Enter password:", mask: "*",
  validate: validatePassword,
};
const imageQuestion = {
  type: "input", name: "filename", message: "Path to the PNG image:",
  transformer: (value) => terminalText(value),
  validate: (value) => value.length > 0 || "Enter a path to a supported PNG.",
};
const outputQuestion = (encrypting) => ({
  type: "input", name: "output", message: encrypting ? "Output PNG path:" : "Output text path (empty displays the message):",
  default: encrypting ? "encoded.png" : "", transformer: (value) => terminalText(value),
  validate: (value) => !encrypting || value.length > 0 || "Enter an output path.",
});

async function confirmOutput(output) {
  if (!output || !fs.existsSync(output)) return;
  const { overwrite } = await ask({
    type: "confirm", name: "overwrite", default: false,
    message: `Replace the existing file ${terminalText(output)} only after success?`,
  });
  if (!overwrite) throw cancellation();
}

function progressDisplay() {
  const stages = {
    reading: "Reading the image",
    "checking inputs": "Checking inputs",
    "preparing text/capacity": "Preparing text and capacity",
    "deriving keys": "Deriving keys",
    encoding: "Encoding",
    recovering: "Recovering",
    "preparing result": "Preparing result",
    saving: "Saving the completed result",
  };
  let stage = stages.reading;
  const spinner = ora({ stream: process.stderr, text: stage, color: "green", isEnabled: !quiet && !Object.hasOwn(process.env, "NO_COLOR") });
  const timer = setTimeout(() => {
    if (!quiet) {
      if (Object.hasOwn(process.env, "NO_COLOR")) process.stderr.write(`${stage}. Ctrl+C cancels.\n`);
      else spinner.start(`${stage}. Ctrl+C cancels.`);
    }
  }, 1000);
  return {
    update(next) {
      stage = stages[next] || stage;
      if (spinner.isSpinning) spinner.text = `${stage}. Ctrl+C cancels.`;
      if (verbose && !quiet) process.stderr.write(`${stage}.\n`);
    },
    stop() { clearTimeout(timer); spinner.stop(); },
  };
}

function requireSuccess(result) {
  if (!result.ok) throw Object.assign(new Error(result.error), { code: result.code });
}

async function encryptCommand(filename, output, compress) {
  let preparation;
  let credentials;
  process.stderr.write("Only opaque, noninterlaced RGB/RGBA8 PNGs are supported.\nPersonal metadata is removed; only approved rendering metadata is preserved.\nSome otherwise valid PNGs are rejected.\nMetadata removal does not prove concealment.\n");
  process.stderr.write("Message editor: save and close the editor to continue. Passwords stay masked.\n");
  const { message } = await ask({ type: "editor", name: "message", message: "Enter the message in your editor:" });
  if (message.length === 0) throw new Error("Message cannot be empty. Enter a message and try again.");
  try {
    let progress = progressDisplay();
    let prepared;
    try {
      prepared = await prepareImage({ imagePath: filename, message, compress }, {
        signal: controller.signal, onProgress: progress.update,
      });
    } finally { progress.stop(); }
    requireSuccess(prepared);
    preparation = prepared.preparation;
    checkCancelled();
    process.stderr.write(`Original: ${prepared.originalBytes} bytes; stored: ${prepared.storedBytes} bytes; maximum: ${prepared.maxStoredBytes} bytes.\nCompression used: ${prepared.compressionUsed ? "yes" : "no"}.\n`);
    process.stderr.write(`${terminalText(prepared.metadataNotice, true)}\n`);
    if (!prepared.hasFrameCapacity) throw new Error("This image has no protected-message frame capacity. Choose a detailed PNG.");
    if (prepared.maxStoredBytes === 0) throw new Error("This image can hold only an empty message. Choose a larger detailed PNG.");
    if (!prepared.fits) throw new Error("The message does not fit this image. Shorten the text, turn on compression, or choose a larger detailed PNG.");
    credentials = await ask([
      passwordQuestion,
      { type: "password", name: "confirmPassword", message: "Confirm password:", mask: "*",
        validate: (value, answers) => value === answers.password || "Passwords do not match. Enter the same password again." },
    ]);
    await confirmOutput(output);
    checkCancelled();
    progress = progressDisplay();
    let result;
    try {
      result = await encodeImage({ preparation, password: credentials.password, outputPath: output }, {
        signal: controller.signal, onProgress: progress.update,
      });
    } finally { progress.stop(); }
    requireSuccess(result);
    checkCancelled();
    process.stdout.write(`Saved PNG: ${terminalText(result.outputPath)}\n`);
    process.stdout.write("Supported rendering information was retained.\nPersonal and non-rendering metadata was removed.\nThis does not make the image anonymous.\nRemoved metadata and PNG encoding can still be detected.\nInputs with unsupported color profiles are rejected.\n");
  } finally {
    if (credentials) { credentials.password = null; credentials.confirmPassword = null; }
    if (preparation) await discardPreparation(preparation);
  }
}

async function decryptCommand(filename, output) {
  let credentials;
  try {
    credentials = await ask(passwordQuestion);
    await confirmOutput(output);
    checkCancelled();
    const progress = progressDisplay();
    let result;
    try {
      result = await decodeImage({ imagePath: filename, password: credentials.password, outputPath: output || undefined }, {
        signal: controller.signal, onProgress: progress.update,
      });
    } finally { progress.stop(); }
    requireSuccess(result);
    checkCancelled();
    if (result.outputPath) {
      process.stdout.write(`Saved message: ${terminalText(result.outputPath)}\n`);
    } else {
      if (result.message === "") process.stderr.write("Authenticated message recovered: empty text.\n");
      else if (!quiet) process.stderr.write("Authenticated message recovered (terminal control characters are escaped):\n");
      const text = terminalText(result.message, true);
      process.stdout.write(text + (process.stdout.isTTY && !text.endsWith("\n") ? "\n" : ""));
    }
  } finally {
    if (credentials) credentials.password = null;
  }
}

function showExamples() {
  process.stdout.write("Examples:\n\n  obscr encrypt -f photo.png -o secret.png --compress\n  obscr decrypt -f secret.png -o message.txt\n  obscr interactive\n\nMessage and password prompts require a terminal.\nKeys: Up/Down selects; Enter confirms; Ctrl+C cancels.\nUse --help for flags. Set NO_COLOR for plain text.\n");
}

async function interactiveMode() {
  requireTerminal();
  task("Choose an action");
  process.stderr.write("Obscr - image messages\nKeys: Up/Down selects; Enter confirms; Ctrl+C cancels.\n");
  const { action } = await ask({
    type: "list", name: "action", message: "Choose an action:",
    choices: [
      { name: "Encrypt and hide a message", value: "encrypt" },
      { name: "Decrypt and extract a message", value: "decrypt" },
      { name: "Show usage examples", value: "examples" },
      { name: "Exit", value: "exit" },
    ],
  });
  if (action === "exit") return;
  if (action === "examples") { showExamples(); return; }
  task(action === "encrypt" ? "Encrypt" : "Decrypt");
  const files = await ask([imageQuestion, outputQuestion(action === "encrypt")]);
  if (action === "encrypt") {
    const { compress } = await ask({ type: "confirm", name: "compress", message: "Compress the message?", default: false });
    await encryptCommand(files.filename, files.output, compress);
  } else {
    await decryptCommand(files.filename, files.output);
  }
}

process.on("SIGINT", () => controller.abort());

try {
  const argv = await yargs(hideBin(process.argv))
    .usage("Usage: obscr <command> [options]")
    .wrap(Math.min(process.stdout.columns || 80, 100))
    .option("verbose", { alias: "v", describe: "Show safe progress details on stderr", type: "boolean", global: true })
    .option("quiet", { alias: "q", describe: "Hide progress; keep results and errors", type: "boolean", global: true })
    .command("encrypt", "Encrypt and hide a message in an image", (command) => command.options({
      f: { alias: "filename", describe: "Supported PNG input", demandOption: true, type: "string" },
      o: { alias: "output", describe: "Output PNG path", default: "encoded.png", type: "string" },
      c: { alias: "compress", describe: "Compress the message before encryption", default: false, type: "boolean" },
    }).epilog(helpText), async (args) => {
      configure(args);
      requireTerminal();
      task("Encrypt");
      await encryptCommand(args.f, args.o, args.c);
    })
    .command("decrypt", "Decrypt and extract a message from an image", (command) => command.options({
      f: { alias: "filename", describe: "Supported PNG input", demandOption: true, type: "string" },
      o: { alias: "output", describe: "Output text path; omit to display text", type: "string" },
    }).epilog(helpText), async (args) => {
      configure(args);
      requireTerminal();
      task("Decrypt");
      await decryptCommand(args.f, args.o);
    })
    .command("interactive", "Start the guided workflow", (command) => command.epilog(helpText), async (args) => {
      configure(args);
      await interactiveMode();
    })
    .command("examples", "Show usage examples", {}, (args) => { configure(args); showExamples(); })
    .epilog(helpText)
    .help().alias("help", "h")
    .version("1.1.1").alias("version", "V")
    .strict().exitProcess(false).showHelpOnFail(false)
    .fail((message, failure) => { throw failure || new Error(message); })
    .parseAsync();
  if (!commandExecuted && !argv.help && !argv.version) {
    configure(argv);
    await interactiveMode();
  }
} catch (failure) {
  const cancelled = controller.signal.aborted || failure.code === "CANCELLED";
  process.stderr.write(`Error: ${terminalText(cancelled ? cancellation().message : failure.message)}\n`);
  process.exitCode = cancelled ? 130 : 1;
}
