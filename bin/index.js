#! /usr/bin/env node
const yargs = require("yargs");
const chalk = require("chalk");
const fs = require("fs");
const { prompt } = require("inquirer");

const { encrypt, decrypt } = require("./utils/crypto");
const {
  encodeMessageToImage,
  extractMessageFromImage,
} = require("./utils/steg");

// NOTE: This is just to increase obfuscation for steganography, NOT used for AES encryption
// Kept for backward compatibility with images encoded using older versions
const SECRET_KEY = "S3cReTK3Y";

const usage = chalk.keyword("violet")("\nUsage: obscr <cmd> [options]");

const options = yargs
  .usage(usage)

  // Create encrypt command
  .command(
    "encrypt",
    "Encrypts and hides the message into an image.",
    {
      f: {
        alias: "filename",
        describe: "Name of the png image to hide the message in",
        demandOption: true,
        type: "string",
      },
      o: {
        alias: "output",
        describe: "Output filename for the encoded image",
        demandOption: false,
        type: "string",
        default: "encoded.png",
      },
      c: {
        alias: "compress",
        describe: "Compress the secret message before encryption",
        demandOption: false,
        type: "boolean",
        default: false,
      },
    },

    async (argv) => {
      const { f: filename, o: output, c: compress } = argv;

      // Validate input file exists
      if (!fs.existsSync(filename)) {
        return console.log(
          chalk.keyword("red")(`Error: Image file not found: ${filename}`)
        );
      }

      const { password, confirmPassword, message } = await prompt([
        {
          type: "editor",
          name: "message",
          message: "Type the secret message",
        },
        {
          type: "password",
          name: "password",
          message: "Enter Password:",
        },
        {
          type: "password",
          name: "confirmPassword",
          message: "Re-type Password:",
        },
      ]);

      if (password !== confirmPassword) {
        return console.log(chalk.keyword("red")("Passwords don't match"));
      }

      if (!message || message.trim().length === 0) {
        return console.log(
          chalk.keyword("red")("Error: Message cannot be empty")
        );
      }

      try {
        // Step 1: Encrypt message with AES-256-GCM
        const encrypted = await encrypt(message, password, compress);

        if (compress) {
          console.log(chalk.keyword("cyan")("Message compressed"));
        }

        // Step 2: Embed encrypted message into image using steganography
        const result = await encodeMessageToImage(
          filename,
          encrypted,
          password + SECRET_KEY,
          output
        );

        if (!result.success) {
          return console.log(chalk.keyword("red")(`Error: ${result.error}`));
        }

        console.log(chalk.keyword("green")("✓ Encryption successful"));
        console.log(
          chalk.keyword("cyan")(
            `Output: ${result.outputPath}`
          )
        );
        console.log(
          chalk.keyword("cyan")(
            `Capacity used: ${result.capacity.utilization} (${result.capacity.usedBits}/${result.capacity.totalBits} bits)`
          )
        );
      } catch (err) {
        return console.log(
          chalk.keyword("red")(`Error: ${err.message}`)
        );
      }
    }
  )

  // Create decrypt command
  .command(
    "decrypt",
    "Decrypts message from image.",
    {
      f: {
        alias: "filename",
        describe: "Name of the png image containing the hidden message",
        demandOption: true,
        type: "string",
      },
      o: {
        alias: "output",
        describe: "Output filename to save decrypted message",
        demandOption: false,
        type: "string",
      },
    },

    async (argv) => {
      const { f: filename, o: output } = argv;

      // Validate input file exists
      if (!fs.existsSync(filename)) {
        return console.log(
          chalk.keyword("red")(`Error: Image file not found: ${filename}`)
        );
      }

      const { password } = await prompt({
        type: "password",
        name: "password",
        message: "Enter Password:",
      });

      try {
        // Step 1: Extract encrypted message from image
        const extractResult = await extractMessageFromImage(
          filename,
          password + SECRET_KEY
        );

        if (!extractResult.success) {
          return console.log(
            chalk.keyword("red")(`Error: ${extractResult.error}`)
          );
        }

        // Step 2: Decrypt message with AES-256-GCM
        const decrypted = await decrypt(extractResult.data, password);

        console.log(chalk.keyword("green")("✓ Decryption successful\n"));
        console.log(chalk.keyword("white")("--- Message ---"));
        console.log(decrypted);
        console.log(chalk.keyword("white")("---------------\n"));

        // Save to file if output path specified
        if (output) {
          fs.writeFileSync(output, decrypted);
          console.log(
            chalk.keyword("cyan")(`Message saved to: ${output}`)
          );
        }
      } catch (err) {
        return console.log(
          chalk.keyword("red")(
            "Could not decrypt. Wrong password or corrupted image."
          )
        );
      }
    }
  )

  .epilog("obscr - Encrypt and hide your secure data | copyright 2022")
  .help(true).argv;

if (yargs.argv._[0] == null) {
  yargs.showHelp();
  process.exit(0);
}
