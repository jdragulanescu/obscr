import { createProtectedImage } from "../../lib/protected-image.js";
import { nativeCrypto } from "../../lib/protected-native-node.js";
import { cover } from "../fixtures/protected.js";
import { referencePNG, referenceGzip, PASSWORD, TEXT } from "../fixtures/protected-reference.js";
import { admitPNG, serializePNG } from "../../lib/png.js";

const hidden = "Could not recover an authenticated message. The password may be wrong, or the image may be damaged or changed.";
function operation(crypto = nativeCrypto) {
  const execute = createProtectedImage({ nativeCrypto: crypto });
  let id = 0;
  return (fields, progress) => execute({ action: "decode", id: ++id, generation: 1, ...fields }, progress);
}

it("recovers exact independently encoded raw text only after authentication", async () => {
  const decode = operation();
  const stages = [];
  expect(await decode({ pngBytes: await referencePNG(), password: PASSWORD }, stage => stages.push(stage)))
    .toEqual({ ok: true, message: TEXT });
  expect(stages).toEqual(["checking inputs", "deriving keys", "recovering", "preparing result"]);
});

it("rejects invalid credentials and request overrides before key work", async () => {
  const decode = operation({ hkdf() { throw new Error("must not derive"); } });
  for (const password of [undefined, "", "\ud800", "\udc00", "a".repeat(1025), "é".repeat(513)]) {
    const result = await decode({ pngBytes: cover(), password });
    expect(result.ok).toBe(false);
    expect(["INPUT_INVALID", "INPUT_LIMIT"]).toContain(result.code);
    expect(result).not.toHaveProperty("message");
  }
  expect(await decode({ pngBytes: cover(), password: "public", profile: 0 }))
    .toMatchObject({ ok: false, code: "INPUT_INVALID" });
});

it("keeps public PNG and no-capacity refusal distinct from hidden failures", async () => {
  const decode = operation();
  expect(await decode({ pngBytes: new Uint8Array([1]), password: PASSWORD }))
    .toMatchObject({ ok: false, code: "PNG_INVALID" });
  expect(await decode({ pngBytes: cover(1, 1), password: PASSWORD }))
    .toMatchObject({ ok: false, code: "CAPACITY" });
});

it("returns no text for a wrong password and recovers successfully afterward", async () => {
  const decode = operation();
  expect(await decode({ pngBytes: await referencePNG(), password: PASSWORD + "wrong" }))
    .toEqual({ ok: false, code: "RECOVERY_FAILED", error: hidden });
  expect(await decode({ pngBytes: await referencePNG(), password: PASSWORD }))
    .toEqual({ ok: true, message: TEXT });
});


it.each([1, 7, 8])("repairs %i independently damaged bytes per header and body block", async count => {
  const offsets = Array.from({ length: count }, (_, offset) => ({ offset, xor: offset + 1 }));
  const damage = {
    headerBytes: offsets,
    bodyBytes: [0, 1, 2].flatMap(block => offsets.map(value => ({ block, ...value }))),
  };
  expect(await operation()({ pngBytes: await referencePNG({ text: "x".repeat(512), damage }), password: PASSWORD }))
    .toEqual({ ok: true, message: "x".repeat(512) });
}, 30000);

