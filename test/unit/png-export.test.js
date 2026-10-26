import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { PNG } from "pngjs";
import { encryptMessageToImage, decryptMessageFromImage } from "../../lib/steg.js";
import { exportFixture, parseChunks, rendering, chunk, integers } from "../fixtures/pngExport.js";

const workerModule = new URL("../../app/src/lib/png-worker.js", import.meta.url).href;
function browserRequest(operation, args) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort } = require('node:worker_threads');
      globalThis.self = { postMessage: data => parentPort.postMessage(data) };
      import(${JSON.stringify(workerModule)}).then(() => {
        parentPort.on('message', data => self.onmessage({ data }));
        parentPort.postMessage({ ready: true });
      });
    `, { eval: true });
    worker.on("error", reject);
    worker.on("message", async data => {
      if (data.ready) worker.postMessage({ id: 1, operation, args });
      else if (data.result) {
        await worker.terminate();
        resolve(data.result);
      }
    });
  });
}
let directory;
beforeEach(async () => { directory = await fs.mkdtemp(path.join(os.tmpdir(), "obscr-export-")); });
afterEach(async () => { await fs.rm(directory, { recursive: true, force: true }); });

async function encode(platform, source) {
  if (platform === "browser") {
    const result = await browserRequest("embed", {
      file: new Blob([source]), message: "Public export", password: "public-password", compress: false, obfuscate: false,
    });
    return { success: result.ok, code: result.code, bytes: result.blob && Buffer.from(await result.blob.arrayBuffer()) };
  }
  const input = path.join(directory, "input.png"), output = path.join(directory, "output.png");
  await fs.writeFile(input, source);
  const result = await encryptMessageToImage(input, "Public export", "public-password", output, { obfuscate: false });
  return { ...result, bytes: result.success ? await fs.readFile(output) : undefined };
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
  for (let i = 0; i < decoded.data.length; i++) {
    if (i % 4 === 3) expect(decoded.data[i]).toBe(255);
    else {
      if (decoded.data[i] !== fixture.rgba[i]) changed++;
      expect(decoded.data[i] & 254).toBe(fixture.rgba[i] & 254);
    }
  }
  // No filler: only the message's carrier positions may change.
  expect(changed).toBeGreaterThan(0);
  expect(changed).toBeLessThanOrEqual(1200);
  expect(bytes.length).toBeLessThanOrEqual(16 * 1024 * 1024);
}

describe.each(["node", "browser"])("PNG-EXPORT through real %s workers", platform => {
  it.each([[2, false], [2, true], [6, false], [6, true]])("preserves type %i samples and rendering=%s without personal chunks", async (colorType, metadata) => {
    const fixture = exportFixture({ colorType, metadata });
    const result = await encode(platform, fixture.bytes);
    expect(result.success).toBe(true);
    assertExport(result.bytes, fixture, metadata);
    if (platform === "browser") {
      const file = path.join(directory, "browser-output.png");
      await fs.writeFile(file, result.bytes);
      expect(await decryptMessageFromImage(file, "public-password")).toMatchObject({ success: true, data: "Public export" });
    } else {
      expect(await browserRequest("extract", { file: new Blob([result.bytes]), password: "public-password" }))
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
    expect(result).toMatchObject({ success: false, code });
    expect(result.bytes).toBeUndefined();
    expect(await fs.readdir(directory)).not.toContain("output.png");
  });
});
