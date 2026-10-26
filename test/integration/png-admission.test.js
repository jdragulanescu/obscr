import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { PNG } from "pngjs";
import { encryptMessageToImage, decryptMessageFromImage } from "../../lib/steg.js";
import { comparePNGs } from "../../lib/png-diff.js";
import { admitPNG, serializePNG } from "../../lib/png.js";
import { exportFixture, parseChunks, rendering, chunk, integers } from "../fixtures/pngExport.js";

let directory;
beforeEach(async () => { directory = await fs.mkdtemp(path.join(os.tmpdir(), "obscr-png-acceptance-")); });
afterEach(async () => { await fs.rm(directory, { recursive: true, force: true }); });

it.each([2, 6])("PNG-ACCEPT-01: color type %i survives admission, export, renamed recovery and sample comparison", async colorType => {
  const fixture = exportFixture({ colorType });
  const input = path.join(directory, "public-source.png");
  const output = path.join(directory, "export.png");
  const renamed = path.join(directory, "renamed.png");
  const message = "Public PNG acceptance: café\nsecond line";
  await fs.writeFile(input, fixture.bytes);
  expect(await encryptMessageToImage(input, message, "public-password", output, { obfuscate: false }))
    .toMatchObject({ success: true, outputPath: output });
  const bytes = await fs.readFile(output);
  const chunks = parseChunks(bytes);
  expect(chunks.map(item => item.type)).toEqual(["IHDR", "cHRM", "gAMA", "sRGB", "IDAT", "IEND"]);
  expect(chunks[0].data[9]).toBe(colorType);
  for (const item of chunks.slice(1, 4)) expect(item.data).toEqual(rendering[item.type]);
  const decoded = PNG.sync.read(bytes);
  expect([decoded.width, decoded.height]).toEqual([64, 64]);
  for (let i = 0; i < decoded.data.length; i++) {
    if (i % 4 === 3) expect(decoded.data[i]).toBe(255);
    else expect(decoded.data[i] & 254).toBe(fixture.rgba[i] & 254);
  }
  expect(await fs.readFile(input)).toEqual(fixture.bytes);
  await fs.rename(output, renamed);
  expect(await decryptMessageFromImage(renamed, "public-password"))
    .toMatchObject({ success: true, data: message });

  const rewritten = PNG.sync.write(decoded, { colorType: 6 });
  expect(comparePNGs(bytes, rewritten)).toMatchObject({ changedPixels: 0, totalPixels: 4096, averageDifference: "0.0000" });
  decoded.data[0] ^= 2;
  const changed = PNG.sync.write(decoded, { colorType: 6 });
  expect(comparePNGs(bytes, changed)).toMatchObject({ changedPixels: 1, totalPixels: 4096, averageDifference: "0.0002" });
});

it("PNG-ACCEPT-02: a refused replacement preserves the prior export and cannot become a successful Diff", async () => {
  const fixture = exportFixture();
  const input = path.join(directory, "source.png");
  const output = path.join(directory, "kept.png");
  await fs.writeFile(input, fixture.bytes);
  expect(await encryptMessageToImage(input, "Keep this result", "public-password", output))
    .toMatchObject({ success: true });
  const kept = await fs.readFile(output);
  const malformed = Buffer.from("not a PNG");
  await fs.writeFile(input, malformed);
  expect(await encryptMessageToImage(input, "Replacement", "public-password", output))
    .toMatchObject({ success: false, code: "PNG_INVALID" });
  expect(await fs.readFile(output)).toEqual(kept);
  expect(await fs.readFile(input)).toEqual(malformed);
  expect(() => comparePNGs(kept, malformed)).toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
  expect(await decryptMessageFromImage(output, "public-password"))
    .toMatchObject({ success: true, data: "Keep this result" });
  expect(comparePNGs(kept, kept)).toMatchObject({ changedPixels: 0, totalPixels: 4096, averageDifference: "0.0000" });
});

function metadataFixture(extra, colorType = 2) {
  return exportFixture({ width: 1, height: 1, metadata: false, colorType, extra }).bytes;
}

it("PNG-ACCEPT-03: rejects a duplicate histogram after a valid palette", () => {
  const bytes = metadataFixture([
    chunk("PLTE", Buffer.alloc(3)), chunk("hIST", Buffer.alloc(2)), chunk("hIST", Buffer.alloc(2)),
  ]);
  expect(() => admitPNG(bytes)).toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
});

it.each([
  ["sRGB", 2, 2], ["gAMA", 5, 2], ["cHRM", 33, 2], ["pHYs", 10, 2],
  ["sBIT", 4, 2], ["sBIT", 5, 6], ["bKGD", 7, 2], ["tIME", 8, 2],
])("PNG-ACCEPT-04: rejects overlong %s size %i for color type %i", (type, size, colorType) => {
  expect(() => admitPNG(metadataFixture([chunk(type, Buffer.alloc(size))], colorType)))
    .toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
});

