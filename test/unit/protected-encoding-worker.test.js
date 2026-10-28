import { Worker } from "node:worker_threads";
import { encode, prepareEncode, decode, discard } from "../../lib/protected-node.js";
import { createProtectedTransport } from "../../lib/protected-transport.js";
import { cover } from "../fixtures/protected.js";

const PASSWORD = "public encoding fixture é\r\n";

function startGate(platform, setup = "") {
  const module = new URL(platform === "node" ? "../../lib/protected-worker.js" : "../../app/src/lib/protected-worker.js", import.meta.url);
  return new Worker(`
    const { parentPort } = require('node:worker_threads');
    ${setup}
    const send = parentPort.postMessage.bind(parentPort);
    parentPort.postMessage = (data, transfer) => {
      const buffer = data.result?.pngBytes?.buffer;
      send(data, transfer);
      if (buffer && buffer.byteLength !== 0) throw new Error('Encoded output was copied, not transferred');
    };
    globalThis.self = { postMessage: (data, transfer) => parentPort.postMessage(data, transfer) };
    import(${JSON.stringify(module.href)}).then(() => {
      ${platform === "browser" ? "parentPort.on('message', data => self.onmessage({data}));" : ""}
      parentPort.postMessage({ready:true});
    });
  `, { eval: true });
}

async function openGate(platform, setup = "") {
  const worker = startGate(platform, setup);
  await new Promise((resolve, reject) => { worker.once("error", reject); worker.once("message", resolve); });
  let sequence = 0;
  return {
    request(fields) {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        const receive = data => {
          if (data.id === id && data.result) {
            worker.off("message", receive); worker.off("error", reject); resolve(data.result);
          }
        };
        worker.on("message", receive); worker.once("error", reject);
        worker.postMessage({ id, generation: 1, ...fields });
      });
    },
    close: () => worker.terminate(),
  };
}

async function prepare(gate, message = "public", compress = false, pngBytes = cover()) {
  const result = await gate.request({ action: "prepareEncode", pngBytes, message, compress });
  expect(result).toMatchObject({ ok: true, fits: true });
  return result;
}

