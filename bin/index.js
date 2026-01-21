#! /usr/bin/env node
const yargs = require("yargs");
const chalk = require("chalk");
const fs = require("fs");
const { prompt } = require("inquirer");
const ora = require("ora");
const boxen = require("boxen");

// Shared core logic (reused by CLI and desktop UI)
const { encrypt, decrypt } = require("../lib/crypto");
const {
  encodeMessageToImage,
  extractMessageFromImage,
} = require("../lib/steg");

// NOTE: This is just to increase obfuscation for steganography, NOT used for AES encryption
// Kept for backward compatibility with images encoded using older versions
const SECRET_KEY = "S3cReTK3Y";

// Global flags
let VERBOSE = false;
let QUIET = false;

// Color palette - using custom green #B4FA72 for consistent branding
const colors = {
  primary: chalk.hex("#B4FA72"), // Custom lime green
  secondary: chalk.hex("#B4FA72"), // Same green for consistency
  accent: chalk.hex("#B4FA72"), // Same green
  muted: chalk.gray, // Gray for secondary text
  error: chalk.red,
  warning: chalk.yellow,
  dim: chalk.hex("#B4FA72").dim, // Dimmed custom green for subtle text
};

/**
 * ASCII Art Logo (matching the UI)
 */
const asciiLogo = `
   ██████╗ ██████╗ ███████╗ ██████╗██████╗
  ██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗
  ██║   ██║██████╔╝███████╗██║     ██████╔╝
  ██║   ██║██╔══██╗╚════██║██║     ██╔══██╗
  ╚██████╔╝██████╔╝███████║╚██████╗██║  ██║
   ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝
`;

/**
 * Terminal-style controls (for visual effect)
 */
const terminalControls = chalk.red("●") + " " + chalk.yellow("●") + " " + chalk.green("●");

/**
 * Logging utilities
 */
const log = {
  info: (msg) => !QUIET && console.log(colors.accent("ℹ"), msg),
  success: (msg) => !QUIET && console.log(colors.primary("✔"), msg),
  error: (msg) => console.error(colors.error("✖"), msg),
  warn: (msg) => !QUIET && console.log(colors.warning("⚠"), msg),
  verbose: (msg) => VERBOSE && console.log(colors.dim("→"), msg),
  box: (msg, options = {}) => !QUIET && console.log(boxen(msg, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "#B4FA72", // Custom lime green
    ...options
  })),
};

/**
 * Display welcome banner with ASCII art
 */
function showBanner() {
  if (QUIET) return;

  const header = terminalControls;
  const logo = colors.primary(asciiLogo);
  const subtitle = colors.primary("$") + " " + chalk.white("Steganography & Encryption Tool");
  const info = colors.muted("AES-256-GCM Encryption | LSB Steganography | Secure Data Hiding");
  const version = colors.dim("v0.2.1");

  const banner = `${header}\n${logo}\n${subtitle}\n${info}\n\n${version}`;

  log.box(banner, { borderColor: "green", padding: 0, margin: { top: 1, bottom: 1, left: 1, right: 1 } });
}

/**
 * Show usage examples
 */
function showExamples() {
  const examples = `
${colors.primary.bold("Examples:")}

${colors.primary(">")} ${colors.secondary("Encrypt with compression:")}
  ${colors.dim("$")} obscr encrypt -f photo.png -o secret.png --compress

${colors.primary(">")} ${colors.secondary("Decrypt to file:")}
  ${colors.dim("$")} obscr decrypt -f secret.png -o message.txt

${colors.primary(">")} ${colors.secondary("Interactive mode:")}
  ${colors.dim("$")} obscr interactive

${colors.primary(">")} ${colors.secondary("Verbose output:")}
  ${colors.dim("$")} obscr encrypt -f image.png --verbose

${colors.primary(">")} ${colors.secondary("Quiet mode (minimal output):")}
  ${colors.dim("$")} obscr decrypt -f image.png --quiet
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
      { name: colors.primary("[+]") + " Encrypt and hide a message in an image", value: "encrypt" },
      { name: colors.secondary("[-]") + " Decrypt and extract a message from an image", value: "decrypt" },
      { name: colors.accent("[?]") + " Show usage examples", value: "examples" },
      { name: colors.dim("[x]") + " Exit", value: "exit" },
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
${colors.primary.bold("✔ Encryption Successful")}

${colors.primary(">")} ${colors.muted("Output:")} ${chalk.white(output)}
${colors.primary(">")} ${colors.muted("Capacity Used:")} ${colors.secondary(result.capacity.utilization)}
    ${colors.dim("Total:")} ${result.capacity.totalBits} bits
    ${colors.dim("Used:")} ${result.capacity.usedBits} bits
${compress ? colors.primary(">") + " " + colors.muted("Compression:") + " " + colors.secondary("Enabled") : ""}
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
${colors.primary.bold("✔ Decryption Successful")}

${colors.primary(">")} ${colors.muted("Message:")}

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
const usage = colors.primary("\nUsage: obscr <command> [options]");

// Track if a command was executed
let commandExecuted = false;

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
      commandExecuted = true;
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
      commandExecuted = true;
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
      commandExecuted = true;
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
      commandExecuted = true;
      showBanner();
      showExamples();
    }
  )
  .epilog(`Run ${colors.primary("obscr examples")} to see usage examples`)
  .help()
  .alias("help", "h")
  .version("0.2.1")
  .alias("version", "V")
  .strict();

// Parse the arguments
const parsedArgv = argv.parse();

// If no command was executed and not showing help/version, enter interactive mode
if (!commandExecuted && !parsedArgv.help && !parsedArgv.version) {
  VERBOSE = parsedArgv.verbose;
  QUIET = parsedArgv.quiet;
  interactiveMode().catch((err) => {
    log.error(err.message);
    process.exit(1);
  });
}
