import { Worker } from "node:worker_threads";
import { PNG } from "pngjs";
import * as nodeOperations from "../../lib/protected-node.js";
import { createProtectedTransport } from "../../lib/protected-transport.js";
import { comparePNGs } from "../../lib/png-diff.js";
import { exportFixture, parseChunks, rendering } from "../fixtures/pngExport.js";
import { referencePNG, PASSWORD, TEXT } from "../fixtures/protected-reference.js";

// This exercises the browser request gate under Node; #71 separately records real browser exchange.
function browserGateOperations() {
  const module = new URL("../../app/src/lib/protected-worker.js", import.meta.url);
  return createProtectedTransport((reply, failed) => {
    const worker = new Worker(`
      const { parentPort } = require('node:worker_threads');
      globalThis.self = { postMessage: (data, transfer) => parentPort.postMessage(data, transfer) };
      import(${JSON.stringify(module.href)}).then(() => {
        parentPort.on('message', data => self.onmessage({ data }));
        parentPort.postMessage({ ready: true });
      }).catch(error => { throw error; });
    `, { eval: true });
    let ready;
    const started = new Promise(resolve => { ready = resolve; });
    worker.on("message", message => message.ready ? ready() : reply(message));
    worker.on("error", failed);
    worker.on("messageerror", failed);
    worker.on("exit", failed);
    return {
      post: (request, transfer) => { void started.then(() => worker.postMessage(request, transfer)).catch(failed); },
      stop: () => worker.terminate(),
    };
  });
}

function expectPreservedPNG(bytes, fixture) {
  const chunks = parseChunks(bytes);
  expect(chunks.map(item => item.type)).toEqual(["IHDR", "cHRM", "gAMA", "sRGB", "IDAT", "IEND"]);
  for (const item of chunks.slice(1, 4)) expect(item.data).toEqual(rendering[item.type]);
  const image = PNG.sync.read(Buffer.from(bytes));
  expect([image.width, image.height, chunks[0].data[9]]).toEqual([640, 640, fixture.colorType]);
  const actual = Buffer.from(image.data);
  const expected = Buffer.from(fixture.rgba);
  for (let i = 0; i < actual.length; i++) {
    if (i % 4 === 3) continue;
    actual[i] &= 254;
    expected[i] &= 254;
  }
  expect(actual.equals(expected)).toBe(true);
  return PNG.sync.write(image, { colorType: 6 });
}

for (const origin of ["Node", "browser gate"]) {
  it(`PROTECTED-ACCEPT-01 ${origin}: prepares exact text, exchanges complete PNGs and preserves PNG/Diff policy`, async () => {
    const browser = browserGateOperations();
    const sender = origin === "Node" ? nodeOperations : browser;
    const receiver = origin === "Node" ? browser : nodeOperations;
    const fixture = exportFixture({ width: 640, height: 640, colorType: 6 });
    const source = Buffer.from(fixture.bytes);
    for (const [message, compress] of [[TEXT, false], [TEXT.repeat(100), true]]) {
      const prepared = await sender.prepareEncode({ pngBytes: new Uint8Array(fixture.bytes), message, compress });
      try {
        expect(prepared).toMatchObject({
          ok: true, originalBytes: Buffer.byteLength(message), compressionUsed: compress,
          hasFrameCapacity: true, fits: true, maxStoredBytes: 512,
        });
        expect(prepared.storedBytes).toBeLessThanOrEqual(prepared.maxStoredBytes);
        if (!compress) expect(prepared.storedBytes).toBe(Buffer.byteLength(message));
        const encoded = await sender.encode({ preparation: prepared.preparation, password: PASSWORD });
        expect(encoded.ok).toBe(true);
        for (const field of ["originalBytes", "storedBytes", "compressionUsed", "maxStoredBytes", "hasFrameCapacity", "fits", "metadataNotice"]) {
          expect(encoded[field]).toEqual(prepared[field]);
        }
        expect(await sender.encode({ preparation: prepared.preparation, password: PASSWORD }))
          .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
        expect(await receiver.decode({ pngBytes: new Uint8Array(encoded.pngBytes), password: PASSWORD }))
          .toEqual({ ok: true, message });
        const rewritten = expectPreservedPNG(encoded.pngBytes, fixture);
        expect(comparePNGs(encoded.pngBytes, rewritten))
          .toMatchObject({ changedPixels: 0, totalPixels: 409600, averageDifference: "0.0000" });
        expect(await receiver.decode({ pngBytes: new Uint8Array(rewritten), password: PASSWORD }))
          .toEqual({ ok: true, message });
        const refused = await receiver.decode({ pngBytes: new Uint8Array(encoded.pngBytes), password: "wrong public password" });
        expect(refused).toMatchObject({ ok: false, code: "RECOVERY_FAILED" });
        expect(refused).not.toHaveProperty("message");
        expect(Buffer.from(fixture.bytes).equals(source)).toBe(true);
      } finally {
        await sender.discard(prepared.preparation);
      }
    }
  }, 30000);
}

