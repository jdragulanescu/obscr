#! /usr/bin/env node
const yargs = require("yargs");
const chalk = require("chalk");
const fs = require("fs");
const { prompt } = require("inquirer");
const ora = require("ora");
const boxen = require("boxen");

const { encrypt, decrypt } = require("./utils/crypto");
const {
  encodeMessageToImage,
  extractMessageFromImage,
} = require("./utils/steg");

// NOTE: This is just to increase obfuscation for steganography, NOT used for AES encryption
// Kept for backward compatibility with images encoded using older versions
const SECRET_KEY = "S3cReTK3Y";

// Global flags
let VERBOSE = false;
let QUIET = false;

/**
 * Logging utilities
 */
const log = {
  info: (msg) => !QUIET && console.log(chalk.blue("ℹ"), msg),
  success: (msg) => !QUIET && console.log(chalk.green("✔"), msg),
  error: (msg) => console.error(chalk.red("✖"), msg),
  warn: (msg) => !QUIET && console.log(chalk.yellow("⚠"), msg),
  verbose: (msg) => VERBOSE && console.log(chalk.gray("→"), msg),
  box: (msg, options = {}) => !QUIET && console.log(boxen(msg, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "cyan",
    ...options
  })),
};

/**
 * Display welcome banner
 */
function showBanner() {
  if (QUIET) return;

  const banner = chalk.keyword("violet").bold("obscr") +
                 chalk.gray(" - Encrypt and hide your secure data\n") +
                 chalk.dim("v0.2.1");

  log.box(banner, { borderColor: "magenta" });
}

/**
 * Show usage examples
 */
function showExamples() {
  const examples = `
${chalk.bold("Examples:")}

${chalk.cyan("Encrypt with compression:")}
  $ obscr encrypt -f photo.png -o secret.png --compress

${chalk.cyan("Decrypt to file:")}
  $ obscr decrypt -f secret.png -o message.txt

${chalk.cyan("Interactive mode:")}
  $ obscr interactive

${chalk.cyan("Verbose output:")}
  $ obscr encrypt -f image.png --verbose

${chalk.cyan("Quiet mode (minimal output):")}
  $ obscr decrypt -f image.png --quiet
`;

  console.log(examples);
}

/**
 * Interactive mode - guided workflow
 */
async function interactiveMode() {
  showBanner();

  const { action } = await prompt({
    type: "list",
    name: "action",
    message: "What would you like to do?",
    choices: [
      { name: "🔒 Encrypt and hide a message in an image", value: "encrypt" },
      { name: "🔓 Decrypt and extract a message from an image", value: "decrypt" },
      { name: "ℹ️  Show usage examples", value: "examples" },
      { name: "❌ Exit", value: "exit" },
    ],
  });

  if (action === "exit") {
    log.info("Goodbye!");
    return;
  }

  if (action === "examples") {
    showExamples();
    return;
  }

  if (action === "encrypt") {
    const answers = await prompt([
      {
        type: "input",
        name: "filename",
        message: "Path to the PNG image:",
        validate: (input) => {
          if (!input) return "Filename is required";
          if (!fs.existsSync(input)) return "File does not exist";
          if (!input.toLowerCase().endsWith(".png")) return "Must be a PNG file";
          return true;
        },
      },
      {
        type: "input",
        name: "output",
        message: "Output filename:",
        default: "encoded.png",
      },
      {
        type: "confirm",
        name: "compress",
        message: "Enable compression?",
        default: false,
      },
      {
        type: "editor",
        name: "message",
        message: "Enter your secret message (editor will open):",
      },
      {
        type: "password",
        name: "password",
        message: "Enter password:",
        mask: "*",
      },
      {
        type: "password",
        name: "confirmPassword",
        message: "Confirm password:",
        mask: "*",
      },
    ]);

    if (answers.password !== answers.confirmPassword) {
      log.error("Passwords don't match!");
      return;
    }

    await encryptCommand(
      answers.filename,
      answers.output,
      answers.compress,
      answers.message,
      answers.password
    );
  } else if (action === "decrypt") {
    const answers = await prompt([
      {
        type: "input",
        name: "filename",
        message: "Path to the encoded PNG image:",
        validate: (input) => {
          if (!input) return "Filename is required";
          if (!fs.existsSync(input)) return "File does not exist";
          return true;
        },
      },
      {
        type: "input",
        name: "output",
        message: "Save to file (leave empty to display):",
        default: "",
      },
      {
        type: "password",
        name: "password",
        message: "Enter password:",
        mask: "*",
      },
    ]);

    await decryptCommand(answers.filename, answers.output || null, answers.password);
  }
}

