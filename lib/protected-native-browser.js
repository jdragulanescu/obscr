function resourceFailure() {
  return Object.assign(new Error("Native cryptography is unavailable."), { code: "RESOURCE_FAILED" });
}

function subtleCrypto(method) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof subtle.importKey !== "function" || typeof subtle[method] !== "function") {
    throw resourceFailure();
  }
  return subtle;
}

function checkCTR(key, counter, zeros) {
  if (!(key instanceof Uint8Array) || key.length !== 32 ||
      !(counter instanceof Uint8Array) || counter.length !== 16 ||
      !(zeros instanceof Uint8Array) || zeros.length > 4096) {
    throw new Error("Invalid placement stream input.");
  }
  let carry = Math.max(0, Math.ceil(zeros.length / 16) - 1);
  for (let i = 15; i >= 0; i--) carry = Math.floor((counter[i] + carry) / 256);
  if (carry) throw new Error("Placement counter exhausted.");
}

export const nativeCrypto = {
  randomBytes(length) {
    try {
      return globalThis.crypto.getRandomValues(new Uint8Array(length));
    } catch {
      throw resourceFailure();
    }
  },

  async encrypt(key, nonce, plaintext, aad) {
    if (!(key instanceof Uint8Array) || key.length !== 32 ||
        !(nonce instanceof Uint8Array) || nonce.length !== 12 ||
        !(plaintext instanceof Uint8Array) || plaintext.length > 512 ||
        !(aad instanceof Uint8Array) || aad.length !== 56) throw resourceFailure();
    try {
      const subtle = subtleCrypto("encrypt");
      const nativeKey = await subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"]);
      return new Uint8Array(await subtle.encrypt({
        name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128,
      }, nativeKey, plaintext));
    } catch {
      throw resourceFailure();
    }
  },

  async hkdf(root, info) {
    try {
      const subtle = subtleCrypto("deriveBits");
      const key = await subtle.importKey("raw", root, "HKDF", false, ["deriveBits"]);
      return new Uint8Array(await subtle.deriveBits({
        name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info,
      }, key, 256));
    } catch {
      throw resourceFailure();
    }
  },

  async ctr(key, counter, zeros) {
    checkCTR(key, counter, zeros);
    try {
      const subtle = subtleCrypto("encrypt");
      const nativeKey = await subtle.importKey("raw", key, "AES-CTR", false, ["encrypt"]);
      return new Uint8Array(await subtle.encrypt({ name: "AES-CTR", counter, length: 128 }, nativeKey, zeros));
    } catch {
      throw resourceFailure();
    }
  },

  async decrypt(key, nonce, body, aad) {
    if (!(key instanceof Uint8Array) || key.length !== 32 ||
        !(nonce instanceof Uint8Array) || nonce.length !== 12 ||
        !(body instanceof Uint8Array) || body.length < 16 || body.length > 528 ||
        !(aad instanceof Uint8Array)) throw new Error("Invalid authenticated body.");
    const subtle = subtleCrypto("decrypt");
    let nativeKey;
    try {
      nativeKey = await subtle.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
    } catch {
      throw resourceFailure();
    }
    try {
      return new Uint8Array(await subtle.decrypt({
        name: "AES-GCM", iv: nonce, additionalData: aad, tagLength: 128,
      }, nativeKey, body));
    } catch (error) {
      if (error?.name === "NotSupportedError") throw resourceFailure();
      throw new Error("Authentication failed.");
    }
  },
};
