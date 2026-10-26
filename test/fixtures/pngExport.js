import { deflateSync } from "node:zlib";

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export function integers(...values) {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((value, i) => bytes.writeUInt32BE(value, i * 4));
  return bytes;
}
function crc(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}
export function chunk(type, data) {
  const payload = Buffer.concat([Buffer.from(type), data]);
  return Buffer.concat([integers(data.length), payload, integers(crc(payload))]);
}
export const rendering = {
  cHRM: integers(31270, 32900, 64000, 33000, 30000, 60000, 15000, 6000),
  gAMA: integers(45455),
  sRGB: Buffer.from([0]),
};
export function exportFixture({ colorType = 2, width = 64, height = 64, metadata = true, extra = [] } = {}) {
  const channels = colorType === 2 ? 3 : 4;
  const raw = Buffer.alloc((width * channels + 1) * height);
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rgb = [(x * 17 + y) % 256, (y * 29 + x) % 256, (x * 7 + y * 11) % 256, 255];
      for (let c = 0; c < channels; c++) raw[y * (width * channels + 1) + 1 + x * channels + c] = rgb[c];
      rgba.set(rgb, (y * width + x) * 4);
    }
  }
  const before = metadata ? [
    chunk("sRGB", rendering.sRGB), chunk("gAMA", rendering.gAMA), chunk("cHRM", rendering.cHRM),
    chunk("tEXt", Buffer.from("Author\0Public test author")),
    chunk("zTXt", Buffer.concat([Buffer.from("Comment\0\0"), deflateSync(Buffer.from("Public test comment"))])),
    chunk("iTXt", Buffer.from("Title\0\0\0en\0Title\0Public test title")),
    chunk("eXIf", Buffer.from([73, 73, 42, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
    chunk("tIME", Buffer.from([7, 234, 10, 26, 12, 0, 0])),
    chunk("pHYs", Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 1])),
    chunk("sBIT", Buffer.alloc(channels, 8)),
    chunk("PLTE", Buffer.from([0, 0, 0])),
    chunk("bKGD", Buffer.alloc(6)), chunk("hIST", Buffer.from([0, 1])),
  ] : [];
  const bytes = Buffer.concat([
    signature,
    chunk("IHDR", Buffer.concat([integers(width, height), Buffer.from([8, colorType, 0, 0, 0])])),
    ...before, ...extra,
    chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
  return { bytes, rgba, width, height, colorType };
}
export function parseChunks(input) {
  const bytes = Buffer.from(input);
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error("Invalid PNG signature");
  const chunks = [];
  let position = 8;
  while (position < bytes.length) {
    const size = bytes.readUInt32BE(position);
    const end = position + 8 + size;
    if (end + 4 > bytes.length) throw new Error("Truncated output chunk");
    if (bytes.readUInt32BE(end) !== crc(bytes.subarray(position + 4, end))) throw new Error("Output CRC mismatch");
    chunks.push({ type: bytes.toString("ascii", position + 4, position + 8), data: bytes.subarray(position + 8, end) });
    position = end + 4;
  }
  return chunks;
}
