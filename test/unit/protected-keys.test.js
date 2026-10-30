import { jest } from "@jest/globals";
import { webcrypto } from "node:crypto";
import { deriveKeys, createPositionSource } from "../../lib/protected-keys.js";
import { nativeCrypto as nodeCrypto } from "../../lib/protected-native-node.js";
import { nativeCrypto as browserCrypto } from "../../lib/protected-native-browser.js";

// KEY-POSITIONS: fixed public vectors from the accepted password-device-cost
// experiment at acec5c4, results/node-vectors.json, a64t3. Its root was checked
// against independent Noble Argon2id; child keys against Noble HKDF; positions
// against a dense swap-with-last reference. No expected value uses this module.
const bytes = value => Uint8Array.from(Buffer.from(value, "hex"));
const hex = value => Buffer.from(value).toString("hex");
const password = bytes("204f6273637220636166c3a92065cc8120f09f949020");
const salt = bytes("000102030405060708090a0b0c0d0e0f");
const rootHex = "adc50138bc654242c87e374011a4c26cb711c4026386ef52c6f104294f7e6e3b";
const encryptionHex = "682938eea4a91099fc270cb35bbfa8a398d9aeb85c677a734a934b7f6d9958a0";
const placementHex = "5c65e3bc7613b2cebd56c0a65752f216e03226dc0adcfc0ac2a9d77981a2f2ee";
const streamHex = "798ce672fa7ec18ceeece9fd72348c315931c0906d6a8baa7a36c60bbe7f5f75e1de7e4e9766c469ea3c2cd71ffdfe50d2d57f91fc9d32e361038afc7249b0fd12386df0b70250ede845c760214be85027f2ec0ae58d7e7993aa450769935c62a1033eb31b1f2352d04c85e365dc8b2ff1f2bf753b82a5e723398f0c414eee4e";
const positions = [3193, 1321, 3210, 6660, 2977, 5213, 3084, 4669, 897, 3632, 4034, 7761, 6710, 4116, 4135, 3047, 2786, 6217, 5284, 4506, 2687, 7508, 3553, 6358];
const domain = length => Uint32Array.from({ length }, (_, i) => i);
const take = async (source, count) => {
  const result = [];
  for (let i = 0; i < count; i++) result.push(await source.next());
  return result;
};
const wordAdapter = wordAt => {
  let wordIndex = 0;
  return { ctr: jest.fn(async (_key, _counter, zeros) => {
    const result = new Uint8Array(zeros.length);
    const view = new DataView(result.buffer);
    for (let i = 0; i < result.length; i += 4) view.setUint32(i, wordAt(wordIndex++), true);
    return result;
  }) };
};

const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, "crypto");
beforeAll(() => {
  // This exercises the browser adapter through Node's WebCrypto, not a browser run.
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: webcrypto });
});

afterAll(() => {
  if (originalCrypto) Object.defineProperty(globalThis, "crypto", originalCrypto);
  else delete globalThis.crypto;
});

