// Question: what can a complete authenticated image record survive?
// https://github.com/jdragulanescu/obscr/issues/16
// Run: npm run spike-image-survival -- --out spikes/image-survival/runs/local
// --smoke uses one cover/seed/message; --worker is internal. Nothing touches production.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { SIDE, HEADER, PASSWORD, profiles, bytes, digest, shuffle, capacity, encode, decode,
  toPng, pixels, carrierBits, targetedDamage, malformedHeader, publicDetector } from './codec.mjs';

sharp.cache(false); sharp.concurrency(1);
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const out = path.resolve(option('--out', path.join(here, 'runs/local')));
const smoke = args.includes('--smoke');
fs.mkdirSync(out, { recursive: true });
const writeJson = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n');

function cover(kind, seed) {
  const rgb = Buffer.alloc(SIDE * SIDE * 3), noise = bytes(`cover/${seed}`, rgb.length);
  for (let y = 0; y < SIDE; y++) for (let x = 0; x < SIDE; x++) {
    for (let c = 0; c < 3; c++) {
      const i = (y * SIDE + x) * 3 + c;
      rgb[i] = kind === 'flat' ? [64, 128, 192][c] : kind === 'smooth'
        ? Math.round(40 + (x / SIDE) * 100 + (y / SIDE) * 40 + 12 * Math.sin((x + seed * c) / 43))
        : Math.max(0, Math.min(255, Math.round(128 + 36 * Math.sin((x + seed) / 11) * Math.cos(y / 17) + (noise[i] - 128) / 3)));
    }
  }
  return rgb;
}
function message(size, compressed, seed) {
  if (!compressed) return bytes(`incompressible-message/${seed}`, size);
  const unit = Buffer.from('Hi 🌍 你好\n');
  // Fill the exact byte budget without splitting a UTF-8 code point.
  return Buffer.concat([Buffer.from(unit.toString().repeat(Math.floor(size / unit.length))), Buffer.alloc(size % unit.length, 32)]);
}
function disturbance(before, after) {
  let squares = 0, changed = 0, max = 0;
  for (let i = 0; i < before.length; i++) {
    const d = Math.abs(before[i] - after[i]); squares += d * d; changed += Number(d !== 0); max = Math.max(max, d);
  }
  const mse = squares / before.length;
  return { changedSamples: changed, sampleCount: before.length, changedFraction: changed / before.length,
    mse, psnrDb: mse === 0 ? null : 10 * Math.log10(255 ** 2 / mse), maxAbsoluteChange: max };
}
function pixelDamage(rgb, seed, fraction, replace) {
  const result = Buffer.from(rgb), count = Math.floor(SIDE * SIDE * fraction);
  const order = shuffle(Uint32Array.from({ length: SIDE * SIDE }, (_, i) => i), bytes(`damage/${seed}/${fraction}`, 32), count);
  const noise = bytes(`replacement/${seed}`, count * 3);
  for (let i = 0; i < count; i++) {
    const index = order[i] * 3;
    if (replace) noise.copy(result, index, i * 3, i * 3 + 3);
    else { const c = noise[i * 3] % 3; result[index + c] += result[index + c] === 255 ? -1 : 1; }
  }
  return result;
}
const transforms = [
  ['unchanged', async e => e.png],
  ['png-reencode', async e => sharp(e.png).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()],
  ...[0.0001, 0.001, 0.01, 0.05, 0.2].map(rate => [`pixel-plus1-${rate}`, async (e, p, seed) => toPng(pixelDamage(e.rgb, seed, rate, false))]),
  ...[0.001, 0.01].map(rate => [`pixel-randomRGB-${rate}`, async (e, p, seed) => toPng(pixelDamage(e.rgb, seed, rate, true))]),
  ...[16, 64].map(size => [`center-black-${size}`, async e => {
    const rgb = Buffer.from(e.rgb), start = (SIDE - size) / 2;
    for (let y = start; y < start + size; y++) rgb.fill(0, (y * SIDE + start) * 3, (y * SIDE + start + size) * 3);
    return toPng(rgb);
  }]),
  ['stripe-black-8', async e => { const rgb = Buffer.from(e.rgb); rgb.fill(0, 252 * SIDE * 3, 260 * SIDE * 3); return toPng(rgb); }],
  ...[384, 256].map(size => [`resize-${size}-lanczos3`, async e => sharp(e.png).resize(size, size, { kernel: 'lanczos3' }).png().toBuffer()]),
  ...[95, 85, 60].map(quality => [`jpeg-${quality}-420`, async e => sharp(e.png).jpeg({ quality, chromaSubsampling: '4:2:0', mozjpeg: false }).toBuffer()]),
  ['resize384-jpeg85', async e => sharp(e.png).resize(384, 384, { kernel: 'lanczos3' }).jpeg({ quality: 85, chromaSubsampling: '4:2:0' }).toBuffer()],
  ['jpeg95-resize384-jpeg75', async e => {
    const jpeg = await sharp(e.png).jpeg({ quality: 95, chromaSubsampling: '4:2:0' }).toBuffer();
    return sharp(jpeg).resize(384, 384, { kernel: 'lanczos3' }).jpeg({ quality: 75, chromaSubsampling: '4:2:0' }).toBuffer();
  }],
  ['jpeg85-twice', async e => sharp(await sharp(e.png).jpeg({ quality: 85, chromaSubsampling: '4:2:0' }).toBuffer()).jpeg({ quality: 85, chromaSubsampling: '4:2:0' }).toBuffer()],
  ['clear-lowest-bit', async e => toPng(Buffer.from(e.rgb.map(x => x & 254)))],
  ['clear-lowest-four-bits', async e => toPng(Buffer.from(e.rgb.map(x => x & 240)))],
  ['truncate-half-file', async e => e.png.subarray(0, Math.floor(e.png.length / 2))],
  ['invalid-png-header', async e => { const file = Buffer.from(e.png); file[0] ^= 255; return file; }],
  ...['bootstrap', 'payload'].flatMap(section => ['within', 'beyond'].map(bound => [
    `${section}-${bound}-repetition-limit`, async (e, p) => toPng(targetedDamage(e, p, section, Math.floor(p.repeats / 2) + Number(bound === 'beyond'))),
  ])),
  ['malformed-length', async (e, p) => toPng(malformedHeader(e, p))],
  ['wrong-password', async e => e.png],
];
function damageStats(bits, data, order, repeats) {
  let rawErrors = 0, majorityErrors = 0, worstErrorsInCodeword = 0;
  const count = data.length * 8;
  for (let bit = 0; bit < count; bit++) {
    const expected = (data[bit >> 3] >> (7 - bit % 8)) & 1;
    let errors = 0;
    for (let copy = 0; copy < repeats; copy++) errors += Number(bits[order[copy * count + bit]] !== expected);
    rawErrors += errors; majorityErrors += Number(errors > repeats / 2); worstErrorsInCodeword = Math.max(worstErrorsInCodeword, errors);
  }
  return { rawErrors, majorityErrors, worstErrorsInCodeword, totalBits: count * repeats };
}

