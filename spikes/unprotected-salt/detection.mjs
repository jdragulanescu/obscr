// Disposable detector protocol for https://github.com/jdragulanescu/obscr/issues/31.
// Freeze this file and DETECTORS.md before held-out scoring; no codec dependency.
import { rsEncode } from './rs.mjs';

export const statisticalFeatureNames = [
  'red-pair-chi-square-per-pixel', 'green-pair-chi-square-per-pixel', 'blue-pair-chi-square-per-pixel',
  'red-lsb-imbalance', 'green-lsb-imbalance', 'blue-lsb-imbalance',
  'horizontal-lsb-disagreement', 'vertical-lsb-disagreement',
  'cross-channel-lsb-disagreement', 'horizontal-difference-at-most-one',
  'vertical-difference-at-most-one', 'horizontal-low-two-bit-agreement',
];
export const saltFeatureNames = [
  'salt16-bit-bias', 'salt16-absolute-bit-bias',
  'salt16-consecutive-spin-correlation', 'salt16-cross-channel-spin-correlation',
  'non-salt-bit-bias', 'non-salt-consecutive-spin-correlation', 'non-salt-cross-channel-spin-correlation',
  'salt16-minus-non-salt-bit-bias', 'salt16-minus-non-salt-consecutive-correlation',
  'salt16-minus-non-salt-cross-channel-correlation',
];
export const featureNames = [...statisticalFeatureNames, ...saltFeatureNames];

function saltSignatures(rgb) {
  const groups = Math.floor(rgb.length / 8);
  if (groups < 16) throw new Error('Image too small for salt signatures');
  const positions = new Set();
  for (let byte = 0; byte < 16; byte++) {
    const start = Math.floor(byte * groups / 16) * 8;
    for (let bit = 0; bit < 8; bit++) positions.add(start + bit);
  }
  const ones = [0, 0], count = [0, 0], adjacent = [0, 0], adjacentCount = [0, 0];
  const cross = [0, 0], crossCount = [0, 0];
  let previousSalt = false, previousSpin = 0;
  for (let i = 0; i < rgb.length; i++) {
    const salt = positions.has(i), side = Number(salt), bit = rgb[i] & 1, spin = 2 * bit - 1;
    ones[side] += bit; count[side]++;
    // Salt pairs stay inside one public byte; unrelated distant bytes are not neighbors.
    if (i > 0 && salt === previousSalt && (!salt || i % 8 !== 0)) {
      adjacent[side] += spin * previousSpin; adjacentCount[side]++;
      if (i % 3 !== 0) { cross[side] += spin * previousSpin; crossCount[side]++; }
    }
    previousSalt = salt; previousSpin = spin;
  }
  const bias = count.map((n, i) => n ? ones[i] / n - 0.5 : 0);
  const correlation = adjacentCount.map((n, i) => n ? adjacent[i] / n : 0);
  const crossCorrelation = crossCount.map((n, i) => n ? cross[i] / n : 0);
  return [bias[1], Math.abs(bias[1]), correlation[1], crossCorrelation[1],
    bias[0], correlation[0], crossCorrelation[0], bias[1] - bias[0],
    correlation[1] - correlation[0], crossCorrelation[1] - crossCorrelation[0]];
}

// Exact OLD public-code membership, not successful error repair and not the new salt.
// The old bytes occupy floor(i * floor(RGB.length / 8) / 80), i = 0..79.
export function publicScore(rgb, width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      rgb.length !== width * height * 3) throw new Error('Invalid RGB dimensions');
  const groups = Math.floor(rgb.length / 8);
  if (groups < 80) return 0;
  const code = new Uint8Array(80);
  for (let byte = 0; byte < 80; byte++) {
    const start = Math.floor(byte * groups / 80) * 8;
    for (let bit = 0; bit < 8; bit++) code[byte] = (code[byte] << 1) | (rgb[start + bit] & 1);
  }
  const expected = rsEncode(code.subarray(0, 16), 64);
  return expected.every((value, i) => value === code[i]) ? 1 : 0;
}

