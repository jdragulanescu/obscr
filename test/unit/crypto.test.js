const { encrypt, decrypt } = require("../../bin/utils/crypto");

describe("Crypto Module", () => {
  describe("encrypt", () => {
    it("should encrypt a message successfully", async () => {
      const message = "Hello, World!";
      const password = "test-password-123";

      const encrypted = await encrypt(message, password);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted.split(":")).toHaveLength(4); // salt:nonce:ciphertext:tag
    });

    it("should produce different encrypted outputs for the same message", async () => {
      const message = "Same message";
      const password = "password";

      const encrypted1 = await encrypt(message, password);
      const encrypted2 = await encrypt(message, password);

      // Should be different due to random salt and nonce
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should support compression flag", async () => {
      const message = "Hello, World!";
      const password = "test-password";

      const encrypted = await encrypt(message, password, true);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(":")).toHaveLength(5); // includes compression flag
      expect(encrypted.endsWith(":1")).toBe(true);
    });

    it("should handle long messages", async () => {
      const message = "A".repeat(10000);
      const password = "password";

      const encrypted = await encrypt(message, password);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
    });

    it("should handle unicode characters", async () => {
      const message = "Hello 世界 🌍 Мир";
      const password = "password";

      const encrypted = await encrypt(message, password);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
    });

    it("should handle empty password", async () => {
      const message = "Secret";
      const password = "";

      const encrypted = await encrypt(message, password);

      expect(encrypted).toBeDefined();
    });
  });

  describe("decrypt", () => {
    it("should decrypt an encrypted message successfully", async () => {
      const message = "Hello, World!";
      const password = "test-password-123";

      const encrypted = await encrypt(message, password);
      const decrypted = await decrypt(encrypted, password);

      expect(decrypted).toBe(message);
    });

    it("should decrypt compressed messages", async () => {
      const message = "This is a test message that will be compressed";
      const password = "password";

      const encrypted = await encrypt(message, password, true);
      const decrypted = await decrypt(encrypted, password);

      expect(decrypted).toBe(message);
    });

    it("should handle unicode in encrypted messages", async () => {
      const message = "Hello 世界 🌍 Мир";
      const password = "password";

      const encrypted = await encrypt(message, password);
      const decrypted = await decrypt(encrypted, password);

      expect(decrypted).toBe(message);
    });

    it("should fail with wrong password", async () => {
      const message = "Secret message";
      const password = "correct-password";
      const wrongPassword = "wrong-password";

      const encrypted = await encrypt(message, password);

      await expect(decrypt(encrypted, wrongPassword)).rejects.toThrow();
    });

    it("should fail with corrupted data", async () => {
      const corrupted = "invalid:encrypted:data:here";
      const password = "password";

      await expect(decrypt(corrupted, password)).rejects.toThrow();
    });

    it("should handle long messages correctly", async () => {
      const message = "A".repeat(10000);
      const password = "password";

      const encrypted = await encrypt(message, password);
      const decrypted = await decrypt(encrypted, password);

      expect(decrypted).toBe(message);
    });

    it("should maintain message integrity", async () => {
      const message = "Exact message with\nnewlines\tand\ttabs";
      const password = "password";

      const encrypted = await encrypt(message, password);
      const decrypted = await decrypt(encrypted, password);

      expect(decrypted).toBe(message);
    });
  });

  describe("encryption format", () => {
    it("should produce base64 encoded components", async () => {
      const message = "Test";
      const password = "password";

      const encrypted = await encrypt(message, password);
      const parts = encrypted.split(":");

      // Check that all parts are base64
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      expect(parts[0]).toMatch(base64Regex); // salt
      expect(parts[1]).toMatch(base64Regex); // nonce
      expect(parts[2]).toMatch(base64Regex); // ciphertext
      expect(parts[3]).toMatch(base64Regex); // tag
    });

    it("should have correct salt length (32 bytes = 44 base64 chars)", async () => {
      const message = "Test";
      const password = "password";

      const encrypted = await encrypt(message, password);
      const salt = encrypted.split(":")[0];

      // 32 bytes -> 44 base64 characters (with padding)
      expect(salt.length).toBe(44);
    });

    it("should have correct nonce length (12 bytes = 16 base64 chars)", async () => {
      const message = "Test";
      const password = "password";

      const encrypted = await encrypt(message, password);
      const nonce = encrypted.split(":")[1];

      // 12 bytes -> 16 base64 characters
      expect(nonce.length).toBe(16);
    });
  });

  describe("backward compatibility", () => {
    it("should decrypt non-compressed messages (4 parts)", async () => {
      const message = "Test message";
      const password = "password";

      const encrypted = await encrypt(message, password, false);
      const parts = encrypted.split(":");

      expect(parts).toHaveLength(4); // No compression flag

      const decrypted = await decrypt(encrypted, password);
      expect(decrypted).toBe(message);
    });

    it("should handle both compressed and non-compressed formats", async () => {
      const message = "Test message";
      const password = "password";

      const nonCompressed = await encrypt(message, password, false);
      const compressed = await encrypt(message, password, true);

      const decrypted1 = await decrypt(nonCompressed, password);
      const decrypted2 = await decrypt(compressed, password);

      expect(decrypted1).toBe(message);
      expect(decrypted2).toBe(message);
    });
  });

  describe("compression efficiency", () => {
    it("should compress repetitive data effectively", async () => {
      const message = "A".repeat(1000);
      const password = "password";

      const nonCompressed = await encrypt(message, password, false);
      const compressed = await encrypt(message, password, true);

      // Compressed should be significantly smaller
      expect(compressed.length).toBeLessThan(nonCompressed.length);
    });

    it("should still work on incompressible data", async () => {
      // Random-like data that won't compress well
      const message = "AbCdEf123!@#XyZ";
      const password = "password";

      const compressed = await encrypt(message, password, true);
      const decrypted = await decrypt(compressed, password);

      expect(decrypted).toBe(message);
    });
  });
});
