import { gunzipSync } from "node:zlib";
import deflate from "pako/lib/deflate.js";
import { createProtectedImage } from "../../lib/protected-image.js";
import { cover } from "../fixtures/protected.js";

function request(message, compress = true, pngBytes = cover()) {
  return { id: 1, generation: 1, action: "prepareEncode", pngBytes, message, compress };
}

it("passes exact UTF-8 to the compressor and emits a canonical single gzip member", async () => {
  const chunks = [];
  let input;
  const execute = createProtectedImage({ createCompressor(options) {
    const native = new deflate.Deflate(options);
    const push = native.push;
    native.push = function(bytes, final) { input = bytes; return push.call(this, bytes, final); };
    Object.defineProperty(native, "onData", { configurable: true, set(callback) {
      Object.defineProperty(this, "onData", { value(chunk) { chunks.push(chunk.slice()); callback(chunk); } });
    } });
    return native;
  } });
  const message = "\uFEFFé😀\r\n \t".repeat(30);
  expect(await execute(request(message))).toMatchObject({ ok: true, compressionUsed: true, fits: true });
  const bytes = Buffer.concat(chunks);
  expect([...bytes.subarray(0, 10)]).toEqual([31, 139, 8, 0, 0, 0, 0, 0, 0, 255]);
  expect(Buffer.from(input)).toEqual(Buffer.from(message, "utf8"));
  expect(gunzipSync(bytes)).toEqual(Buffer.from(message, "utf8"));
  // The independent decoder reports the complete single input it consumed.
  const decoded = gunzipSync(bytes, { info: true });
  expect(decoded.engine.bytesWritten).toBe(bytes.length);
});

it.each([null, () => { throw new Error("private compressor failure"); }, () => ({ push: () => false })])(
  "reports unavailable/failed compression after PNG admission without leaving a usable preparation", async createCompressor => {
    const execute = createProtectedImage({ createCompressor });
    const first = await execute(request("previous", false));
    const stages = [];
    expect(await execute(request("compress me"), stage => stages.push(stage)))
      .toEqual({ ok: false, code: "COMPRESSION_FAILED", error: "Text compression is unavailable or failed. Try again or turn compression off." });
    expect(stages).toEqual(["checking inputs", "preparing text/capacity"]);
    expect(await execute({ action: "discard", id: 2, generation: 1, preparation: first.preparation }))
      .toEqual({ ok: true, discarded: false });
    expect(await execute(request("again", false))).toMatchObject({ ok: true, storedBytes: 5 });
  });

it("reports exact raw capacity after a bounded or larger stream and refuses non-fitting encoding", async () => {
  const execute = createProtectedImage();
  expect(await execute(request("abc"))).toMatchObject({ ok: true, storedBytes: 3, compressionUsed: false, fits: true });
  const emptyOnly = await execute(request("abc", true, cover(256, 168)));
  expect(emptyOnly).toMatchObject({ ok: true, originalBytes: 3, storedBytes: 3, compressionUsed: false, hasFrameCapacity: true, maxStoredBytes: 0, fits: false });
  expect(await execute({ id: 2, generation: 1, action: "encode", preparation: emptyOnly.preparation, password: "public" }))
    .toMatchObject({ ok: false, code: "CAPACITY" });
  let state = 1;
  const message = Array.from({ length: 2000 }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return String.fromCharCode(32 + ((state >>> 16) % 95));
  }).join("");
  const oversized = await execute(request(message));
  expect(oversized).toMatchObject({ ok: true, originalBytes: 2000, storedBytes: 2000, compressionUsed: false, fits: false });
  expect(await execute({ id: 3, generation: 1, action: "encode", preparation: oversized.preparation, password: "public" }))
    .toMatchObject({ ok: false, code: "CAPACITY" });
  expect(await execute(request(message, false))).toMatchObject({ ok: true, storedBytes: 2000, fits: false });
});

it("never reports an incomplete stream as compressed text", async () => {
  const execute = createProtectedImage({ createCompressor: () => ({
    push() { this.onData(new Uint8Array([31, 139])); return false; },
  }) });
  expect(await execute(request("long enough public text"))).toMatchObject({ ok: false, code: "COMPRESSION_FAILED" });
});
