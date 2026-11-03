import { serializePNG } from "../../lib/png.js";

export function cover(width = 512, height = 512, detailed = true) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = (y * width + x) * 4;
    const value = detailed && ((x + y) & 1) ? 254 : 0;
    data[p] = data[p + 1] = data[p + 2] = value;
    data[p + 3] = 255;
  }
  return serializePNG({ width, height, colorType: 2, rendering: {}, data });
}
