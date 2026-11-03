import { Worker } from "node:worker_threads";
import { PNG } from "pngjs";

function image(width = 100, height = 100, alpha = 255) {
  const png = new PNG({ width, height });
  png.data.fill(255);
  png.data[3] = alpha;
  return new Blob([PNG.sync.write(png, { filterType: 0 })], { type: "image/png" });
}

const workerModule = new URL("../../app/src/lib/png-worker.js", import.meta.url).href;
const workers = new Set();
afterEach(async () => {
  await Promise.all([...workers].map(worker => worker.terminate()));
});
async function request(operation, args) {
  const worker = new Worker(`
    const { parentPort } = require('node:worker_threads');
    globalThis.self = { postMessage: (data) => parentPort.postMessage(data) };
    import(${JSON.stringify(workerModule)}).then(() => {
      parentPort.on('message', data => self.onmessage({data}));
      parentPort.postMessage({ready: true});
    });
  `, { eval: true, resourceLimits: { stackSizeMb: 1 } });
  workers.add(worker);
  try {
    return await new Promise((resolve, reject) => {
      worker.on("error", reject);
      worker.on("exit", () => reject(new Error("Test worker exited before replying")));
      worker.on("message", (data) => {
        if (data.ready) worker.postMessage({ id: 1, operation, args });
        else if (data.result) resolve(data.result);
      });
    });
  } finally {
    await worker.terminate();
    workers.delete(worker);
  }
}

it("reports malformed PNG input at admission", async () => {
  const result = await request("admit", {
    file: new Blob([new Uint8Array([1, 2, 3])]),
  });
  expect(result).toMatchObject({ ok: false, code: "PNG_INVALID" });
});

it("refuses transparent input and excessive source bytes in the real worker", async () => {
  expect(await request("admit", { file: image(2, 2, 254) })).toMatchObject({ ok: false, code: "PNG_UNSUPPORTED" });
  expect(await request("admit", { file: new Blob([new Uint8Array(16 * 1024 * 1024 + 1)]) })).toMatchObject({ ok: false, code: "PNG_LIMIT" });
});

it("admits the minimum dimensions without claiming message capacity", async () => {
  expect(await request("admit", { file: image(1, 1) })).toMatchObject({
    ok: true, width: 1, height: 1,
  });
});

it("rejects invalid requests at the actual worker boundary", async () => {
  expect(await request("unknown", {})).toMatchObject({ ok: false, code: "INPUT_INVALID" });
  expect(await request("admit", { file: { size: 1 } })).toMatchObject({ ok: false, code: "INPUT_INVALID" });
  for (const operation of ["embed", "extract", "capacity"]) {
    expect(await request(operation, { file: image() })).toMatchObject({ ok: false, code: "INPUT_INVALID" });
  }
});

it("keeps a specific input error when the second comparison image fails admission", async () => {
  const result = await request("diff", { file: image(), secondFile: new Blob(["not PNG"]) });
  expect(result).toMatchObject({ ok: false, code: "PNG_INVALID" });
  expect(result).not.toHaveProperty("diffBlob");
});

it("keeps image geometry mismatch separate from hidden recovery", async () => {
  expect(await request("diff", { file: image(2, 2), secondFile: image(3, 2) })).toMatchObject({ ok: false, code: "DIMENSIONS" });
});

it.each([
  [{}, "INPUT_INVALID"],
  [{ file: image() }, "INPUT_INVALID"],
  [{ file: image(), secondFile: { size: 1 } }, "INPUT_INVALID"],
  [{ file: image(), secondFile: image(1, 1, 254) }, "PNG_UNSUPPORTED"],
  [{ file: image(), secondFile: new Blob([new Uint8Array(16777217)]) }, "PNG_LIMIT"],
])("refuses invalid comparison request %# at the real worker boundary", async (args, code) => {
  expect(await request("diff", args)).toMatchObject({ ok: false, code });
});

it("compares native samples and reports changed pixels without a security score", async () => {
  const original = new PNG({ width: 2, height: 1 });
  original.data.set([10, 20, 30, 255, 40, 50, 60, 255]);
  const changed = new PNG({ width: 2, height: 1 });
  changed.data.set([13, 20, 30, 255, 40, 50, 60, 255]);
  const result = await request("diff", {
    file: new Blob([PNG.sync.write(original)]),
    secondFile: new Blob([PNG.sync.write(changed)]),
  });
  expect(result).toMatchObject({ ok: true, changedPixels: 1, totalPixels: 2, averageDifference: "0.5000" });
  const overlay = PNG.sync.read(Buffer.from(await result.diffBlob.arrayBuffer()));
  expect([...overlay.data]).toEqual([45, 150, 60, 255, 0, 0, 0, 255]);
});

