import { createProtectedImage } from "../../lib/protected-image.js";
import { nativeCrypto } from "../../lib/protected-native-node.js";
import { cover } from "../fixtures/protected.js";
import { PASSWORD, TEXT } from "../fixtures/protected-reference.js";
import deflate from "pako/lib/deflate.js";
import { admitPNG, serializePNG } from "../../lib/png.js";
import { exportFixture, parseChunks } from "../fixtures/pngExport.js";

function operation(options = {}) {
  const execute = createProtectedImage({ nativeCrypto, ...options });
  let id = 0;
  return (fields, progress) => execute({ id: ++id, generation: 1, ...fields }, progress);
}

it("consumes one preparation into a complete PNG and recovers exact text", async () => {
  const run = operation();
  const prepared = await run({ action: "prepareEncode", pngBytes: cover(), message: TEXT, compress: false });
  expect(prepared.ok).toBe(true);
  const encoded = await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
  expect(encoded.ok).toBe(true);
  expect(await run({ action: "decode", pngBytes: encoded.pngBytes, password: PASSWORD }))
    .toEqual({ ok: true, message: TEXT });
  expect(await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
    .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
});

it("refuses impossible preparations before salt, nonce or key work", async () => {
  let cryptoWork = 0;
  const unavailable = () => { cryptoWork++; throw new Error("must not run"); };
  const run = operation({ nativeCrypto: { randomBytes: unavailable, hkdf: unavailable, ctr: unavailable, encrypt: unavailable } });
  for (const [pngBytes, message] of [[cover(1, 1), ""], [cover(256, 168), "x"], [cover(), "x".repeat(513)]]) {
    const prepared = await run({ action: "prepareEncode", pngBytes, message, compress: false });
    expect(prepared).toMatchObject({ ok: true, fits: false });
    expect(await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "CAPACITY" });
    expect(await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  }
  expect(cryptoWork).toBe(0);
});

it("validates exact password bounds and refuses request overrides without publishing bytes", async () => {
  const run = operation();
  for (const fields of [
    { password: "" }, { password: "\ud800" }, { password: "\udc00" },
    { password: "a".repeat(1025) }, { password: "é".repeat(513) },
    { password: PASSWORD, profile: 1 }, { password: PASSWORD, salt: new Uint8Array(16) },
    { password: PASSWORD, nativeCrypto }, { password: PASSWORD, serialize: "override" },
  ]) {
    const prepared = await run({ action: "prepareEncode", pngBytes: cover(), message: TEXT, compress: false });
    const result = await run({ action: "encode", preparation: prepared.preparation, ...fields });
    expect(result.ok).toBe(false);
    expect(["INPUT_INVALID", "INPUT_LIMIT"]).toContain(result.code);
    expect(result).not.toHaveProperty("pngBytes");
    expect(await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
      .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  }
});

it("encrypts the exact retained compressed bytes once, without admitting the source again", async () => {
  let compressed;
  let compressions = 0;
  let encrypted;
  const message = "\uFEFF public\r\n \t".repeat(200);
  const run = operation({
    createCompressor(options) {
      compressions++;
      const compressor = new deflate.Deflate(options);
      const push = compressor.push;
      compressor.push = function(bytes, final) {
        const onData = this.onData;
        this.onData = chunk => { compressed = chunk.slice(); onData(chunk); };
        return push.call(this, bytes, final);
      };
      return compressor;
    },
    nativeCrypto: { ...nativeCrypto, encrypt(key, nonce, bytes, aad) {
      encrypted = bytes;
      expect(bytes).toEqual(compressed);
      return nativeCrypto.encrypt(key, nonce, bytes, aad);
    } },
  });
  const source = cover();
  const prepared = await run({ action: "prepareEncode", pngBytes: source, message, compress: true });
  expect(prepared).toMatchObject({ ok: true, fits: true, compressionUsed: true });
  source.fill(0);
  const encoded = await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD + " changed" });
  expect(encoded.ok).toBe(true);
  expect(encoded).toMatchObject({
    originalBytes: 2800, storedBytes: 56, compressionUsed: true,
    maxStoredBytes: prepared.maxStoredBytes, hasFrameCapacity: true, fits: true,
    metadataNotice: prepared.metadataNotice,
  });
  expect(compressions).toBe(1);
  expect(encrypted.every(value => value === 0)).toBe(true);
  expect(await run({ action: "decode", pngBytes: encoded.pngBytes, password: PASSWORD + " changed" }))
    .toEqual({ ok: true, message });
});

