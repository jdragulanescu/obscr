import inflater from "pako/lib/zlib/inflate.js";
import ZStream from "pako/lib/zlib/zstream.js";

export const MAX_SOURCE_BYTES = 16 * 1024 * 1024;
const SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const SRGB_CHRM = [31270, 32900, 64000, 33000, 30000, 60000, 15000, 6000];
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function fail(code = "PNG_INVALID") {
  const messages = {
    PNG_INVALID: "The PNG is malformed. Select a valid PNG image.",
    PNG_UNSUPPORTED: "Use a non-interlaced 8-bit RGB or fully opaque RGBA PNG with supported metadata.",
    PNG_LIMIT: "Use a PNG up to 16 MiB and 1024 × 1024 pixels, with limited metadata.",
  };
  throw Object.assign(new Error(messages[code]), { code });
}
function requireValid(condition) { if (!condition) fail(); }
function u32(b, p) { return ((b[p] * 0x1000000) + (b[p + 1] << 16) + (b[p + 2] << 8) + b[p + 3]) >>> 0; }
function put32(b, p, v) { b[p] = v >>> 24; b[p + 1] = v >>> 16; b[p + 2] = v >>> 8; b[p + 3] = v; }
function crc(b, start, end) {
  let c = 0xffffffff;
  for (let p = start; p < end; p++) c = CRC_TABLE[(c ^ b[p]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function geometry(width, height) {
  requireValid(Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0);
  if (width > 1024 || height > 1024 || width * height > 1048576) fail("PNG_LIMIT");
}
function keyword(b) {
  const end = b.indexOf(0);
  requireValid(end >= 1 && end <= 79 && b[0] !== 32 && b[end - 1] !== 32);
  for (let i = 0; i < end; i++) {
    requireValid((b[i] >= 32 && b[i] <= 126) || b[i] >= 161);
    requireValid(b[i] !== 32 || b[i - 1] !== 32);
  }
  return end + 1;
}
function utf8(b) {
  try { new TextDecoder("utf-8", { fatal: true }).decode(b); } catch { fail(); }
}
function opaqueZlib(b) {
  requireValid(b.length >= 6 && (b[0] & 15) === 8 && (b[0] >>> 4) <= 7);
  requireValid(((b[0] << 8) | b[1]) % 31 === 0 && (b[1] & 32) === 0);
}
function singleMetadata(type, state) {
  requireValid(!state.seen.has(type));
  state.seen.add(type);
}
function validateRendering(type, b) {
  requireValid(b instanceof Uint8Array);
  switch (type) {
    case "sRGB": requireValid(b.length === 1 && b[0] <= 3); break;
    case "gAMA": requireValid(b.length === 4 && u32(b, 0) > 0); break;
    case "cHRM":
      requireValid(b.length === 32);
      for (let i = 0; i < 32; i += 8) requireValid(u32(b, i) + u32(b, i + 4) <= 100000);
      break;
  }
}
function renderingMetadata(type, b, state) {
  singleMetadata(type, state);
  requireValid(!state.idat);
  requireValid(!state.palette);
  validateRendering(type, b);
  state.rendering[type] = new Uint8Array(b);
}
function languageByte(value) {
  return (value >= 65 && value <= 90) || (value >= 97 && value <= 122) || (value >= 48 && value <= 57) || value === 45;
}
function internationalText(b) {
  let p = keyword(b);
  requireValid((b[p] === 0 || b[p] === 1) && b[p + 1] === 0);
  const compressed = b[p] === 1; p += 2;
  const languageEnd = b.indexOf(0, p); requireValid(languageEnd >= p);
  for (let i = p; i < languageEnd; i++) requireValid(languageByte(b[i]));
  p = languageEnd + 1;
  const translatedEnd = b.indexOf(0, p); requireValid(translatedEnd >= p);
  utf8(b.subarray(p, translatedEnd)); p = translatedEnd + 1;
  if (compressed) opaqueZlib(b.subarray(p));
  else { requireValid(b.indexOf(0, p) === -1); utf8(b.subarray(p)); }
}
function exifMetadata(b) {
  requireValid(b.length >= 8);
  const little = b[0] === 73 && b[1] === 73;
  requireValid(little || (b[0] === 77 && b[1] === 77));
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  requireValid(view.getUint16(2, little) === 42);
  const offset = view.getUint32(4, little);
  requireValid(offset >= 8 && offset <= b.length - 2);
  const count = view.getUint16(offset, little);
  requireValid(count <= Math.floor((b.length - offset - 6) / 12));
}
function metadata(type, b, state) {
  switch (type) {
    case "sRGB": case "gAMA": case "cHRM": renderingMetadata(type, b, state); break;
    case "PLTE":
      singleMetadata(type, state); requireValid(!state.idat);
      requireValid(!state.seen.has("bKGD") && !state.seen.has("hIST"));
      requireValid(b.length >= 3 && b.length <= 768 && b.length % 3 === 0);
      state.palette = b.length / 3;
      break;
    case "tEXt": {
      const p = keyword(b); requireValid(b.indexOf(0, p) === -1); break;
    }
    case "zTXt": {
      const p = keyword(b); requireValid(b[p] === 0); opaqueZlib(b.subarray(p + 1)); break;
    }
    case "iTXt": internationalText(b); break;
    case "eXIf": singleMetadata(type, state); exifMetadata(b); break;
    case "tIME":
      singleMetadata(type, state);
      requireValid(b.length === 7 && b[2] >= 1 && b[2] <= 12 && b[3] >= 1 && b[3] <= 31 && b[4] <= 23 && b[5] <= 59 && b[6] <= 60); break;
    case "pHYs":
      singleMetadata(type, state); requireValid(!state.idat); requireValid(b.length === 9 && b[8] <= 1); break;
    case "sBIT":
      singleMetadata(type, state); requireValid(!state.idat); requireValid(!state.palette && b.length === state.channels);
      for (const value of b) requireValid(value >= 1 && value <= 8);
      break;
    case "bKGD":
      singleMetadata(type, state); requireValid(!state.idat); requireValid(b.length === 6);
      for (let p = 0; p < 6; p += 2) requireValid(b[p] === 0);
      break;
    case "hIST":
      singleMetadata(type, state); requireValid(!state.idat); requireValid(state.palette > 0 && b.length === state.palette * 2); break;
    default: fail("PNG_UNSUPPORTED");
  }
}

function inflatePart(stream, part, size, overflow) {
  stream.input = part; stream.next_in = 0; stream.avail_in = part.length;
  while (true) {
    if (stream.total_out === size) { stream.output = overflow; stream.next_out = 0; stream.avail_out = 1; }
    const inputBefore = stream.avail_in;
    const outputBefore = stream.total_out;
    const status = inflater.inflate(stream, 0);
    requireValid(stream.total_out <= size);
    if (status === 1) { requireValid(stream.avail_in === 0); return true; }
    requireValid(status === 0 || status === -5);
    if (stream.avail_in === 0) return false;
    requireValid(inputBefore !== stream.avail_in || outputBefore !== stream.total_out);
  }
}
function inflateRaster(parts, size) {
  const output = new Uint8Array(size);
  const overflow = new Uint8Array(1);
  const stream = new ZStream();
  requireValid(inflater.inflateInit2(stream, 15) === 0);
  stream.output = output; stream.next_out = 0; stream.avail_out = size;
  let ended = false;
  try {
    for (const part of parts) {
      if (ended) { requireValid(part.length === 0); continue; }
      ended = inflatePart(stream, part, size, overflow);
    }
    requireValid(ended && stream.total_out === size);
    return output;
  } finally { inflater.inflateEnd(stream); }
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
function filterPrediction(filter, a, b, c) {
  switch (filter) {
    case 0: return 0;
    case 1: return a;
    case 2: return b;
    case 3: return (a + b) >>> 1;
    default: return paeth(a, b, c);
  }
}
function chunkLength(bytes, position) {
  requireValid(bytes.length - position >= 12);
  const length = u32(bytes, position);
  requireValid(length <= 0x7fffffff && length <= bytes.length - position - 12);
  return length;
}
function chunkType(bytes, position) {
  let type = "";
  for (let i = 0; i < 4; i++) {
    const value = bytes[position + 4 + i];
    requireValid((value >= 65 && value <= 90) || (value >= 97 && value <= 122));
    if (i === 2) requireValid(value >= 65 && value <= 90);
    type += String.fromCharCode(value);
  }
  return type;
}
function accountAncillary(type, length, state) {
  if (type === "IDAT" || type === "IHDR" || type === "IEND") return;
  state.ancillary += length;
  if (state.ancillary > 65536) fail("PNG_LIMIT");
}
function admitHeader(b, chunks, state) {
  requireValid(chunks === 1 && b.length === 13);
  state.width = u32(b, 0); state.height = u32(b, 4); geometry(state.width, state.height);
  state.colorType = b[9];
  requireValid(b[10] === 0 && b[11] === 0 && b[12] <= 1);
  if (b[8] !== 8 || (state.colorType !== 2 && state.colorType !== 6) || b[12] !== 0) fail("PNG_UNSUPPORTED");
  state.channels = state.colorType === 2 ? 3 : 4;
}
function admitChunk(type, b, chunks, atEnd, state, parts) {
  switch (type) {
    case "IHDR": admitHeader(b, chunks, state); break;
    case "IDAT":
      requireValid(!state.closedIDAT); state.idat = true; parts.push(b); break;
    case "IEND":
      requireValid(b.length === 0 && state.idat && atEnd); return true;
    default: metadata(type, b, state);
  }
  return false;
}
function admitChunks(bytes, state, parts) {
  let position = 8, chunks = 0;
  while (position < bytes.length) {
    if (++chunks > 4096) fail("PNG_LIMIT");
    const length = chunkLength(bytes, position);
    const type = chunkType(bytes, position);
    accountAncillary(type, length, state);
    requireValid(crc(bytes, position + 4, position + 8 + length) === u32(bytes, position + 8 + length));
    requireValid(chunks !== 1 || type === "IHDR");
    const b = bytes.subarray(position + 8, position + 8 + length);
    position += length + 12;
    if (type !== "IDAT" && state.idat) state.closedIDAT = true;
    if (admitChunk(type, b, chunks, position === bytes.length, state, parts)) return;
  }
  fail();
}
function renderingConsistency(rendering) {
  if (!rendering.sRGB) return;
  if (rendering.gAMA) requireValid(u32(rendering.gAMA, 0) === 45455);
  if (rendering.cHRM) requireValid(SRGB_CHRM.every((value, i) => u32(rendering.cHRM, i * 4) === value));
}
function reconstructRow(filtered, row, stride, channels) {
  const filter = filtered[row];
  requireValid(filter <= 4);
  for (let x = 0; x < stride; x++) {
    const p = row + 1 + x;
    const a = x >= channels ? filtered[p - channels] : 0;
    const b = row ? filtered[p - stride - 1] : 0;
    const c = row && x >= channels ? filtered[p - stride - 1 - channels] : 0;
    filtered[p] = (filtered[p] + filterPrediction(filter, a, b, c)) & 255;
    if (channels === 4 && x % 4 === 3 && filtered[p] !== 255) fail("PNG_UNSUPPORTED");
  }
}
function reconstructRaster(filtered, stride, height, channels) {
  for (let y = 0; y < height; y++) reconstructRow(filtered, y * (stride + 1), stride, channels);
}
function rgbaRaster(filtered, width, height, stride, channels) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const src = y * (stride + 1) + 1 + x * channels, dest = (y * width + x) * 4;
    data[dest] = filtered[src]; data[dest + 1] = filtered[src + 1]; data[dest + 2] = filtered[src + 2]; data[dest + 3] = 255;
  }
  return data;
}

/** Admit native samples; rendering contains owned, small chunk-data arrays. */
export function admitPNG(bytes) {
  requireValid(bytes instanceof Uint8Array);
  if (bytes.byteLength > MAX_SOURCE_BYTES) fail("PNG_LIMIT");
  requireValid(bytes.length >= 8 && SIGNATURE.every((value, i) => bytes[i] === value));
  const state = {
    seen: new Set(), rendering: {}, palette: 0, idat: false, channels: 0,
    ancillary: 0, closedIDAT: false, width: 0, height: 0, colorType: 0,
  };
  const parts = [];
  admitChunks(bytes, state, parts);
  const { width, height, colorType, channels, rendering } = state;
  renderingConsistency(rendering);
  const stride = width * channels;
  const filtered = inflateRaster(parts, (stride + 1) * height);
  reconstructRaster(filtered, stride, height, channels);
  const data = rgbaRaster(filtered, width, height, stride, channels);
  return { width, height, colorType, data, rendering };
}

function requireOpaqueRGBA(data) {
  for (let p = 3; p < data.length; p += 4) if (data[p] !== 255) fail("PNG_UNSUPPORTED");
}

/** Fresh PNG, using stored DEFLATE blocks to avoid an additional raster copy. */
export function serializePNG(png) {
  const { width, height, colorType, data, rendering = {} } = png;
  geometry(width, height);
  requireValid(colorType === 2 || colorType === 6);
  requireValid(data instanceof Uint8Array && data.length === width * height * 4);
  requireOpaqueRGBA(data);
  const channels = colorType === 2 ? 3 : 4, rowSize = width * channels + 1;
  const rawSize = rowSize * height, compressedSize = rawSize + Math.ceil(rawSize / 65535) * 5 + 6;
  const chunks = ["cHRM", "gAMA", "sRGB"].filter(type => rendering[type]);
  for (const type of chunks) validateRendering(type, rendering[type]);
  renderingConsistency(rendering);
  const length = 8 + 25 + 12 + compressedSize + 12 + chunks.reduce((n, type) => n + 12 + rendering[type].length, 0);
  if (length > MAX_SOURCE_BYTES) fail("PNG_LIMIT");
  const out = new Uint8Array(length); out.set(SIGNATURE);
  let position = 8;
  function start(type, size) {
    put32(out, position, size);
    for (let i = 0; i < 4; i++) out[position + 4 + i] = type.charCodeAt(i);
    return position + 8;
  }
  function finish(size) { put32(out, position + 8 + size, crc(out, position + 4, position + 8 + size)); position += size + 12; }
  let p = start("IHDR", 13);
  put32(out, p, width); put32(out, p + 4, height); out[p + 8] = 8; out[p + 9] = colorType; finish(13);
  for (const type of chunks) { p = start(type, rendering[type].length); out.set(rendering[type], p); finish(rendering[type].length); }
  p = start("IDAT", compressedSize); out[p++] = 0x78; out[p++] = 0x01;
  let a = 1, b = 0, raw = 0;
  while (raw < rawSize) {
    const count = Math.min(65535, rawSize - raw);
    out[p++] = raw + count === rawSize ? 1 : 0;
    out[p++] = count; out[p++] = count >>> 8; out[p++] = ~count; out[p++] = (~count) >>> 8;
    for (let i = 0; i < count; i++, raw++) {
      const column = raw % rowSize;
      const sample = column - 1;
      const value = column === 0 ? 0 : data[(Math.floor(raw / rowSize) * width + Math.floor(sample / channels)) * 4 + sample % channels];
      out[p++] = value; a = (a + value) % 65521; b = (b + a) % 65521;
    }
  }
  put32(out, p, ((b << 16) | a) >>> 0); finish(compressedSize);
  start("IEND", 0); finish(0);
  return out;
}
