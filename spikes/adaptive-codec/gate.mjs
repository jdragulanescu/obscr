// Question: does the pinned real STC recover exact bytes with bounded shared WASM?
// https://github.com/jdragulanescu/obscr/issues/35 — run npm run gate or browser.html.
// Synthetic arrays check coding correctness, not image concealment or PNG exchange.
export const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
export function fixture(length, seed) {
  let state = seed >>> 0;
  return Uint8Array.from({ length }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 24;
  });
}
export async function loadCodec(bytes) {
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const api = instance.exports;
  if (api.init() !== 0) throw Error('Codec initialization failed');
  const samples = () => new Uint8Array(api.memory.buffer, api.carrier_ptr(), 262144);
  const costs = () => new Float32Array(api.memory.buffer, api.costs_ptr(), 262144);
  const payload = () => new Uint8Array(api.memory.buffer, api.payload_ptr(), 655);
  return { api, samples, costs, payload };
}
function rank(columns, n, m) {
  const used = Math.min(n, 64 * m), segmentBlocks = Math.floor(65536 / Math.floor(used / m));
  const basis = Array(m).fill(0n);
  let result = 0;
  for (let block = 0; block < m; block++) {
    const segmentEnd = Math.min(m, (Math.floor(block / segmentBlocks) + 1) * segmentBlocks);
    const end = Math.floor((block + 1) * used / m);
    for (let i = Math.floor(block * used / m); i < end; i++) {
      let v = (BigInt(columns[i]) << BigInt(block)) & ((1n << BigInt(segmentEnd)) - 1n);
      for (let row = m - 1; row >= 0 && v !== 0n; row--) {
        if ((v & (1n << BigInt(row))) === 0n) continue;
        if (basis[row]) v ^= basis[row];
        else { basis[row] = v; result++; break; }
      }
    }
  }
  return result;
}
export async function runGate(bytes, report = () => {}) {
  const start = performance.now(), codec = await loadCodec(bytes), { api } = codec;
  const result = { stage: 'real-wasm-codec-gate', runtime: typeof navigator === 'undefined' ? process.version : navigator.userAgent, fixedSeed: '00'.repeat(32), height: 10, maxBpp: .02, rows: [], bounds: [], salt: null, elapsedMs: 0, memoryBytes: api.memory.buffer.byteLength, passed: false };
  const cases = [
    { name: 'salt-random', n: 8192, length: 16, coverSeed: 1, payloadSeed: 2, cost: 'uniform' },
    { name: 'salt-zero-cover', n: 8192, length: 16, constant: 0, payloadSeed: 3, cost: 'uniform' },
    { name: 'salt-saturated-cover', n: 8192, length: 16, constant: 255, payloadSeed: 4, cost: 'uniform' },
    { name: '64-byte-variable-cost', n: 32768, length: 64, coverSeed: 5, payloadSeed: 6, cost: 'alternating' },
    { name: '512-byte-segmented', n: 262144, length: 512, coverSeed: 7, payloadSeed: 8, cost: 'alternating' },
    { name: '655-byte-rate-boundary', n: 262144, length: 655, coverSeed: 9, payloadSeed: 10, cost: 'uniform' },
    { name: '2048-byte-required-load', n: 262144, length: 2048, coverSeed: 11, payloadSeed: 12, cost: 'uniform', rejection: true }
  ];
  for (const test of cases) {
    const cover = test.constant === undefined ? fixture(test.n, test.coverSeed) : new Uint8Array(test.n).fill(test.constant);
    const message = fixture(test.length, test.payloadSeed);
    codec.samples().set(cover);
    for (let i = 0; i < test.n; i++) codec.costs()[i] = test.cost === 'alternating' ? (i % 2 ? 1 : 100) : 1;
    codec.payload().set(message.subarray(0, 655));
    const t0 = performance.now(), status = api.encode(test.n, test.length), encodeMs = performance.now() - t0;
    if (test.rejection) {
      const row = { ...test, status, encodeMs, unchanged: equal(codec.samples().subarray(0, test.n), cover), passed: status < 0 && equal(codec.samples().subarray(0, test.n), cover) };
      result.rows.push(row); report(row);
      if (!row.passed) return finish('capacity rejection failed');
      continue;
    }
    if (status < 0) { result.rows.push({ ...test, status, encodeMs, passed: false }); return finish('unexpected encode rejection'); }
    const encoded = codec.samples().slice(0, test.n);
    let changed = 0, maximumDelta = 0;
    for (let i = 0; i < test.n; i++) { changed += encoded[i] !== cover[i]; maximumDelta = Math.max(maximumDelta, Math.abs(encoded[i] - cover[i])); }
    // Destroy payload and cost state before extraction: the receiver has neither.
    codec.payload().fill(0); codec.costs().fill(NaN);
    const t1 = performance.now(), decodedStatus = api.decode(test.n, test.length), decodeMs = performance.now() - t1;
    const recovered = codec.payload().slice(0, test.length);
    const row = { ...test, status, decodedStatus, encodeMs, decodeMs, changed, maximumDelta, exact: equal(recovered, message), maxSegmentColumns: api.max_segment_columns(test.n, test.length) };
    row.passed = decodedStatus === 0 && row.exact && changed === status && maximumDelta <= 1 && row.maxSegmentColumns <= 66816;
    result.rows.push(row); report(row);
    if (!row.passed) return finish('exact blind extraction failed');
  }
  const prepared = api.matrix_prepare(8192, 128);
  const columns = new Uint32Array(api.memory.buffer, api.columns_ptr(), Math.max(0, prepared));
  result.salt = { samples: 8192, bits: 128, used: prepared, rank: prepared > 0 ? rank(columns, 8192, 128) : 0 };
  if (result.salt.rank !== 128) return finish('salt matrix is not full row rank');
  for (const [name, n, length, value] of [['negative-cost',8192,16,-1],['nan-cost',8192,16,NaN],['infinite-cost',8192,16,Infinity],['positions-over-limit',262145,16,1],['payload-over-limit',262144,656,1]]) {
    codec.samples().fill(128); codec.costs().fill(value); codec.payload().fill(42);
    const t = performance.now(), status = api.encode(n, length);
    const unchanged = codec.samples().every(v => v === 128);
    result.bounds.push({ name, status, unchanged, elapsedMs: performance.now() - t, passed: status < 0 && unchanged });
  }
  result.passed = result.bounds.every(row => row.passed);
  return finish(result.passed ? null : 'bounded input rejection failed');
  function finish(failure) {
    result.elapsedMs = performance.now() - start;
    result.memoryBytes = api.memory.buffer.byteLength;
    if (failure) result.failure = failure;
    return result;
  }
}