describe.each([["Node", nodeCrypto], ["WebCrypto", browserCrypto]])("KEY-POSITIONS %s", (_name, native) => {
  it("derives the fixed root once and both independently anchored child keys", async () => {
    const roots = [];
    const labels = [];
    const references = [];
    const adapter = { ...native, hkdf: async (root, info) => {
      roots.push(hex(root));
      labels.push(new TextDecoder().decode(info));
      references.push(root);
      return native.hkdf(root, info);
    } };
    const keys = await deriveKeys(password, salt, adapter);
    expect(roots).toEqual([rootHex, rootHex]);
    expect(references[0]).toBe(references[1]);
    expect(references[0].every(value => value === 0)).toBe(true);
    expect(labels).toEqual(["obscr/keys/1/encryption", "obscr/keys/1/placement"]);
    expect(hex(keys.encryption)).toBe(encryptionHex);
    expect(hex(keys.placement)).toBe(placementHex);
    expect(hex(password)).toBe("204f6273637220636166c3a92065cc8120f09f949020");
    keys.encryption.fill(0);
    keys.placement.fill(0);
  });

  it("matches the independent stream and full-width position trace", async () => {
    const key = bytes(placementHex);
    expect(hex(await native.ctr(key, new Uint8Array(16), new Uint8Array(128)))).toBe(streamHex);
    const source = await createPositionSource(domain(8192), key, native);
    source.setLimit(24);
    expect(await take(source, 24)).toEqual(positions);
    await expect(source.next()).rejects.toThrow();
    source.clear();
  });

  it("increments all 128 counter bits and rejects wrap before producing output", async () => {
    // Same published experiment: native cross-check of carry beyond bit 63.
    const key = bytes("603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4");
    const counter = bytes("0000000000000000ffffffffffffffff");
    expect(hex(await native.ctr(key, counter, new Uint8Array(48))))
      .toBe("289e23e13ec8c34291f27c4ccf3eaa29579be1a0d892238805feb810a4a10aaa51ffb50816f5e9fa954d2604f081f8dc");
    expect(hex(counter)).toBe("0000000000000000ffffffffffffffff");
    await expect(native.ctr(key, new Uint8Array(16).fill(255), new Uint8Array(16))).resolves.toHaveLength(16);
    await expect(native.ctr(key, new Uint8Array(16).fill(255), new Uint8Array(17))).rejects.toThrow();
    await expect(native.ctr(key, counter, new Uint8Array(4097))).rejects.toThrow();
  });

  it("authenticates the accepted exact GCM serialization without partial output", async () => {
    // https://github.com/jdragulanescu/obscr/issues/19#issuecomment-6387228703
    const key = bytes("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
    const nonce = bytes("a0a1a2a3a4a5a6a7a8a9aaab");
    const aad = bytes("000102030405060708090a0b0c0d0e0fa0a1a2a3a4a5a6a7a8a9aaab00000002000000021001000101010100000000000000040000000400");
    const body = bytes("ae718862b4a46f027f90688844858e705203");
    expect(hex(await native.decrypt(key, nonce, body, aad))).toBe("4869");
    for (const input of [body.slice(0, -1), body.map((value, i) => i === 0 ? value ^ 1 : value)]) {
      await expect(native.decrypt(key, nonce, input, aad)).rejects.not.toHaveProperty("code", "RESOURCE_FAILED");
    }
    const alteredAAD = aad.slice();
    alteredAAD[55] ^= 1;
    await expect(native.decrypt(key, nonce, body, alteredAAD)).rejects.toThrow();
    await expect(native.decrypt(key, nonce, body.slice(0, 15), aad)).rejects.toThrow();
  });
});

it("does not normalize, trim, fold case, or reuse keys across salt/password changes", async () => {
  const encoder = new TextEncoder();
  const inputs = ["é", "e\u0301", " A ", "A", "a", "\uFEFFA\r\n"];
  const fingerprints = [];
  for (const input of inputs) {
    const key = await deriveKeys(encoder.encode(input), salt, nodeCrypto);
    fingerprints.push(hex(key.encryption) + hex(key.placement));
    key.encryption.fill(0);
    key.placement.fill(0);
  }
  const changedSalt = salt.slice();
  changedSalt[15] ^= 1;
  const changed = await deriveKeys(password, changedSalt, nodeCrypto);
  expect(hex(changed.encryption)).not.toBe(encryptionHex);
  expect(hex(changed.placement)).not.toBe(placementHex);
  expect(new Set(fingerprints).size).toBe(inputs.length);
  changed.encryption.fill(0);
  changed.placement.fill(0);
}, 30000);

it("clears the root and first child if the second native derivation fails", async () => {
  let root;
  let encryption;
  let calls = 0;
  await expect(deriveKeys(password, salt, { hkdf: async (value, info) => {
    root = value;
    if (++calls === 2) throw new Error("unavailable");
    encryption = await nodeCrypto.hkdf(value, info);
    return encryption;
  } })).rejects.toMatchObject({ code: "RESOURCE_FAILED" });
  expect(root.every(value => value === 0)).toBe(true);
  expect(encryption.every(value => value === 0)).toBe(true);
});

it("rejects missing native capabilities and invalid byte inputs", async () => {
  await expect(deriveKeys(password, salt, {})).rejects.toMatchObject({ code: "RESOURCE_FAILED" });
  for (const value of [new Uint8Array(), new Uint8Array(1025), "password"]) {
    await expect(deriveKeys(value, salt, nodeCrypto)).rejects.toThrow();
  }
  await expect(deriveKeys(password, new Uint8Array(15), nodeCrypto)).rejects.toThrow();
  await expect(createPositionSource(domain(3), bytes(placementHex), {})).rejects.toMatchObject({ code: "RESOURCE_FAILED" });
  await expect(createPositionSource(domain(786433), bytes(placementHex), nodeCrypto)).rejects.toThrow();
  await expect(createPositionSource(domain(3), new Uint8Array(31), nodeCrypto)).rejects.toThrow();
});

it("reports absent WebCrypto as a resource failure, including decryption", async () => {
  const previous = globalThis.crypto;
  try {
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });
    await expect(browserCrypto.hkdf(bytes(rootHex), new Uint8Array())).rejects.toMatchObject({ code: "RESOURCE_FAILED" });
    await expect(browserCrypto.ctr(bytes(placementHex), new Uint8Array(16), new Uint8Array(16))).rejects.toMatchObject({ code: "RESOURCE_FAILED" });
    await expect(browserCrypto.decrypt(bytes(encryptionHex), new Uint8Array(12), new Uint8Array(16), new Uint8Array())).rejects.toMatchObject({ code: "RESOURCE_FAILED" });
  } finally {
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: previous });
  }
});

