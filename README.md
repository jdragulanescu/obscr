<p align="center">
  
 </p>
 <p align="center">
   <img  src="https://img.shields.io/badge/license-MIT-green">
 <img  src="https://img.shields.io/badge/build-passing-brightgreen">
   <img  src="https://img.shields.io/badge/version-0.1.1-orange">
   <img  src="https://img.shields.io/badge/npm-v8.3.1-blue">
  <img  src="https://img.shields.io/badge/node-v16.14.0-yellow">
 </p>
 <br>
<p align="center">A CLI to encrypt data inside images.</p>
<br>

---

## Description

CLI tool to encrypt secret messages with AES-256-GCM and a password.
Same password will then be used as a seed to generate a random order in which the encrypted message will be encoded inside the specified .png image.

## NPM package

```
npm install -g obscr
```

## Usage

```
~$ obscr --help
Usage: obscr <cmd> [options]

Commands:
  obscr encrypt  Encrypts and hides the message into an image.
  obscr decrypt  Decrypts message from image.

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]

copyright 2022

```

> :warning: **Supports only png images**

<br>

## Installation

1. Clone the repository and then navigate to it.
2. Run `npm install` to install the dependencies.
3. Run `npm install -g .` to install the CLI. <br>

> :warning: **This might cause an error** which can be resolved easily by using `sudo` with the command, **however**, using `sudo` with `npm` is **not recommended** because it might cause permission issues later. So instead put the code below in your .bashrc file and then run the above command again.

```
npm set prefix ~/.npm
PATH="$HOME/.npm/bin:$PATH"
PATH="./node_modules/.bin:$PATH"
```

4. Now you are good to go and can use the CLI globally!

Type `obscr` or `obscr --help` to get started.

<br>

## License

MIT © **_Obscr_**
