#! /usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import fs from "node:fs";
import inquirer from "inquirer";
import ora from "ora";
import { encryptMessageToImage, decryptMessageFromImage } from "../lib/steg.js";

const controller = new AbortController();
const prompt = inquirer.createPromptModule({ input: process.stdin, output: process.stderr, skipTTYChecks: false });
let quiet = false;
let verbose = false;
let commandExecuted = false;
// The shared Chalk instance also controls Inquirer's prompt colors.
if (Object.hasOwn(process.env, "NO_COLOR") || !process.stderr.isTTY) chalk.level = 0;
const primary = chalk.hex("#B4FA72");
const cancellation = () => Object.assign(new Error("Operation cancelled. No result was saved."), { code: "CANCELLED" });
const helpText = "Prompts require terminal stdin and stderr. Keys: Up/Down selects; Enter confirms; Ctrl+C cancels. No scripted secret-input flags. NO_COLOR disables color. Progress goes to stderr; results go to stdout.";

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

const passwordQuestion = {
  type: "password", name: "password", message: "Enter password:", mask: "*",
  validate: (value) => value.length > 0 || "Enter a password.",
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
    admitting: "Checking the PNG",
    processing: "Processing the message",
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
  if (!result.success) throw Object.assign(new Error(result.error), { code: result.code });
}

async function encryptCommand(filename, output, compress, message, password) {
  if (!message || !message.trim()) throw new Error("Message cannot be empty. Enter a message and try again.");
  await confirmOutput(output);
  checkCancelled();
  const progress = progressDisplay();
  let result;
  try {
    result = await encryptMessageToImage(filename, message, password, output, {
      compress, signal: controller.signal, onProgress: progress.update,
    });
  } finally { progress.stop(); }
  requireSuccess(result);
  process.stdout.write(`Saved PNG: ${terminalText(result.outputPath)}\n`);
  process.stdout.write("Supported rendering information was retained.\nPersonal and non-rendering metadata was removed.\nThis does not make the image anonymous.\nRemoved metadata and PNG encoding can still be detected.\nInputs with unsupported color profiles are rejected.\n");
  if (verbose && !quiet) process.stderr.write(`Capacity used: ${result.capacity.utilization}.\n`);
}

async function decryptCommand(filename, output, password) {
  await confirmOutput(output);
  checkCancelled();
  const progress = progressDisplay();
  let result;
  try {
    result = await decryptMessageFromImage(filename, password, {
      outputPath: output || undefined, signal: controller.signal, onProgress: progress.update,
    });
  } finally { progress.stop(); }
  requireSuccess(result);
  if (result.outputPath) {
    process.stdout.write(`Saved message: ${terminalText(result.outputPath)}\n`);
  } else {
    if (!quiet) process.stderr.write("Recovered message (terminal control characters are escaped):\n");
    const text = terminalText(result.data, true);
    process.stdout.write(text + (process.stdout.isTTY && !text.endsWith("\n") ? "\n" : ""));
  }
}

async function encryptionQuestions() {
  process.stderr.write("Message editor: save and close the editor to continue. Passwords stay masked.\n");
  const answers = await ask([
    { type: "editor", name: "message", message: "Enter the message in your editor:" },
    passwordQuestion,
    { type: "password", name: "confirmPassword", message: "Confirm password:", mask: "*" },
  ]);
  if (answers.password !== answers.confirmPassword) throw new Error("Passwords do not match. Start again with the same password in both fields.");
  return answers;
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
    const { message, password } = await encryptionQuestions();
    await encryptCommand(files.filename, files.output, compress, message, password);
  } else {
    const { password } = await ask(passwordQuestion);
    await decryptCommand(files.filename, files.output, password);
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
      const { message, password } = await encryptionQuestions();
      await encryptCommand(args.f, args.o, args.c, message, password);
    })
    .command("decrypt", "Decrypt and extract a message from an image", (command) => command.options({
      f: { alias: "filename", describe: "Supported PNG input", demandOption: true, type: "string" },
      o: { alias: "output", describe: "Output text path; omit to display text", type: "string" },
    }).epilog(helpText), async (args) => {
      configure(args);
      requireTerminal();
      task("Decrypt");
      const { password } = await ask(passwordQuestion);
      await decryptCommand(args.f, args.o, password);
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