for (const platform of ["node", "browser"]) describe(`${platform} actual encoding request gate`, () => {
  let gate, other;
  afterEach(async () => { await gate?.close(); await other?.close(); gate = other = null; });

  it("exchanges exact raw, gzip and empty text with the other platform", async () => {
    gate = await openGate(platform);
    other = await openGate(platform === "node" ? "browser" : "node");
    for (const [message, compress, originalBytes, storedBytes] of [
      ["\ufeff public é🙂\r\n\t ", false, 21, 21], ["\ufeff é\r\n ".repeat(500), true, 4500, 59], ["", false, 0, 0],
    ]) {
      const prepared = await prepare(gate, message, compress, cover(600, 600));
      const result = await gate.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
      expect(result).toEqual({
        ok: true, pngBytes: expect.any(Uint8Array), originalBytes, storedBytes, compressionUsed: compress,
        maxStoredBytes: 512, hasFrameCapacity: true, fits: true, metadataNotice: prepared.metadataNotice,
      });
      expect(result.pngBytes).toBeInstanceOf(Uint8Array);
      expect(result.pngBytes.byteOffset).toBe(0);
      expect(result.pngBytes.byteLength).toBe(result.pngBytes.buffer.byteLength);
      expect(await other.request({ action: "decode", pngBytes: result.pngBytes, password: PASSWORD }))
        .toEqual({ ok: true, message });
      expect(await gate.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
        .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
    }
  }, 30000);

  it("uses the final exact password without replacing a valid preparation", async () => {
    gate = await openGate(platform);
    const prepared = await prepare(gate);
    let password = "old public password";
    password = "\ufeff e\u0301 \r\n";
    const result = await gate.request({ action: "encode", preparation: prepared.preparation, password });
    expect(result.ok).toBe(true);
    expect(await gate.request({ action: "decode", pngBytes: result.pngBytes, password: "old public password" }))
      .toMatchObject({ ok: false, code: "RECOVERY_FAILED" });
    expect(await gate.request({ action: "decode", pngBytes: result.pngBytes, password })).toEqual({ ok: true, message: "public" });
  }, 30000);

  it("rejects replaced, discarded and foreign generation handles", async () => {
    gate = await openGate(platform);
    const first = await prepare(gate);
    await prepare(gate);
    expect(await gate.request({ action: "encode", preparation: first.preparation, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
    const second = await prepare(gate);
    expect(await gate.request({ action: "discard", preparation: second.preparation }))
      .toEqual({ ok: true, discarded: true });
    expect(await gate.request({ action: "encode", preparation: second.preparation, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
    const third = await prepare(gate);
    expect(await gate.request({ action: "encode", preparation: { ...third.preparation, generation: 2 }, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  });

  it("rejects unknown encode options and malformed passwords at the real gate", async () => {
    gate = await openGate(platform);
    for (const [fields, code] of [
      [{ profile: 1 }, "INPUT_INVALID"], [{ key: new Uint8Array(32) }, "INPUT_INVALID"],
      [{ randomBytes: 1 }, "INPUT_INVALID"], [{ generation: 2 }, "INPUT_INVALID"],
      [{ password: null }, "INPUT_INVALID"], [{ password: "" }, "INPUT_INVALID"],
      [{ password: "\ud800" }, "INPUT_INVALID"], [{ password: "é".repeat(513) }, "INPUT_LIMIT"],
    ]) {
      const prepared = await prepare(gate);
      const result = await gate.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD, ...fields });
      expect(result).toMatchObject({ ok: false, code });
      expect(result).not.toHaveProperty("pngBytes");
    }
    const prepared = await prepare(gate);
    expect((await gate.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD })).ok).toBe(true);
  }, 30000);

  it("fails without WASM, consumes the preparation and publishes no partial PNG", async () => {
    gate = await openGate(platform, "globalThis.WebAssembly = undefined;");
    const prepared = await prepare(gate);
    const result = await gate.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
    expect(result).toEqual({ ok: false, code: "RESOURCE_FAILED", error: expect.any(String) });
    expect(await gate.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  }, 30000);
});

it("exchanges every raw stored length 0..512 across real workers at all block and padding transitions", async () => {
  const gates = [await openGate("node"), await openGate("browser")];
  try {
    const pngBytes = cover(600, 600);
    for (let length = 0; length <= 512; length++) {
      const writer = gates[length % 2], reader = gates[1 - length % 2];
      const message = "x".repeat(length);
      const prepared = await prepare(writer, message, false, pngBytes);
      expect(prepared.storedBytes).toBe(length);
      const result = await writer.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
      expect(result).toEqual({
        ok: true, pngBytes: expect.any(Uint8Array),
        originalBytes: length, storedBytes: length, compressionUsed: false,
        maxStoredBytes: 512, hasFrameCapacity: true, fits: true, metadataNotice: prepared.metadataNotice,
      });
      expect(await reader.request({ action: "decode", pngBytes: result.pngBytes, password: PASSWORD })).toEqual({ ok: true, message });
    }
  } finally { await Promise.all(gates.map(gate => gate.close())); }
}, 600000);

for (const platform of ["node", "browser"]) for (const stage of ["deriving keys", "encoding"]) {
  it(`cancels ${platform} encoding during ${stage}, rejects the old handle and starts fresh`, async () => {
    const api = createProtectedTransport((reply, failed) => {
      const worker = startGate(platform);
      let ready;
      const started = new Promise(resolve => { ready = resolve; });
      worker.on("message", message => message.ready ? ready() : reply(message));
      worker.on("error", failed);
      return {
        post: (request, transfer) => { void started.then(() => worker.postMessage(request, transfer)); },
        stop: () => worker.terminate(),
      };
    });
    const prepared = await api.prepareEncode({ pngBytes: cover(), message: "public", compress: false });
    expect(prepared.ok).toBe(true);
    const controller = new AbortController();
    const result = await api.encode({ preparation: prepared.preparation, password: PASSWORD }, {
      signal: controller.signal,
      onProgress(value) { if (value === stage) controller.abort(); },
    });
    expect(result).toEqual({ ok: false, code: "CANCELLED", error: expect.any(String) });
    expect(await api.encode({ preparation: prepared.preparation, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
    const next = await api.prepareEncode({ pngBytes: cover(), message: "again", compress: false });
    const encoded = await api.encode({ preparation: next.preparation, password: PASSWORD });
    expect(encoded).toMatchObject({
      ok: true, originalBytes: 5, storedBytes: 5, compressionUsed: false,
      maxStoredBytes: next.maxStoredBytes, hasFrameCapacity: true, fits: true,
      metadataNotice: next.metadataNotice,
    });
    expect(await api.decode({ pngBytes: encoded.pngBytes, password: PASSWORD })).toEqual({ ok: true, message: "again" });
  }, 30000);
}

it("exports the complete Node encoding operation and rejects foreign opaque handles", async () => {
  const prepared = await prepareEncode({ pngBytes: cover(), message: "export", compress: false });
  expect(prepared.ok).toBe(true);
  expect(await encode({ preparation: {}, password: PASSWORD })).toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  const next = await prepareEncode({ pngBytes: cover(), message: "export", compress: false });
  const result = await encode({ preparation: next.preparation, password: PASSWORD });
  expect(result.ok).toBe(true);
  expect(await decode({ pngBytes: result.pngBytes, password: PASSWORD })).toEqual({ ok: true, message: "export" });
  expect(await discard(next.preparation)).toEqual({ ok: true, discarded: false });
}, 30000);

it("fails safely when workers cannot start and releases the operation lock", async () => {
  const api = createProtectedTransport(() => { throw new Error("private runtime failure"); });
  const result = await api.prepareEncode({ pngBytes: cover(), message: "public", compress: false });
  expect(result).toMatchObject({ ok: false, code: "WORKER_FAILED" });
  expect(result).not.toHaveProperty("pngBytes");
  expect(result.error).not.toContain("private runtime failure");
  const next = await prepareEncode({ pngBytes: cover(), message: "public", compress: false });
  expect(next.ok).toBe(true);
  await discard(next.preparation);
});

it("ignores a cancelled encoder's late bytes after a new worker has started", async () => {
  const workers = [];
  const api = createProtectedTransport(reply => {
    const state = { reply, request: null };
    workers.push(state);
    return { post(request) { state.request = request; }, stop() {} };
  });
  const preparing = api.prepareEncode({ pngBytes: cover(), message: "first", compress: false });
  workers[0].reply({ id: workers[0].request.id, result: { ok: true, preparation: { generation: 1, revision: 1 } } });
  const prepared = await preparing;
  const controller = new AbortController();
  const encoding = api.encode({ preparation: prepared.preparation, password: PASSWORD }, { signal: controller.signal });
  const oldId = workers[0].request.id;
  controller.abort();
  expect(await encoding).toEqual({ ok: false, code: "CANCELLED", error: expect.any(String) });
  const next = api.prepareEncode({ pngBytes: cover(), message: "second", compress: false });
  workers[0].reply({ id: oldId, result: { ok: true, pngBytes: new Uint8Array([1, 2, 3]),
    originalBytes: 5, storedBytes: 5, compressionUsed: false, maxStoredBytes: 512,
    hasFrameCapacity: true, fits: true, metadataNotice: "obsolete result" } });
  workers[1].reply({ id: workers[1].request.id, result: { ok: true, preparation: { generation: 2, revision: 1 }, storedBytes: 6 } });
  const fresh = await next;
  expect(fresh).toMatchObject({ ok: true, storedBytes: 6 });
  expect(fresh).not.toHaveProperty("pngBytes");
  const discarded = api.discard(fresh.preparation);
  workers[1].reply({ id: workers[1].request.id, result: { ok: true, discarded: true } });
  expect(await discarded).toEqual({ ok: true, discarded: true });
});

for (const unavailable of ["RNG", "native crypto"]) it(`fails without browser ${unavailable} and consumes the handle`, async () => {
  const setup = unavailable === "RNG"
    ? "Object.defineProperty(globalThis, 'crypto', {value: {getRandomValues() {throw new Error('private RNG failure');}}, configurable:true});"
    : "const crypto = globalThis.crypto; Object.defineProperty(globalThis, 'crypto', {value: {getRandomValues: crypto.getRandomValues.bind(crypto)}, configurable:true});";
  const gate = await openGate("browser", setup);
  try {
    const prepared = await prepare(gate);
    const result = await gate.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
    expect(result).toEqual({ ok: false, code: "RESOURCE_FAILED", error: expect.any(String) });
    expect(result.error).not.toContain("private");
    expect(await gate.request({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  } finally { await gate.close(); }
}, 30000);
