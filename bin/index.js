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

//just to increase obfuscation for steg, not actually used for the AES encryption
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
        demandOption: true, // Required
        type: "string",
      },
      c: {
        alias: "compress",
        describe: "Compress the secret message",
        demandOption: false,
        type: "string",
      },
    },

    async (argv) => {
      const { f: filename, c: compress } = argv;

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

      // config.set({ token });
      if (password !== confirmPassword) {
        return console.log(chalk.keyword("red")("Passwords don't match"));
      }

      /*
        #1. encrypt message with key using AES-256-GCM
      */

      try {
        const encrypted = encrypt(message, password);
        console.log(encrypted);
        await encodeMessageToImage(filename, encrypted, password + SECRET_KEY);
      } catch (e) {
        return console.log(chalk.keyword("red")(e.message));
      }

      /*
        #2. embed encrypted message scattered into image
      */

      console.log(chalk.keyword("green")("Successful"));
    }
  )
  //create decrypt command
  .command(
    "decrypt",
    "Decrypts message from image.",
    {
      f: {
        alias: "filename",
        describe: "Name of the png image to hide the message in",
        demandOption: true, // Required
        type: "string",
      },
      o: {
        alias: "output",
        describe: "Output filename",
        demandOption: false, // Required
        type: "string",
      },
    },

    async (argv) => {
      const { f: filename, o: output } = argv;

      const { password } = await prompt({
        type: "password",
        name: "password",
        message: "Enter Password:",
      });

      /*
        #2. extract encrypted message from image
      */

      /*
        #1. decrypt message with key using AES-256-GCM
      */

      try {
        const [succeeded, extracted] = await extractMessageFromImage(
          filename,
          password + SECRET_KEY
        );

        if (!succeeded) throw extracted;
        const decrypted = decrypt(extracted, password);

        console.log(decrypted);

        if (output) fs.writeFileSync(output, decrypted);
      } catch (e) {
        console.log(e);
        return console.log(chalk.keyword("red")("Could not decrypt"));
      }

      console.log(chalk.keyword("green")("Successful"));
    }
  )

  .epilog("copyright 2022")
  .help(true).argv;

if (yargs.argv._[0] == null) {
  yargs.showHelp();
  process.exit(0);
}

/*
TODO: error out if image is too small
TODO: implement compression
TODO: implement streaming
TODO: file encryption

*/
