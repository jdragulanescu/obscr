const {
  encodeMessageToImage,
  extractMessageFromImage,
  calculateImageCapacity,
} = require("../../lib/steg");
const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");
const OUTPUT_DIR = path.join(__dirname, "..", "output");
const SMALL_IMAGE = path.join(FIXTURES_DIR, "test-small.png");
const MEDIUM_IMAGE = path.join(FIXTURES_DIR, "test-medium.png");
const LARGE_IMAGE = path.join(FIXTURES_DIR, "test-large.png");

describe("Steg Module", () => {
  // Ensure output directory exists
  beforeAll(() => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  // Clean up test output files after all tests
  afterAll(() => {
    if (fs.existsSync(OUTPUT_DIR)) {
      const files = fs.readdirSync(OUTPUT_DIR);
      files.forEach((file) => {
        fs.unlinkSync(path.join(OUTPUT_DIR, file));
      });
    }
  });

  describe("calculateImageCapacity", () => {
    it("should calculate capacity correctly for small image", () => {
      const imageBuffer = fs.readFileSync(SMALL_IMAGE);
      const imageData = PNG.sync.read(imageBuffer);

      const capacity = calculateImageCapacity(imageData);

      // 10x10 = 100 pixels, 3 bits per pixel = 300 bits
      expect(capacity).toBe(300);
    });

    it("should calculate capacity correctly for medium image", () => {
      const imageBuffer = fs.readFileSync(MEDIUM_IMAGE);
      const imageData = PNG.sync.read(imageBuffer);

      const capacity = calculateImageCapacity(imageData);

      // 100x100 = 10,000 pixels, 3 bits per pixel = 30,000 bits
      expect(capacity).toBe(30000);
    });

    it("should calculate capacity correctly for large image", () => {
      const imageBuffer = fs.readFileSync(LARGE_IMAGE);
      const imageData = PNG.sync.read(imageBuffer);

      const capacity = calculateImageCapacity(imageData);

      // 200x200 = 40,000 pixels, 3 bits per pixel = 120,000 bits
      expect(capacity).toBe(120000);
    });
  });

  describe("encodeMessageToImage", () => {
    it("should encode a message successfully", async () => {
      const message = "encrypted-data-here";
      const encKey = "password123";
      const outputPath = path.join(OUTPUT_DIR, "test-output.png");

      const result = await encodeMessageToImage(
        MEDIUM_IMAGE,
        message,
        encKey,
        outputPath
      );

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(outputPath);
      expect(result.capacity).toBeDefined();
      expect(result.capacity.totalBits).toBe(30000);
      expect(result.capacity.usedBits).toBeGreaterThan(0);
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it("should encode with custom output path", async () => {
      const message = "test";
      const encKey = "key";
      const outputPath = path.join(OUTPUT_DIR, "custom-output.png");

      const result = await encodeMessageToImage(MEDIUM_IMAGE, message, encKey, outputPath);

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it("should fail with non-existent image file", async () => {
      const message = "test";
      const encKey = "key";
      const badPath = "non-existent-image.png";

      const result = await encodeMessageToImage(badPath, message, encKey);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("not found");
    });

    it("should fail when message is too large", async () => {
      const message = "A".repeat(10000); // Very long message
      const encKey = "key";

      const result = await encodeMessageToImage(SMALL_IMAGE, message, encKey);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("too large");
    });

    it("should provide capacity information", async () => {
      const message = "test message";
      const encKey = "password";
      const outputPath = path.join(OUTPUT_DIR, "test-output-medium.png");

      const result = await encodeMessageToImage(
        MEDIUM_IMAGE,
        message,
        encKey,
        outputPath
      );

      expect(result.success).toBe(true);
      expect(result.capacity).toBeDefined();
      expect(result.capacity.totalBits).toBeDefined();
      expect(result.capacity.usedBits).toBeDefined();
      expect(result.capacity.utilization).toBeDefined();
      expect(result.capacity.utilization).toMatch(/%$/);
    });

    it("should handle different encryption keys", async () => {
      const message = "same-message";
      const key1 = "key1";
      const key2 = "key2";
      const outputPath1 = path.join(OUTPUT_DIR, "test-key1.png");
      const outputPath2 = path.join(OUTPUT_DIR, "test-key2.png");

      const result1 = await encodeMessageToImage(
        MEDIUM_IMAGE,
        message,
        key1,
        outputPath1
      );
      const result2 = await encodeMessageToImage(
        MEDIUM_IMAGE,
        message,
        key2,
        outputPath2
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Files should be different due to different keys
      const file1 = fs.readFileSync(outputPath1);
      const file2 = fs.readFileSync(outputPath2);
      expect(file1.equals(file2)).toBe(false);
    });
  });

  describe("extractMessageFromImage", () => {
    it("should extract an encoded message successfully", async () => {
      const originalMessage = "secret-encrypted-message";
      const encKey = "password123";
      const outputPath = path.join(OUTPUT_DIR, "test-extract.png");

      // First encode
      await encodeMessageToImage(
        MEDIUM_IMAGE,
        originalMessage,
        encKey,
        outputPath
      );

      // Then extract
      const result = await extractMessageFromImage(outputPath, encKey);

      expect(result.success).toBe(true);
      expect(result.data).toBe(originalMessage);

      // Clean up
      fs.unlinkSync(outputPath);
    });

    it("should fail with wrong encryption key", async () => {
      const message = "secret";
      const correctKey = "correct-key";
      const wrongKey = "wrong-key";
      const outputPath = path.join(OUTPUT_DIR, "test-wrong-key.png");

      // Encode with correct key
      await encodeMessageToImage(MEDIUM_IMAGE, message, correctKey, outputPath);

      // Try to extract with wrong key
      const result = await extractMessageFromImage(outputPath, wrongKey);

      // Either extraction fails or returns garbled data (not the original message)
      if (result.success) {
        expect(result.data).not.toBe(message);
      } else {
        expect(result.error).toBeDefined();
      }

      // Clean up
      fs.unlinkSync(outputPath);
    });

    it("should fail with non-existent image", async () => {
      const result = await extractMessageFromImage(
        "non-existent.png",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("not found");
    });

    it("should handle empty message encoding/decoding", async () => {
      const message = "";
      const encKey = "key";
      const outputPath = path.join(OUTPUT_DIR, "test-empty.png");

      const encodeResult = await encodeMessageToImage(
        MEDIUM_IMAGE,
        message,
        encKey,
        outputPath
      );
      expect(encodeResult.success).toBe(true);

      const extractResult = await extractMessageFromImage(outputPath, encKey);
      expect(extractResult.success).toBe(true);
      expect(extractResult.data).toBe(message);

      // Clean up
      fs.unlinkSync(outputPath);
    });

    it("should handle unicode messages", async () => {
      const message = "Hello 世界 Мир";
      const encKey = "password";
      const outputPath = path.join(OUTPUT_DIR, "test-unicode.png");

      await encodeMessageToImage(MEDIUM_IMAGE, message, encKey, outputPath);
      const result = await extractMessageFromImage(outputPath, encKey);

      expect(result.success).toBe(true);
      expect(result.data).toBe(message);

      // Clean up
      fs.unlinkSync(outputPath);
    });
  });

  describe("round-trip encoding/decoding", () => {
    const testCases = [
      { message: "Simple message", key: "password" },
      { message: "Message with\nnewlines\nand\ttabs", key: "key123" },
      { message: "Special chars !@#$%^&*()", key: "special" },
      { message: "Unicode 世界 Мир", key: "unicode" },
      { message: "Long message: " + "A".repeat(500), key: "long" },
    ];

    testCases.forEach(({ message, key }, index) => {
      it(`should handle round-trip for: "${message.substring(0, 30)}..."`, async () => {
        const outputPath = path.join(OUTPUT_DIR, `test-roundtrip-${index}.png`);

        const encodeResult = await encodeMessageToImage(
          LARGE_IMAGE,
          message,
          key,
          outputPath
        );
        expect(encodeResult.success).toBe(true);

        const extractResult = await extractMessageFromImage(outputPath, key);
        expect(extractResult.success).toBe(true);
        expect(extractResult.data).toBe(message);
      });
    });
  });

  describe("data integrity", () => {
    it("should not corrupt the image structure", async () => {
      const message = "test";
      const encKey = "key";
      const outputPath = path.join(OUTPUT_DIR, "test-integrity.png");

      await encodeMessageToImage(MEDIUM_IMAGE, message, encKey, outputPath);

      // Verify the output is a valid PNG
      const buffer = fs.readFileSync(outputPath);
      expect(() => PNG.sync.read(buffer)).not.toThrow();

      const originalPng = PNG.sync.read(fs.readFileSync(MEDIUM_IMAGE));
      const encodedPng = PNG.sync.read(buffer);

      // Dimensions should be preserved
      expect(encodedPng.width).toBe(originalPng.width);
      expect(encodedPng.height).toBe(originalPng.height);

      // Clean up
      fs.unlinkSync(outputPath);
    });

    it("should make minimal visual changes", async () => {
      const message = "test";
      const encKey = "key";
      const outputPath = path.join(OUTPUT_DIR, "test-visual.png");

      await encodeMessageToImage(MEDIUM_IMAGE, message, encKey, outputPath);

      const originalPng = PNG.sync.read(fs.readFileSync(MEDIUM_IMAGE));
      const encodedPng = PNG.sync.read(fs.readFileSync(outputPath));

      let totalDifference = 0;
      let pixelCount = 0;

      // Check that pixel changes are minimal (only LSB changes)
      for (let i = 0; i < originalPng.data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          // RGB channels
          const diff = Math.abs(
            originalPng.data[i + c] - encodedPng.data[i + c]
          );
          totalDifference += diff;
          pixelCount++;
          // LSB changes should be at most 1 per channel
          expect(diff).toBeLessThanOrEqual(1);
        }
      }

      // Average difference should be very small
      const avgDiff = totalDifference / pixelCount;
      expect(avgDiff).toBeLessThan(1);

      // Clean up
      fs.unlinkSync(outputPath);
    });
  });

  describe("capacity limits", () => {
    it("should handle message at capacity limit", async () => {
      // Calculate max message size for small image
      const imageBuffer = fs.readFileSync(SMALL_IMAGE);
      const imageData = PNG.sync.read(imageBuffer);
      const capacity = calculateImageCapacity(imageData);

      // Create a message that uses most of capacity (accounting for encoding overhead)
      const maxMessageSize = Math.floor(capacity / 8) - 10; // Leave some margin
      const message = "A".repeat(maxMessageSize);
      const encKey = "key";
      const outputPath = path.join(OUTPUT_DIR, "test-capacity.png");

      const result = await encodeMessageToImage(
        SMALL_IMAGE,
        message,
        encKey,
        outputPath
      );

      if (result.success) {
        const extractResult = await extractMessageFromImage(outputPath, encKey);
        expect(extractResult.success).toBe(true);
        expect(extractResult.data).toBe(message);
        fs.unlinkSync(outputPath);
      } else {
        // If it fails, error should mention capacity
        expect(result.error).toContain("large");
      }
    });
  });

  describe("obfuscation flag", () => {
    it("should scatter message bits across entire image when obfuscation is OFF", async () => {
      const { get_hashed_order, str_to_bits } = require("../../lib/utils");
      const { encrypt } = require("../../lib/crypto");

      const message = "test";
      const password = "password123";
      const encKey = password + "S3cReTK3Y"; // SECRET_KEY from main.js
      const outputPath = path.join(OUTPUT_DIR, "test-obfuscation-off.png");

      // Encrypt the message
      const encrypted = await encrypt(message, password, false);

      // Encode with obfuscation OFF
      const result = await encodeMessageToImage(
        MEDIUM_IMAGE,
        encrypted,
        encKey,
        outputPath,
        false // obfuscation OFF
      );

      expect(result.success).toBe(true);

      // Read both images
      const originalBuffer = fs.readFileSync(MEDIUM_IMAGE);
      const encodedBuffer = fs.readFileSync(outputPath);
      const originalImage = PNG.sync.read(originalBuffer);
      const encodedImage = PNG.sync.read(encodedBuffer);

      // Calculate which positions should have changed
      const dataBits = str_to_bits(encrypted, 1);
      const capacity = calculateImageCapacity(originalImage);
      const scrambledOrder = get_hashed_order(encKey, capacity);

      // Create set of expected changed positions
      const expectedPositions = new Set();
      for (let i = 0; i < dataBits.length; i++) {
        expectedPositions.add(scrambledOrder[i]);
      }

      // Check each bit position in the image
      let changedCount = 0;
      let unchangedCount = 0;
      let unexpectedChanges = 0;

      for (let bitPos = 0; bitPos < capacity; bitPos++) {
        const pixelIdx = Math.floor(bitPos / 3);
        const channelIdx = bitPos % 3;
        const dataIdx = pixelIdx * 4 + channelIdx;

        const originalBit = originalImage.data[dataIdx] & 1;
        const encodedBit = encodedImage.data[dataIdx] & 1;
        const isExpectedPosition = expectedPositions.has(bitPos);

        if (originalBit !== encodedBit) {
          changedCount++;
          if (!isExpectedPosition) {
            unexpectedChanges++;
          }
        } else if (isExpectedPosition) {
          unchangedCount++;
        }
      }

      // Verify no unexpected positions changed
      expect(unexpectedChanges).toBe(0);

      // Verify we touched all expected positions (changed or not)
      expect(changedCount + unchangedCount).toBe(dataBits.length);

      // At least some bits should have changed (statistically very likely)
      expect(changedCount).toBeGreaterThan(dataBits.length * 0.3);

      // Verify bits are scattered (not all at beginning)
      const firstQuarterChanges = Array.from(expectedPositions).filter(
        (pos) => pos < capacity / 4
      ).length;
      const lastQuarterChanges = Array.from(expectedPositions).filter(
        (pos) => pos >= (capacity * 3) / 4
      ).length;

      // At least some bits should be in different quarters of the image
      expect(firstQuarterChanges).toBeGreaterThan(0);
      expect(lastQuarterChanges).toBeGreaterThan(0);

      // Clean up
      fs.unlinkSync(outputPath);
    });

    it("should write to more pixels when obfuscation is ON", async () => {
      const { encrypt } = require("../../lib/crypto");

      const message = "test";
      const password = "password123";
      const encKey = password + "S3cReTK3Y";
      const outputPathOff = path.join(OUTPUT_DIR, "test-obf-off.png");
      const outputPathOn = path.join(OUTPUT_DIR, "test-obf-on.png");

      const encrypted = await encrypt(message, password, false);

      // Encode with obfuscation OFF
      await encodeMessageToImage(
        MEDIUM_IMAGE,
        encrypted,
        encKey,
        outputPathOff,
        false
      );

      // Encode with obfuscation ON
      await encodeMessageToImage(
        MEDIUM_IMAGE,
        encrypted,
        encKey,
        outputPathOn,
        true
      );

      // Read all images
      const originalBuffer = fs.readFileSync(MEDIUM_IMAGE);
      const encodedOffBuffer = fs.readFileSync(outputPathOff);
      const encodedOnBuffer = fs.readFileSync(outputPathOn);

      const originalImage = PNG.sync.read(originalBuffer);
      const encodedOffImage = PNG.sync.read(encodedOffBuffer);
      const encodedOnImage = PNG.sync.read(encodedOnBuffer);

      const capacity = calculateImageCapacity(originalImage);

      // Count changed bits for both
      let changedOffCount = 0;
      let changedOnCount = 0;

      for (let bitPos = 0; bitPos < capacity; bitPos++) {
        const pixelIdx = Math.floor(bitPos / 3);
        const channelIdx = bitPos % 3;
        const dataIdx = pixelIdx * 4 + channelIdx;

        const originalBit = originalImage.data[dataIdx] & 1;
        const encodedOffBit = encodedOffImage.data[dataIdx] & 1;
        const encodedOnBit = encodedOnImage.data[dataIdx] & 1;

        if (originalBit !== encodedOffBit) changedOffCount++;
        if (originalBit !== encodedOnBit) changedOnCount++;
      }

      // Obfuscation ON should change significantly more bits (most of the image)
      expect(changedOnCount).toBeGreaterThan(changedOffCount * 10);
      expect(changedOnCount).toBeGreaterThan(capacity * 0.4); // At least 40% changed

      // Clean up
      fs.unlinkSync(outputPathOff);
      fs.unlinkSync(outputPathOn);
    });
  });
});
