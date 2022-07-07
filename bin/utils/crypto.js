const crypto = require("crypto");

const cryptoConfig = {
  cipherAlgorithm: "aes-256-gcm",
  iterations: 65535,
  keyLength: 32,
  saltLength: 32,
  nonceLength: 12,
  tagLength: 16,
  digest: "sha512",
};

const encrypt = (message, password) => {
  const salt = crypto.randomBytes(cryptoConfig.saltLength);
  const key = crypto.pbkdf2Sync(
    password,
    salt,
    cryptoConfig.iterations,
    cryptoConfig.keyLength,
    cryptoConfig.digest
  );

  const nonce = crypto.randomBytes(cryptoConfig.nonceLength);
  const cipher = crypto.createCipheriv(
    cryptoConfig.cipherAlgorithm,
    key,
    nonce
  );

  let encryptedBase64 = "";
  cipher.setEncoding("base64");
  cipher.on("data", (chunk) => (encryptedBase64 += chunk));
  cipher.on("end", () => {
    // do nothing console.log(encryptedBase64);
    // Prints: some clear text data
  });
  cipher.write(message);
  cipher.end();

  const saltBase64 = base64Encoding(salt);
  const nonceBase64 = base64Encoding(nonce);
  const gcmTagBase64 = base64Encoding(cipher.getAuthTag());
  return (
    saltBase64 + ":" + nonceBase64 + ":" + encryptedBase64 + ":" + gcmTagBase64
  );
};

const decrypt = (encrypted, password) => {
  const dataSplit = encrypted.split(":");
  const salt = base64Decoding(dataSplit[0]);
  const nonce = base64Decoding(dataSplit[1]);
  const ciphertext = dataSplit[2];
  const gcmTag = base64Decoding(dataSplit[3]);
  const key = crypto.pbkdf2Sync(
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

  let decrypted = "";
  decipher.on("readable", () => {
    while (null !== (chunk = decipher.read())) {
      decrypted += chunk.toString("utf8");
    }
  });
  decipher.on("end", () => {
    // do nothing console.log(decrypted);
  });
  decipher.on("error", (err) => {
    throw err.message;
  });
  decipher.write(ciphertext, "base64");
  decipher.end();
  return decrypted;
};

const base64Encoding = (input) => input.toString("base64");

const base64Decoding = (input) => Buffer.from(input, "base64");

module.exports = { encrypt, decrypt };