/**
 * Encrypt command with enhanced UX
 */
async function encryptCommand(filename, output, compress, message, password) {
  const spinner = ora();

  try {
    // Validate input file
    log.verbose(`Validating input file: ${filename}`);
    if (!fs.existsSync(filename)) {
      log.error(`Image file not found: ${filename}`);
      return process.exit(1);
    }

    // Check for output file overwrite
    if (fs.existsSync(output)) {
      const { overwrite } = await prompt({
        type: "confirm",
        name: "overwrite",
        message: `File ${output} already exists. Overwrite?`,
        default: false,
      });

      if (!overwrite) {
        log.warn("Operation cancelled");
        return process.exit(0);
      }
    }

    if (!message || message.trim().length === 0) {
      log.error("Message cannot be empty");
      return process.exit(1);
    }

    // Step 1: Encrypt message
    spinner.start("Encrypting message with AES-256-GCM...");
    log.verbose(`Using ${compress ? "compressed" : "uncompressed"} format`);

    const encrypted = await encrypt(message, password, compress);

    spinner.succeed("Message encrypted");
    log.verbose(`Encrypted data length: ${encrypted.length} characters`);

    if (compress) {
      log.info("Compression enabled");
    }

    // Step 2: Embed in image
    spinner.start("Embedding encrypted message into image...");
    log.verbose(`Encoding to: ${output}`);

    const result = await encodeMessageToImage(
      filename,
      encrypted,
      password + SECRET_KEY,
      output
    );

    if (!result.success) {
      spinner.fail("Encoding failed");
      log.error(result.error);
      return process.exit(1);
    }

    spinner.succeed("Message successfully hidden in image");

    // Show summary
    if (!QUIET) {
      const summary = `
${chalk.green.bold("✔ Encryption Successful")}

${chalk.bold("Output:")} ${output}
${chalk.bold("Capacity Used:")} ${result.capacity.utilization}
${chalk.bold("  Total:")} ${result.capacity.totalBits} bits
${chalk.bold("  Used:")} ${result.capacity.usedBits} bits
${compress ? chalk.bold("Compression:") + " Enabled" : ""}
`;
      log.box(summary.trim(), { borderColor: "green" });
    }

    log.verbose("Encryption complete");
  } catch (err) {
    spinner.fail("Encryption failed");
    log.error(err.message);
    log.verbose(err.stack);
    process.exit(1);
  }
}

/**
 * Decrypt command with enhanced UX
 */
