import { Worker } from "node:worker_threads";
import { cover } from "../fixtures/protected.js";

async function workerGate(platform, setup = "") {
  const module = platform === "node"
    ? new URL("../../lib/protected-worker.js", import.meta.url)
    : new URL("../../app/src/lib/protected-worker.js", import.meta.url);
  const worker = new Worker(`
    const { parentPort } = require('node:worker_threads');
    ${setup}
    globalThis.self = { postMessage: data => parentPort.postMessage(data) };
    import(${JSON.stringify(module.href)}).then(() => {
      ${platform === "browser" ? "parentPort.on('message', data => self.onmessage({data}));" : ""}
      parentPort.postMessage({ready:true});
    });
  `, { eval: true });
  const pending = new Map();
  let sequence = 0;
  await new Promise((resolve, reject) => {
    worker.once("error", reject);
    worker.once("message", resolve);
  });
  worker.on("message", data => {
    if (data.result) { pending.get(data.id)?.(data.result); pending.delete(data.id); }
  });
  return {
    request(fields) {
      const id = ++sequence;
      return new Promise(resolve => {
        pending.set(id, resolve);
        worker.postMessage({ id, generation: 1, ...fields });
      });
    },
    close: () => worker.terminate(),
  };
}

for (const platform of ["node", "browser"]) describe(`${platform} real request gate`, () => {
  let gate;
  afterEach(async () => { await gate?.close(); });

  it("accepts preparation and discard, retains only the exact latest revision", async () => {
    gate = await workerGate(platform);
    const request = { action: "prepareEncode", pngBytes: cover(), message: "public", compress: false };
    const first = await gate.request(request);
    expect(first).toMatchObject({ ok: true, storedBytes: 6, fits: true });
    const second = await gate.request({ ...request, message: "a".repeat(1000), compress: true });
    expect(second).toMatchObject({ ok: true, originalBytes: 1000, storedBytes: 29, compressionUsed: true });
    expect(await gate.request({ action: "discard", preparation: first.preparation })).toEqual({ ok: true, discarded: false });
    expect(await gate.request({ action: "discard", preparation: { ...second.preparation, generation: 2 } })).toEqual({ ok: true, discarded: false });
    expect(await gate.request({ action: "discard", preparation: second.preparation })).toEqual({ ok: true, discarded: true });
    expect(await gate.request({ action: "discard", preparation: second.preparation })).toEqual({ ok: true, discarded: false });
  });

  it("rejects unsupported actions and malformed requests accepted by no real contract", async () => {
    gate = await workerGate(platform);
    const good = { action: "prepareEncode", pngBytes: cover(1, 1), message: "", compress: false };
    for (const fields of [
      { ...good, action: "unsupported" }, { ...good, generation: -1 },
      { ...good, message: "\ud800" }, { ...good, message: null },
      { ...good, pngBytes: good.pngBytes.subarray(1) }, { ...good, compress: "yes" },
      { ...good, pngBytes: new Uint8Array(new SharedArrayBuffer(8)) },
    ]) {
      expect(await gate.request(fields)).toMatchObject({ ok: false, code: "INPUT_INVALID" });
    }
    expect(await gate.request({ ...good, pngBytes: new Uint8Array(16777217) })).toMatchObject({ ok: false, code: "PNG_LIMIT" });
    expect(await gate.request({ ...good, pngBytes: new Uint8Array(16777216) })).toMatchObject({ ok: false, code: "PNG_INVALID" });
    expect(await gate.request(good)).toMatchObject({ ok: true, fits: false, hasFrameCapacity: false });
  });

  it("prepares with randomness and key derivation forbidden by the runtime", async () => {
    gate = await workerGate(platform, `
      const crypto = require('node:crypto');
      const forbidden = () => { throw new Error('No keys or randomness during preparation'); };
      crypto.randomBytes = crypto.randomFillSync = crypto.pbkdf2 = crypto.pbkdf2Sync = crypto.scrypt = forbidden;
      Object.defineProperty(globalThis, 'crypto', { value: { getRandomValues: forbidden, subtle: { deriveBits: forbidden, deriveKey: forbidden } } });
    `);
    expect(await gate.request({ action: "prepareEncode", pngBytes: cover(), message: "a".repeat(1000), compress: true }))
      .toMatchObject({ ok: true, compressionUsed: true, fits: true });
  });

  it("returns a safe allocation failure after admission, then prepares again", async () => {
    gate = await workerGate(platform, `
      const Native = Uint16Array;
      let reject = true;
      globalThis.Uint16Array = new Proxy(Native, { construct(target,args) {
        if (reject && args[0] === 262144) { reject = false; throw new RangeError('private allocation detail'); }
        return Reflect.construct(target,args);
      } });
    `);
    const fields = { action: "prepareEncode", pngBytes: cover(), message: "public", compress: false };
    const failed = await gate.request(fields);
    expect(failed).toMatchObject({ ok: false, code: "RESOURCE_FAILED" });
    expect(failed).not.toHaveProperty("preparation");
    expect(failed.error).not.toContain("private allocation");
    expect(await gate.request(fields)).toMatchObject({ ok: true, storedBytes: 6, fits: true });
  });
});
