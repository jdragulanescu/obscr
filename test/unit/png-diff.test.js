import { PNG } from "pngjs";
import { comparePNGs } from "../../lib/png-diff.js";

function image(width = 1, height = 1, color = [10, 20, 30, 255], colorType = 6) {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) png.data.set(color, i);
  return PNG.sync.write(png, { colorType });
}

function allocations(action) {
  const Original = globalThis.Uint8Array;
  const push = Array.prototype.push;
  const sizes = [];
  globalThis.Uint8Array = new Proxy(Original, {
    construct(target, args) {
      if (typeof args[0] === "number") sizes.push(args[0]);
      return Reflect.construct(target, args);
    },
  });
  // A bounded PNG has at most 4096 chunks. A per-pixel list cannot grow here.
  Array.prototype.push = function (...values) {
    if (this.length + values.length > 4096) throw new Error("Unbounded comparison list");
    return push.apply(this, values);
  };
  try { return { result: action(), sizes }; }
  finally { globalThis.Uint8Array = Original; Array.prototype.push = push; }
}

it.each([2, 6])("compares identical color type %i samples without changing the source bytes", colorType => {
  const original = image(1, 1, [10, 20, 30, 255], colorType);
  const before = Buffer.from(original);
  const result = comparePNGs(original, original);
  expect(result).toMatchObject({ changedPixels: 0, totalPixels: 1, averageDifference: "0.0000" });
  expect([...PNG.sync.read(Buffer.from(result.bytes)).data]).toEqual([0, 0, 0, 255]);
  expect(original).toEqual(before);
});

it("counts RGB sample changes, not PNG encoding or color-type differences", () => {
  const result = comparePNGs(image(1, 1, [10, 20, 30, 255], 2), image());
  expect(result).toMatchObject({ changedPixels: 0, totalPixels: 1, averageDifference: "0.0000" });
});

it("counts each changed pixel once across all three channels and caps amplification", () => {
  const result = comparePNGs(image(1, 1, [0, 0, 0, 255]), image(1, 1, [255, 255, 255, 255]));
  expect(result).toMatchObject({ changedPixels: 1, totalPixels: 1, averageDifference: "255.0000" });
  expect([...PNG.sync.read(Buffer.from(result.bytes)).data]).toEqual([77, 255, 102, 255]);
});

it.each([
  [undefined, image(), "PNG_INVALID"],
  [image(), undefined, "PNG_INVALID"],
  [new Uint8Array([1, 2, 3]), image(), "PNG_INVALID"],
  [image(), new Uint8Array([1, 2, 3]), "PNG_INVALID"],
  [image(), image(2, 1), "DIMENSIONS"],
  [image(), image(1, 2), "DIMENSIONS"],
  [image(), image(1, 1, [10, 20, 30, 254]), "PNG_UNSUPPORTED"],
  [image(), new Uint8Array(16777217), "PNG_LIMIT"],
])("refuses invalid pair %# without a successful empty comparison", (first, second, code) => {
  expect(() => comparePNGs(first, second)).toThrow(expect.objectContaining({ code }));
});

it("does not allocate a second raster after later admission fails, and permits a fresh pair", () => {
  const first = image(32, 32);
  const { sizes } = allocations(() => {
    expect(() => comparePNGs(first, new Uint8Array([1, 2, 3])))
      .toThrow(expect.objectContaining({ code: "PNG_INVALID" }));
  });
  expect(sizes.filter(size => size === 4096)).toEqual([4096]);
  expect(comparePNGs(first, first)).toMatchObject({ changedPixels: 0, totalPixels: 1024 });
});

it.each([2, 6])("compares a fully changed maximum pair of color type %i with two rasters and no pixel list", colorType => {
  const first = image(1024, 1024, [0, 0, 0, 255], colorType);
  const second = image(1024, 1024, [255, 255, 255, 255], colorType);
  const { result, sizes } = allocations(() => comparePNGs(first, second));
  expect(result).toMatchObject({ changedPixels: 1048576, totalPixels: 1048576, averageDifference: "255.0000" });
  expect(sizes.filter(size => size === 4194304)).toEqual([4194304, 4194304]);
  const filteredSize = colorType === 2 ? 3146752 : 4195328;
  expect(sizes.filter(size => size === filteredSize)).toEqual([filteredSize, filteredSize]);
  expect(Math.max(...sizes)).toBeLessThanOrEqual(4195789);
  const decoded = PNG.sync.read(Buffer.from(result.bytes));
  expect([...decoded.data.subarray(0, 4)]).toEqual([77, 255, 102, 255]);
  expect([...decoded.data.subarray(-4)]).toEqual([77, 255, 102, 255]);
});
