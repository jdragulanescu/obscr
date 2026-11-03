import { gzipSync } from "node:zlib";
import { createProtectedImage } from "../../lib/protected-image.js";
import { nativeCrypto as nodeCrypto } from "../../lib/protected-native-node.js";
import { nativeCrypto as browserCrypto } from "../../lib/protected-native-browser.js";
import { admitPNG } from "../../lib/png.js";
import { referenceCoverPNG, referencePNG, PASSWORD, TEXT } from "../fixtures/protected-reference.js";

// PROTECTED-OPERATION: fixed public randomness is a private dependency, never
// a request option. Expected samples come only from the independent fixture.
function operation(nativeCrypto) {
  const execute = createProtectedImage({ nativeCrypto: {
    ...nativeCrypto,
    randomBytes(length) {
      return Uint8Array.from({ length }, (_, i) => length === 16 ? i : 0xa0 + i);
    },
  } });
  let id = 0;
  return fields => execute({ id: ++id, generation: 1, ...fields });
}

async function compare(run, message, compress = false, colorType = 2) {
  const options = { width: 600, height: 600, colorType };
  const source = referenceCoverPNG(options);
  const unchanged = source.slice();
  const prepared = await run({ action: "prepareEncode", pngBytes: source, message, compress });
  expect(prepared).toMatchObject({ ok: true, fits: true });
  const result = await run({ action: "encode", preparation: prepared.preparation, password: PASSWORD });
  expect(result.ok).toBe(true);
  const actual = admitPNG(result.pngBytes);
  const raw = new TextEncoder().encode(message);
  const compressed = compress ? Uint8Array.from(gzipSync(raw, { level: 6 })) : null;
  if (compressed) compressed[9] = 255; // Fixed format OS byte, independent native zlib.
  const useGzip = compressed !== null && compressed.length < raw.length;
  const expected = admitPNG(await referencePNG({
    ...options, text: message, compression: useGzip ? 1 : 0,
    storedBytes: useGzip ? compressed : raw, originalLength: raw.length,
  }));
  // Equality covers salt locations, continuous full-domain placement, all header
  // fields/AAD, parity/interleave, canonical padding and untouched filler samples.
  expect(Buffer.from(actual.data).equals(Buffer.from(expected.data))).toBe(true);
  expect([actual.width, actual.height, actual.colorType]).toEqual([600, 600, colorType]);
  expect(Buffer.from(source).equals(Buffer.from(unchanged))).toBe(true);
  return { result, prepared, actual, source };
}

it.each([["Node", nodeCrypto], ["browser-compatible", browserCrypto]])(
  "%s output matches independent complete-image expectations for raw and gzip exact text",
  async (_name, crypto) => {
    const run = operation(crypto);
    for (const [text, compress, colorType] of [[TEXT, false, 2], [TEXT.repeat(60), true, 6], [" \t\r\n", false, 6]]) {
      const { result } = await compare(run, text, compress, colorType);
      expect(await run({ action: "decode", pngBytes: result.pngBytes, password: PASSWORD }))
        .toEqual({ ok: true, message: text });
    }
  }, 30000,
);

it("matches independent samples for every stored length, including all block and padding boundaries", async () => {
  const run = operation(nodeCrypto);
  // The 600-square cover has E > 262144. A writer that truncates the sampled
  // domain to B, resets the stream, or writes filler cannot match these images.
  for (let stored = 0; stored <= 512; stored++) {
    await compare(run, "x".repeat(stored));
  }
}, 300000);

it("preserves all alpha and upper RGB bits while changing only carrier LSBs", async () => {
  const { actual, source } = await compare(operation(nodeCrypto), "x".repeat(512), false, 6);
  const original = admitPNG(source);
  let changed = 0;
  for (let i = 0; i < actual.data.length; i++) {
    if (i % 4 === 3) {
      if (actual.data[i] !== original.data[i]) throw new Error(`Alpha changed at ${i}`);
    } else {
      if ((actual.data[i] & 254) !== (original.data[i] & 254)) throw new Error(`Upper RGB changed at ${i}`);
      if (actual.data[i] !== original.data[i]) changed++;
    }
  }
  expect(changed).toBeGreaterThan(0);
  expect(changed).toBeLessThanOrEqual(128 + 1664);
}, 30000);
