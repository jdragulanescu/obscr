const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

/**
 * Creates test PNG images for unit tests
 */
function createTestImages() {
  const fixturesDir = __dirname;

  // Create a small test image (10x10 pixels)
  const smallPng = new PNG({ width: 10, height: 10 });
  for (let y = 0; y < smallPng.height; y++) {
    for (let x = 0; x < smallPng.width; x++) {
      const idx = (smallPng.width * y + x) << 2;
      // Create a simple pattern
      smallPng.data[idx] = x * 25; // Red
      smallPng.data[idx + 1] = y * 25; // Green
      smallPng.data[idx + 2] = (x + y) * 12; // Blue
      smallPng.data[idx + 3] = 255; // Alpha
    }
  }
  const smallBuffer = PNG.sync.write(smallPng);
  fs.writeFileSync(path.join(fixturesDir, "test-small.png"), smallBuffer);

  // Create a medium test image (100x100 pixels)
  const mediumPng = new PNG({ width: 100, height: 100 });
  for (let y = 0; y < mediumPng.height; y++) {
    for (let x = 0; x < mediumPng.width; x++) {
      const idx = (mediumPng.width * y + x) << 2;
      mediumPng.data[idx] = (x * 2.55) % 256; // Red
      mediumPng.data[idx + 1] = (y * 2.55) % 256; // Green
      mediumPng.data[idx + 2] = ((x + y) * 1.27) % 256; // Blue
      mediumPng.data[idx + 3] = 255; // Alpha
    }
  }
  const mediumBuffer = PNG.sync.write(mediumPng);
  fs.writeFileSync(path.join(fixturesDir, "test-medium.png"), mediumBuffer);

  // Create a large test image (200x200 pixels)
  const largePng = new PNG({ width: 200, height: 200 });
  for (let y = 0; y < largePng.height; y++) {
    for (let x = 0; x < largePng.width; x++) {
      const idx = (largePng.width * y + x) << 2;
      largePng.data[idx] = (x * 1.275) % 256; // Red
      largePng.data[idx + 1] = (y * 1.275) % 256; // Green
      largePng.data[idx + 2] = ((x + y) * 0.64) % 256; // Blue
      largePng.data[idx + 3] = 255; // Alpha
    }
  }
  const largeBuffer = PNG.sync.write(largePng);
  fs.writeFileSync(path.join(fixturesDir, "test-large.png"), largeBuffer);

  console.log("Test images created successfully:");
  console.log("- test-small.png (10x10)");
  console.log("- test-medium.png (100x100)");
  console.log("- test-large.png (200x200)");
}

// Run if called directly
if (require.main === module) {
  createTestImages();
}

module.exports = { createTestImages };