export function features(rgb, width, height) {
  if (width < 2 || height < 2 || rgb.length !== width * height * 3) throw new Error('Invalid RGB dimensions');
  const hist = new Uint32Array(768);
  const ones = [0, 0, 0];
  let hx = 0, vx = 0, cx = 0, hd = 0, vd = 0, h2 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3;
      cx += (rgb[offset] ^ rgb[offset + 1]) & 1;
      cx += (rgb[offset + 1] ^ rgb[offset + 2]) & 1;
      for (let c = 0; c < 3; c++) {
        const v = rgb[offset + c];
        hist[c * 256 + v]++;
        ones[c] += v & 1;
        if (x + 1 < width) {
          const right = rgb[offset + c + 3];
          hx += (v ^ right) & 1;
          hd += Math.abs(v - right) <= 1 ? 1 : 0;
          h2 += (v & 3) === (right & 3) ? 1 : 0;
        }
        if (y + 1 < height) {
          const below = rgb[offset + c + width * 3];
          vx += (v ^ below) & 1;
          vd += Math.abs(v - below) <= 1 ? 1 : 0;
        }
      }
    }
  }
  const n = width * height;
  const chi = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    for (let v = 0; v < 256; v += 2) {
      const a = hist[c * 256 + v], b = hist[c * 256 + v + 1];
      if (a + b) chi[c] += (a - b) ** 2 / (a + b);
    }
    chi[c] /= n;
  }
  const hn = height * (width - 1) * 3;
  const vn = width * (height - 1) * 3;
  return [...chi, ...ones.map(v => Math.abs(v / n - 0.5)), hx / hn, vx / vn,
    cx / (2 * n), hd / hn, vd / vn, h2 / hn, ...saltSignatures(rgb)];
}

const isStress = row => row.kind === 'stress' || row.sourceGroup.startsWith('stress-');
const groupCount = rows => new Set(rows.map(row => row.sourceGroup)).size;

const sampleKey = row => JSON.stringify([row.sourceGroup, row.id ?? row.coverId ?? null,
  row.width ?? null, row.height ?? null, row.seed ?? null]);
function pairedPoints(rows) {
  const counts = new Map();
  for (const row of rows) counts.set(row.sourceGroup, (counts.get(row.sourceGroup) || 0) + 1);
  return rows.flatMap(row => [
    { group: row.sourceGroup, id: sampleKey(row), y: 0, x: row.coverFeatures, publicScore: row.coverPublicScore, w: 1 / counts.get(row.sourceGroup) },
    { group: row.sourceGroup, id: sampleKey(row), y: 1, x: row.encodedFeatures, publicScore: row.publicScore, w: 1 / counts.get(row.sourceGroup) },
  ]);
}

// Diagonal regularized linear discriminant; no validation/test feature fitting.
// Each source contributes equal total mass to each class, regardless of dimensions.
function fit(points, indices) {
  const d = indices.length;
  const means = [new Array(d).fill(0), new Array(d).fill(0)];
  const masses = [0, 0];
  for (const p of points) {
    masses[p.y] += p.w;
    for (let j = 0; j < d; j++) means[p.y][j] += p.w * p.x[indices[j]];
  }
  for (let y = 0; y < 2; y++) for (let j = 0; j < d; j++) means[y][j] /= masses[y];
  const variances = new Array(d).fill(0);
  for (const p of points) for (let j = 0; j < d; j++) variances[j] += p.w * (p.x[indices[j]] - means[p.y][j]) ** 2;
  const weights = variances.map((v, j) => (means[1][j] - means[0][j]) / (v / (masses[0] + masses[1]) + 0.0001));
  const center = means[0].map((v, j) => (v + means[1][j]) / 2);
  return { featureIndices: indices, featureNames: indices.map(i => featureNames[i]), weights, center, ridgeVariance: 0.0001 };
}

function score(points, model, detector) {
  return points.map(p => {
    let linear = 0;
    if (model) for (let j = 0; j < model.weights.length; j++) linear += model.weights[j] * (p.x[model.featureIndices[j]] - model.center[j]);
    const bounded = 0.5 + Math.atan(linear) / Math.PI;
    const value = detector === 'old-public-code-only' ? p.publicScore
      : detector === 'complete-format' ? (p.publicScore >= 0.5 ? 2 : 0) + bounded : linear;
    return { group: p.group, id: p.id, y: p.y, w: p.w, score: value };
  });
}

function roc(points) {
  const sorted = [...points].sort((a, b) => b.score - a.score);
  const total = [0, 0];
  for (const p of sorted) total[p.y] += p.w;
  if (!total[0] || !total[1]) return { auc: null, points: [] };
  const curve = [{ threshold: null, thresholdMeaning: 'above-all-scores', fpr: 0, tpr: 0 }];
  let fp = 0, tp = 0, area = 0;
  for (let i = 0; i < sorted.length;) {
    const threshold = sorted[i].score;
    do {
      const p = sorted[i++];
      if (p.y) tp += p.w; else fp += p.w;
    } while (i < sorted.length && sorted[i].score === threshold);
    const point = { threshold, fpr: fp / total[0], tpr: tp / total[1] };
    const previous = curve[curve.length - 1];
    area += (point.fpr - previous.fpr) * (point.tpr + previous.tpr) / 2;
    curve.push(point);
  }
  return { auc: area, points: curve };
}

