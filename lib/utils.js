const { MersenneTwister } = require("./mersenne-twister");
const SHA512 = require("crypto-js/sha512");

/**
 * Generates a hashed order array for data scrambling using password-based seeding
 * @param {string} password - The password to generate the seed from
 * @param {number} arrayLength - The length of the order array to generate
 * @returns {number[]} Array of indices in scrambled order
 */
const get_hashed_order = (password, arrayLength) => {
  // O(arrayLength) algorithm using Fisher-Yates shuffle
  const orders = Array.from(Array(arrayLength).keys());
  const result = [];
  let location;
  const seed = SHA512(password).words.reduce((total, num) => {
    return total + Math.abs(num);
  }, 0);
  const rng = new MersenneTwister(seed);
  for (let i = arrayLength; i > 0; i--) {
    location = rng.genrand_int32() % i;
    result.push(orders[location]);
    orders[location] = orders[i - 1];
  }
  return result;
};

/**
 * Decodes a UTF-8 byte array to a string with bounds checking
 * Handles truncated multi-byte sequences gracefully by stopping at truncation
 * rather than reading undefined values. This is especially important when
 * decrypting with the wrong password, which produces random byte sequences.
 *
 * @param {number[]} bytes - Array of byte values (0-255)
 * @returns {string} Decoded UTF-8 string (stops at first truncated sequence)
 * @example
 * // Valid UTF-8
 * utf8Decode([72, 101, 108, 108, 111]); // "Hello"
 *
 * // Truncated multi-byte sequence (wrong password scenario)
 * utf8Decode([72, 101, 195]); // "He" (stops at truncated byte)
 */
const utf8Decode = (bytes) => {
  const chars = [];
  let offset = 0;
  const length = bytes.length;
  let currentByte, secondByte, thirdByte;

  while (offset < length) {
    currentByte = bytes[offset];

    if (128 > currentByte) {
      // Single-byte character (ASCII)
      chars.push(String.fromCharCode(currentByte));
      offset += 1;
    } else if (191 < currentByte && currentByte < 224) {
      // Two-byte character
      if (offset + 1 >= length) {
        // Truncated multi-byte sequence
        break;
      }
      secondByte = bytes[offset + 1];
      chars.push(String.fromCharCode(((currentByte & 31) << 6) | (secondByte & 63)));
      offset += 2;
    } else {
      // Three-byte character
      if (offset + 2 >= length) {
        // Truncated multi-byte sequence
        break;
      }
      secondByte = bytes[offset + 1];
      thirdByte = bytes[offset + 2];
      chars.push(
        String.fromCharCode(
          ((currentByte & 15) << 12) | ((secondByte & 63) << 6) | (thirdByte & 63)
        )
      );
      offset += 3;
    }
  }

  return chars.join("");
};

/**
 * Encodes a string to a UTF-8 byte array
 * @param {string} str - The string to encode
 * @returns {number[]} Array of byte values
 */
const utf8Encode = (str) => {
  const bytes = [];
  let offset = 0;
  let length;
  let char;

  str = encodeURI(str);
  length = str.length;

  while (offset < length) {
    char = str[offset];
    offset += 1;

    if ("%" !== char) {
      bytes.push(char.charCodeAt(0));
    } else {
      char = str[offset] + str[offset + 1];
      bytes.push(parseInt(char, 16));
      offset += 2;
    }
  }

  return bytes;
};

/**
 * Converts a bit array to a string using majority voting for error correction
 * @param {number[]} bitArray - Array of bits (0s and 1s)
 * @param {number} numCopies - Number of redundant copies per bit for error correction
 * @returns {string} Decoded string
 */
const bits_to_str = (bitArray, numCopies) => {
  /**
   * Merges multiple copies of a bit using majority voting
   * @param {number[]} bits - Array of bit copies
   * @returns {number} 0 or 1 based on majority
   */
  const mergeBits = (bits) => {
    const bitsLength = bits.length;
    let bitsSum = 0;
    for (let i = 0; i < bitsLength; i++) {
      bitsSum += bits[i];
    }
    return Math.round(bitsSum / bitsLength);
  };

  const messageArray = [];
  let byteValue, powerOfTwo;

  const messageArrayLength = Math.floor(Math.floor(bitArray.length / numCopies) / 8);
  for (let i = 0; i < messageArrayLength; i++) {
    byteValue = 0;
    powerOfTwo = 128;
    for (let j = 0; j < 8; j++) {
      byteValue +=
        mergeBits(
          bitArray.slice((i * 8 + j) * numCopies, (i * 8 + j + 1) * numCopies)
        ) * powerOfTwo;
      powerOfTwo = Math.floor(powerOfTwo / 2);
    }
    if (byteValue === 255) break; // END NOTATION
    messageArray.push(byteValue);
  }

  return utf8Decode(messageArray);
};

/**
 * Converts a string to a bit array with redundant copies for error correction
 * @param {string} str - The string to convert
 * @param {number} numCopies - Number of redundant copies per bit
 * @returns {number[]} Array of bits with redundancy
 */
const str_to_bits = (str, numCopies) => {
  const utf8Array = utf8Encode(str);
  const result = [];
  const utf8Length = utf8Array.length;

  for (let i = 0; i < utf8Length; i++) {
    for (let powerOfTwo = 128; powerOfTwo > 0; powerOfTwo = Math.floor(powerOfTwo / 2)) {
      if (Math.floor(utf8Array[i] / powerOfTwo)) {
        for (let copy = 0; copy < numCopies; copy++) {
          result.push(1);
        }
        utf8Array[i] -= powerOfTwo;
      } else {
        for (let copy = 0; copy < numCopies; copy++) {
          result.push(0);
        }
      }
    }
  }

  // Add end marker (24 bits of 1s)
  for (let j = 0; j < 24; j++) {
    for (let i = 0; i < numCopies; i++) {
      result.push(1);
    }
  }

  return result;
};

module.exports = { get_hashed_order, str_to_bits, bits_to_str };