it("rejects biased words and applies sparse swaps in the supplied eligible order", async () => {
  // Worked trace: reject 2^32-1 for bound 3; select index 1; then index 1;
  // then index 0. Scalar 9 is excluded from the supplied canonical domain.
  const adapter = wordAdapter(index => [0xffffffff, 1, 0xffffffff, 0][index] ?? 0);
  const source = await createPositionSource(Uint32Array.of(2, 7, 13), bytes(placementHex), adapter);
  source.setLimit(3);
  expect(await take(source, 3)).toEqual([7, 13, 2]);
  expect(adapter.ctr).toHaveBeenCalledTimes(1);
  await expect(source.next()).rejects.toThrow();
  source.clear();
});

it("consumes a singleton draw and exhausts non-power-of-two domains uniquely", async () => {
  const adapter = wordAdapter(() => 0xffffffff);
  const singleton = await createPositionSource(Uint32Array.of(37), bytes(placementHex), adapter);
  expect(await singleton.next()).toBe(37);
  expect(adapter.ctr).toHaveBeenCalledTimes(1);
  await expect(singleton.next()).rejects.toThrow();
  singleton.clear();
  const source = await createPositionSource(domain(37), bytes(placementHex), nodeCrypto);
  source.setLimit(37);
  expect((await take(source, 37)).sort((a, b) => a - b)).toEqual(Array.from(domain(37)));
  source.clear();
});

it("uses the full domain, not the position or 262144-sample budget", async () => {
  const source = await createPositionSource(domain(786432), bytes(placementHex), wordAdapter(() => 786431));
  source.setLimit(1);
  expect(await source.next()).toBe(786431);
  source.clear();
});

it("preserves leftover stream bytes across the prefix and 4096-byte boundary", async () => {
  const calls = [];
  const retained = [];
  const adapter = { ctr: async (key, counter, zeros) => {
    calls.push({ key: hex(key), counter: hex(counter), length: zeros.length });
    const result = await nodeCrypto.ctr(key, counter, zeros);
    retained.push(result);
    return result;
  } };
  const source = await createPositionSource(domain(32768), bytes(placementHex), adapter);
  const prefix = await take(source, 896);
  expect(calls).toHaveLength(1);
  source.setLimit(2049);
  const suffix = await take(source, 1153);
  expect(calls).toEqual([
    { key: placementHex, counter: "00000000000000000000000000000000", length: 4096 },
    { key: placementHex, counter: "00000000000000000000000000000100", length: 4096 },
    { key: placementHex, counter: "00000000000000000000000000000200", length: 4096 },
  ]);
  const uninterrupted = await createPositionSource(domain(32768), bytes(placementHex), nodeCrypto);
  uninterrupted.setLimit(2049);
  expect(prefix.concat(suffix)).toEqual(await take(uninterrupted, 2049));
  source.clear();
  uninterrupted.clear();
  expect(retained.every(chunk => chunk.every(value => value === 0))).toBe(true);
});

it("enforces the fixed prefix and exact total position ceilings", async () => {
  const source = await createPositionSource(domain(20000), bytes(placementHex), wordAdapter(() => 0));
  await take(source, 896);
  await expect(source.next()).rejects.toThrow();
  source.clear();
  const maximum = await createPositionSource(domain(20000), bytes(placementHex), wordAdapter(() => 0));
  for (const limit of [-1, 0.5, 11649, NaN]) expect(() => maximum.setLimit(limit)).toThrow();
  maximum.setLimit(11648);
  expect(new Set(await take(maximum, 11648)).size).toBe(11648);
  await expect(maximum.next()).rejects.toThrow();
  maximum.clear();
});

