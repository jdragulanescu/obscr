import { admitPNG, serializePNG } from "./png.js";

/** Compare native samples. Admission releases its filtered raster before the next
 * image; the first RGBA buffer becomes the overlay, never a third raster. */
export function comparePNGs(originalBytes, comparisonBytes) {
  const original = admitPNG(originalBytes);
  const comparison = admitPNG(comparisonBytes);
  const { width, height, data } = original;
  if (width !== comparison.width || height !== comparison.height) {
    throw Object.assign(new Error("Images must have matching dimensions. Select another PNG."), { code: "DIMENSIONS" });
  }
  let totalDifference = 0;
  let changedPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const difference = Math.abs(data[i] - comparison.data[i]) +
      Math.abs(data[i + 1] - comparison.data[i + 1]) +
      Math.abs(data[i + 2] - comparison.data[i + 2]);
    totalDifference += difference;
    if (difference !== 0) changedPixels++;
    const amplified = Math.min(255, difference * 50);
    data[i] = Math.round(amplified * 0.3);
    data[i + 1] = amplified;
    data[i + 2] = Math.round(amplified * 0.4);
  }
  return {
    bytes: serializePNG(original),
    changedPixels,
    totalPixels: width * height,
    averageDifference: (totalDifference / (width * height * 3)).toFixed(4),
  };
}
