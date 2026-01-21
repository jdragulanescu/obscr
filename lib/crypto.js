const crypto = require("crypto");
const zlib = require("zlib");
const { promisify } = require("util");

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);
const pbkdf2Async = promisify(crypto.pbkdf2);

const cryptoConfig = {
  cipherAlgorithm: "aes-256-gcm",
  iterations: 65535,
  keyLength: 32,
  saltLength: 32,
  nonceLength: 12,
  tagLength: 16,
  digest: "sha512",
};

/**
 * Encrypts a message using AES-256-GCM with optional compression
 * @param {string} message - The message to encrypt
 * @param {string} password - The password to use for encryption
 * @param {boolean} compress - Whether to compress the message before encryption
 * @returns {Promise<string>} The encrypted message in format: salt:nonce:ciphertext:tag[:compressed]
 */
const encrypt = async (message, password, compress = false) => {
  const salt = crypto.randomBytes(cryptoConfig.saltLength);
  const key = await pbkdf2Async(
    password,
    salt,
    cryptoConfig.iterations,
    cryptoConfig.keyLength,
    cryptoConfig.digest
  );

  let dataToEncrypt = Buffer.from(message, "utf8");

  // Compress if requested
  if (compress) {
    dataToEncrypt = await gzipAsync(dataToEncrypt);
  }

  const nonce = crypto.randomBytes(cryptoConfig.nonceLength);
  const cipher = crypto.createCipheriv(
    cryptoConfig.cipherAlgorithm,
    key,
    nonce
  );

  const encryptedChunks = [];
  encryptedChunks.push(cipher.update(dataToEncrypt));
  encryptedChunks.push(cipher.final());
  const encrypted = Buffer.concat(encryptedChunks);

  const saltBase64 = base64Encoding(salt);
  const nonceBase64 = base64Encoding(nonce);
  const encryptedBase64 = base64Encoding(encrypted);
  const gcmTagBase64 = base64Encoding(cipher.getAuthTag());

  // Add compression flag to the end for backward compatibility
  const compressionFlag = compress ? ":1" : "";
  return `${saltBase64}:${nonceBase64}:${encryptedBase64}:${gcmTagBase64}${compressionFlag}`;
};

/**
 * Decrypts an encrypted message
 * @param {string} encrypted - The encrypted message string
 * @param {string} password - The password to use for decryption
 * @returns {Promise<string>} The decrypted message
 * @throws {Error} If decryption fails
 */
const decrypt = async (encrypted, password) => {
  // Validate input
  if (!encrypted || typeof encrypted !== "string") {
    throw new Error(
      "Invalid encrypted data. The image may not contain a hidden message, or the extraction failed."
    );
  }

  const dataSplit = encrypted.split(":");

  // Validate format - should have 4 or 5 parts (salt:nonce:ciphertext:tag[:compressed])
  if (dataSplit.length < 4 || dataSplit.length > 5) {
    throw new Error(
      "Invalid encrypted message format. This may indicate:\n" +
        "  • Wrong password used for decryption\n" +
        "  • Image does not contain an encrypted message\n" +
        "  • Corrupted or modified image file"
    );
  }

  // Validate that all required parts exist and are not empty
  if (!dataSplit[0] || !dataSplit[1] || !dataSplit[2] || !dataSplit[3]) {
    throw new Error(
      "Incomplete encrypted data. Wrong password or corrupted message."
    );
  }

  try {
    // Check if compression flag is present (backward compatible)
    const isCompressed = dataSplit.length === 5 && dataSplit[4] === "1";

    const salt = base64Decoding(dataSplit[0]);
    const nonce = base64Decoding(dataSplit[1]);
    const ciphertext = dataSplit[2];
    const gcmTag = base64Decoding(dataSplit[3]);

    const key = await pbkdf2Async(
      password,
      salt,
      cryptoConfig.iterations,
      cryptoConfig.keyLength,
      cryptoConfig.digest
    );

    const decipher = crypto.createDecipheriv(
      cryptoConfig.cipherAlgorithm,
      key,
      nonce
    );
    decipher.setAuthTag(gcmTag);

    const decryptedChunks = [];
    decryptedChunks.push(decipher.update(Buffer.from(ciphertext, "base64")));
    decryptedChunks.push(decipher.final());
    let decrypted = Buffer.concat(decryptedChunks);

    // Decompress if it was compressed
    if (isCompressed) {
      decrypted = await gunzipAsync(decrypted);
    }

    return decrypted.toString("utf8");
  } catch (err) {
    // Check for common error patterns
    if (err.message && err.message.includes("Unsupported state or unable to authenticate data")) {
      throw new Error(
        "Authentication failed: Incorrect password or tampered message.\n" +
          "Make sure you're using the same password that was used for encryption."
      );
    }

    if (err.message && err.message.includes("Invalid base64")) {
      throw new Error(
        "Invalid data encoding. This indicates:\n" +
          "  • Wrong password (most likely)\n" +
          "  • Corrupted or modified image"
      );
    }

    // Generic decryption error
    throw new Error(
      `Decryption failed: ${err.message}\n` +
        "This is most likely due to an incorrect password."
    );
  }
};

/**
 * Encodes a buffer to base64 string
 * @param {Buffer} input - The buffer to encode
 * @returns {string} Base64 encoded string
 */
const base64Encoding = (input) => input.toString("base64");

/**
 * Decodes a base64 string to buffer
 * @param {string} input - The base64 string to decode
 * @returns {Buffer} Decoded buffer
 */
const base64Decoding = (input) => Buffer.from(input, "base64");

module.exports = { encrypt, decrypt };

