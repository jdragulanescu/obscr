import * as crypto from "node:crypto";

function resourceFailure() {
  return Object.assign(new Error("Native cryptography is unavailable."), { code: "RESOURCE_FAILED" });
}

function checkCTR(key, counter, zeros) {
  if (!(key instanceof Uint8Array) || key.length !== 32 ||
      !(counter instanceof Uint8Array) || counter.length !== 16 ||
      !(zeros instanceof Uint8Array) || zeros.length > 4096) {
    throw new Error("Invalid placement stream input.");
  }
  // Test the last block, not the next block: the final counter value is usable.
  let carry = Math.max(0, Math.ceil(zeros.length / 16) - 1);
  for (let i = 15; i >= 0; i--) carry = Math.floor((counter[i] + carry) / 256);
  if (carry) throw new Error("Placement counter exhausted.");
}

export const nativeCrypto = {
  async hkdf(root, info) {
    try {
      if (typeof crypto.hkdfSync !== "function") throw resourceFailure();
      return new Uint8Array(crypto.hkdfSync("sha256", root, new Uint8Array(32), info, 32));
    } catch {
      throw resourceFailure();
    }
  },

  async ctr(key, counter, zeros) {
    checkCTR(key, counter, zeros);
    let output;
    try {
      const cipher = crypto.createCipheriv("aes-256-ctr", key, counter);
      output = cipher.update(zeros);
      const final = cipher.final();
      if (final.length !== 0 || output.length !== zeros.length) {
        final.fill(0);
        throw resourceFailure();
      }
      return new Uint8Array(output.buffer, output.byteOffset, output.byteLength);
    } catch {
      output?.fill(0);
      throw resourceFailure();
    }
  },

  async decrypt(key, nonce, body, aad) {
    if (!(key instanceof Uint8Array) || key.length !== 32 ||
        !(nonce instanceof Uint8Array) || nonce.length !== 12 ||
        !(body instanceof Uint8Array) || body.length < 16 || body.length > 528 ||
        !(aad instanceof Uint8Array)) throw new Error("Invalid authenticated body.");
    let decipher;
    try {
      decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce, { authTagLength: 16 });
    } catch {
      throw resourceFailure();
    }
    let plaintext;
    try {
      decipher.setAAD(aad);
      decipher.setAuthTag(body.subarray(body.length - 16));
      plaintext = decipher.update(body.subarray(0, body.length - 16));
      // update() output is private until final() authenticates the complete body.
      const final = decipher.final();
      if (final.length !== 0) {
        final.fill(0);
        throw new Error("Unexpected authenticated output.");
      }
      return new Uint8Array(plaintext.buffer, plaintext.byteOffset, plaintext.byteLength);
    } catch {
      plaintext?.fill(0);
      throw new Error("Authentication failed.");
    }
  },
};
