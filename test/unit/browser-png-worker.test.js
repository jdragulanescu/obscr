import { Worker } from "node:worker_threads";
import { PNG } from "pngjs";

function image(width = 100, height = 100, alpha = 255) {
  const png = new PNG({ width, height });
  png.data.fill(255);
  png.data[3] = alpha;
  return new Blob([PNG.sync.write(png)], { type: "image/png" });
}

const workerModule = new URL("../../app/src/lib/png-worker.js", import.meta.url).href;
function request(operation, args) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort } = require('node:worker_threads');
      globalThis.self = { postMessage: (data) => parentPort.postMessage(data) };
      import(${JSON.stringify(workerModule)}).then(() => {
        parentPort.on('message', data => self.onmessage({data}));
        parentPort.postMessage({ready: true});
      });
    `, { eval: true, resourceLimits: { stackSizeMb: 1 } });
    worker.on("error", reject);
    worker.on("message", (data) => {
      if (data.ready) worker.postMessage({ id: 1, operation, args });
      else if (data.result) {
        worker.terminate();
        resolve(data.result);
      }
    });
  });
}

it("reports malformed PNG input before attempting hidden-message recovery", async () => {
  const result = await request("extract", {
    file: new Blob([new Uint8Array([1, 2, 3])]),
    password: "public-password",
  });
  expect(result).toMatchObject({ ok: false, code: "PNG_INVALID" });
});

it("refuses transparent input and excessive source bytes in the real worker", async () => {
  expect(await request("admit", { file: image(2, 2, 254) })).toMatchObject({ ok: false, code: "PNG_UNSUPPORTED" });
  expect(await request("admit", { file: new Blob([new Uint8Array(16 * 1024 * 1024 + 1)]) })).toMatchObject({ ok: false, code: "PNG_LIMIT" });
});

it("admits the minimum dimensions without claiming message capacity", async () => {
  expect(await request("capacity", { file: image(1, 1), message: "hello", compress: false })).toMatchObject({
    ok: true, totalBits: 3, estimatedBits: 784,
  });
});

it("rejects invalid requests at the actual worker boundary", async () => {
  expect(await request("unknown", {})).toMatchObject({ ok: false, code: "INPUT_INVALID" });
  expect(await request("admit", { file: { size: 1 } })).toMatchObject({ ok: false, code: "INPUT_INVALID" });
  expect(await request("embed", { file: image(), message: "hello", password: "", compress: false, obfuscate: false })).toMatchObject({ ok: false, code: "INPUT_INVALID" });
  expect(await request("capacity", { file: image(), message: "hello", compress: "yes" })).toMatchObject({ ok: false, code: "INPUT_INVALID" });
});

it("keeps a specific input error when the second comparison image fails admission", async () => {
  const result = await request("diff", { file: image(), secondFile: new Blob(["not PNG"]) });
  expect(result).toMatchObject({ ok: false, code: "PNG_INVALID" });
  expect(result).not.toHaveProperty("diffBlob");
});

it("keeps image geometry mismatch separate from hidden recovery", async () => {
  expect(await request("diff", { file: image(2, 2), secondFile: image(3, 2) })).toMatchObject({ ok: false, code: "DIMENSIONS" });
});

it("exchanges a complete message through real worker encode and decode", async () => {
  const encoded = await request("embed", { file: image(), message: "Public message", password: "public-password", compress: false, obfuscate: false });
  expect(encoded.ok).toBe(true);
  expect(await request("extract", { file: encoded.blob, password: "public-password" })).toEqual({ ok: true, message: "Public message" });
  expect(await request("extract", { file: encoded.blob, password: "wrong-password" })).toMatchObject({ ok: false, code: "RECOVERY_FAILED" });
});

it("checks a large message without overflowing argument or carrier allocations", async () => {
  const result = await request("capacity", { file: image(1024, 1024), message: "a".repeat(200000), compress: false });
  expect(result).toMatchObject({ ok: true, totalBits: 3145728, estimatedBits: 2134064 });
});