async function worker(p) {
  const rows = [], fixtures = [], controls = [], previews = [];
  const seeds = smoke ? [17] : [17, 29, 43];
  const kinds = smoke ? ['smooth'] : ['smooth', 'texture', 'flat'];
  const sizes = smoke ? [32] : [32, 96, 256];
  for (const kind of kinds) for (const seed of seeds) {
    const rgb = cover(kind, seed), png = await toPng(rgb);
    const negative = await decode(png, p);
    controls.push({ kind, seed, coverSha256: digest(png), detected: publicDetector(rgb, p), outcome: negative.outcome });
    for (const size of sizes) for (const compressed of [false, true]) {
      const msg = message(size, compressed, seed), id = `${p.name}-${kind}-${seed}-${size}-${compressed ? 'gzip' : 'raw'}`;
      const started = performance.now(), e = await encode(rgb, msg, compressed, p, id), encodeMs = performance.now() - started;
      const fixture = { id, kind, seed, nominalMessageBytes: size, messageBytes: msg.length, compressed, messageSha256: digest(msg),
        coverSha256: digest(png), storedBytes: e.storedBytes, capacityStoredBytes: capacity(p), outcome: e.outcome, encodeMs };
      fixtures.push(fixture);
      if (e.outcome === 'capacity') continue;
      Object.assign(fixture, { encodedSha256: digest(e.png), pngBytes: e.png.length, codedBits: e.codedBits,
        codedBitsPerPixel: e.codedBits / (SIDE * SIDE), disturbance: disturbance(rgb, e.rgb), detected: publicDetector(e.rgb, p) });
      const preview = kind === 'smooth' && seed === 17 && size === 32 && !compressed;
      if (preview) {
        fs.writeFileSync(path.join(out, `${p.name}-cover.png`), png);
        fs.writeFileSync(path.join(out, `${p.name}-encoded.png`), e.png);
        const residual = Buffer.from(rgb.map((value, i) => Math.min(255, Math.abs(value - e.rgb[i]) * 16)));
        fs.writeFileSync(path.join(out, `${p.name}-residual-x16.png`), await toPng(residual));
        previews.push(id);
      }
      for (const [transform, apply] of transforms) {
        const transformStart = performance.now(), file = await apply(e, p, seed), transformMs = performance.now() - transformStart;
        const decodeStart = performance.now(), result = await decode(file, p, transform === 'wrong-password' ? 'deliberately wrong' : PASSWORD);
        const decodeMs = performance.now() - decodeStart;
        const outcome = result.outcome === 'authenticated' ? (result.message.equals(msg) ? 'exact' : 'WRONG-AUTHENTICATED') : result.outcome;
        const row = { fixture: id, transform, outcome, fileBytes: file.length, fileSha256: digest(file), transformMs, decodeMs, times: result.times };
        // Oracle diagnostics only: these are never passed into decode or used to select geometry.
        try {
          const sample = await pixels(file, p), bits = carrierBits(sample, p);
          row.bootstrapErrors = damageStats(bits, e.header, e.order, p.repeats);
          row.payloadErrorsAtOriginalPositions = damageStats(bits, e.payload, e.payloadOrder, p.repeats);
          if (transform === 'png-reencode') row.pixelsUnchanged = sample.equals(e.rgb);
        } catch { /* Expected unreadable image or unsupported LSB geometry; no bit-error claim. */ }
        rows.push(row);
        if (preview && ['resize384-jpeg85', 'jpeg-85-420'].includes(transform)) fs.writeFileSync(path.join(out, `${p.name}-${transform}.jpg`), file);
      }
      console.log(`${id}: ${rows.slice(-transforms.length).filter(r => r.outcome === 'exact').length}/${transforms.length} exact`);
    }
  }
  // Capacity boundary uses raw bytes so compression cannot hide an oversize record.
  const boundary = [];
  for (const delta of [-1, 0, 1]) {
    const size = capacity(p) + delta, msg = bytes(`boundary/${p.name}/${delta}`, size);
    const e = await encode(cover('texture', 101), msg, false, p, `boundary/${p.name}/${delta}`);
    let outcome = e.outcome;
    if (outcome === 'encoded') {
      const result = await decode(e.png, p);
      outcome = result.outcome === 'authenticated' ? (result.message.equals(msg) ? 'exact' : 'WRONG-AUTHENTICATED') : result.outcome;
    }
    boundary.push({ size, delta, outcome });
  }
  writeJson(`${p.name}.json`, { profile: p, fixtures, controls, boundary, rows, previews, peakRssKiB: process.resourceUsage().maxRSS });
  const invalid = rows.some(r => r.outcome === 'WRONG-AUTHENTICATED' ||
    (['unchanged', 'png-reencode', 'bootstrap-within-repetition-limit', 'payload-within-repetition-limit'].includes(r.transform) && r.outcome !== 'exact') ||
    (r.transform === 'png-reencode' && !r.pixelsUnchanged)) ||
    controls.some(c => c.outcome === 'authenticated') || boundary.some(b => b.outcome !== (b.delta > 0 ? 'capacity' : 'exact'));
  if (invalid) throw new Error('A required experiment control failed; report is not valid evidence.');
}

