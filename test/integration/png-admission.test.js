import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
import { encryptMessageToImage, decryptMessageFromImage } from "../../lib/steg.js";
import { comparePNGs } from "../../lib/png-diff.js";
import { exportFixture, parseChunks, rendering } from "../fixtures/pngExport.js";

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
