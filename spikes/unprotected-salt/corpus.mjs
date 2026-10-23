import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';

export const dimensions = [256, 512];
const photosURL = new URL('./photos/', import.meta.url);

function squareRGB(image, size) {
  const side = Math.min(image.width, image.height);
  const left = Math.floor((image.width - side) / 2);
  const top = Math.floor((image.height - side) / 2);
  const rgb = new Uint8Array(size * size * 3);
  for (let y = 0; y < size; y++) {
    const sy = top + Math.min(side - 1, Math.floor((y + 0.5) * side / size));
    for (let x = 0; x < size; x++) {
      const sx = left + Math.min(side - 1, Math.floor((x + 0.5) * side / size));
      const from = (sy * image.width + sx) * 4;
      const to = (y * size + x) * 3;
      rgb[to] = image.data[from];
      rgb[to + 1] = image.data[from + 1];
      rgb[to + 2] = image.data[from + 2];
    }
  }
  return rgb;
}

function stressRGB(size, type, splitIndex) {
  const rgb = new Uint8Array(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      for (let c = 0; c < 3; c++) {
        rgb[(y * size + x) * 3 + c] = type === 'flat'
          ? 64 + splitIndex * 48 + c * 8
          : (Math.floor(x * 128 / size) + Math.floor(y * 64 / size) + c * 16 + splitIndex * 7) & 255;
      }
    }
  }
  return rgb;
}

// No network access: source bytes and their provenance travel with the spike.
export async function covers() {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', photosURL), 'utf8'));
  const result = [];
  for (const entry of manifest) {
    const bytes = await readFile(new URL(entry.png, photosURL));
    if (createHash('sha256').update(bytes).digest('hex') !== entry.pngSha256) {
      throw new Error(`Photograph digest mismatch: ${entry.png}`);
    }
    const image = PNG.sync.read(bytes);
    for (const size of dimensions) {
      result.push({
        id: `${entry.id}-${size}`, sourceGroup: entry.sourceGroup,
        split: entry.split, kind: entry.kind, width: size, height: size,
        rgb: squareRGB(image, size), source: entry.source, license: entry.license,
        creator: entry.creator, originalWidth: image.width, originalHeight: image.height,
        preprocessing: 'center-square, nearest-neighbor pixel-center sampling, RGB8',
      });
    }
  }
  for (const [splitIndex, split] of ['train', 'validation', 'test'].entries()) {
    for (const type of ['flat', 'gradient']) {
      for (const size of dimensions) {
        result.push({
          id: `stress-${type}-${split}-${size}`, sourceGroup: `stress-${type}-${split}`,
          split, kind: 'stress', width: size, height: size,
          rgb: stressRGB(size, type, splitIndex), source: 'Deterministic formula in corpus.mjs',
          license: 'Repository license',
        });
      }
    }
  }
  return result;
}