if (args.includes('--worker')) {
  await worker(profiles.find(p => p.name === option('--worker')));
} else {
  const started = new Date().toISOString();
  for (const p of profiles) {
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--worker', p.name, '--out', out, ...(smoke ? ['--smoke'] : [])], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
  }
  const reports = profiles.map(p => JSON.parse(fs.readFileSync(path.join(out, `${p.name}.json`))));
  const sourceHashes = Object.fromEntries(['codec.mjs', 'run.mjs', 'package-lock.json'].map(name => [name, digest(fs.readFileSync(path.join(here, name)))]));
  const summary = reports.map(report => {
    const outcomes = {};
    for (const row of report.rows) {
      outcomes[row.transform] ??= {};
      outcomes[row.transform][row.outcome] = (outcomes[row.transform][row.outcome] || 0) + 1;
    }
    const sorted = values => values.sort((a, b) => a - b);
    const quantile = (values, q) => { const v = sorted(values); return v[Math.floor((v.length - 1) * q)]; };
    const successful = report.rows.filter(r => r.outcome === 'exact');
    const encoded = report.fixtures.filter(f => f.outcome === 'encoded');
    return { profile: report.profile.name, capacityStoredBytes: capacity(report.profile), fixtures: report.fixtures.length,
      encoded: encoded.length, capacityRejected: report.fixtures.length - encoded.length, cases: report.rows.length, outcomes,
      detection: { truePositive: encoded.filter(f => f.detected).length, positiveCount: encoded.length,
        falsePositive: report.controls.filter(c => c.detected).length, negativeCount: report.controls.length },
      encodeMedianMs: quantile(encoded.map(f => f.encodeMs), 0.5), encodeP95Ms: quantile(encoded.map(f => f.encodeMs), 0.95),
      exactDecodeMedianMs: quantile(successful.map(r => r.decodeMs), 0.5), exactDecodeP95Ms: quantile(successful.map(r => r.decodeMs), 0.95),
      embeddingPsnrMinDb: Math.min(...encoded.map(f => f.disturbance.psnrDb)), embeddingPsnrMaxDb: Math.max(...encoded.map(f => f.disturbance.psnrDb)),
      peakRssKiB: report.peakRssKiB, boundary: report.boundary };
  });
  const manifest = { started, ended: new Date().toISOString(), smoke, command: `npm run spike-image-survival -- --out ${path.relative(process.cwd(), out)}${smoke ? ' --smoke' : ''}`,
    sourceHashes, baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    platform: { os: os.platform(), release: os.release(), arch: os.arch(), cpu: os.cpus()[0].model, totalMemoryBytes: os.totalmem(), node: process.version },
    versions: sharp.versions, profiles, side: SIDE, headerBytes: HEADER, tagBytes: 16,
    kdf: { name: 'PBKDF2-SHA256', iterations: 65535, bytes: 32, hkdf: 'SHA256, separate encryption and placement labels' },
    source: 'Generated mathematical covers; no third-party images. Synthetic evidence only.',
    seeds: smoke ? [17] : [17, 29, 43], transforms: transforms.map(([name]) => name), summary };
  writeJson('manifest.json', manifest);
  console.log(JSON.stringify(summary, null, 2));
}
