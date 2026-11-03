import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { PNG } from "pngjs";
import { prepareImage, encodeImage, decodeImage } from "../../lib/steg.js";
import { createProtectedTransport } from "../../lib/protected-transport.js";
import { exportFixture, parseChunks, rendering, chunk, integers } from "../fixtures/pngExport.js";

const workerModule = new URL("../../app/src/lib/protected-worker.js", import.meta.url).href;
const browser = createProtectedTransport((message, failed) => {
  const worker = new Worker(`
    const { parentPort } = require('node:worker_threads');
    globalThis.self = { postMessage: (data, transfer) => parentPort.postMessage(data, transfer) };
    import(${JSON.stringify(workerModule)}).then(() => {
      parentPort.on('message', data => self.onmessage({ data }));
      parentPort.postMessage({ ready: true });
    });
  `, { eval: true });
  let ready = false, pending;
  worker.on("error", failed);
  worker.on("message", data => {
    if (data.ready) {
      ready = true;
      if (pending) worker.postMessage(...pending);
    } else message(data);
  });
  return {
    post: (...args) => { if (ready) worker.postMessage(...args); else pending = args; },
    stop: () => worker.terminate(),
  };
});
let directory;
beforeEach(async () => { directory = await fs.mkdtemp(path.join(os.tmpdir(), "obscr-export-")); });
afterEach(async () => { await fs.rm(directory, { recursive: true, force: true }); });

async function encode(platform, source) {
  if (platform === "browser") {
    const prepared = await browser.prepareEncode({ pngBytes: new Uint8Array(source), message: "Public export", compress: false });
    if (!prepared.ok) return prepared;
    const result = await browser.encode({ preparation: prepared.preparation, password: "public-password" });
    return { ...result, bytes: result.pngBytes && Buffer.from(result.pngBytes) };
  }
  const input = path.join(directory, "input.png"), output = path.join(directory, "output.png");
  await fs.writeFile(input, source);
  const prepared = await prepareImage({ imagePath: input, message: "Public export", compress: false });
  if (!prepared.ok) return prepared;
  const result = await encodeImage({ preparation: prepared.preparation, password: "public-password", outputPath: output });
  return { ...result, bytes: result.ok ? await fs.readFile(output) : undefined };
}
function assertExport(bytes, fixture, metadata) {
  const chunks = parseChunks(bytes);
  expect(chunks.map(item => item.type)).toEqual(metadata
    ? ["IHDR", "cHRM", "gAMA", "sRGB", "IDAT", "IEND"]
    : ["IHDR", "IDAT", "IEND"]);
  expect(chunks[0].data[9]).toBe(fixture.colorType);
  for (const item of chunks.filter(item => Object.hasOwn(rendering, item.type))) expect(item.data).toEqual(rendering[item.type]);
  const decoded = PNG.sync.read(bytes);
  expect([decoded.width, decoded.height]).toEqual([fixture.width, fixture.height]);
  let changed = 0;
  const upper = Buffer.from(decoded.data), originalUpper = Buffer.from(fixture.rgba);
  for (let i = 0; i < decoded.data.length; i++) {
    if (decoded.data[i] !== fixture.rgba[i]) changed++;
    if (i % 4 !== 3) { upper[i] &= 254; originalUpper[i] &= 254; }
  }
  expect(upper.equals(originalUpper)).toBe(true);
  // No filler: only the message's carrier positions may change.
  expect(changed).toBeGreaterThan(0);
  expect(changed).toBeLessThanOrEqual(128 + 128 + Math.ceil(8 * (13 + 16 + 16) / 3));
  expect(bytes.length).toBeLessThanOrEqual(16 * 1024 * 1024);
}

describe.each(["node", "browser"])("PNG-EXPORT through real %s workers", platform => {
  it.each([[2, false], [2, true], [6, false], [6, true]])("preserves type %i samples and rendering=%s without personal chunks", async (colorType, metadata) => {
    const fixture = exportFixture({ colorType, metadata, width: 512, height: 512 });
    const result = await encode(platform, fixture.bytes);
    expect(result.ok).toBe(true);
    assertExport(result.bytes, fixture, metadata);
    if (platform === "browser") {
      const file = path.join(directory, "browser-output.png");
      await fs.writeFile(file, result.bytes);
      expect(await decodeImage({ imagePath: file, password: "public-password" })).toMatchObject({ ok: true, message: "Public export" });
    } else {
      expect(await browser.decode({ pngBytes: new Uint8Array(result.bytes), password: "public-password" }))
        .toEqual({ ok: true, message: "Public export" });
    }
  });
  it.each([
    ["conflicting rendering", [chunk("sRGB", Buffer.from([0])), chunk("gAMA", integers(100000))], "PNG_INVALID"],
    ["unsupported profile", [chunk("iCCP", Buffer.from("Profile\0\0"))], "PNG_UNSUPPORTED"],
    ["unknown ancillary", [chunk("vpAg", Buffer.alloc(0))], "PNG_UNSUPPORTED"],
  ])("refuses %s without an output", async (_name, extra, code) => {
    const fixture = exportFixture({ metadata: false, extra });
    const result = await encode(platform, fixture.bytes);
    expect(result).toMatchObject({ ok: false, code });
    expect(result.bytes).toBeUndefined();
    expect(await fs.readdir(directory)).not.toContain("output.png");
  });
});