it("PNG-ACCEPT-05: rejects a 14-byte IHDR with a valid CRC", () => {
  const bytes = metadataFixture([]);
  const chunks = parseChunks(bytes).map(item => chunk(item.type,
    item.type === "IHDR" ? Buffer.concat([item.data, Buffer.from([0])]) : item.data));
  expect(() => admitPNG(Buffer.concat([bytes.subarray(0, 8), ...chunks])))
    .toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
});

it.each([
  ["sRGB", Buffer.from([3])],
  ["gAMA-min", integers(1)],
  ["gAMA-max", integers(0xffffffff)],
  ["cHRM", integers(50000, 50000, 100000, 0, 0, 100000, 0, 0)],
])("PNG-ACCEPT-06: retains independent rendering declaration %s without inventing others", (name, data) => {
  const type = name.split("-")[0];
  const admitted = admitPNG(metadataFixture([chunk(type, data)]));
  const bytes = serializePNG(admitted);
  const chunks = parseChunks(bytes);
  expect(chunks.map(item => item.type)).toEqual(["IHDR", type, "IDAT", "IEND"]);
  expect(chunks[1].data).toEqual(data);
  expect([...PNG.sync.read(Buffer.from(bytes)).data]).toEqual([0, 0, 0, 255]);
});

it("PNG-ACCEPT-07: refuses chromaticity sums one above the admitted boundary", () => {
  expect(() => admitPNG(metadataFixture([chunk("cHRM", integers(50000, 50001, 0, 0, 0, 0, 0, 0))])))
    .toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
});

it.each([[1, 1, 0, 0, 0], [12, 31, 23, 59, 60]])(
  "PNG-ACCEPT-08: discards valid time boundary %j %j %j %j %j",
  (month, day, hour, minute, second) => {
    const bytes = metadataFixture([chunk("tIME", Buffer.from([0, 0, month, day, hour, minute, second]))]);
    expect(parseChunks(serializePNG(admitPNG(bytes))).map(item => item.type)).toEqual(["IHDR", "IDAT", "IEND"]);
  },
);

it.each([[0, 1], [1, 32]])("PNG-ACCEPT-09: refuses time month %i day %i", (month, day) => {
  expect(() => admitPNG(metadataFixture([chunk("tIME", Buffer.from([0, 0, month, day, 0, 0, 0]))])))
    .toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
});

it("PNG-ACCEPT-10: discards physical dimensions with unspecified units", () => {
  const bytes = metadataFixture([chunk("pHYs", Buffer.concat([integers(0, 0), Buffer.from([0])]))]);
  expect(parseChunks(serializePNG(admitPNG(bytes))).map(item => item.type)).toEqual(["IHDR", "IDAT", "IEND"]);
});

it.each([
  ["truncated count", [73, 73, 42, 0, 8, 0, 0, 0, 0]],
  ["truncated entry", [73, 73, 42, 0, 8, 0, 0, 0, 1, 0, 0, 0, 0, 0]],
  ["offset below header", [73, 73, 42, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  ["wrong TIFF magic", [73, 73, 43, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
])("PNG-ACCEPT-11: refuses EXIF %s", (_name, data) => {
  expect(() => admitPNG(metadataFixture([chunk("eXIf", Buffer.from(data))])))
    .toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
});

it("PNG-ACCEPT-12: refuses an expanding ICC profile before raster or inflate allocation", () => {
  const bytes = metadataFixture([chunk("iCCP", Buffer.concat([
    Buffer.from("Profile\0\0"), deflateSync(Buffer.alloc(8 * 1024 * 1024)),
  ]))]);
  const Original = globalThis.Uint8Array;
  const allocations = [];
  globalThis.Uint8Array = new Proxy(Original, {
    construct(target, args) {
      if (typeof args[0] === "number") allocations.push(args[0]);
      return Reflect.construct(target, args);
    },
  });
  try {
    expect(() => admitPNG(bytes)).toThrow(expect.objectContaining({ code: "PNG_UNSUPPORTED" }));
    expect(allocations).toEqual([]);
  } finally {
    globalThis.Uint8Array = Original;
  }
});

it("PNG-ACCEPT-13: cancelling publication to the input path preserves the original source", async () => {
  const source = path.join(directory, "source.png");
  const fixture = exportFixture();
  await fs.writeFile(source, fixture.bytes);
  const controller = new AbortController();
  const result = await encryptMessageToImage(source, "Public message", "public-password", source, {
    signal: controller.signal,
    onProgress(stage) { if (stage === "saving") controller.abort(); },
  });
  expect(result).toMatchObject({ success: false, code: "CANCELLED" });
  expect(await fs.readFile(source)).toEqual(fixture.bytes);
  expect(await fs.readdir(directory)).toEqual(["source.png"]);
});