it.each(["randomBytes", "hkdf", "ctr", "encrypt"])("releases consumed preparation after %s fails and permits a fresh operation", async method => {
  let failNext = true;
  const crypto = { ...nativeCrypto, [method](...args) {
    if (failNext) { failNext = false; throw new Error("private failure"); }
    return nativeCrypto[method](...args);
  } };
  const run = operation({ nativeCrypto: crypto });
  const prepare = () => run({ action: "prepareEncode", pngBytes: cover(), message: TEXT, compress: false });
  const first = await prepare();
  expect(await run({ action: "encode", preparation: first.preparation, password: PASSWORD }))
    .toMatchObject({ ok: false, code: "RESOURCE_FAILED" });
  expect(await run({ action: "encode", preparation: first.preparation, password: PASSWORD }))
    .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  const second = await prepare();
  const encoded = await run({ action: "encode", preparation: second.preparation, password: PASSWORD });
  expect(encoded.ok).toBe(true);
  expect(await run({ action: "decode", pngBytes: encoded.pngBytes, password: PASSWORD }))
    .toEqual({ ok: true, message: TEXT });
}, 30000);

it("returns no partial PNG on allocation failure after encryption and clears secret buffers", async () => {
  const held = [];
  let encrypted = false;
  const crypto = { ...nativeCrypto,
    async hkdf(root, info) {
      held.push(root);
      const child = await nativeCrypto.hkdf(root, info);
      held.push(child);
      return child;
    },
    async encrypt(key, nonce, bytes, aad) {
      const body = await nativeCrypto.encrypt(key, nonce, bytes, aad);
      encrypted = true;
      held.push(bytes);
      return body;
    },
  };
  const source = cover();
  const original = source.slice();
  const run = operation({ nativeCrypto: crypto, serialize() {
    expect(encrypted).toBe(true);
    throw new RangeError("private allocation failure");
  } });
  const prepared = await run({ action: "prepareEncode", pngBytes: source, message: TEXT, compress: false });
  const request = { action: "encode", preparation: prepared.preparation, password: PASSWORD };
  const result = await run(request);
  expect(result).toEqual({ ok: false, code: "RESOURCE_FAILED", error: expect.any(String) });
  expect(result.error).not.toContain("private");
  expect(Buffer.from(source).equals(Buffer.from(original))).toBe(true);
  expect(held.every(bytes => bytes.every(value => value === 0))).toBe(true);
  expect(await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
    .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
});

it("preserves source bytes, dimensions, alpha and approved rendering data through serialization", async () => {
  const image = admitPNG(cover());
  image.colorType = 6;
  image.rendering = { sRGB: Uint8Array.of(0) };
  const source = serializePNG(image);
  const original = source.slice();
  const run = operation();
  const prepared = await run({ action: "prepareEncode", pngBytes: source, message: TEXT, compress: false });
  const encoded = await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
  expect(encoded.ok).toBe(true);
  const output = admitPNG(encoded.pngBytes);
  expect([output.width, output.height, output.colorType]).toEqual([512, 512, 6]);
  expect(output.rendering).toEqual(image.rendering);
  let samplesPreserved = true;
  for (let i = 0; i < image.data.length; i++) {
    const mask = i % 4 === 3 ? 255 : 254;
    if ((output.data[i] & mask) !== (image.data[i] & mask)) samplesPreserved = false;
  }
  expect(samplesPreserved).toBe(true);
  expect(Buffer.from(source).equals(Buffer.from(original))).toBe(true);
  expect(await run({ action: "decode", pngBytes: encoded.pngBytes, password: PASSWORD }))
    .toEqual({ ok: true, message: TEXT });
});

it("encodes empty wire text in an empty-only carrier", async () => {
  const run = operation();
  const prepared = await run({ action: "prepareEncode", pngBytes: cover(256, 168), message: "", compress: false });
  expect(prepared).toMatchObject({ ok: true, hasFrameCapacity: true, maxStoredBytes: 0, fits: true });
  const result = await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
  expect(result.ok).toBe(true);
  expect(await run({ action: "decode", pngBytes: result.pngBytes, password: PASSWORD })).toEqual({ ok: true, message: "" });
});

it.each(["a".repeat(1024), "é".repeat(512)])("encodes maximum image, stored bytes and exact password boundary %#", async password => {
  const run = operation();
  const message = "x".repeat(512);
  const prepared = await run({ action: "prepareEncode", pngBytes: cover(1024, 1024), message, compress: false });
  expect(prepared).toMatchObject({ ok: true, storedBytes: 512, maxStoredBytes: 512, fits: true });
  const result = await run({ action: "encode", preparation: prepared.preparation, password });
  expect(result.ok).toBe(true);
  expect(await run({ action: "decode", pngBytes: result.pngBytes, password })).toEqual({ ok: true, message });
}, 30000);

it("refuses maximum original text before randomness when it cannot fit", async () => {
  let randomness = 0;
  const run = operation({ nativeCrypto: { ...nativeCrypto, randomBytes() { randomness++; throw new Error("must not run"); } } });
  const prepared = await run({ action: "prepareEncode", pngBytes: cover(1024, 1024), message: "x".repeat(1048576), compress: false });
  expect(prepared).toMatchObject({ ok: true, originalBytes: 1048576, fits: false });
  expect(await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD }))
    .toMatchObject({ ok: false, code: "CAPACITY" });
  expect(randomness).toBe(0);
}, 30000);

