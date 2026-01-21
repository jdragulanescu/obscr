const path = require("path");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");

// Shared core logic
const { encrypt, decrypt } = require("../lib/crypto");
const {
  encodeMessageToImage,
  extractMessageFromImage,
  calculateImageCapacity,
} = require("../lib/steg");

// NOTE: This is just to increase obfuscation for steganography, NOT used for AES encryption
// Kept for backward compatibility with images encoded using older versions
const SECRET_KEY = "S3cReTK3Y";

const isDev = process.env.NODE_ENV === "development";

/**
 * Create the main application window
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 950,
    height: 1200,
    minWidth: 800,
    minHeight: 1000,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Obscr",
    backgroundColor: "#0a0e0f",
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * ============================================================================
 * IPC HANDLERS
 * ============================================================================
 * Electron IPC handlers for communication between main and renderer processes.
 * All handlers follow a consistent pattern of returning:
 *   { ok: true, ...data } on success
 *   { ok: false, error: string } on failure
 */

/**
 * Opens a file dialog for selecting a PNG image
 * @returns {Promise<string|null>} File path or null if canceled
 */
ipcMain.handle("file:openImage", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select PNG Image",
    filters: [{ name: "PNG Images", extensions: ["png"] }],
    properties: ["openFile"],
  });

  if (canceled || !filePaths.length) {
    return null;
  }

  return filePaths[0];
});

/**
 * Opens a save dialog for choosing output file location
 * @param {Object} options - Dialog options
 * @param {string} options.defaultPath - Default file name/path
 * @param {Array} options.filters - File type filters
 * @returns {Promise<string|null>} File path or null if canceled
 */
ipcMain.handle("file:saveOutput", async (event, { defaultPath, filters }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Save File",
    defaultPath,
    filters,
  });

  if (canceled || !filePath) {
    return null;
  }

  return filePath;
});

/**
 * Encrypts a message and hides it in a PNG image using steganography
 * @param {Object} params - Encryption parameters
 * @param {string} params.imagePath - Path to source PNG image
 * @param {string} params.outputPath - Path for output encoded image
 * @param {string} params.message - Plain text message to encrypt and hide
 * @param {string} params.password - Password for encryption
 * @param {boolean} params.compress - Whether to compress before encryption
 * @param {boolean} params.obfuscate - Whether to fill unused bits with random data (default: true)
 * @returns {Promise<Object>} Result object with ok, outputPath, capacity, or error
 */
ipcMain.handle(
  "encrypt:start",
  async (event, { imagePath, outputPath, message, password, compress, obfuscate = true }) => {
    try {
      // Encrypt message
      const encrypted = await encrypt(message, password, compress);

      // Encode into image
      const result = await encodeMessageToImage(
        imagePath,
        encrypted,
        password + SECRET_KEY,
        outputPath,
        obfuscate
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        ok: true,
        outputPath: result.outputPath,
        capacity: result.capacity,
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message || "Encryption failed",
      };
    }
  }
);

/**
 * Estimates the capacity usage for a message in an image
 * Used for real-time feedback to show users if message will fit
 * @param {Object} params - Capacity estimation parameters
 * @param {string} params.imagePath - Path to PNG image
 * @param {string} params.message - Message to estimate size for
 * @param {boolean} params.compress - Whether compression will be used
 * @returns {Promise<Object>} Result with totalBits, estimatedBits, utilization, or error
 */
ipcMain.handle(
  "encrypt:capacity",
  async (event, { imagePath, message, compress }) => {
    try {
      const fs = require("fs");
      const { PNG } = require("pngjs");

      const imageBuffer = fs.readFileSync(imagePath);
      const imageData = PNG.sync.read(imageBuffer);
      const totalBits = calculateImageCapacity(imageData);

      // Actually encrypt the message to get the real size with overhead
      // Use a dummy password since we only need the size
      const encrypted = await encrypt(message, "dummy-password-for-estimation", compress);

      const { str_to_bits } = require("../lib/utils");
      const dataBits = str_to_bits(encrypted, 1);
      let estimatedBits = dataBits.length;

      return {
        ok: true,
        totalBits,
        estimatedBits,
        utilization: ((estimatedBits / totalBits) * 100).toFixed(2) + "%",
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message || "Failed to calculate capacity",
      };
    }
  }
);

/**
 * Generates a visual diff between original and encoded images
 * Shows which pixels were modified during steganographic encoding
 * Validates that both images have matching dimensions before processing
 * @param {Object} params - Diff generation parameters
 * @param {string} params.originalPath - Path to original PNG image
 * @param {string} params.encodedPath - Path to encoded PNG image
 * @returns {Promise<Object>} Result with base64 images (original, encoded, diff) and stats, or error
 */
