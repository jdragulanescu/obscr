import { cover as image } from "../fixtures/protected.js";
import { prepareEncode, discard } from "../../lib/protected-node.js";
import { PNG } from "pngjs";


it("prepares exact BOM, CRLF and whitespace bytes without a password", async () => {
  const result = await prepareEncode({ pngBytes: image(), message: "\uFEFF A\r\n\t", compress: false });
  expect(result).toMatchObject({ ok: true, originalBytes: 8, storedBytes: 8, compressionUsed: false, hasFrameCapacity: true, fits: true });
  expect(typeof result.metadataNotice).toBe("string");
  expect(await discard(result.preparation)).toEqual({ ok: true, discarded: true });
});

it("uses one bounded gzip member only when it makes the exact text smaller", async () => {
  const result = await prepareEncode({ pngBytes: image(), message: "a".repeat(1000), compress: true });
  expect(result).toMatchObject({ ok: true, originalBytes: 1000, storedBytes: 29, compressionUsed: true, fits: true });
  await discard(result.preparation);
});

it("rejects competing work across the retained interface and existing image operations", async () => {
  const { extractMessageFromImage } = await import("../../lib/steg.js");
  const pending = prepareEncode({ pngBytes: image(), message: "public", compress: false });
  expect(await prepareEncode({ pngBytes: image(1, 1), message: "", compress: false })).toMatchObject({ ok: false, code: "BUSY" });
  expect(await extractMessageFromImage("unused.png", "public")).toMatchObject({ success: false, code: "BUSY" });
  const result = await pending;
  await discard(result.preparation);
});

it.each([
  ["", 0], [" \t\r\n", 4], ["\uFEFFé😀\r\n ", 12], ["e\u0301", 3],
])("keeps exact UTF-8 length for %j", async (message, originalBytes) => {
  const result = await prepareEncode({ pngBytes: image(), message, compress: false });
  expect(result).toMatchObject({ ok: true, originalBytes, storedBytes: originalBytes, compressionUsed: false, fits: true });
  await discard(result.preparation);
});

it.each(["\ud800", "\udc00", "a\ud800b", "😀\udfff"])("rejects unpaired surrogates %j", async message => {
  expect(await prepareEncode({ pngBytes: image(1, 1), message, compress: false }))
    .toMatchObject({ ok: false, code: "INPUT_INVALID" });
});

it("admits the exact text and image limits, but not one extra UTF-8 byte", async () => {
  const result = await prepareEncode({ pngBytes: image(1024, 1024), message: "é".repeat(524288), compress: false });
  expect(result).toMatchObject({ ok: true, originalBytes: 1048576, storedBytes: 1048576, maxStoredBytes: 512, fits: false });
  await discard(result.preparation);
  expect(await prepareEncode({ pngBytes: image(1, 1), message: "é".repeat(524288) + "a", compress: false }))
    .toMatchObject({ ok: false, code: "INPUT_LIMIT" });
});

it.each([
  [256, 167, true, 0, false], [256, 168, true, 0, true],
  [512, 316, true, 223, true], [512, 333, true, 223, true],
  [512, 334, true, 224, true], [512, 582, true, 462, true],
  [512, 599, true, 462, true], [512, 600, true, 463, true],
  [1024, 1024, true, 512, true], [1024, 1024, false, 0, false],
])("accounts for complete frame and repair overhead on %ix%i (%s)", async (width, height, detailed, maximum, hasFrameCapacity) => {
  const result = await prepareEncode({ pngBytes: image(width, height, detailed), message: "", compress: false });
  expect(result).toMatchObject({ ok: true, maxStoredBytes: maximum, hasFrameCapacity, fits: hasFrameCapacity });
  await discard(result.preparation);
});

it("supports every stored length 0..512 without expanding the stored-byte limit", async () => {
  const png = image(1024, 334);
  let result;
  for (let size = 0; size <= 512; size++) {
    result = await prepareEncode({ pngBytes: png.slice(), message: "x".repeat(size), compress: false });
    expect(result).toMatchObject({ ok: true, storedBytes: size, maxStoredBytes: 512, fits: true });
  }
  result = await prepareEncode({ pngBytes: png.slice(), message: "x".repeat(513), compress: false });
  expect(result).toMatchObject({ ok: true, maxStoredBytes: 512, fits: false });
  await discard(result.preparation);
}, 120000);

it("replaces preparations, ignores foreign handles and makes discard idempotent", async () => {
  const first = await prepareEncode({ pngBytes: image(), message: "one", compress: false });
  const second = await prepareEncode({ pngBytes: image(256, 168), message: "", compress: true });
  expect(second).toMatchObject({ ok: true, maxStoredBytes: 0, storedBytes: 0, compressionUsed: false });
  expect(await discard(first.preparation)).toEqual({ ok: true, discarded: false });
  expect(await discard({})).toEqual({ ok: true, discarded: false });
  expect(await discard(second.preparation)).toEqual({ ok: true, discarded: true });
  expect(await discard(second.preparation)).toEqual({ ok: true, discarded: false });
});

it.each(["checking inputs", "preparing text/capacity"])("cancels during %s and permits a fresh operation", async stage => {
  const controller = new AbortController();
  const result = await prepareEncode({ pngBytes: image(1024, 1024), message: "a".repeat(1048576), compress: true }, {
    signal: controller.signal,
    onProgress: value => { if (value === stage) controller.abort(); },
  });
  expect(result).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(result).not.toHaveProperty("preparation");
  const fresh = await prepareEncode({ pngBytes: image(), message: "again", compress: false });
  expect(fresh).toMatchObject({ ok: true, storedBytes: 5, fits: true });
  await discard(fresh.preparation);
});

it("transfers owned PNG bytes and clears old preparation when replacement fails", async () => {
  const bytes = image();
  const pending = prepareEncode({ pngBytes: bytes, message: "first", compress: false });
  expect(bytes.byteLength).toBe(0);
  const first = await pending;
  expect(await prepareEncode({ pngBytes: new Uint8Array([1]), message: "second", compress: false }))
    .toMatchObject({ ok: false, code: "PNG_INVALID" });
  expect(await discard(first.preparation)).toEqual({ ok: true, discarded: false });
});

it("excludes salt scalars before capacity and ignores all lower RGB bits", async () => {
  const source = image(400, 107);
  const first = await prepareEncode({ pngBytes: source.slice(), message: "", compress: false });
  // 42,800 pixels would supply exactly 32,100 scalars before salt exclusions.
  expect(first).toMatchObject({ ok: true, hasFrameCapacity: false, maxStoredBytes: 0 });
  const png = PNG.sync.read(Buffer.from(source));
  for (let p = 0; p < png.data.length; p += 4) {
    png.data[p] ^= 1; png.data[p + 1] ^= 1; png.data[p + 2] ^= 1;
  }
  const second = await prepareEncode({ pngBytes: new Uint8Array(PNG.sync.write(png)), message: "", compress: false });
  expect(second).toMatchObject({ ok: true, hasFrameCapacity: false, maxStoredBytes: 0 });
  await discard(second.preparation);
});

it("preserves PNG admission failures for nonopaque and out-of-domain covers", async () => {
  for (const [width, alpha, code] of [[1, 254, "PNG_UNSUPPORTED"], [1025, 255, "PNG_LIMIT"]]) {
    const png = new PNG({ width, height: 1 });
    png.data.fill(255);
    png.data[3] = alpha;
    expect(await prepareEncode({ pngBytes: new Uint8Array(PNG.sync.write(png)), message: "", compress: false }))
      .toMatchObject({ ok: false, code });
  }
});