async function decryptCommand(filename, output, password) {
  const spinner = ora();

  try {
    // Validate input file
    log.verbose(`Validating input file: ${filename}`);
    if (!fs.existsSync(filename)) {
      log.error(`Image file not found: ${filename}`);
      return process.exit(1);
    }

    // Step 1: Extract from image
    spinner.start("Extracting encrypted message from image...");
    log.verbose(`Reading from: ${filename}`);

    const extractResult = await extractMessageFromImage(
      filename,
      password + SECRET_KEY
    );

    if (!extractResult.success) {
      spinner.fail("Extraction failed");
      log.error(extractResult.error);
      return process.exit(1);
    }

    spinner.succeed("Encrypted message extracted");
    log.verbose(`Extracted ${extractResult.data.length} characters`);

    // Step 2: Decrypt message
    spinner.start("Decrypting message with AES-256-GCM...");

    const decrypted = await decrypt(extractResult.data, password);

    spinner.succeed("Message decrypted successfully");

    // Display or save result
    if (output) {
      fs.writeFileSync(output, decrypted);
      log.success(`Message saved to: ${output}`);
    } else {
      if (!QUIET) {
        const messageBox = `
${chalk.green.bold("✔ Decryption Successful")}

${chalk.bold("Message:")}
${chalk.white(decrypted)}
`;
        log.box(messageBox.trim(), { borderColor: "green" });
      } else {
        console.log(decrypted);
      }
    }

    log.verbose("Decryption complete");
  } catch (err) {
    spinner.fail("Decryption failed");
    log.error("Could not decrypt. Wrong password or corrupted image.");
    log.verbose(err.message);
    log.verbose(err.stack);
    process.exit(1);
  }
}

// Parse arguments
const usage = chalk.keyword("violet")("\nUsage: obscr <command> [options]");

const argv = yargs
  .usage(usage)
  .option("verbose", {
    alias: "v",
    describe: "Show detailed output",
    type: "boolean",
    global: true,
  })
  .option("quiet", {
    alias: "q",
    describe: "Minimal output (only essential messages)",
    type: "boolean",
    global: true,
  })
  .command(
    "encrypt",
    "Encrypt and hide a message in an image",
    {
      f: {
        alias: "filename",
        describe: "PNG image to hide the message in",
        demandOption: true,
        type: "string",
      },
      o: {
        alias: "output",
        describe: "Output filename for encoded image",
        demandOption: false,
        type: "string",
        default: "encoded.png",
      },
      c: {
        alias: "compress",
        describe: "Compress message before encryption (50-90% size reduction)",
        demandOption: false,
        type: "boolean",
        default: false,
      },
    },
    async (argv) => {
      VERBOSE = argv.verbose;
      QUIET = argv.quiet;

      if (!QUIET) showBanner();

      const { f: filename, o: output, c: compress } = argv;

      const { password, confirmPassword, message } = await prompt([
        {
          type: "editor",
          name: "message",
          message: "Type the secret message:",
        },
        {
          type: "password",
          name: "password",
          message: "Enter password:",
          mask: "*",
        },
        {
          type: "password",
          name: "confirmPassword",
          message: "Confirm password:",
          mask: "*",
        },
      ]);

      if (password !== confirmPassword) {
        log.error("Passwords don't match");
        return process.exit(1);
      }

      await encryptCommand(filename, output, compress, message, password);
    }
  )
  .command(
    "decrypt",
    "Decrypt and extract a message from an image",
    {
      f: {
        alias: "filename",
        describe: "PNG image containing hidden message",
        demandOption: true,
        type: "string",
      },
      o: {
        alias: "output",
        describe: "Save decrypted message to file",
        demandOption: false,
        type: "string",
      },
    },
    async (argv) => {
      VERBOSE = argv.verbose;
      QUIET = argv.quiet;

      if (!QUIET) showBanner();

      const { f: filename, o: output } = argv;

      const { password } = await prompt({
        type: "password",
        name: "password",
        message: "Enter password:",
        mask: "*",
      });

      await decryptCommand(filename, output, password);
    }
  )
  .command(
    "interactive",
    "Start interactive mode with guided workflow",
    {},
    async (argv) => {
      VERBOSE = argv.verbose;
      QUIET = argv.quiet;
      await interactiveMode();
    }
  )
  .command(
    "examples",
    "Show usage examples",
    {},
    () => {
      showBanner();
      showExamples();
    }
  )
  .epilog(`Run ${chalk.cyan("obscr examples")} to see usage examples`)
  .help()
  .alias("help", "h")
  .version("0.2.1")
  .alias("version", "V")
  .demandCommand(1, "You must specify a command")
  .strict()
  .argv;
