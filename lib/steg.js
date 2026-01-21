const fs = require("fs");
const { PNG } = require("pngjs");
const {
  prepare_write_data,
  prepare_read_data,
  get_bits_lsb,
  write_lsb,
  calculateImageCapacity,
  str_to_bits,
  bits_to_str,
} = require("./steg-core");

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
        error:
          "Decryption failed. Possible causes: wrong password, corrupted file, or no hidden message.",
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
 * @param {boolean} obfuscate - Whether to fill unused bits with random data (default: true)
 * @returns {Promise<{success: boolean, outputPath?: string, capacity?: Object, error?: string}>} Result object
 */
const encodeMessageToImage = async (
  imagePath,
  message,
  encryptionKey,
  outputPath = "encoded.png",
  obfuscate = true
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
      totalCapacity,
      obfuscate
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