it.each([
  ["salt", { damage: { saltBits: [0] } }],
  ["nonce authenticated after repair", { damage: { headerAfterAuth: { 0: 0 } } }],
  ["tag", { damage: { tagBytes: [{ offset: 0 }] } }],
  ["header beyond repair", { damage: { headerBytes: Array.from({ length: 16 }, (_, offset) => ({ offset })) } }],
  ["body beyond repair", { damage: { bodyBytes: Array.from({ length: 16 }, (_, offset) => ({ block: 0, offset })) } }],
  ["body order", { text: "x".repeat(512), damage: { bodyOrder: "concatenate" } }],
  ["reversed blocks", { text: "x".repeat(512), damage: { bodyOrder: "reverse-blocks" } }],
  ["noncanonical padding", { text: "Hi", damage: { padding: true } }],
  ["stored length overflow", { headerOverrides: { 12: 1 } }],
  ["original length overflow", { originalLength: 1048577 }],
  ["raw unequal lengths", { originalLength: 1 }],
  ["invalid UTF-8", { storedBytes: Uint8Array.of(0xff) }],
  ...[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(offset =>
    [`header field ${offset}`, { headerOverrides: { [offset]: 255 } }]),
])("returns one hidden failure and no text for %s", async (_name, options) => {
  expect(await operation()({ pngBytes: await referencePNG(options), password: PASSWORD }))
    .toEqual({ ok: false, code: "RECOVERY_FAILED", error: hidden });
}, 30000);

it("authenticates before decompression and rejects malformed authenticated gzip without partial text", async () => {
  const original = new TextEncoder().encode("gzip public text ".repeat(100));
  const good = referenceGzip(original);
  const mutate = (offset, value) => { const bytes = good.slice(); bytes[offset] ^= value; return bytes; };
  const cases = [
    { bytes: mutate(3, 1) }, { bytes: mutate(4, 1) }, { bytes: mutate(8, 1) }, { bytes: mutate(9, 1) },
    { bytes: mutate(good.length - 8, 1) }, { bytes: mutate(good.length - 4, 1) },
    { bytes: good.subarray(0, good.length - 1) },
    { bytes: new Uint8Array([...good, 0]) },
    { bytes: new Uint8Array([...good, ...good]) },
    { bytes: good, length: original.length - 1 },
    { bytes: good, length: original.length + 1 },
  ];
  const decode = operation();
  for (const { bytes, length = original.length } of cases) {
    expect(await decode({ pngBytes: await referencePNG({ storedBytes: bytes, originalLength: length, compression: 1 }), password: PASSWORD }))
      .toEqual({ ok: false, code: "RECOVERY_FAILED", error: hidden });
  }
  expect(await decode({ pngBytes: await referencePNG({ storedBytes: good, originalLength: original.length, compression: 1 }), password: PASSWORD }))
    .toEqual({ ok: true, message: new TextDecoder().decode(original) });
}, 30000);

it("returns an explicit resource failure after derivation when native crypto becomes unavailable", async () => {
  const crypto = { ...nativeCrypto, decrypt() { throw Object.assign(new Error("private native failure"), { code: "RESOURCE_FAILED" }); } };
  const result = await operation(crypto)({ pngBytes: await referencePNG(), password: PASSWORD });
  expect(result).toMatchObject({ ok: false, code: "RESOURCE_FAILED" });
  expect(result).not.toHaveProperty("message");
  expect(result.error).not.toContain("private native");
});

it("preserves recovery through a sample-preserving RGB to RGBA rewrite but not changed geometry", async () => {
  const image = admitPNG(await referencePNG({ width: 512, height: 1024 }));
  image.colorType = 6;
  const decode = operation();
  expect(await decode({ pngBytes: serializePNG(image), password: PASSWORD })).toEqual({ ok: true, message: TEXT });
  image.width = 1024; image.height = 512;
  expect(await decode({ pngBytes: serializePNG(image), password: PASSWORD }))
    .toEqual({ ok: false, code: "RECOVERY_FAILED", error: hidden });
}, 30000);

it("bounds authenticated decompression while producing a large exact result", async () => {
  const message = "a".repeat(400000);
  const decode = operation();
  expect(await decode({ pngBytes: await referencePNG({ text: message, compression: 1 }), password: PASSWORD }))
    .toEqual({ ok: true, message });
  expect(await decode({ pngBytes: await referencePNG({ text: message, compression: 1, originalLength: 1000 }), password: PASSWORD }))
    .toEqual({ ok: false, code: "RECOVERY_FAILED", error: hidden });
}, 30000);

it("does not recognize a detailed plain image before the fixed derivation", async () => {
  let derivations = 0;
  let authentications = 0;
  const crypto = {
    ...nativeCrypto,
    hkdf(root, info) { derivations++; return nativeCrypto.hkdf(root, info); },
    decrypt(...args) { authentications++; return nativeCrypto.decrypt(...args); },
  };
  expect(await operation(crypto)({ pngBytes: cover(1024, 1024), password: PASSWORD }))
    .toEqual({ ok: false, code: "RECOVERY_FAILED", error: hidden });
  expect(derivations).toBe(2);
  expect(authentications).toBe(0);
});

it("performs one complete key schedule and one authentication at maximum stored size, then clears keys", async () => {
  const roots = [];
  const children = [];
  const streamBuffers = [];
  let authentications = 0;
  const crypto = {
    ...nativeCrypto,
    async hkdf(root, info) {
      roots.push(root);
      const key = await nativeCrypto.hkdf(root, info);
      children.push(key);
      return key;
    },
    async ctr(...args) {
      const output = await nativeCrypto.ctr(...args);
      streamBuffers.push(output);
      return output;
    },
    decrypt(...args) { authentications++; return nativeCrypto.decrypt(...args); },
  };
  expect(await operation(crypto)({ pngBytes: await referencePNG({ text: "x".repeat(512) }), password: PASSWORD }))
    .toEqual({ ok: true, message: "x".repeat(512) });
  expect(roots).toHaveLength(2);
  expect(roots[0]).toBe(roots[1]);
  expect(authentications).toBe(1);
  expect(streamBuffers.length).toBeLessThanOrEqual(24);
  expect(streamBuffers.every(bytes => bytes.length <= 4096)).toBe(true);
  expect([...roots, ...children, ...streamBuffers].every(bytes => bytes.every(value => value === 0))).toBe(true);
}, 30000);