it("counts rejected draws against the prefix ceiling and does not reset after setLimit", async () => {
  const stuck = wordAdapter(index => index === 2816 ? 0 : 0xffffffff);
  const source = await createPositionSource(domain(30001), bytes(placementHex), stuck);
  await expect(source.next()).rejects.toThrow();
  expect(stuck.ctr).toHaveBeenCalledTimes(3); // 2816 draws, not a fourth chunk.
  source.clear();
  const finalDraw = await createPositionSource(domain(30001), bytes(placementHex),
    wordAdapter(index => index === 2815 ? 0 : 0xffffffff));
  expect(await finalDraw.next()).toBe(0);
  finalDraw.clear();
  // 1920 rejected words plus 896 accepted words consume the entire prefix cap.
  const adapter = wordAdapter(index => index < 1920 || (index >= 2816 && index < 2818) ? 0xffffffff : 0);
  const cumulative = await createPositionSource(domain(30001), bytes(placementHex), adapter);
  await take(cumulative, 896);
  cumulative.setLimit(897); // permits only two more draws, not a fresh budget.
  await expect(cumulative.next()).rejects.toThrow();
  expect(adapter.ctr).toHaveBeenCalledTimes(3);
  cumulative.clear();
});

it("clears retained secrets and closes a source while native work is pending", async () => {
  let resolve;
  const key = bytes(placementHex);
  const result = new Uint8Array(4096).fill(1);
  const source = await createPositionSource(domain(3), key, { ctr: () => new Promise(done => { resolve = done; }) });
  const pending = source.next();
  source.clear();
  resolve(result);
  await expect(pending).rejects.toThrow();
  expect(result.every(value => value === 0)).toBe(true);
  expect(key.every(value => value === 0)).toBe(true);
  await expect(source.next()).rejects.toThrow();
  expect(() => source.setLimit(2)).toThrow();
  source.clear();
});

it("does no stream work for zero demand and cannot renegotiate a parsed budget", async () => {
  const adapter = wordAdapter(() => 0);
  const empty = await createPositionSource(domain(3), bytes(placementHex), adapter);
  empty.setLimit(0);
  await expect(empty.next()).rejects.toThrow();
  expect(adapter.ctr).not.toHaveBeenCalled();
  expect(() => empty.setLimit(3)).toThrow();
  empty.clear();
  const source = await createPositionSource(domain(3), bytes(placementHex), adapter);
  expect(await source.next()).toBe(0);
  expect(() => source.setLimit(0)).toThrow();
  expect(() => source.setLimit(4)).toThrow();
  source.setLimit(3);
  expect(await take(source, 2)).toEqual([2, 1]);
  source.clear();
});

it("rejects unavailable or malformed native streams and clears their output", async () => {
  for (const ctr of [
    async () => { throw new Error("native unavailable"); },
    async () => new Uint8Array(4095).fill(1),
  ]) {
    const key = bytes(placementHex);
    let output;
    const source = await createPositionSource(domain(3), key, { ctr: async (...args) => {
      output = await ctr(...args);
      return output;
    } });
    await expect(source.next()).rejects.toMatchObject({ code: "RESOURCE_FAILED" });
    expect(key.every(value => value === 0)).toBe(true);
    if (output) expect(output.every(value => value === 0)).toBe(true);
    await expect(source.next()).rejects.toThrow();
  }
});

it("requires WebAssembly even after a previous successful Sodium initialization", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "WebAssembly");
  const hkdf = jest.fn();
  try {
    Object.defineProperty(globalThis, "WebAssembly", { configurable: true, value: undefined });
    await expect(deriveKeys(password, salt, { hkdf })).rejects.toMatchObject({ code: "RESOURCE_FAILED" });
    expect(hkdf).not.toHaveBeenCalled();
  } finally {
    if (original) Object.defineProperty(globalThis, "WebAssembly", original);
    else delete globalThis.WebAssembly;
  }
});

it("enforces the final cumulative 24320-draw boundary without restarting the stream", async () => {
  // Fixed accepted format maximum k=11648. These public words consume the full
  // prefix, then put the next accepted word exactly at, or beyond, final budget.
  for (const finalAccepted of [24319, 24320]) {
    const adapter = wordAdapter(index => index < 1920 || (index >= 2816 && index < finalAccepted) ? 0xffffffff : 0);
    const source = await createPositionSource(domain(30001), bytes(placementHex), adapter);
    try {
      await take(source, 896); // 1920 rejected + 896 accepted = 2816 draws.
      source.setLimit(11648);
      if (finalAccepted === 24319) expect(await source.next()).toBe(29105);
      else await expect(source.next()).rejects.toThrow();
      expect(adapter.ctr).toHaveBeenCalledTimes(24);
    } finally { source.clear(); }
  }
});
