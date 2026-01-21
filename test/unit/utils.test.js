const { get_hashed_order, str_to_bits, bits_to_str } = require("../../lib/utils");

describe("Utils Module", () => {
  describe("get_hashed_order", () => {
    it("should generate a permutation of indices", () => {
      const password = "test-password";
      const length = 100;

      const order = get_hashed_order(password, length);

      expect(order).toHaveLength(length);
      expect(new Set(order).size).toBe(length); // All unique
      expect(Math.max(...order)).toBe(length - 1);
      expect(Math.min(...order)).toBe(0);
    });

    it("should produce deterministic output for same password", () => {
      const password = "password123";
      const length = 50;

      const order1 = get_hashed_order(password, length);
      const order2 = get_hashed_order(password, length);

      expect(order1).toEqual(order2);
    });

    it("should produce different output for different passwords", () => {
      const password1 = "password1";
      const password2 = "password2";
      const length = 50;

      const order1 = get_hashed_order(password1, length);
      const order2 = get_hashed_order(password2, length);

      expect(order1).not.toEqual(order2);
    });

    it("should handle small arrays", () => {
      const password = "test";
      const length = 5;

      const order = get_hashed_order(password, length);

      expect(order).toHaveLength(length);
      expect(new Set(order).size).toBe(length);
    });

    it("should handle large arrays", () => {
      const password = "test";
      const length = 10000;

      const order = get_hashed_order(password, length);

      expect(order).toHaveLength(length);
      expect(new Set(order).size).toBe(length);
    });

    it("should handle single element", () => {
      const password = "test";
      const length = 1;

      const order = get_hashed_order(password, length);

      expect(order).toEqual([0]);
    });
  });

  describe("str_to_bits and bits_to_str", () => {
    it("should convert string to bits and back", () => {
      const original = "Hello, World!";
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
    });

    it("should handle unicode characters (2-3 byte UTF-8)", () => {
      const original = "Hello 世界";
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
    });

    it("should handle empty string", () => {
      const original = "";
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
    });

    it("should handle special characters", () => {
      const original = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
    });

    it("should handle newlines and tabs", () => {
      const original = "Line 1\nLine 2\tTabbed";
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
    });

    it("should handle long strings", () => {
      const original = "A".repeat(1000);
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
    });

    it("should support error correction with multiple copies", () => {
      const original = "Test";
      const numCopies = 3;

      const bits = str_to_bits(original, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
      expect(bits.length).toBe(original.length * 8 * numCopies + 24 * numCopies); // + end marker
    });

    it("should handle majority voting for bit errors", () => {
      const original = "A";
      const numCopies = 3;

      const bits = str_to_bits(original, numCopies);

      // Flip one bit in a triplet (majority should still work)
      bits[0] = bits[0] === 0 ? 1 : 0;

      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
    });

    it("should produce only 0s and 1s", () => {
      const original = "Test123";
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);

      const allBinary = bits.every((bit) => bit === 0 || bit === 1);
      expect(allBinary).toBe(true);
    });

    it("should include end marker", () => {
      const original = "Test";
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);

      // End marker is 24 bits of 1s
      const lastBits = bits.slice(-24);
      const allOnes = lastBits.every((bit) => bit === 1);
      expect(allOnes).toBe(true);
    });

    it("should handle different number of copies", () => {
      const original = "Test";

      for (let copies = 1; copies <= 5; copies++) {
        const bits = str_to_bits(original, copies);
        const restored = bits_to_str(bits, copies);
        expect(restored).toBe(original);
      }
    });
  });

  describe("bit array properties", () => {
    it("should create correct bit length for ASCII", () => {
      const original = "ABC"; // 3 ASCII chars = 24 bits + 24 end marker
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);

      // Each char is 8 bits, plus 24 bit end marker
      expect(bits.length).toBeGreaterThanOrEqual(24 + 24);
    });

    it("should handle UTF-8 multi-byte characters correctly", () => {
      const original = "€£¥"; // 2-3 byte characters
      const numCopies = 1;

      const bits = str_to_bits(original, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(original);
    });
  });

  describe("round-trip consistency", () => {
    const testCases = [
      "Simple text",
      "Text with 数字 123",
      "Special !@#$%^&*()",
      "Multi\nLine\nText",
      "Tab\tSeparated\tValues",
      "  Spaces  and  tabs\t",
      "Mixed case aBcDeF",
      "",
      "A",
    ];

    testCases.forEach((testCase) => {
      it(`should handle: "${testCase.substring(0, 20)}..."`, () => {
        const numCopies = 1;
        const bits = str_to_bits(testCase, numCopies);
        const restored = bits_to_str(bits, numCopies);
        expect(restored).toBe(testCase);
      });
    });
  });

  describe("UTF-8 decoder bounds checking (via bits_to_str)", () => {
    it("should handle messages with truncated UTF-8 sequences without errors", () => {
      // Test via the public API (bits_to_str) which uses utf8Decode internally
      // Create a bit stream that would result in truncated UTF-8 when decoded
      // This simulates what happens with wrong password

      // Create a message that ends with a multi-byte character
      const testMessage = "Hello 世"; // Ends with 3-byte UTF-8 char
      const numCopies = 1;

      const bits = str_to_bits(testMessage, numCopies);

      // Truncate the bit array to simulate corrupted data
      // Remove last few bits to create incomplete UTF-8 sequence
      const truncatedBits = bits.slice(0, bits.length - 10);

      // Should not throw when decoding truncated data
      expect(() => {
        const result = bits_to_str(truncatedBits, numCopies);
        // Result will be partial but should not crash
        expect(typeof result).toBe("string");
      }).not.toThrow();
    });

    it("should handle complete multi-byte characters correctly", () => {
      // Valid 2-byte and 3-byte UTF-8 sequences
      const message = "Hello 世界 Мир"; // Contains 2-byte and 3-byte characters
      const numCopies = 1;

      const bits = str_to_bits(message, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(message);
    });

    it("should handle wrong password scenario gracefully", () => {
      // When wrong password is used, bits are unscrambled incorrectly
      // producing random byte sequences that may have truncated UTF-8
      const message = "Secret message with unicode 世界";
      const numCopies = 1;

      const bits = str_to_bits(message, numCopies);

      // Shuffle bits to simulate wrong password scrambling
      const shuffledBits = [...bits].sort(() => Math.random() - 0.5);

      // Should not throw even with completely corrupted data
      expect(() => {
        const result = bits_to_str(shuffledBits, numCopies);
        // Result will be garbage but should not crash
        expect(typeof result).toBe("string");
      }).not.toThrow();
    });

    it("should handle very short corrupted bit arrays", () => {
      // Minimal bit array that could cause issues
      const shortBits = [1, 1, 1, 1, 0, 0, 0, 0]; // Just one byte
      const numCopies = 1;

      expect(() => {
        bits_to_str(shortBits, numCopies);
      }).not.toThrow();
    });

    it("should handle bit arrays with partial multi-byte sequences", () => {
      // Create a message, then truncate in the middle of a multi-byte char
      const message = "Test 世";
      const numCopies = 1;
      const bits = str_to_bits(message, numCopies);

      // Find where the multi-byte character starts and truncate in the middle
      const truncatedBits = bits.slice(0, bits.length - 16); // Remove partial char

      expect(() => {
        const result = bits_to_str(truncatedBits, numCopies);
        // Should get "Test " without crashing
        expect(result.startsWith("Test")).toBe(true);
      }).not.toThrow();
    });
  });

  describe("edge cases for bit conversion", () => {
    it("should handle very long strings without truncation errors", () => {
      const longMessage = "Test message with unicode 世界! ".repeat(50);
      const numCopies = 1;

      const bits = str_to_bits(longMessage, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(longMessage);
      expect(restored.length).toBe(longMessage.length);
    });

    it("should handle strings ending with multi-byte characters", () => {
      const message = "Hello 世"; // Ends with multi-byte char
      const numCopies = 1;

      const bits = str_to_bits(message, numCopies);
      const restored = bits_to_str(bits, numCopies);

      expect(restored).toBe(message);
    });
  });
});
