const MAX_POSITIONS = 11648;
const PREFIX_POSITIONS = 896;
const MAX_ELIGIBLE = 786432;
const CHUNK_BYTES = 4096;
const UINT32_RANGE = 0x100000000;

function resourceFailure() {
  return Object.assign(new Error("Protected cryptography is unavailable."), { code: "RESOURCE_FAILED" });
}

export async function deriveKeys(passwordBytes, salt, cryptoAdapter) {
  if (!(passwordBytes instanceof Uint8Array) || passwordBytes.length === 0 || passwordBytes.length > 1024 ||
      !(salt instanceof Uint8Array) || salt.length !== 16) throw new Error("Invalid key derivation input.");
  if (typeof cryptoAdapter?.hkdf !== "function") throw resourceFailure();
  if (typeof globalThis.WebAssembly?.instantiate !== "function" ||
      typeof globalThis.WebAssembly?.Memory !== "function") throw resourceFailure();
  let root;
  let encryption;
  let placement;
  try {
    // Preparation must not load WASM or need cryptography. Import only when the
    // one fixed-profile derivation is requested; never cache roots or child keys.
    const { default: sodium } = await import("libsodium-wrappers-sumo");
    await sodium.ready;
    if (typeof sodium.crypto_pwhash !== "function" || sodium.crypto_pwhash_ALG_ARGON2ID13 !== 2) {
      throw resourceFailure();
    }
    // Sodium's raw Argon2id13 API fixes v19, p=1, and empty secret/AD.
    root = sodium.crypto_pwhash(32, passwordBytes, salt, 3, 67108864, sodium.crypto_pwhash_ALG_ARGON2ID13);
    if (!(root instanceof Uint8Array) || root.length !== 32) throw resourceFailure();
    const encoder = new TextEncoder();
    encryption = await cryptoAdapter.hkdf(root, encoder.encode("obscr/keys/1/encryption"));
    if (!(encryption instanceof Uint8Array) || encryption.length !== 32) throw resourceFailure();
    placement = await cryptoAdapter.hkdf(root, encoder.encode("obscr/keys/1/placement"));
    if (!(placement instanceof Uint8Array) || placement.length !== 32) throw resourceFailure();
    return { encryption, placement };
  } catch {
    encryption?.fill?.(0);
    placement?.fill?.(0);
    throw resourceFailure();
  } finally {
    root?.fill?.(0);
  }
}

export async function createPositionSource(eligible, placement, cryptoAdapter) {
  if (!(eligible instanceof Uint32Array) || eligible.length === 0 || eligible.length > MAX_ELIGIBLE ||
      !(placement instanceof Uint8Array) || placement.length !== 32) throw new Error("Invalid placement input.");
  if (typeof cryptoAdapter?.ctr !== "function") throw resourceFailure();

  // eligible is the caller's canonical domain, already excluding salt samples.
  // Keep it intact: only selected indices need sparse swap entries.
  const swaps = new Map();
  const counter = new Uint8Array(16);
  const zeros = new Uint8Array(CHUNK_BYTES);
  let stream;
  let view;
  let offset = 0;
  let remaining = eligible.length;
  let emitted = 0;
  let draws = 0;
  let positionLimit = Math.min(PREFIX_POSITIONS, remaining);
  let drawLimit = 2 * PREFIX_POSITIONS + 1024;
  let limitSet = false;
  let exhaustedCounter = false;
  let closed = false;
  let pending = false;

  function clear() {
    closed = true;
    placement.fill(0);
    counter.fill(0);
    zeros.fill(0);
    stream?.fill(0);
    stream = undefined;
    view = undefined;
    swaps.clear();
    // Release the potentially large public domain as well as secret state.
    eligible = undefined;
  }

  async function refill() {
    if (exhaustedCounter) throw new Error("Placement counter exhausted.");
    stream?.fill(0);
    stream = undefined;
    view = undefined;
    let output;
    try {
      output = await cryptoAdapter.ctr(placement, counter, zeros);
    } catch (error) {
      if (error?.code === "RESOURCE_FAILED") throw error;
      throw resourceFailure();
    }
    if (closed) {
      output?.fill?.(0);
      throw new Error("Placement source is closed.");
    }
    if (!(output instanceof Uint8Array) || output.length !== CHUNK_BYTES) {
      output?.fill?.(0);
      throw resourceFailure();
    }
    stream = output;
    view = new DataView(stream.buffer, stream.byteOffset, stream.byteLength);
    offset = 0;
    // 4096 bytes are 256 complete AES blocks. Carry through all 128 bits.
    let carry = CHUNK_BYTES / 16;
    for (let i = 15; i >= 0; i--) {
      const sum = counter[i] + carry;
      counter[i] = sum & 255;
      carry = Math.floor(sum / 256);
    }
    exhaustedCounter = carry !== 0;
  }

  return {
    async next() {
      if (closed || pending || emitted >= positionLimit || remaining === 0) {
        throw new Error("Placement source is exhausted or unavailable.");
      }
      pending = true;
      try {
        const ceiling = UINT32_RANGE - UINT32_RANGE % remaining;
        let word;
        do {
          if (draws >= drawLimit) throw new Error("Placement draw budget exhausted.");
          if (!stream || offset === stream.length) await refill();
          if (closed) throw new Error("Placement source is closed.");
          word = view.getUint32(offset, true);
          offset += 4;
          draws++;
        } while (word >= ceiling);
        const index = word % remaining;
        const selected = swaps.get(index) ?? index;
        const last = remaining - 1;
        if (index !== last) swaps.set(index, swaps.get(last) ?? last);
        swaps.delete(last);
        remaining--;
        emitted++;
        // At most one new entry per emitted position, never a full permutation.
        return eligible[selected];
      } catch (error) {
        clear();
        throw error;
      } finally {
        pending = false;
      }
    },

    setLimit(totalPositions) {
      if (closed || pending || limitSet || !Number.isInteger(totalPositions) ||
          totalPositions < emitted || totalPositions < 0 || totalPositions > MAX_POSITIONS ||
          totalPositions > eligible.length || draws > 2 * totalPositions + 1024) {
        throw new Error("Invalid placement budget.");
      }
      positionLimit = totalPositions;
      drawLimit = 2 * totalPositions + 1024;
      limitSet = true;
    },

    clear,
  };
}
