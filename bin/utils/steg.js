const fs = require("fs");
const { get_hashed_order, str_to_bits, bits_to_str } = require("./utils");
const { PNG } = require("pngjs");

/**
 * Prepares data bits for writing by scrambling them with a password-based key
 * @param {number[]} dataBits - Array of data bits to write
 * @param {string} encryptionKey - Key for scrambling the data
 * @param {number} totalCapacity - Total capacity of the image in bits
 * @returns {number[]} Scrambled bit array with obfuscation
 * @throws {Error} If data is too large for the image
 */
const prepare_write_data = (dataBits, encryptionKey, totalCapacity) => {
  const dataBitsLength = dataBits.length;
  if (dataBitsLength > totalCapacity) {
    throw new Error(
      `Message too large! Message requires ${dataBitsLength} bits, but image can only hold ${totalCapacity} bits. ` +
      `Try using a larger image or enabling compression with --compress flag.`
    );
  }

  // Initialize with random bits for obfuscation
  const result = new Array(totalCapacity);
  for (let i = 0; i < totalCapacity; i++) {
    result[i] = Math.floor(Math.random() * 2);
  }

  // Scramble actual data into random positions
  const scrambledOrder = get_hashed_order(encryptionKey, totalCapacity);
  for (let i = 0; i < dataBitsLength; i++) {
    result[scrambledOrder[i]] = dataBits[i];
  }

  return result;
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
    result.push(imageData.data[i] % 2 === 1 ? 1 : 0);       // Red LSB
    result.push(imageData.data[i + 1] % 2 === 1 ? 1 : 0);   // Green LSB
    result.push(imageData.data[i + 2] % 2 === 1 ? 1 : 0);   // Blue LSB
  }
  return result;
};

/**
 * Writes bits to the least significant bits of image RGB channels
 * @param {Object} imageData - PNG image data object
 * @param {number[]} bitsToWrite - Array of bits to write
 * @returns {Object} Modified image data
 */
const write_lsb = (imageData, bitsToWrite) => {
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

  let bitIndex = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Write to RGB channels
    imageData.data[i] = bitsToWrite[bitIndex]
      ? setLSB(imageData.data[i])
      : clearLSB(imageData.data[i]);
    imageData.data[i + 1] = bitsToWrite[bitIndex + 1]
      ? setLSB(imageData.data[i + 1])
      : clearLSB(imageData.data[i + 1]);
    imageData.data[i + 2] = bitsToWrite[bitIndex + 2]
      ? setLSB(imageData.data[i + 2])
      : clearLSB(imageData.data[i + 2]);
    imageData.data[i + 3] = 255; // Keep alpha channel at full opacity
    bitIndex += 3;
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

/**
 * Validates that an image file exists and is readable
 * @param {string} imagePath - Path to the image file
 * @throws {Error} If file doesn't exist or isn't readable
 */
const validateImageFile = (imagePath) => {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const stats = fs.statSync(imagePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${imagePath}`);
  }
};

/**
 * Extracts and decrypts a hidden message from a PNG image
 * @param {string} imagePath - Path to the PNG image
 * @param {string} encryptionKey - Key for unscrambling the data
 * @returns {Promise<{success: boolean, data?: string, error?: string}>} Result object
 */
const extractMessageFromImage = async (imagePath, encryptionKey) => {
  try {
    validateImageFile(imagePath);

    const imageBuffer = fs.readFileSync(imagePath);
    const imageData = PNG.sync.read(imageBuffer);

    const bitsStream = get_bits_lsb(imageData);
    const decryptedBitsStream = prepare_read_data(bitsStream, encryptionKey);
    const message = bits_to_str(decryptedBitsStream, 1);

    if (message == null) {
      return {
        success: false,
        error: "Decryption failed. Possible causes: wrong password, corrupted file, or no hidden message.",
      };
    }

    return { success: true, data: message };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to extract message from image",
    };
  }
};

/**
 * Encodes and hides an encrypted message into a PNG image
 * @param {string} imagePath - Path to the source PNG image
 * @param {string} message - Encrypted message to hide
 * @param {string} encryptionKey - Key for scrambling the data
 * @param {string} outputPath - Path for the output image (default: "encoded.png")
 * @returns {Promise<{success: boolean, outputPath?: string, capacity?: Object, error?: string}>} Result object
 */
const encodeMessageToImage = async (
  imagePath,
  message,
  encryptionKey,
  outputPath = "encoded.png"
) => {
  try {
    validateImageFile(imagePath);

    const imageBuffer = fs.readFileSync(imagePath);
    const imageData = PNG.sync.read(imageBuffer);

    const totalCapacity = calculateImageCapacity(imageData);
    const bitStream = str_to_bits(message, 1);

    // Prepare capacity info for user
    const capacityInfo = {
      totalBits: totalCapacity,
      usedBits: bitStream.length,
      utilization: ((bitStream.length / totalCapacity) * 100).toFixed(2) + "%",
    };

    // This will throw if message is too large
    const encryptedBitStream = prepare_write_data(
      bitStream,
      encryptionKey,
      totalCapacity
    );

    const encryptedImageData = write_lsb(imageData, encryptedBitStream);
    const outputBuffer = PNG.sync.write(encryptedImageData);

    fs.writeFileSync(outputPath, outputBuffer);

    return {
      success: true,
      outputPath,
      capacity: capacityInfo,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to encode message to image",
    };
  }
};

module.exports = {
  extractMessageFromImage,
  encodeMessageToImage,
  calculateImageCapacity,
};