function rates(points, threshold) {
  const mass = [0, 0], positive = [0, 0];
  const falsePositiveGroups = new Set();
  for (const p of points) {
    mass[p.y] += p.w;
    if (p.score >= threshold) {
      positive[p.y] += p.w;
      if (!p.y) falsePositiveGroups.add(p.group);
    }
  }
  return { fpr: mass[0] ? positive[0] / mass[0] : null,
    tpr: mass[1] ? positive[1] / mass[1] : null,
    falsePositiveSourceGroups: falsePositiveGroups.size };
}

function thresholdAt(points, target) {
  const negatives = points.filter(p => !p.y).map(p => p.score);
  const unique = [...new Set(negatives)].sort((a, b) => b - a);
  const max = unique[0];
  let threshold = max + Math.max(1, Math.abs(max)) * Number.EPSILON * 2;
  for (const candidate of unique) {
    if (rates(points, candidate).fpr <= target + 1e-12) threshold = candidate;
    else break;
  }
  return { targetFpr: target, threshold, validation: rates(points, threshold) };
}

function rng(seed) {
  let s = 2166136261;
  for (const c of String(seed)) { s ^= c.charCodeAt(0); s = Math.imul(s, 16777619); }
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function interval(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const quantile = p => {
    const x = (sorted.length - 1) * p, lo = Math.floor(x), hi = Math.ceil(x);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (x - lo);
  };
  return { low: quantile(0.025), high: quantile(0.975) };
}

function uncertainty(points, operating, seed, repetitions) {
  const groups = new Map();
  for (const p of points) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group).push(p);
  }
  const names = [...groups.keys()].sort(), random = rng(seed);
  const aucs = [], fprs = operating.map(() => []), tprs = operating.map(() => []);
  for (let b = 0; b < repetitions; b++) {
    const sampled = [];
    for (let j = 0; j < names.length; j++) sampled.push(...groups.get(names[Math.floor(random() * names.length)]));
    aucs.push(roc(sampled).auc);
    operating.forEach((op, j) => {
      const r = rates(sampled, op.threshold);
      fprs[j].push(r.fpr); tprs[j].push(r.tpr);
    });
  }
  return { seed, repetitions, unit: 'sourceGroup (paired classes and all dimensions retained)',
    scope: 'test-source sampling only; trained model and validation thresholds fixed',
    percentile: 95, auc: interval(aucs),
    operatingPoints: operating.map((op, j) => ({ targetFpr: op.targetFpr, fpr: interval(fprs[j]), tpr: interval(tprs[j]) })) };
}

function evaluate(points, operating) {
  return { roc: roc(points), operatingPoints: operating.map(op => ({ ...op, observed: rates(points, op.threshold) })) };
}

const detectorNames = ['statistical-only', 'salt-signature-only', 'old-public-code-only', 'complete-format'];
const publicDetectors = ['salt-signature-only', 'old-public-code-only'];
const targets = [0.01, 0.05];

function pairedComparison(candidate, baseline, seed, repetitions) {
  const identity = p => JSON.stringify([p.id, p.y]);
  const candidateIds = new Set(candidate.points.map(identity));
  const baselineIds = new Set(baseline.points.map(identity));
  if (candidateIds.size !== candidate.points.length || baselineIds.size !== baseline.points.length ||
      candidateIds.size !== baselineIds.size || [...candidateIds].some(id => !baselineIds.has(id))) {
    return { status: 'unmatched-test-pairs', reason: 'All photographed test source/cover/size/seed pairs must match exactly; no intersection-only estimate' };
  }
  const groupNames = [...new Set(candidate.points.map(p => p.group))].sort();
  const group = points => new Map(groupNames.map(name => [name, points.filter(p => p.group === name)]));
  const cg = group(candidate.points), bg = group(baseline.points), random = rng(seed);
  const aucDeltas = [], tprDeltas = targets.map(() => []), fprDeltas = targets.map(() => []);
  for (let b = 0; b < repetitions; b++) {
    const cp = [], bp = [];
    for (let j = 0; j < groupNames.length; j++) {
      const name = groupNames[Math.floor(random() * groupNames.length)];
      cp.push(...cg.get(name)); bp.push(...bg.get(name));
    }
    aucDeltas.push(roc(bp).auc - roc(cp).auc);
    targets.forEach((_, i) => {
      const cr = rates(cp, candidate.operating[i].threshold), br = rates(bp, baseline.operating[i].threshold);
      tprDeltas[i].push(cr.tpr - br.tpr); fprDeltas[i].push(cr.fpr - br.fpr);
    });
  }
  const improvement = roc(baseline.points).auc - roc(candidate.points).auc;
  const ci = interval(aucDeltas);
  const operatingPoints = targets.map((targetFpr, i) => {
    const c = rates(candidate.points, candidate.operating[i].threshold);
    const b = rates(baseline.points, baseline.operating[i].threshold);
    return { targetFpr, candidate: c, baseline: b,
      candidateMinusBaseline: { tpr: c.tpr - b.tpr, fpr: c.fpr - b.fpr },
      interval95: { tpr: interval(tprDeltas[i]), fpr: interval(fprDeltas[i]) } };
  });
  return { status: 'paired', sourceGroups: groupNames.length,
    aucImprovement: { estimate: improvement, interval95: ci, direction: 'baseline minus candidate; positive means less detectable' },
    aucPenalty: { estimate: -improvement, interval95: { low: -ci.high, high: -ci.low }, direction: 'candidate minus baseline; positive means more detectable' },
    operatingPoints,
    uncertainty: { seed, repetitions, percentile: 95,
      unit: 'Identical whole test-source draws for both methods, retaining classes and all sizes/seeds',
      scope: 'Test-source resampling only; separately trained models and validation thresholds fixed' } };
}