it("uses fresh salt and nonce on each complete encode attempt", async () => {
  const generated = [];
  const run = operation({ nativeCrypto: { ...nativeCrypto, randomBytes(length) {
    const value = nativeCrypto.randomBytes(length);
    generated.push(value.slice());
    return value;
  } } });
  for (let attempt = 0; attempt < 2; attempt++) {
    const prepared = await run({ action: "prepareEncode", pngBytes: cover(), message: TEXT, compress: false });
    const result = await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
    expect(result.ok).toBe(true);
    expect(await run({ action: "decode", pngBytes: result.pngBytes, password: PASSWORD })).toEqual({ ok: true, message: TEXT });
  }
  expect(generated.map(bytes => bytes.length)).toEqual([16, 12, 16, 12]);
  expect(generated[0]).not.toEqual(generated[2]);
  expect(generated[1]).not.toEqual(generated[3]);
});

it("strips admitted personal metadata while preserving supported rendering chunks", async () => {
  const source = Uint8Array.from(exportFixture({ width: 512, height: 512, colorType: 6 }).bytes);
  const original = source.slice();
  const run = operation();
  const prepared = await run({ action: "prepareEncode", pngBytes: source, message: TEXT, compress: false });
  expect(prepared).toMatchObject({ ok: true, fits: true });
  const result = await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
  expect(result.ok).toBe(true);
  const chunks = parseChunks(result.pngBytes);
  expect(chunks.filter(chunk => !["IHDR", "IDAT", "IEND"].includes(chunk.type)).map(chunk => chunk.type).sort())
    .toEqual(["cHRM", "gAMA", "sRGB"]);
  expect(admitPNG(result.pngBytes).rendering).toEqual(admitPNG(source).rendering);
  expect(Buffer.from(source).equals(Buffer.from(original))).toBe(true);
  expect(await run({ action: "decode", pngBytes: result.pngBytes, password: PASSWORD })).toEqual({ ok: true, message: TEXT });
});