it("PROTECTED-ACCEPT-02: independent damaged and empty frames recover; authentication failure releases no text", async () => {
  const browser = browserGateOperations();
  const damage = { headerBytes: Array.from({ length: 8 }, (_, offset) => ({ offset })) };
  for (const [options, message] of [[{ damage }, TEXT], [{ text: "" }, ""]]) {
    const pngBytes = await referencePNG({ width: 640, height: 640, ...options });
    expect(await nodeOperations.decode({ pngBytes: new Uint8Array(pngBytes), password: PASSWORD })).toEqual({ ok: true, message });
    expect(await browser.decode({ pngBytes: new Uint8Array(pngBytes), password: PASSWORD })).toEqual({ ok: true, message });
  }
  const altered = await referencePNG({ width: 640, height: 640, damage: { headerAfterAuth: { 0: 0 } } });
  for (const operations of [nodeOperations, browser]) {
    const result = await operations.decode({ pngBytes: new Uint8Array(altered), password: PASSWORD });
    expect(result).toMatchObject({ ok: false, code: "RECOVERY_FAILED" });
    expect(result).not.toHaveProperty("message");
  }
}, 30000);

it("PROTECTED-ACCEPT-03: cancelled real recovery cannot consume a replacement preparation or publish stale text", async () => {
  const pngBytes = await referencePNG({ width: 640, height: 640 });
  const controller = new AbortController();
  const cancelled = await nodeOperations.decode({ pngBytes: new Uint8Array(pngBytes), password: PASSWORD }, {
    signal: controller.signal,
    onProgress(stage) { if (stage === "recovering") controller.abort(); },
  });
  expect(cancelled).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(cancelled).not.toHaveProperty("message");
  const message = "Fresh public text after cancellation";
  const prepared = await nodeOperations.prepareEncode({ pngBytes: new Uint8Array(pngBytes), message, compress: false });
  try {
    expect(prepared).toMatchObject({ ok: true, fits: true });
    const encoded = await nodeOperations.encode({ preparation: prepared.preparation, password: PASSWORD });
    expect(encoded.ok).toBe(true);
    expect(await nodeOperations.decode({ pngBytes: encoded.pngBytes, password: PASSWORD }))
      .toEqual({ ok: true, message });
  } finally {
    await nodeOperations.discard(prepared.preparation);
  }
}, 30000);

it("PROTECTED-ACCEPT-04: independent physically shortened tags never release text through either real gate", async () => {
  const browser = browserGateOperations();
  for (const message of ["", "Short public tag fixture", "x".repeat(224), "x".repeat(512)]) {
    const complete = await referencePNG({ width: 640, height: 640, text: message });
    for (const operations of [nodeOperations, browser]) {
      expect(await operations.decode({ pngBytes: new Uint8Array(complete), password: PASSWORD }))
        .toEqual({ ok: true, message });
    }
    for (let tagLength = 0; tagLength < 16; tagLength++) {
      // Header still declares the fixed full-tag format. Reference writer drops
      // tag bytes BEFORE its separate RS encoder/interleaver/carrier, not XOR damage.
      const shortened = await referencePNG({ width: 640, height: 640, text: message, damage: { tagLength } });
      for (const operations of [nodeOperations, browser]) {
        expect(await operations.decode({ pngBytes: new Uint8Array(shortened), password: PASSWORD }))
          .toEqual({ ok: false, code: "RECOVERY_FAILED", error: "Could not recover an authenticated message. The password may be wrong, or the image may be damaged or changed." });
      }
    }
  }
}, 60000);

it("PROTECTED-ACCEPT-05: real gates authenticate independent gzip and refuse its bad tag without text", async () => {
  const browser = browserGateOperations();
  const message = "Public authenticated gzip 日本 ".repeat(100);
  for (const damage of [{}, { tagBytes: [{ offset: 0 }] }]) {
    const pngBytes = await referencePNG({ text: message, compression: 1, damage });
    for (const operations of [nodeOperations, browser]) {
      const result = await operations.decode({ pngBytes: new Uint8Array(pngBytes), password: PASSWORD });
      expect(result).toEqual(damage.tagBytes
        ? { ok: false, code: "RECOVERY_FAILED", error: "Could not recover an authenticated message. The password may be wrong, or the image may be damaged or changed." }
        : { ok: true, message });
    }
  }
}, 30000);
