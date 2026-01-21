const { get_hashed_order, str_to_bits, bits_to_str } = require("./utils");

/**
 * Pure steganography core functions - shared between CLI and web
 * No file I/O or crypto operations here - those are injected by the platform layer
 */

/**
 * Prepares data bits for writing by scrambling them with a password-based key
 * @param {number[]} dataBits - Array of data bits to write
 * @param {string} encryptionKey - Key for scrambling the data
 * @param {number} totalCapacity - Total capacity of the image in bits
 * @param {boolean} obfuscate - Whether to fill unused bits with random data (default: true)
 * @returns {Object} Object with sparse bit mapping and metadata
 * @throws {Error} If data is too large for the image
 */
const prepare_write_data = (dataBits, encryptionKey, totalCapacity, obfuscate = true) => {
  const dataBitsLength = dataBits.length;
  if (dataBitsLength > totalCapacity) {
    throw new Error(
      `Message too large! Message requires ${dataBitsLength} bits, but image can only hold ${totalCapacity} bits. ` +
        `Try using a larger image or enabling compression with --compress flag.`
    );
  }

  // Always scramble message bits across entire image using password-derived positions
  const scrambledOrder = get_hashed_order(encryptionKey, totalCapacity);
  const sparseData = {};

  for (let i = 0; i < dataBitsLength; i++) {
    const position = scrambledOrder[i];
    sparseData[position] = dataBits[i];
  }

  return {
    sparse: sparseData,
    obfuscate: obfuscate,
    totalCapacity: totalCapacity,
  };
};

/**
 * Extracts and unscrambles data bits using password-based key
 * @param {number[]} dataBits - Array of scrambled bits from image
 * @param {string} encryptionKey - Key for unscrambling the data
 * @returns {number[]} Unscrambled bit array
 */
const prepare_read_data = (dataBits, encryptionKey) => {
  const dataBitsLength = dataBits.length;
  const result = new Array(dataBitsLength);
  const scrambledOrder = get_hashed_order(encryptionKey, dataBitsLength);

  for (let i = 0; i < dataBitsLength; i++) {
    result[i] = dataBits[scrambledOrder[i]];
  }

  return result;
};

/**
 * Extracts the least significant bits from image RGB channels
 * @param {Object} imageData - PNG image data object
 * @returns {number[]} Array of extracted LSB bits
 */
const get_bits_lsb = (imageData) => {
  const result = [];
  // Process RGB channels (skip alpha at i+3)
  for (let i = 0; i < imageData.data.length; i += 4) {
    result.push(imageData.data[i] % 2 === 1 ? 1 : 0); // Red LSB
    result.push(imageData.data[i + 1] % 2 === 1 ? 1 : 0); // Green LSB
    result.push(imageData.data[i + 2] % 2 === 1 ? 1 : 0); // Blue LSB
  }
  return result;
};

/**
 * Writes bits to the least significant bits of image RGB channels
 * @param {Object} imageData - PNG image data object
 * @param {Object} writeData - Object with sparse bit mapping and metadata
 * @returns {Object} Modified image data
 */
const write_lsb = (imageData, writeData) => {
  /**
   * Clears the LSB of a byte value
   * @param {number} value - Byte value
   * @returns {number} Value with LSB cleared
   */
  const clearLSB = (value) => {
    return value % 2 === 1 ? value - 1 : value;
  };

  /**
   * Sets the LSB of a byte value
   * @param {number} value - Byte value
   * @returns {number} Value with LSB set
   */
  const setLSB = (value) => {
    return value % 2 === 1 ? value : value + 1;
  };

  const { sparse, obfuscate, totalCapacity } = writeData;

  // Process each bit position in the image
  for (let bitPos = 0; bitPos < totalCapacity; bitPos++) {
    const pixelIdx = Math.floor(bitPos / 3);
    const channelIdx = bitPos % 3;
    const dataIdx = pixelIdx * 4 + channelIdx; // RGBA offset

    if (sparse.hasOwnProperty(bitPos)) {
      // Write actual message bit at this position
      imageData.data[dataIdx] = sparse[bitPos]
        ? setLSB(imageData.data[dataIdx])
        : clearLSB(imageData.data[dataIdx]);
    } else if (obfuscate) {
      // Fill unused position with random bit for obfuscation
      const randomBit = Math.floor(Math.random() * 2);
      imageData.data[dataIdx] = randomBit
        ? setLSB(imageData.data[dataIdx])
        : clearLSB(imageData.data[dataIdx]);
    }
    // If obfuscate is false and no data at this position, leave pixel unchanged
  }

  return imageData;
};

/**
 * Calculates the bit capacity of an image
 * @param {Object} imageData - PNG image data object
 * @returns {number} Capacity in bits
 */
const calculateImageCapacity = (imageData) => {
  return Math.floor(imageData.data.length / 4) * 3; // 3 bits per pixel (RGB)
};

// CommonJS export
module.exports = {
  prepare_write_data,
  prepare_read_data,
  get_bits_lsb,
  write_lsb,
  calculateImageCapacity,
  str_to_bits,
  bits_to_str,
};
