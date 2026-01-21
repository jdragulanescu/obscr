/**
 * Browser-compatible crypto utilities for web version
 * Provides same functionality as lib/crypto.js but using Web Crypto API
 */

const cryptoConfig = {
  cipherAlgorithm: "AES-GCM",
  iterations: 65535,
  keyLength: 32,
  saltLength: 32,
  nonceLength: 12,
  tagLength: 16,
  digest: "SHA-512",
};

/**
 * Derives a key from password using PBKDF2
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const importedKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: cryptoConfig.iterations,
      hash: cryptoConfig.digest,
    },
    importedKey,
    { name: cryptoConfig.cipherAlgorithm, length: cryptoConfig.keyLength * 8 },
    true,
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

/**
 * Encrypts a message using AES-256-GCM with optional compression
 * Format: salt:nonce:ciphertext:tag[:compressed]
 * Compatible with Node.js crypto version
 */
export async function encrypt(message, password, compress = false) {
  const salt = crypto.getRandomValues(new Uint8Array(cryptoConfig.saltLength));
  const key = await deriveKey(password, salt);

  let dataToEncrypt = new TextEncoder().encode(message);

  // Compress if requested (using CompressionStream API)
  if (compress && typeof CompressionStream !== "undefined") {
    const stream = new Response(
      new Blob([dataToEncrypt]).stream().pipeThrough(new CompressionStream("gzip"))
    );
    dataToEncrypt = new Uint8Array(await stream.arrayBuffer());
  }

  const nonce = crypto.getRandomValues(
    new Uint8Array(cryptoConfig.nonceLength)
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: cryptoConfig.cipherAlgorithm,
      iv: nonce,
    },
    key,
    dataToEncrypt
  );

  // AES-GCM in Web Crypto API returns ciphertext + tag concatenated
  // Last 16 bytes are the authentication tag
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -cryptoConfig.tagLength);
  const tag = encryptedArray.slice(-cryptoConfig.tagLength);

  // Convert to base64 format: salt:nonce:ciphertext:tag[:compressed]
  const saltB64 = btoa(String.fromCharCode(...salt));
  const nonceB64 = btoa(String.fromCharCode(...nonce));
  const ciphertextB64 = btoa(String.fromCharCode(...ciphertext));
  const tagB64 = btoa(String.fromCharCode(...tag));

  const compressionFlag = compress ? ":1" : "";
  return `${saltB64}:${nonceB64}:${ciphertextB64}:${tagB64}${compressionFlag}`;
}

/**
 * Decrypts a message encrypted with encrypt()
 * Format: salt:nonce:ciphertext:tag[:compressed]
 * Compatible with Node.js crypto version
 */
export async function decrypt(encryptedData, password) {
  const parts = encryptedData.split(":");
  if (parts.length < 4 || parts.length > 5) {
    throw new Error("Invalid encrypted data format");
  }

  const salt = Uint8Array.from(atob(parts[0]), (c) => c.charCodeAt(0));
  const nonce = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));
  const tag = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0));
  const isCompressed = parts.length === 5 && parts[4] === "1";

  const key = await deriveKey(password, salt);

  // Web Crypto API expects ciphertext + tag concatenated
  const encryptedWithTag = new Uint8Array(ciphertext.length + tag.length);
  encryptedWithTag.set(ciphertext, 0);
  encryptedWithTag.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: cryptoConfig.cipherAlgorithm,
      iv: nonce,
    },
    key,
    encryptedWithTag
  );

  let decryptedData = new Uint8Array(decrypted);

  // Decompress if needed
  if (isCompressed && typeof DecompressionStream !== "undefined") {
    const stream = new Response(
      new Blob([decryptedData]).stream().pipeThrough(new DecompressionStream("gzip"))
    );
    decryptedData = new Uint8Array(await stream.arrayBuffer());
  }

  return new TextDecoder().decode(decryptedData);
}
