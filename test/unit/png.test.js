import { deflateSync, inflateSync, gzipSync } from "node:zlib";
import { PNG } from "pngjs";
import { admitPNG, serializePNG, MAX_SOURCE_BYTES } from "../../lib/png.js";

// Independent wire fixtures: CRC is deliberately bitwise, not the parser's table.
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function crc(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c ^= byte;
    for (let bit = 0; bit < 8; bit++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function integers(...values) {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((value, i) => bytes.writeUInt32BE(value, i * 4));
  return bytes;
}
function chunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type);
  return Buffer.concat([integers(data.length), name, data, integers(crc(Buffer.concat([name, data])))]);
}
function header({ width = 1, height = 1, colorType = 2, depth = 8, compression = 0, filter = 0, interlace = 0 } = {}) {
  return chunk("IHDR", Buffer.concat([integers(width, height), Buffer.from([depth, colorType, compression, filter, interlace])]));
}
function file(...chunks) { return Buffer.concat([signature, ...chunks]); }
function fixture({ raw = Buffer.from([0, 19, 127, 241]), compressed = deflateSync(raw), before = [], after = [], ...options } = {}) {
  return file(header(options), ...before, chunk("IDAT", compressed), ...after, chunk("IEND"));
}
function rejects(bytes, code = "PNG_INVALID") { expect(() => admitPNG(bytes)).toThrow(expect.objectContaining({ code })); }
function allocationSizes(action) {
  const Original = globalThis.Uint8Array;
  const sizes = [];
  globalThis.Uint8Array = new Proxy(Original, {
    construct(target, args) {
      const value = Reflect.construct(target, args);
      if (typeof args[0] === "number") sizes.push(args[0]);
      return value;
    },
  });
  try { action(); } finally { globalThis.Uint8Array = Original; }
  return sizes;
}
const chrm = integers(31270, 32900, 64000, 33000, 30000, 60000, 15000, 6000);
const exif = Buffer.from([73, 73, 42, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const known = {
  sRGB: Buffer.from([0]), gAMA: integers(45455), cHRM: chrm,
  tEXt: Buffer.from("Author\0Public fixture"),
  zTXt: Buffer.concat([Buffer.from("Note\0\0"), deflateSync("Public")]),
  iTXt: Buffer.from("Note\0\0\0en-US\0Translated\0Public ✓"),
  eXIf: exif,
  tIME: Buffer.from([7, 234, 10, 25, 23, 59, 60]),
  pHYs: Buffer.concat([integers(3780, 3780), Buffer.from([1])]),
  sBIT: Buffer.from([8, 8, 8]), bKGD: Buffer.from([0, 19, 0, 127, 0, 241]),
};

describe("PNG-ADMIT native samples and bounds", () => {
  it.each([2, 6])("accepts minimum dimensions and color type %i without conversion", colorType => {
    const raw = Buffer.from(colorType === 2 ? [0, 19, 127, 241] : [0, 19, 127, 241, 255]);
    const result = admitPNG(fixture({ colorType, raw }));
    expect(result).toMatchObject({ width: 1, height: 1, colorType, rendering: {} });
    expect([...result.data]).toEqual([19, 127, 241, 255]);
  });
  it.each([2, 6])("accepts maximum dimensions for color type %i within one filtered and one RGBA allocation", colorType => {
    const channels = colorType === 2 ? 3 : 4;
    const row = Buffer.alloc(1024 * channels + 1, 255); row[0] = 0;
    const bytes = fixture({ width: 1024, height: 1024, colorType, raw: Buffer.concat(Array(1024).fill(row)) });
    let result;
    const sizes = allocationSizes(() => { result = admitPNG(bytes); });
    expect(result.data.length).toBe(4194304);
    expect(result.data[0]).toBe(255);
    expect(result.data[result.data.length - 1]).toBe(255);
    expect(sizes.filter(n => n > 32768)).toEqual([(1024 * channels + 1) * 1024, 4194304]);
  });
  it.each([0, 1, 2, 3, 4])("reconstructs filter %i across RGB/RGBA pixels and rows", filter => {
    for (const channels of [3, 4]) {
      const width = 3, height = 3, stride = width * channels;
      const samples = Buffer.alloc(stride * height);
      for (let i = 0; i < samples.length; i++) samples[i] = channels === 4 && i % 4 === 3 ? 255 : (i * 73 + 29) % 256;
      const raw = Buffer.alloc((stride + 1) * height);
      for (let y = 0; y < height; y++) {
        raw[y * (stride + 1)] = filter;
        for (let x = 0; x < stride; x++) {
          const i = y * stride + x, a = x >= channels ? samples[i - channels] : 0;
          const b = y ? samples[i - stride] : 0, c = y && x >= channels ? samples[i - stride - channels] : 0;
          const distances = [Math.abs(b - c), Math.abs(a - c), Math.abs(a + b - 2 * c)];
          const paeth = [a, b, c][distances.indexOf(Math.min(...distances))];
          const prediction = [0, a, b, Math.floor((a + b) / 2), paeth][filter];
          raw[y * (stride + 1) + 1 + x] = (samples[i] - prediction) & 255;
        }
      }
      const result = admitPNG(fixture({ width, height, colorType: channels === 3 ? 2 : 6, raw }));
      const expected = [];
      for (let p = 0; p < samples.length; p += channels) expected.push(samples[p], samples[p + 1], samples[p + 2], 255);
      expect([...result.data]).toEqual(expected);
    }
  });
  it("accepts byte-at-a-time contiguous IDAT and empty IDAT chunks", () => {
    const compressed = deflateSync(Buffer.from([0, 19, 127, 241]));
    const bytes = file(header(), chunk("IDAT"), ...[...compressed].map(byte => chunk("IDAT", Buffer.from([byte]))), chunk("IDAT"), chunk("IEND"));
    expect([...admitPNG(bytes).data]).toEqual([19, 127, 241, 255]);
  });
  it.each([{ width: 0 }, { height: 0 }])("refuses zero geometry %j", options => rejects(fixture(options)));
  it.each([{ width: 1025 }, { height: 1025 }, { width: 0xffffffff, height: 0xffffffff }])("refuses declared excessive geometry before raster allocation %j", options => {
    const bytes = fixture(options);
    expect(allocationSizes(() => rejects(bytes, "PNG_LIMIT"))).toEqual([]);
  });
  it("refuses an excessive source before allocating", () => {
    const bytes = new Uint8Array(MAX_SOURCE_BYTES + 1);
    expect(allocationSizes(() => rejects(bytes, "PNG_LIMIT"))).toEqual([]);
  });
  it("accepts exactly 16 MiB of valid bounded input", () => {
    // Empty stored blocks add compressed bytes without adding raster samples.
    const base = deflateSync(Buffer.from([0, 19, 127, 241]));
    const blocks = Math.floor((MAX_SOURCE_BYTES - 57 - base.length - 14) / 5);
    const padding = Buffer.alloc(blocks * 5);
    for (let p = 0; p < padding.length; p += 5) { padding[p + 3] = 255; padding[p + 4] = 255; }
    const compressed = Buffer.concat([base.subarray(0, 2), padding, base.subarray(2)]);
    const textLength = MAX_SOURCE_BYTES - 57 - compressed.length - 12;
    const text = Buffer.alloc(textLength, 65); text[1] = 0;
    const bytes = fixture({ compressed, before: [chunk("tEXt", text)] });
    expect(bytes.length).toBe(MAX_SOURCE_BYTES);
    expect([...admitPNG(bytes).data]).toEqual([19, 127, 241, 255]);
  });
  it("stops a high-expansion stream at the declared raster, without allocating the expansion", () => {
    const bytes = fixture({ compressed: deflateSync(Buffer.alloc(8 * 1024 * 1024)) });
    const sizes = allocationSizes(() => rejects(bytes));
    expect(Math.max(...sizes)).toBeLessThanOrEqual(32768);
    expect(sizes.reduce((sum, n) => sum + n, 0)).toBeLessThan(65536);
    expect(sizes).toContain(4);
  });
  it("enforces the exact chunk-count boundary", () => {
    const compressed = deflateSync(Buffer.from([0, 19, 127, 241]));
    const at = file(header(), chunk("IDAT", compressed), ...Array.from({ length: 4093 }, () => chunk("IDAT")), chunk("IEND"));
    expect(admitPNG(at).width).toBe(1);
    const over = file(header(), chunk("IDAT", compressed), ...Array.from({ length: 4094 }, () => chunk("IDAT")), chunk("IEND"));
    expect(allocationSizes(() => rejects(over, "PNG_LIMIT"))).toEqual([]);
  });
  it("enforces the ancillary-data boundary before raster allocation", () => {
    for (const size of [65536, 65537]) {
      const text = Buffer.alloc(size, 65); text[1] = 0;
      const bytes = fixture({ before: [chunk("tEXt", text)] });
      if (size === 65536) expect(admitPNG(bytes).width).toBe(1);
      else expect(allocationSizes(() => rejects(bytes, "PNG_LIMIT"))).toEqual([]);
    }
  });
});

describe("PNG-ADMIT invalid framing and compressed streams", () => {
  it("refuses every partial prefix of a valid input", () => {
    const bytes = fixture();
    for (let length = 0; length < bytes.length; length++) rejects(bytes.subarray(0, length));
  });
  it("refuses non-byte inputs", () => { for (const value of [null, {}, [], new ArrayBuffer(8)]) rejects(value); });
  it("refuses a bad signature and CRC", () => {
    const signatureError = fixture(); signatureError[0] ^= 1; rejects(signatureError);
    const crcError = fixture(); crcError[29] ^= 1; rejects(crcError);
  });
  it("checks declared chunk lengths against the remaining source", () => {
    for (const length of [1000, 0x7fffffff, 0xffffffff]) {
      const bytes = fixture(); bytes.writeUInt32BE(length, 8);
      expect(allocationSizes(() => rejects(bytes))).toEqual([]);
    }
  });
  it.each([
    ["first chunk", () => file(chunk("tEXt", Buffer.from("A\0B")), header(), chunk("IEND"))],
    ["duplicate header", () => file(header(), header(), chunk("IEND"))],
    ["short header", () => file(chunk("IHDR", Buffer.alloc(12)), chunk("IEND"))],
    ["missing IDAT", () => file(header(), chunk("IEND"))],
    ["empty stream", () => fixture({ compressed: Buffer.alloc(0) })],
    ["noncontiguous IDAT", () => file(header(), chunk("IDAT", deflateSync(Buffer.from([0, 19, 127, 241]))), chunk("tEXt", Buffer.from("A\0B")), chunk("IDAT"), chunk("IEND"))],
    ["nonempty IEND", () => file(header(), chunk("IDAT"), chunk("IEND", Buffer.from([0])))],
    ["duplicate IEND", () => Buffer.concat([fixture(), chunk("IEND")])],
    ["trailing file byte", () => Buffer.concat([fixture(), Buffer.from([0])])],
    ["illegal chunk name", () => fixture({ before: [chunk("te1t")] })],
    ["reserved lowercase name bit", () => fixture({ before: [chunk("test")] })],
    ["bad filter", () => fixture({ raw: Buffer.from([5, 19, 127, 241]) })],
    ["early raster", () => fixture({ raw: Buffer.from([0, 19, 127]) })],
    ["long raster", () => fixture({ raw: Buffer.from([0, 19, 127, 241, 0]) })],
    ["second zlib stream", () => fixture({ compressed: Buffer.concat([deflateSync(Buffer.from([0, 19, 127, 241])), deflateSync(Buffer.alloc(0))]) })],
    ["trailing compressed byte", () => fixture({ compressed: Buffer.concat([deflateSync(Buffer.from([0, 19, 127, 241])), Buffer.from([0])]) })],
    ["truncated zlib trailer", () => fixture({ compressed: deflateSync(Buffer.from([0, 19, 127, 241])).subarray(0, -1) })],
    ["gzip instead of zlib", () => fixture({ compressed: gzipSync(Buffer.from([0, 19, 127, 241])) })],
    ["invalid deflate", () => fixture({ compressed: Buffer.from([0x78, 0x9c, 7, 0, 0, 0, 0]) })],
    ["compression method", () => fixture({ compression: 1 })],
    ["filter method", () => fixture({ filter: 1 })],
    ["invalid interlace", () => fixture({ interlace: 2 })],
  ])("refuses %s", (_label, make) => rejects(make()));
  it("checks the zlib checksum", () => {
    const compressed = deflateSync(Buffer.from([0, 19, 127, 241])); compressed[compressed.length - 1] ^= 1;
    rejects(fixture({ compressed }));
  });
  it.each([{ colorType: 0 }, { colorType: 3 }, { colorType: 4 }, { depth: 16 }, { depth: 1 }, { interlace: 1 }])("refuses unsupported samples %j", options => rejects(fixture(options), "PNG_UNSUPPORTED"));
  it.each([0, 1, 254])("refuses alpha %i without returning a partial raster", alpha => rejects(fixture({ colorType: 6, raw: Buffer.from([0, 19, 127, 241, alpha]) }), "PNG_UNSUPPORTED"));
  it.each(["tRNS", "acTL", "fcTL", "fdAT", "iCCP", "cICP", "mDCV", "cLLI", "vpAg", "ABCD"])("refuses unsupported chunk %s", type => rejects(fixture({ before: [chunk(type)] }), "PNG_UNSUPPORTED"));
});

describe("PNG-ADMIT rendering and discardable metadata", () => {
  it.each(Object.entries(known))("admits structurally valid %s without changing samples", (type, data) => {
    const result = admitPNG(fixture({ before: [chunk(type, data)] }));
    expect([...result.data]).toEqual([19, 127, 241, 255]);
    expect(Object.keys(result.rendering)).toEqual(["sRGB", "gAMA", "cHRM"].includes(type) ? [type] : []);
    if (result.rendering[type]) expect([...result.rendering[type]]).toEqual([...data]);
  });
  it("admits all rendering declarations together and owns their bytes", () => {
    const bytes = fixture({ before: [chunk("sRGB", known.sRGB), chunk("gAMA", known.gAMA), chunk("cHRM", chrm)] });
    const result = admitPNG(bytes); bytes.fill(0);
    expect([...result.rendering.cHRM]).toEqual([...chrm]);
    expect([...result.rendering.gAMA]).toEqual([...known.gAMA]);
  });
  it("accepts compressed text without expanding it", () => {
    const bomb = deflateSync(Buffer.alloc(8 * 1024 * 1024));
    const bytes = fixture({ before: [chunk("zTXt", Buffer.concat([Buffer.from("A\0\0"), bomb])), chunk("iTXt", Buffer.concat([Buffer.from([65, 0, 1, 0, 0, 0]), bomb]))] });
    const sizes = allocationSizes(() => expect(admitPNG(bytes).width).toBe(1));
    expect(Math.max(...sizes)).toBeLessThanOrEqual(32768);
  });
  it("accepts an optional palette and matching histogram without quantizing RGB", () => {
    const result = admitPNG(fixture({ before: [chunk("PLTE", Buffer.from([0, 0, 0])), chunk("hIST", Buffer.from([0, 1])), chunk("bKGD", known.bKGD)] }));
    expect([...result.data]).toEqual([19, 127, 241, 255]);
  });
  it("accepts metadata value and size boundaries", () => {
    for (const intent of [0, 1, 2, 3]) expect(admitPNG(fixture({ before: [chunk("sRGB", Buffer.from([intent]))] })).width).toBe(1);
    for (const gamma of [1, 0xffffffff]) expect(admitPNG(fixture({ before: [chunk("gAMA", integers(gamma))] })).width).toBe(1);
    const keyword79 = Buffer.concat([Buffer.alloc(79, 65), Buffer.from([0])]);
    expect(admitPNG(fixture({ before: [chunk("tEXt", keyword79), chunk("PLTE", Buffer.alloc(768)), chunk("hIST", Buffer.alloc(512))] })).width).toBe(1);
    expect(admitPNG(fixture({ colorType: 6, raw: Buffer.from([0, 19, 127, 241, 255]), before: [chunk("sBIT", Buffer.from([1, 8, 1, 8]))] })).colorType).toBe(6);
    const bigEndianExif = Buffer.from([77, 77, 0, 42, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0]);
    expect(admitPNG(fixture({ before: [chunk("eXIf", bigEndianExif)] })).width).toBe(1);
  });
  it("counts optional PLTE data toward the ancillary limit", () => {
    const text = Buffer.alloc(65534, 65); text[1] = 0;
    rejects(fixture({ before: [chunk("tEXt", text), chunk("PLTE", Buffer.alloc(3))] }), "PNG_LIMIT");
  });
  it("refuses malformed compressed-text envelopes without inflating them", () => {
    for (const payload of [Buffer.from([0x78, 0, 0, 0, 0, 0]), Buffer.from([0x78, 0x20, 0, 0, 0, 0])]) {
      rejects(fixture({ before: [chunk("zTXt", Buffer.concat([Buffer.from([65, 0, 0]), payload]))] }));
      rejects(fixture({ before: [chunk("iTXt", Buffer.concat([Buffer.from([65, 0, 1, 0, 0, 0]), payload]))] }));
    }
  });
  it.each(["sRGB", "gAMA", "cHRM", "pHYs", "sBIT", "bKGD", "eXIf", "tIME"])("refuses duplicate singleton %s", type => rejects(fixture({ before: [chunk(type, known[type]), chunk(type, known[type])] })));
  it.each(["sRGB", "gAMA", "cHRM", "pHYs", "sBIT", "bKGD"])("refuses late %s", type => rejects(fixture({ after: [chunk(type, known[type])] })));
  it.each(["sRGB", "gAMA", "cHRM", "sBIT"])("refuses %s after PLTE", type => rejects(fixture({ before: [chunk("PLTE", Buffer.from([0, 0, 0])), chunk(type, known[type])] })));
  it.each(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"])("accepts %s after the IDAT run", type => expect(admitPNG(fixture({ after: [chunk(type, known[type])] })).width).toBe(1));
  it.each([
    ["sRGB", Buffer.from([4])], ["sRGB", Buffer.alloc(0)],
    ["gAMA", integers(0)], ["gAMA", Buffer.alloc(3)],
    ["cHRM", Buffer.alloc(31)], ["cHRM", integers(90000, 90000, 0, 0, 0, 0, 0, 0)],
    ["pHYs", Buffer.alloc(8)], ["pHYs", Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 2])],
    ["sBIT", Buffer.from([0, 8, 8])], ["sBIT", Buffer.from([9, 8, 8])], ["sBIT", Buffer.from([8, 8])],
    ["bKGD", Buffer.alloc(5)], ["bKGD", Buffer.from([1, 0, 0, 0, 0, 0])],
    ["hIST", Buffer.from([0, 1])], ["PLTE", Buffer.alloc(0)], ["PLTE", Buffer.alloc(4)], ["PLTE", Buffer.alloc(771)],
    ["tEXt", Buffer.from("\0Text")], ["tEXt", Buffer.from(" A\0Text")], ["tEXt", Buffer.from("A \0Text")], ["tEXt", Buffer.from("A  B\0Text")], ["tEXt", Buffer.from("A\0B\0")], ["tEXt", Buffer.concat([Buffer.alloc(80, 65), Buffer.from([0])])], ["tEXt", Buffer.from([127, 0])],
    ["zTXt", Buffer.from([65, 0, 1, 0])], ["zTXt", Buffer.from([65, 0, 0])],
    ["iTXt", Buffer.from([65, 0, 2, 0, 0, 0])], ["iTXt", Buffer.from([65, 0, 0, 1, 0, 0])], ["iTXt", Buffer.from([65, 0, 0, 0])], ["iTXt", Buffer.from([65, 0, 0, 0, 255, 0, 0])], ["iTXt", Buffer.from([65, 0, 0, 0, 0, 255, 0])], ["iTXt", Buffer.from([65, 0, 0, 0, 0, 0, 255])],
    ["eXIf", Buffer.alloc(7)], ["eXIf", Buffer.alloc(14)], ["eXIf", Buffer.from([73, 73, 42, 0, 255, 255, 255, 255])],
    ["tIME", Buffer.alloc(6)], ["tIME", Buffer.from([7, 234, 13, 25, 23, 59, 0])], ["tIME", Buffer.from([7, 234, 10, 0, 23, 59, 0])], ["tIME", Buffer.from([7, 234, 10, 25, 24, 59, 0])], ["tIME", Buffer.from([7, 234, 10, 25, 23, 60, 0])], ["tIME", Buffer.from([7, 234, 10, 25, 23, 59, 61])],
  ])("refuses malformed %s data %j", (type, data) => rejects(fixture({ before: [chunk(type, data)] })));
  it("refuses rendering declarations that conflict with sRGB", () => {
    rejects(fixture({ before: [chunk("sRGB", known.sRGB), chunk("gAMA", integers(100000))] }));
    rejects(fixture({ before: [chunk("sRGB", known.sRGB), chunk("cHRM", Buffer.alloc(32))] }));
  });
  it("refuses palette ordering, duplicates and invalid histogram size", () => {
    const palette = chunk("PLTE", Buffer.from([0, 0, 0]));
    rejects(fixture({ before: [palette, palette] }));
    rejects(fixture({ after: [palette] }));
    rejects(fixture({ before: [chunk("bKGD", known.bKGD), palette] }));
    rejects(fixture({ before: [palette, chunk("hIST", Buffer.alloc(4))] }));
    rejects(fixture({ before: [palette], after: [chunk("hIST", Buffer.alloc(2))] }));
  });
});

describe("minimal shared PNG serialization", () => {
  it.each([
    { sRGB: new Uint8Array([4]) },
    { gAMA: integers(0) },
    { cHRM: new Uint8Array(31) },
    { sRGB: new Uint8Array([0]), gAMA: integers(100000) },
    { sRGB: new Uint8Array([0]), cHRM: new Uint8Array(32) },
    { sRGB: [0] },
  ])("refuses invalid rendering state before producing output: %j", rendering => {
    const png = admitPNG(fixture());
    png.rendering = rendering;
    expect(() => serializePNG(png)).toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
    expect([...png.data]).toEqual([19, 127, 241, 255]);
  });
  it.each([2, 6])("writes independently readable color type %i with exact samples", colorType => {
    const raw = Buffer.from(colorType === 2 ? [0, 19, 127, 241] : [0, 19, 127, 241, 255]);
    const png = admitPNG(fixture({ colorType, raw, before: [chunk("tEXt", known.tEXt), chunk("sRGB", known.sRGB), chunk("gAMA", known.gAMA), chunk("cHRM", known.cHRM)] }));
    const encoded = serializePNG(png);
    const independent = PNG.sync.read(Buffer.from(encoded));
    expect([...independent.data]).toEqual([...png.data]);
    expect(admitPNG(encoded).colorType).toBe(colorType);
    const types = [];
    for (let p = 8; p < encoded.length;) {
      const b = Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength), size = b.readUInt32BE(p), type = b.toString("ascii", p + 4, p + 8);
      types.push(type);
      if (type === "IDAT") expect([...inflateSync(b.subarray(p + 8, p + 8 + size))]).toEqual([...raw]);
      p += size + 12;
    }
    expect(types).toEqual(["IHDR", "cHRM", "gAMA", "sRGB", "IDAT", "IEND"]);
  });
  it("writes multiple stored DEFLATE blocks without an extra full-raster allocation", () => {
    const png = { width: 1024, height: 1024, colorType: 6, data: new Uint8Array(4194304).fill(255), rendering: { cHRM: chrm, gAMA: known.gAMA, sRGB: known.sRGB } };
    let bytes;
    const sizes = allocationSizes(() => { bytes = serializePNG(png); });
    expect(sizes).toEqual([bytes.length]);
    expect(bytes.length).toBe(4195789);
    const decoded = PNG.sync.read(Buffer.from(bytes));
    expect(decoded.data.equals(Buffer.from(png.data))).toBe(true);
    const admitted = admitPNG(bytes);
    for (const type of ["cHRM", "gAMA", "sRGB"]) expect(Buffer.from(admitted.rendering[type])).toEqual(png.rendering[type]);
  });
  it("does not require Buffer or process globals", () => {
    const bytes = new Uint8Array(fixture());
    const savedBuffer = globalThis.Buffer, savedProcess = globalThis.process;
    let result;
    try {
      globalThis.Buffer = undefined; globalThis.process = undefined;
      result = admitPNG(serializePNG(admitPNG(bytes)));
    } finally { globalThis.Buffer = savedBuffer; globalThis.process = savedProcess; }
    expect([...result.data]).toEqual([19, 127, 241, 255]);
  });
});
