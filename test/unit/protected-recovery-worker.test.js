import { Worker } from "node:worker_threads";
import { decode, prepareEncode, discard } from "../../lib/protected-node.js";
import { cover } from "../fixtures/protected.js";
import { referencePNG, PASSWORD, TEXT } from "../fixtures/protected-reference.js";

async function openGate(platform, setup = "") {
  const module = platform === "node" ? new URL("../../lib/protected-worker.js", import.meta.url)
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
  await new Promise((resolve, reject) => { worker.once("error", reject); worker.once("message", resolve); });
  let sequence = 0;
  return {
    request(fields) {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        const receive = data => {
          if (data.id === id && data.result) { worker.off("message", receive); worker.off("error", reject); resolve(data.result); }
        };
        worker.on("message", receive); worker.once("error", reject);
        worker.postMessage({ action: "decode", id, generation: 1, ...fields });
      });
    },
    close: () => worker.terminate(),
  };
}

for (const platform of ["node", "browser"]) describe(`${platform} actual recovery request gate`, () => {
  let gate;
  afterEach(async () => { await gate?.close(); gate = null; });

  it("recovers raw, gzip and empty independent PNGs with exact text", async () => {
    gate = await openGate(platform);
    for (const options of [{}, { text: "\ufeff \r\n".repeat(500), compression: 1 }, { text: "" }, { colorType: 6 }]) {
      expect(await gate.request({ pngBytes: await referencePNG(options), password: PASSWORD }))
        .toEqual({ ok: true, message: options.text ?? TEXT });
    }
  }, 30000);

  it("recovers every stored length through the real worker, including every block and padding transition", async () => {
    gate = await openGate(platform);
    const module = new URL("../fixtures/protected-reference.js", import.meta.url);
    const fixtures = new Worker(`
      const { parentPort } = require('node:worker_threads');
      import(${JSON.stringify(module.href)}).then(({ referencePNG }) => {
        parentPort.on('message', async length => {
          const bytes = await referencePNG({text:'x'.repeat(length)});
          parentPort.postMessage(bytes, [bytes.buffer]);
        });
        parentPort.postMessage('ready');
      });
    `, { eval: true });
    try {
      await new Promise((resolve, reject) => { fixtures.once("message", resolve); fixtures.once("error", reject); });
      for (let length = 0; length <= 512; length++) {
        const pngBytes = await new Promise((resolve, reject) => {
          fixtures.once("message", resolve);
          fixtures.once("error", reject);
          fixtures.postMessage(length);
        });
        fixtures.removeAllListeners("error");
        expect(await gate.request({ pngBytes, password: PASSWORD })).toEqual({ ok: true, message: "x".repeat(length) });
      }
    } finally {
      await fixtures.terminate();
    }
  }, 300000);

  it("rejects malformed decode requests, profile overrides and invalid exact passwords", async () => {
    gate = await openGate(platform);
    const pngBytes = cover();
    for (const fields of [
      { password: null }, { password: "" }, { password: "\ud800" }, { password: "é".repeat(513) },
      { profile: 1 }, { key: new Uint8Array(32) }, { generation: 2 },
      { pngBytes: pngBytes.subarray(1) }, { pngBytes: new Uint8Array(new SharedArrayBuffer(8)) },
    ]) {
      const result = await gate.request({ pngBytes, password: PASSWORD, ...fields });
      expect(result.ok).toBe(false);
      expect(["INPUT_INVALID", "INPUT_LIMIT"]).toContain(result.code);
      expect(result).not.toHaveProperty("message");
    }
    expect(await gate.request({ pngBytes: new Uint8Array(16777217), password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PNG_LIMIT" });
    expect(await gate.request({ pngBytes: await referencePNG(), password: PASSWORD }))
      .toEqual({ ok: true, message: TEXT });
  }, 30000);

  it("fails explicitly without WASM and does not fall back", async () => {
    gate = await openGate(platform, "globalThis.WebAssembly = undefined;");
    const result = await gate.request({ pngBytes: await referencePNG(), password: PASSWORD });
    expect(result).toMatchObject({ ok: false, code: "RESOURCE_FAILED" });
    expect(result).not.toHaveProperty("message");
  }, 30000);

  it("releases failed maximum-image allocation and accepts a subsequent operation", async () => {
    gate = await openGate(platform, `
      const Native = Uint16Array;
      let reject = true;
      globalThis.Uint16Array = new Proxy(Native, { construct(target,args) {
        if (reject && args[0] === 1048576) { reject = false; throw new RangeError('private allocation'); }
        return Reflect.construct(target,args);
      } });
    `);
    const pngBytes = await referencePNG({ width: 1024, height: 1024 });
    expect(await gate.request({ pngBytes, password: PASSWORD })).toMatchObject({ ok: false, code: "RESOURCE_FAILED" });
    expect(await gate.request({ pngBytes, password: PASSWORD })).toEqual({ ok: true, message: TEXT });
  }, 30000);
});

for (const stage of ["deriving keys", "recovering"]) it(`cancels actual Node worker during ${stage}, suppresses output and starts again`, async () => {
  const controller = new AbortController();
  const result = await decode({ pngBytes: await referencePNG(), password: PASSWORD }, {
    signal: controller.signal,
    onProgress(value) { if (value === stage) controller.abort(); },
  });
  expect(result).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(result).not.toHaveProperty("message");
  expect(await decode({ pngBytes: await referencePNG(), password: PASSWORD })).toEqual({ ok: true, message: TEXT });
}, 30000);

it("recovery replaces retained preparation and releases its image lock on success", async () => {
  const prepared = await prepareEncode({ pngBytes: cover(), message: "public", compress: false });
  expect(prepared.ok).toBe(true);
  expect(await decode({ pngBytes: await referencePNG(), password: PASSWORD })).toEqual({ ok: true, message: TEXT });
  expect(await discard(prepared.preparation)).toEqual({ ok: true, discarded: false });
  const next = await prepareEncode({ pngBytes: cover(), message: "again", compress: false });
  expect(next).toMatchObject({ ok: true, storedBytes: 5 });
  await discard(next.preparation);
}, 30000);
