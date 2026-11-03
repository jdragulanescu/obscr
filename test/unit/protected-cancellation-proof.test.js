import { Worker } from "node:worker_threads";
import { createProtectedTransport } from "../../lib/protected-transport.js";
import { referencePNG, PASSWORD, TEXT } from "../fixtures/protected-reference.js";

function observedCallWorker(platform, boundary, state, entered, reply, failed) {
  const gate = platform === "node" ? new URL("../../lib/protected-worker.js", import.meta.url)
    : new URL("../../app/src/lib/protected-worker.js", import.meta.url);
  const worker = new Worker(`
    const { parentPort, workerData } = require('node:worker_threads');
    const state = new Int32Array(workerData.state);
    (async () => {
      const target = workerData.boundary === 'KDF'
        ? (await import('libsodium-wrappers-sumo')).default
        : (await import('pako/lib/deflate.js')).default.Deflate.prototype;
      if (workerData.boundary === 'KDF') await target.ready;
      const name = workerData.boundary === 'KDF' ? 'crypto_pwhash' : 'push';
      const original = target[name];
      target[name] = function (...args) {
        Atomics.store(state, 0, 1);
        parentPort.postMessage({ entered: true });
        try { return original.apply(this, args); }
        finally { Atomics.store(state, 0, 2); }
      };
      globalThis.self = { postMessage: (data, transfer) => parentPort.postMessage(data, transfer) };
      await import(${JSON.stringify(gate.href)});
      ${platform === "browser" ? "parentPort.on('message', data => self.onmessage({ data }));" : ""}
      parentPort.postMessage({ ready: true });
    })().catch(error => { throw error; });
  `, { eval: true, workerData: { boundary, state: state.buffer } });
  let ready;
  const started = new Promise(resolve => { ready = resolve; });
  worker.on("message", message => {
    if (message.ready) ready();
    else if (message.entered) entered();
    else reply(message);
  });
  worker.on("error", failed);
  worker.on("messageerror", failed);
  return {
    post: (request, transfer) => { void started.then(() => worker.postMessage(request, transfer)).catch(failed); },
    stop: () => worker.terminate(),
  };
}

for (const platform of ["node", "browser"]) {
  it.each(["KDF", "compression"])(`PROTECTED-PROOF-04 ${platform}: terminates an active real %s call without output and restarts`, async boundary => {
    const pngBytes = await referencePNG({ width: 640, height: 640 });
    const state = new Int32Array(new SharedArrayBuffer(4));
    const controller = new AbortController();
    let entered = false;
    let stillActive = false;
    let first = true;
    const operations = createProtectedTransport((reply, failed) => {
      // Only the first worker's entry event cancels; fresh workers must complete.
      const cancelThisWorker = first;
      first = false;
      return observedCallWorker(platform, boundary, state, () => {
        if (!cancelThisWorker) return;
        entered = true;
        stillActive = Atomics.load(state, 0) === 1;
        controller.abort();
      }, reply, failed);
    });
    const cancelled = boundary === "KDF"
      ? await operations.decode({ pngBytes: new Uint8Array(pngBytes), password: PASSWORD }, { signal: controller.signal })
      : await operations.prepareEncode({ pngBytes: new Uint8Array(pngBytes), message: "a".repeat(1048576), compress: true }, { signal: controller.signal });
    expect(entered).toBe(true);
    expect(stillActive).toBe(true);
    expect(cancelled).toMatchObject({ ok: false, code: "CANCELLED" });
    expect(cancelled).not.toHaveProperty("message");
    expect(cancelled).not.toHaveProperty("preparation");
    expect(cancelled).not.toHaveProperty("pngBytes");
    // The actual synchronous call had entered but never returned before exit.
    // This observes a worker call interval, not a particular WASM instruction.
    expect(Atomics.load(state, 0)).toBe(1);
    if (boundary === "compression") {
      const prepared = await operations.prepareEncode({ pngBytes: new Uint8Array(pngBytes), message: "Fresh public gzip ".repeat(100), compress: true });
      try { expect(prepared).toMatchObject({ ok: true, fits: true, compressionUsed: true }); }
      finally { await operations.discard(prepared.preparation); }
    }
    expect(await operations.decode({ pngBytes: new Uint8Array(pngBytes), password: PASSWORD }))
      .toEqual({ ok: true, message: TEXT });
    expect(Atomics.load(state, 0)).toBe(2);
  }, 30000);
}