export function analyze(rows, { seed = 'unprotected-salt-detection-v1', bootstrapReplicates = 500 } = {}) {
  if (!Number.isInteger(bootstrapReplicates) || bootstrapReplicates < 1) throw new Error('Invalid bootstrap repetitions');
  const groupSplits = new Map(), buckets = new Map(), seen = new Set(), uniqueSamples = new Set();
  let duplicateRowsRemoved = 0;
  for (const row of rows) {
    if (typeof row.sourceGroup !== 'string' || !['train', 'validation', 'test'].includes(row.split)) throw new Error('Missing source split');
    if (groupSplits.has(row.sourceGroup) && groupSplits.get(row.sourceGroup) !== row.split) throw new Error(`Source leaks across splits: ${row.sourceGroup}`);
    groupSplits.set(row.sourceGroup, row.split);
    for (const field of ['coverFeatures', 'encodedFeatures']) {
      if (!row[field] || row[field].length !== featureNames.length || !Array.from(row[field]).every(Number.isFinite)) throw new Error(`Invalid ${field}`);
    }
    if (![0, 1].includes(row.publicScore) || ![0, 1].includes(row.coverPublicScore)) throw new Error('Measured binary old-code scores required for cover and encoded image');
    if (typeof row.method !== 'string' || !Number.isInteger(row.load) || row.load <= 0) throw new Error('Method and useful message byte load required');
    const key = JSON.stringify([row.method, row.load]);
    const sample = sampleKey(row);
    const identity = JSON.stringify([key, sample, Array.from(row.coverFeatures), Array.from(row.encodedFeatures), row.publicScore, row.coverPublicScore]);
    if (seen.has(identity)) { duplicateRowsRemoved++; continue; }
    seen.add(identity);
    const unique = JSON.stringify([key, sample]);
    if (uniqueSamples.has(unique)) throw new Error('Conflicting rows for one source/cover/size/seed/method/load');
    uniqueSamples.add(unique);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  const reports = [], scoredReports = new Map();
  for (const [key, samples] of buckets) {
    const [method, load] = JSON.parse(key);
    const photos = samples.filter(row => !isStress(row));
    const partition = Object.fromEntries(['train', 'validation', 'test'].map(split => [split, photos.filter(row => row.split === split)]));
    const counts = Object.fromEntries(Object.entries(partition).map(([split, values]) => [split, { sourceGroups: groupCount(values), pairedRows: values.length }]));
    if (Object.values(partition).some(part => part.length === 0)) {
      reports.push({ method, load, counts, status: 'insufficient-splits', reason: 'Each method/load needs photographed train, validation and test sources' });
      continue;
    }
    const points = Object.fromEntries(Object.entries(partition).map(([split, values]) => [split, pairedPoints(values)]));
    const allIndices = featureNames.map((_, i) => i);
    const models = {
      'statistical-only': fit(points.train, allIndices.slice(0, statisticalFeatureNames.length)),
      'salt-signature-only': fit(points.train, allIndices.slice(statisticalFeatureNames.length)),
      'old-public-code-only': null,
      'complete-format': fit(points.train, allIndices),
    };
    const detectors = {}, scoredDetectors = {};
    const stress = samples.filter(row => isStress(row) && row.split === 'test');
    for (const detector of detectorNames) {
      const model = models[detector];
      const scored = Object.fromEntries(Object.entries(points).map(([split, values]) => [split, score(values, model, detector)]));
      const operating = targets.map(target => thresholdAt(scored.validation, target));
      scoredDetectors[detector] = { points: scored.test, operating };
      detectors[detector] = {
        model,
        train: evaluate(scored.train, operating), validation: evaluate(scored.validation, operating),
        test: evaluate(scored.test, operating),
        uncertainty: uncertainty(scored.test, operating, `${seed}:${key}:${detector}`, bootstrapReplicates),
        stress: { sourceGroups: groupCount(stress), pairedRows: stress.length,
          ...evaluate(score(pairedPoints(stress), model, detector), operating) },
      };
    }
    scoredReports.set(key, scoredDetectors);
    reports.push({ method, load, status: 'measured', counts, detectors,
      limits: {
        heldoutSourceGroups: counts.test.sourceGroups,
        validationSourceGroups: counts.validation.sourceGroups,
        independentSourceResolution: 1 / counts.test.sourceGroups,
        zeroFalsePositiveSourceOneSided95UpperBound: 1 - 0.05 ** (1 / counts.test.sourceGroups),
        boundMeaning: 'Binomial bound for a source producing any false positive, only if zero test sources do so; assumes independent representative sources',
        lowFprSupported: false,
        note: 'Ten adaptively reused named photos, not newly unseen research data. 1%/5% are validation settings, not population FPR. Intervals omit corpus selection, training, threshold and prior-experiment adaptation uncertainty.',
      },
    });
  }
  const comparisons = [];
  for (const report of reports.filter(r => r.status === 'measured' && ['no-repair', 'grouped-p32'].includes(r.method))) {
    for (const baseline of ['legacy-filler-on', 'no-repair']) {
      if (baseline === report.method) continue;
      const candidateScores = scoredReports.get(JSON.stringify([report.method, report.load]));
      const baselineScores = scoredReports.get(JSON.stringify([baseline, report.load]));
      if (!baselineScores) {
        comparisons.push({ candidate: report.method, baseline, load: report.load, status: 'missing-baseline' });
        continue;
      }
      const detectors = Object.fromEntries(detectorNames.map(name => [name,
        pairedComparison(candidateScores[name], baselineScores[name],
          `${seed}:paired:${report.method}:${baseline}:${report.load}:${name}`, bootstrapReplicates)]));
      const complete = detectors['complete-format'];
      const newPerfectPublicDetectors = publicDetectors.filter(name =>
        roc(candidateScores[name].points).auc === 1 && roc(baselineScores[name].points).auc !== 1);
      const paired = complete.status === 'paired';
      const positiveAucInterval = paired && complete.aucImprovement.interval95.low > 0;
      const noWorseAchievedDetection = paired && complete.operatingPoints.every(op =>
        op.candidate.tpr <= op.baseline.tpr + 1e-12 && op.candidate.fpr <= op.baseline.fpr + 1e-12);
      comparisons.push({ candidate: report.method, baseline, load: report.load,
        status: paired ? 'paired' : 'unmatched-test-pairs',
        purpose: baseline === 'legacy-filler-on' ? 'improvement' : 'repair-penalty',
        detectors, newPerfectPublicDetectors,
        improvementCriterion: { positiveAucInterval, noWorseAchievedDetection,
          noNewPerfectPublicDetector: newPerfectPublicDetectors.length === 0 },
        verdict: baseline !== 'legacy-filler-on' ? 'penalty-estimate'
          : positiveAucInterval && noWorseAchievedDetection && !newPerfectPublicDetectors.length
            ? 'demonstrated-exploratory-improvement' : 'inconclusive' });
    }
  }
  return { featureNames, statisticalFeatureNames, saltFeatureNames, detectorNames,
    seed, bootstrapReplicates, duplicateRowsRemoved,
    weighting: 'Equal source weight within each class; all sizes/seeds from one source stay together',
    combinedRule: 'Exact old public-code positives outrank negatives; the training-only linear score of all 22 features breaks ties.',
    decisionRule: 'Per candidate/useful-byte load against legacy-filler-on: complete-format paired 95% AUC interval (baseline minus candidate) strictly above zero; achieved test TPR and FPR no higher at both fixed validation targets; no salt-only or old-code-only perfect test ranking newly absent from baseline. Otherwise inconclusive. All loads must pass for a profile-wide claim.',
    scope: 'Exploratory source-separated results on adaptively reused photos; never population invisibility, a safe capacity, production readiness or phone approval.',
    reports, comparisons };
}