ipcMain.handle("images:generateDiff", async (event, { originalPath, encodedPath }) => {
  try {
    const fs = require("fs");
    const { PNG } = require("pngjs");

    // Read both images
    const originalBuffer = fs.readFileSync(originalPath);
    const encodedBuffer = fs.readFileSync(encodedPath);

    const originalImage = PNG.sync.read(originalBuffer);
    const encodedImage = PNG.sync.read(encodedBuffer);

    // Validate dimensions match
    if (originalImage.width !== encodedImage.width ||
        originalImage.height !== encodedImage.height) {
      return {
        ok: false,
        error: `Images must have matching dimensions. Original: ${originalImage.width}×${originalImage.height}, Encoded: ${encodedImage.width}×${encodedImage.height}`,
      };
    }

    // Create diff image
    const diffImage = new PNG({
      width: originalImage.width,
      height: originalImage.height,
    });

    // Calculate difference and create visualization
    let totalDiff = 0;
    const changedPixels = [];

    // First pass: find all changed pixels
    for (let y = 0; y < originalImage.height; y++) {
      for (let x = 0; x < originalImage.width; x++) {
        const idx = (originalImage.width * y + x) << 2;

        const r1 = originalImage.data[idx];
        const g1 = originalImage.data[idx + 1];
        const b1 = originalImage.data[idx + 2];

        const r2 = encodedImage.data[idx];
        const g2 = encodedImage.data[idx + 1];
        const b2 = encodedImage.data[idx + 2];

        // Calculate absolute differences
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

    const totalPixels = originalImage.width * originalImage.height;
    const changePercentage = changedPixels.length / totalPixels;

    // If many changes (>10% = obfuscation ON), use amplified style
    // If few changes (<10% = obfuscation OFF), use marker style
    if (changePercentage > 0.1) {
      // Obfuscation ON: Show amplified differences without markers
      for (let y = 0; y < originalImage.height; y++) {
        for (let x = 0; x < originalImage.width; x++) {
          const idx = (originalImage.width * y + x) << 2;

          const r1 = originalImage.data[idx];
          const g1 = originalImage.data[idx + 1];
          const b1 = originalImage.data[idx + 2];

          const r2 = encodedImage.data[idx];
          const g2 = encodedImage.data[idx + 1];
          const b2 = encodedImage.data[idx + 2];

          const dr = Math.abs(r1 - r2);
          const dg = Math.abs(g1 - g2);
          const db = Math.abs(b1 - b2);
          const diff = dr + dg + db;

          // Amplify differences (no markers)
          const amplified = Math.min(255, diff * 50);

          diffImage.data[idx] = amplified * 0.3;
          diffImage.data[idx + 1] = amplified;
          diffImage.data[idx + 2] = amplified * 0.4;
          diffImage.data[idx + 3] = 255;
        }
      }
    } else {
      // Obfuscation OFF: Initialize with dark background and draw small markers
      for (let i = 0; i < diffImage.data.length; i += 4) {
        diffImage.data[i] = 10;
        diffImage.data[i + 1] = 14;
        diffImage.data[i + 2] = 15;
        diffImage.data[i + 3] = 255;
      }

      // Calculate marker size: very small for better visibility of scatter pattern
      const imageSize = Math.max(originalImage.width, originalImage.height);
      const markerSize = Math.max(1, Math.floor(imageSize / 800)); // Even smaller, scales with image

      // Draw small markers around changed pixels
      for (const { x, y } of changedPixels) {
        for (let dy = -markerSize; dy <= markerSize; dy++) {
          for (let dx = -markerSize; dx <= markerSize; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < originalImage.width && ny >= 0 && ny < originalImage.height) {
              const idx = (originalImage.width * ny + nx) << 2;

              // Bright green marker
              diffImage.data[idx] = 76;
              diffImage.data[idx + 1] = 255;
              diffImage.data[idx + 2] = 102;
              diffImage.data[idx + 3] = 255;
            }
          }
        }
      }
    }

    // Convert images to data URIs
    const originalDataUri = `data:image/png;base64,${originalBuffer.toString("base64")}`;
    const encodedDataUri = `data:image/png;base64,${encodedBuffer.toString("base64")}`;
    const diffDataUri = `data:image/png;base64,${PNG.sync.write(diffImage).toString("base64")}`;

    const avgDiff = totalDiff / (originalImage.width * originalImage.height * 3);

    return {
      ok: true,
      original: originalDataUri,
      encoded: encodedDataUri,
      diff: diffDataUri,
      averageDifference: avgDiff.toFixed(4),
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || "Failed to generate image diff",
    };
  }
});

/**
 * Extracts and decrypts a hidden message from a PNG image
 * @param {Object} params - Decryption parameters
 * @param {string} params.imagePath - Path to encoded PNG image
 * @param {string} params.password - Password for decryption
 * @param {string} [params.outputPath] - Optional path to save decrypted message to file
 * @returns {Promise<Object>} Result with decrypted message or savedTo path, or error
 */
ipcMain.handle(
  "decrypt:start",
  async (event, { imagePath, password, outputPath }) => {
    try {
      const extractResult = await extractMessageFromImage(
        imagePath,
        password + SECRET_KEY
      );

      if (!extractResult.success) {
        throw new Error(extractResult.error);
      }

      const decrypted = await decrypt(extractResult.data, password);

      if (outputPath) {
        const fs = require("fs");
        fs.writeFileSync(outputPath, decrypted, "utf8");
        return { ok: true, savedTo: outputPath };
      }

      return { ok: true, message: decrypted };
    } catch (err) {
      return {
        ok: false,
        error:
          err.message ||
          "Decryption failed. Wrong password, corrupted image, or no hidden message.",
      };
    }
  }
);

