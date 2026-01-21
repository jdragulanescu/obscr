/**
 * Browser adapter for steganography operations
 * Uses shared steg-core.js and browser-compatible webCrypto.js
 */

import { PNG } from "pngjs";
import { encrypt, decrypt } from "./webCrypto.js";
import {
  prepare_write_data,
  prepare_read_data,
  get_bits_lsb,
  write_lsb,
  calculateImageCapacity,
  str_to_bits,
  bits_to_str,
} from "../../../lib/steg-core.js";

const SECRET_KEY = "S3cReTK3Y"; // Same as Electron

/**
 * Read PNG from File object
 */
async function readPNGFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = Buffer.from(e.target.result);
        const png = PNG.sync.read(buffer);
        resolve(png);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Embed encrypted message into PNG (browser version)
 * Returns a blob for download instead of writing to fs
 */
export async function embedMessage(imageFile, message, password, options = {}) {
  const { compress = false, obfuscate = true } = options;

  try {
    const png = await readPNGFromFile(imageFile);
    const totalCapacity = calculateImageCapacity(png);

    // Encrypt message
    const encryptedMessage = await encrypt(message, password, compress);
    const dataBits = str_to_bits(encryptedMessage, 1);

    if (dataBits.length > totalCapacity) {
      throw new Error(
        `Message too large! Message requires ${dataBits.length} bits, but image can only hold ${totalCapacity} bits.`
      );
    }

    // Scramble bits using shared steg-core logic
    const encryptedBitStream = prepare_write_data(
      dataBits,
      password + SECRET_KEY,
      totalCapacity,
      obfuscate
    );

    // Write bits to image using shared steg-core logic
    write_lsb(png, encryptedBitStream);

    // Convert to PNG buffer and blob
    const buffer = PNG.sync.write(png);
    const blob = new Blob([buffer], { type: "image/png" });

    return {
      ok: true,
      blob,
      capacity: {
        totalBits: totalCapacity,
        usedBits: dataBits.length,
        utilization: `${((dataBits.length / totalCapacity) * 100).toFixed(2)}%`,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Extract and decrypt message from PNG (browser version)
 */
export async function extractMessage(imageFile, password) {
  try {
    const png = await readPNGFromFile(imageFile);
    const totalCapacity = calculateImageCapacity(png);

    // Extract all LSBs using shared steg-core logic
    const allBits = get_bits_lsb(png);

    // Unscramble bits using shared steg-core logic
    const unscrambledBits = prepare_read_data(allBits, password + SECRET_KEY);

    // Convert to string using shared steg-core logic
    const encryptedMessage = bits_to_str(unscrambledBits, 1);

    // Decrypt using browser crypto
    const message = await decrypt(encryptedMessage, password);

    return {
      ok: true,
      message,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Decryption failed. Wrong password or corrupted image.",
    };
  }
}

/**
 * Estimate capacity for image and message
 */
export async function estimateCapacity(imageFile, message, compress = false) {
  try {
    const png = await readPNGFromFile(imageFile);
    const totalBits = calculateImageCapacity(png);

    // Estimate encrypted size
    const encrypted = await encrypt(message, "dummy-password", compress);
    const dataBits = str_to_bits(encrypted, 1);
    const estimatedBits = dataBits.length;

    return {
      ok: true,
      totalBits,
      estimatedBits,
      utilization: `${((estimatedBits / totalBits) * 100).toFixed(2)}%`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Generate visual diff between two images (browser version)
 */
export async function generateImageDiff(originalFile, encodedFile) {
  try {
    if (!originalFile || !encodedFile) {
      throw new Error("Both original and encoded images are required");
    }

    const original = await readPNGFromFile(originalFile);
    const encoded = await readPNGFromFile(encodedFile);

    if (!original || !encoded) {
      throw new Error("Failed to read one or both PNG files");
    }

    const width = original.width;
    const height = original.height;

    if (!width || !height) {
      throw new Error("Invalid image dimensions");
    }

    if (encoded.width !== width || encoded.height !== height) {
      throw new Error(`Images must have matching dimensions`);
    }

    // Create diff image
    const diffCanvas = document.createElement("canvas");
    diffCanvas.width = width;
    diffCanvas.height = height;
    const diffCtx = diffCanvas.getContext("2d");
    const diffImageData = diffCtx.createImageData(width, height);

    let totalDiff = 0;
    const changedPixels = [];

    // Calculate differences
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) * 4;

        const r1 = original.data[idx];
        const g1 = original.data[idx + 1];
        const b1 = original.data[idx + 2];

        const r2 = encoded.data[idx];
        const g2 = encoded.data[idx + 1];
        const b2 = encoded.data[idx + 2];

        const dr = Math.abs(r1 - r2);
        const dg = Math.abs(g1 - g2);
        const db = Math.abs(b1 - b2);
        const diff = dr + dg + db;

        totalDiff += diff;

        if (diff > 0) {
          changedPixels.push({ x, y, diff });
        }
      }
    }

    const totalPixels = width * height;
    const changePercentage = changedPixels.length / totalPixels;

    // Generate diff visualization
    if (changePercentage > 0.1) {
      // Obfuscation ON: amplified style
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (width * y + x) * 4;

          const r1 = original.data[idx];
          const g1 = original.data[idx + 1];
          const b1 = original.data[idx + 2];

          const r2 = encoded.data[idx];
          const g2 = encoded.data[idx + 1];
          const b2 = encoded.data[idx + 2];

          const dr = Math.abs(r1 - r2);
          const dg = Math.abs(g1 - g2);
          const db = Math.abs(b1 - b2);
          const diff = dr + dg + db;

          const amplified = Math.min(255, diff * 50);

          diffImageData.data[idx] = amplified * 0.3;
          diffImageData.data[idx + 1] = amplified;
          diffImageData.data[idx + 2] = amplified * 0.4;
          diffImageData.data[idx + 3] = 255;
        }
      }
    } else {
      // Obfuscation OFF: marker style
      for (let i = 0; i < diffImageData.data.length; i += 4) {
        diffImageData.data[i] = 10;
        diffImageData.data[i + 1] = 14;
        diffImageData.data[i + 2] = 15;
        diffImageData.data[i + 3] = 255;
      }

      const imageSize = Math.max(width, height);
      const markerSize = Math.max(1, Math.floor(imageSize / 800));

      for (const { x, y } of changedPixels) {
        for (let dy = -markerSize; dy <= markerSize; dy++) {
          for (let dx = -markerSize; dx <= markerSize; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (width * ny + nx) * 4;

              diffImageData.data[idx] = 0;
              diffImageData.data[idx + 1] = 255;
              diffImageData.data[idx + 2] = 0;
              diffImageData.data[idx + 3] = 255;
            }
          }
        }
      }
    }

    diffCtx.putImageData(diffImageData, 0, 0);

    // Convert to data URLs
    const originalUrl = await fileToDataURL(originalFile);
    const encodedUrl = await fileToDataURL(encodedFile);
    const diffUrl = diffCanvas.toDataURL("image/png");

    const avgDiff = totalDiff / (width * height * 3);

    return {
      ok: true,
      original: originalUrl,
      encoded: encodedUrl,
      diff: diffUrl,
      averageDifference: avgDiff.toFixed(4),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Convert File to data URL
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Trigger download of blob as file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
