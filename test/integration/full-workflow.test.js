const { encrypt, decrypt } = require("../../lib/crypto");
const {
  encodeMessageToImage,
  extractMessageFromImage,
} = require("../../lib/steg");
const fs = require("fs");
const path = require("path");

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");
const OUTPUT_DIR = path.join(__dirname, "..", "output");
const TEST_IMAGE = path.join(FIXTURES_DIR, "test-large.png");
const SECRET_KEY = "S3cReTK3Y"; // Same as in index.js

describe("Full Encryption/Decryption Workflow", () => {
  beforeAll(() => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(OUTPUT_DIR)) {
      const files = fs.readdirSync(OUTPUT_DIR);
      files.forEach((file) => {
        fs.unlinkSync(path.join(OUTPUT_DIR, file));
      });
    }
  });

  describe("Basic workflow", () => {
    it("should complete full encryption and decryption cycle", async () => {
      const originalMessage = "This is a secret message!";
      const password = "my-secure-password";
      const outputPath = path.join(OUTPUT_DIR, "integration-test-output.png");

      // Step 1: Encrypt the message
      const encryptedMessage = await encrypt(originalMessage, password);
      expect(encryptedMessage).toBeDefined();

      // Step 2: Hide encrypted message in image
      const encodeResult = await encodeMessageToImage(
        TEST_IMAGE,
        encryptedMessage,
        password + SECRET_KEY,
        outputPath
      );
      expect(encodeResult.success).toBe(true);
      expect(fs.existsSync(outputPath)).toBe(true);

      // Step 3: Extract encrypted message from image
      const extractResult = await extractMessageFromImage(
        outputPath,
        password + SECRET_KEY
      );
      expect(extractResult.success).toBe(true);

      // Step 4: Decrypt the message
      const decryptedMessage = await decrypt(extractResult.data, password);
      expect(decryptedMessage).toBe(originalMessage);
    });

    it("should handle the full workflow with compression", async () => {
      const originalMessage = "A".repeat(1000); // Compressible message
      const password = "password123";
      const outputPath = path.join(OUTPUT_DIR, "integration-compressed.png");

      // Encrypt with compression
      const encryptedMessage = await encrypt(originalMessage, password, true);
      expect(encryptedMessage).toContain(":1"); // Compression flag

      // Encode to image
      const encodeResult = await encodeMessageToImage(
        TEST_IMAGE,
        encryptedMessage,
        password + SECRET_KEY,
        outputPath
      );
      expect(encodeResult.success).toBe(true);

      // Extract from image
      const extractResult = await extractMessageFromImage(
        outputPath,
        password + SECRET_KEY
      );
      expect(extractResult.success).toBe(true);

      // Decrypt (should auto-detect compression)
      const decryptedMessage = await decrypt(extractResult.data, password);
      expect(decryptedMessage).toBe(originalMessage);
    });

    it("should handle workflow without compression", async () => {
      const originalMessage = "Simple message";
      const password = "password123";
      const outputPath = path.join(OUTPUT_DIR, "integration-uncompressed.png");

      // Encrypt without compression
      const encryptedMessage = await encrypt(originalMessage, password, false);
      expect(encryptedMessage.split(":")).toHaveLength(4); // No compression flag

      // Encode to image
      const encodeResult = await encodeMessageToImage(
        TEST_IMAGE,
        encryptedMessage,
        password + SECRET_KEY,
        outputPath
      );
      expect(encodeResult.success).toBe(true);

      // Extract from image
      const extractResult = await extractMessageFromImage(
        outputPath,
        password + SECRET_KEY
      );
      expect(extractResult.success).toBe(true);

      // Decrypt
      const decryptedMessage = await decrypt(extractResult.data, password);
      expect(decryptedMessage).toBe(originalMessage);
    });
  });

  describe("Error scenarios", () => {
    it("should fail with wrong password at encryption step", async () => {
      const originalMessage = "Secret";
      const correctPassword = "correct";
      const wrongPassword = "wrong";
      const outputPath = path.join(OUTPUT_DIR, "integration-wrong-pass.png");

      // Encrypt with correct password
      const encryptedMessage = await encrypt(originalMessage, correctPassword);

      // Encode to image
      await encodeMessageToImage(
        TEST_IMAGE,
        encryptedMessage,
        correctPassword + SECRET_KEY,
        outputPath
      );

      // Extract from image
      const extractResult = await extractMessageFromImage(
        outputPath,
        correctPassword + SECRET_KEY
      );
      expect(extractResult.success).toBe(true);

      // Try to decrypt with wrong password - should fail
      await expect(
        decrypt(extractResult.data, wrongPassword)
      ).rejects.toThrow();

      // Clean up
      fs.unlinkSync(outputPath);
    });

    it("should fail with wrong key for steganography", async () => {
      const originalMessage = "Secret";
      const password = "password";
      const correctKey = password + SECRET_KEY;
      const wrongKey = password + "WRONG";
      const outputPath = path.join(OUTPUT_DIR, "integration-wrong-steg-key.png");

      // Encrypt
      const encryptedMessage = await encrypt(originalMessage, password);

      // Encode with correct key
      await encodeMessageToImage(
        TEST_IMAGE,
        encryptedMessage,
        correctKey,
        outputPath
      );

      // Try to extract with wrong key - should fail or return garbage
      const extractResult = await extractMessageFromImage(
        outputPath,
        wrongKey
      );

      // Either extraction fails or decryption will fail
      if (extractResult.success) {
        await expect(decrypt(extractResult.data, password)).rejects.toThrow();
      }

      // Clean up
      fs.unlinkSync(outputPath);
    });
  });

  describe("Data integrity", () => {
    it("should maintain exact message content through full cycle", async () => {
      const testMessages = [
        "Simple ASCII text",
        "Text with\nnewlines\nand\ttabs",
        "Special characters: !@#$%^&*()_+-=[]{}|;':\",./<>?",
        "Unicode: Hello 世界 🌍 Мир עולם",
        "Numbers and symbols: 123456789 ½ ¼ ¾ © ® ™",
        "Mixed content:\nLine 1\n\tTabbed\nSpecial: © 世界",
      ];

      for (const originalMessage of testMessages) {
        const password = "test-password";
        const outputPath = path.join(
          OUTPUT_DIR,
          `integration-integrity-${testMessages.indexOf(originalMessage)}.png`
        );

        // Full workflow
        const encryptedMessage = await encrypt(originalMessage, password);
        const encodeResult = await encodeMessageToImage(
          TEST_IMAGE,
          encryptedMessage,
          password + SECRET_KEY,
          outputPath
        );
        expect(encodeResult.success).toBe(true);

        const extractResult = await extractMessageFromImage(
          outputPath,
          password + SECRET_KEY
        );
        expect(extractResult.success).toBe(true);

        const decryptedMessage = await decrypt(extractResult.data, password);

        // Exact match required
        expect(decryptedMessage).toBe(originalMessage);
        expect(decryptedMessage.length).toBe(originalMessage.length);
      }
    });

    it("should handle large messages with compression", async () => {
      const originalMessage = "This is a test message. ".repeat(100); // ~2400 chars
      const password = "password";
      const outputPath = path.join(OUTPUT_DIR, "integration-large-message.png");

      // Use compression for large message
      const encryptedMessage = await encrypt(originalMessage, password, true);

      const encodeResult = await encodeMessageToImage(
        TEST_IMAGE,
        encryptedMessage,
        password + SECRET_KEY,
        outputPath
      );
      expect(encodeResult.success).toBe(true);

      const extractResult = await extractMessageFromImage(
        outputPath,
        password + SECRET_KEY
      );
      expect(extractResult.success).toBe(true);

      const decryptedMessage = await decrypt(extractResult.data, password);
      expect(decryptedMessage).toBe(originalMessage);
    });
  });

  describe("Backward compatibility simulation", () => {
    it("should decrypt old format (4-part) messages", async () => {
      const message = "Old format message";
      const password = "password";
      const outputPath = path.join(OUTPUT_DIR, "integration-old-format.png");

      // Create old format (no compression)
      const encryptedMessage = await encrypt(message, password, false);
      expect(encryptedMessage.split(":")).toHaveLength(4);

      // Full workflow
      const encodeResult = await encodeMessageToImage(
        TEST_IMAGE,
        encryptedMessage,
        password + SECRET_KEY,
        outputPath
      );
      expect(encodeResult.success).toBe(true);

      const extractResult = await extractMessageFromImage(
        outputPath,
        password + SECRET_KEY
      );
      expect(extractResult.success).toBe(true);

      const decryptedMessage = await decrypt(extractResult.data, password);
      expect(decryptedMessage).toBe(message);

      // Clean up
      fs.unlinkSync(outputPath);
    });

    it("should decrypt new format (5-part compressed) messages", async () => {
      const message = "New format compressed message";
      const password = "password";
      const outputPath = path.join(OUTPUT_DIR, "integration-new-format.png");

      // Create new format (with compression)
      const encryptedMessage = await encrypt(message, password, true);
      expect(encryptedMessage.split(":")).toHaveLength(5);

      // Full workflow
      const encodeResult = await encodeMessageToImage(
        TEST_IMAGE,
        encryptedMessage,
        password + SECRET_KEY,
        outputPath
      );
      expect(encodeResult.success).toBe(true);

      const extractResult = await extractMessageFromImage(
        outputPath,
        password + SECRET_KEY
      );
      expect(extractResult.success).toBe(true);

      const decryptedMessage = await decrypt(extractResult.data, password);
      expect(decryptedMessage).toBe(message);

      // Clean up
      fs.unlinkSync(outputPath);
    });
  });

  describe("Compression benefits", () => {
    it("should show compression reduces encrypted data size", async () => {
      const message = "A".repeat(500); // Highly compressible
      const password = "password";

      const uncompressed = await encrypt(message, password, false);
      const compressed = await encrypt(message, password, true);

      // Compressed should be significantly smaller
      expect(compressed.length).toBeLessThan(uncompressed.length);

      // Both should decrypt correctly
      const decrypted1 = await decrypt(uncompressed, password);
      const decrypted2 = await decrypt(compressed, password);

      expect(decrypted1).toBe(message);
      expect(decrypted2).toBe(message);
    });
  });
});
