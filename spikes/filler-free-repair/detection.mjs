export const featureNames = [
  'red-pair-chi-square-per-pixel', 'green-pair-chi-square-per-pixel', 'blue-pair-chi-square-per-pixel',
  'red-lsb-imbalance', 'green-lsb-imbalance', 'blue-lsb-imbalance',
  'horizontal-lsb-disagreement', 'vertical-lsb-disagreement',
  'cross-channel-lsb-disagreement', 'horizontal-difference-at-most-one',
  'vertical-difference-at-most-one', 'horizontal-low-two-bit-agreement',
];

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
    cx / (2 * n), hd / hn, vd / vn, h2 / hn];
}

const isStress = row => row.kind === 'stress' || row.sourceGroup.startsWith('stress-');
const groupCount = rows => new Set(rows.map(row => row.sourceGroup)).size;

function pairedPoints(rows) {
  const counts = new Map();
  for (const row of rows) counts.set(row.sourceGroup, (counts.get(row.sourceGroup) || 0) + 1);
  return rows.flatMap(row => [
    { group: row.sourceGroup, y: 0, x: row.coverFeatures, publicScore: row.coverPublicScore, w: 1 / counts.get(row.sourceGroup) },
    { group: row.sourceGroup, y: 1, x: row.encodedFeatures, publicScore: row.publicScore, w: 1 / counts.get(row.sourceGroup) },
  ]);
}

// Diagonal regularized linear discriminant; no validation/test feature fitting.
// Each source contributes equal total mass to each class, regardless of dimensions.
function fit(points) {
  const d = featureNames.length;
  const means = [new Array(d).fill(0), new Array(d).fill(0)];
  const masses = [0, 0];
  for (const p of points) {
    masses[p.y] += p.w;
    for (let j = 0; j < d; j++) means[p.y][j] += p.w * p.x[j];
  }
  for (let y = 0; y < 2; y++) for (let j = 0; j < d; j++) means[y][j] /= masses[y];
  const variances = new Array(d).fill(0);
  for (const p of points) for (let j = 0; j < d; j++) variances[j] += p.w * (p.x[j] - means[p.y][j]) ** 2;
  const weights = variances.map((v, j) => (means[1][j] - means[0][j]) / (v / (masses[0] + masses[1]) + 0.0001));
  const center = means[0].map((v, j) => (v + means[1][j]) / 2);
  return { weights, center, ridgeVariance: 0.0001 };
}

function score(points, model, detector) {
  return points.map(p => {
    let statistical = 0;
    for (let j = 0; j < model.weights.length; j++) statistical += model.weights[j] * (p.x[j] - model.center[j]);
    const bounded = 0.5 + Math.atan(statistical) / Math.PI;
    const value = detector === 'statistical-only' ? statistical
      : detector === 'public-format-only' ? p.publicScore
        : (p.publicScore >= 0.5 ? 2 : 0) + bounded;
    return { group: p.group, y: p.y, w: p.w, score: value };
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

export function analyze(rows, { seed = 'filler-free-detection-v1', bootstrapReplicates = 500 } = {}) {
  if (!Number.isInteger(bootstrapReplicates) || bootstrapReplicates < 1) throw new Error('Invalid bootstrap repetitions');
  const groupSplits = new Map(), buckets = new Map(), seen = new Set();
  let duplicateRowsRemoved = 0;
  for (const row of rows) {
    if (typeof row.sourceGroup !== 'string' || !['train', 'validation', 'test'].includes(row.split)) throw new Error('Missing source split');
    if (groupSplits.has(row.sourceGroup) && groupSplits.get(row.sourceGroup) !== row.split) throw new Error(`Source leaks across splits: ${row.sourceGroup}`);
    groupSplits.set(row.sourceGroup, row.split);
    for (const field of ['coverFeatures', 'encodedFeatures']) {
      if (!row[field] || row[field].length !== featureNames.length || !Array.from(row[field]).every(Number.isFinite)) throw new Error(`Invalid ${field}`);
    }
    if (!Number.isFinite(row.publicScore) || !Number.isFinite(row.coverPublicScore)) throw new Error('Both public and cover public scores are required');
    const key = JSON.stringify([row.method, row.load]);
    const identity = JSON.stringify([key, row.sourceGroup, row.id ?? row.coverId ?? null,
      row.width ?? null, row.height ?? null, Array.from(row.coverFeatures), Array.from(row.encodedFeatures), row.publicScore, row.coverPublicScore]);
    if (seen.has(identity)) { duplicateRowsRemoved++; continue; }
    seen.add(identity);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  const reports = [];
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
    const model = fit(points.train);
    const detectors = {};
    for (const detector of ['statistical-only', 'public-format-only', 'combined-format']) {
      const scored = Object.fromEntries(Object.entries(points).map(([split, values]) => [split, score(values, model, detector)]));
      const operating = [0.01, 0.05].map(target => thresholdAt(scored.validation, target));
      const stress = samples.filter(row => isStress(row) && row.split === 'test');
      detectors[detector] = {
        train: evaluate(scored.train, operating), validation: evaluate(scored.validation, operating),
        test: evaluate(scored.test, operating),
        uncertainty: uncertainty(scored.test, operating, `${seed}:${key}:${detector}`, bootstrapReplicates),
        stress: { sourceGroups: groupCount(stress), pairedRows: stress.length,
          ...evaluate(score(pairedPoints(stress), model, detector), operating) },
      };
    }
    reports.push({ method, load, status: 'measured', counts, model, detectors,
      limits: {
        heldoutSourceGroups: counts.test.sourceGroups,
        validationSourceGroups: counts.validation.sourceGroups,
        independentSourceResolution: 1 / counts.test.sourceGroups,
        zeroFalsePositiveSourceOneSided95UpperBound: 1 - 0.05 ** (1 / counts.test.sourceGroups),
        boundMeaning: 'Binomial bound for a source producing any false positive, only if zero test sources do so; assumes independent representative sources',
        lowFprSupported: false,
        note: 'Tiny convenience corpus; 1%/5% targets are validation settings, not established population FPR. Bootstrap intervals omit corpus selection, training and threshold uncertainty.',
      },
    });
  }
  return { featureNames, seed, bootstrapReplicates, duplicateRowsRemoved,
    weighting: 'Equal source weight within each class; all sizes/seeds from one source stay together',
    combinedRule: 'Public score >=0.5 outranks every non-triggering image; statistical score breaks ties. Complete-format reporting must use combined-format, not statistical-only.',
    reports };
}
