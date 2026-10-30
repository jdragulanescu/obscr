import { jest } from "@jest/globals";
import inflater from "pako/lib/zlib/inflate.js";
import { createProtectedImage } from "../../lib/protected-image.js";
import { nativeCrypto } from "../../lib/protected-native-node.js";
import { referencePNG, PASSWORD } from "../fixtures/protected-reference.js";

const hidden = "Could not recover an authenticated message. The password may be wrong, or the image may be damaged or changed.";

it("PROTECTED-PROOF-01: failed GCM does no payload decompression; successful authentication precedes real gzip work", async () => {
  const message = "Public authenticated gzip 日本 ".repeat(100);
  const good = await referencePNG({ text: message, compression: 1 });
  const bad = await referencePNG({ text: message, compression: 1, damage: { tagBytes: [{ offset: 0 }] } });
  const events = [];
  const gzipStreams = new WeakSet();
  const init = inflater.inflateInit2;
  const inflate = inflater.inflate;
  const initSpy = jest.spyOn(inflater, "inflateInit2").mockImplementation((stream, bits) => {
    // PNG admission also inflates, with windowBits=15. Only the authenticated
    // payload's gzip decoder uses 31. A positive control proves this observer.
    if (bits === 31) { events.push("gzip init"); gzipStreams.add(stream); }
    return init(stream, bits);
  });
  const workSpy = jest.spyOn(inflater, "inflate").mockImplementation((stream, flush) => {
    if (gzipStreams.has(stream)) events.push("gzip work");
    return inflate(stream, flush);
  });
  const crypto = { ...nativeCrypto, async decrypt(...args) {
    events.push("GCM start");
    try {
      const bytes = await nativeCrypto.decrypt(...args);
      events.push("GCM accepted");
      return bytes;
    } catch (error) { events.push("GCM rejected"); throw error; }
  } };
  const execute = createProtectedImage({ nativeCrypto: crypto });
  try {
    expect(await execute({ action: "decode", id: 1, generation: 1, pngBytes: bad, password: PASSWORD }))
      .toEqual({ ok: false, code: "RECOVERY_FAILED", error: hidden });
    expect(events).toEqual(["GCM start", "GCM rejected"]);
    events.length = 0;
    expect(await execute({ action: "decode", id: 2, generation: 1, pngBytes: good, password: PASSWORD }))
      .toEqual({ ok: true, message });
    expect(events.slice(0, 3)).toEqual(["GCM start", "GCM accepted", "gzip init"]);
    expect(events.slice(3).length).toBeGreaterThan(0);
    expect(events.slice(3).every(event => event === "gzip work")).toBe(true);
  } finally { initSpy.mockRestore(); workSpy.mockRestore(); }
}, 30000);

it("PROTECTED-PROOF-02: maximum complete recovery respects allocations, salt/KDF/repair/GCM attempts and stream ownership", async () => {
  // Generate before instrumenting: the independent reference is not part of the
  // implementation's allocation/attempt budget, nor is Sodium initialization.
  const pngBytes = await referencePNG({ width: 1024, height: 1024, text: "x".repeat(512), colorType: 6 });
  const { default: sodium } = await import("libsodium-wrappers-sumo");
  await sodium.ready;
  const { repair } = await import("../../lib/protected-repair.js");
  const { observeAllocations } = await import("../fixtures/protected-observation.js");
  const pwhash = sodium.crypto_pwhash;
  const attempts = [];
  const kdf = jest.spyOn(sodium, "crypto_pwhash").mockImplementation((...args) => {
    attempts.push({ output: args[0], salt: Array.from(args[2]), ops: args[3], memory: args[4], algorithm: args[5] });
    return pwhash(...args);
  });
  const repairs = [];
  const gcmBodies = [];
  let previousStream;
  let zerosBuffer;
  let counter = 0n;
  let chunks = 0;
  let pairedBytes = 0;
  const crypto = { ...nativeCrypto,
    async ctr(key, currentCounter, zeros) {
      if (previousStream) expect(previousStream.every(byte => byte === 0)).toBe(true);
      if (zerosBuffer) expect(zeros).toBe(zerosBuffer);
      zerosBuffer = zeros;
      expect(BigInt("0x" + Buffer.from(currentCounter).toString("hex"))).toBe(counter);
      counter += 256n;
      const output = await nativeCrypto.ctr(key, currentCounter, zeros);
      pairedBytes = Math.max(pairedBytes, zeros.byteLength + output.byteLength);
      previousStream = output;
      chunks++;
      return output;
    },
    decrypt(key, nonce, body, aad) { gcmBodies.push(body.length); return nativeCrypto.decrypt(key, nonce, body, aad); },
  };
  const observation = observeAllocations();
  const execute = createProtectedImage({ nativeCrypto: crypto, repairCodeword(word) {
    repairs.push(word.length);
    return repair(word);
  } });
  try {
    const result = await execute({ action: "decode", id: 1, generation: 1, pngBytes, password: PASSWORD }, stage => {
      if (stage === "deriving keys") observation.stopSalt();
    });
    expect(result).toEqual({ ok: true, message: "x".repeat(512) });
    expect(observation.allocations.Uint16Array).toEqual([2097152]);
    expect(observation.allocations.Uint32Array.filter(size => size >= 12196)).toEqual([12196, 3145728]);
    expect(observation.allocations.Uint8Array.filter(size => size >= 4194304)).toEqual([4195328, 4194304]);
    expect(observation.allocations.Uint8Array.filter(size => size === 576)).toHaveLength(1);
    expect(observation.saltReads).toEqual(Array.from({ length: 128 }, (_, i) => i * 32768));
    expect(attempts).toEqual([{ output: 32, salt: Array.from({ length: 16 }, (_, i) => i), ops: 3, memory: 67108864, algorithm: 2 }]);
    expect(repairs).toEqual([48, 255, 255, 66]);
    expect(repairs.reduce((sum, length) => sum + length, 0)).toBe(624);
    expect(gcmBodies).toEqual([528]);
    expect(observation.maps).toHaveLength(1);
    expect(observation.maps[0].peak).toBeGreaterThan(896);
    expect(observation.maps[0].peak).toBeLessThanOrEqual(11648);
    expect(observation.maps[0].size).toBe(0);
    expect(chunks).toBeLessThanOrEqual(24);
    expect(pairedBytes).toBe(8192);
    expect(previousStream.every(byte => byte === 0)).toBe(true);
    expect(zerosBuffer.every(byte => byte === 0)).toBe(true);
  } finally { observation.restore(); kdf.mockRestore(); }
}, 30000);
