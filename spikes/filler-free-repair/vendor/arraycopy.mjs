// Local replacement for ZXing's System.arraycopy, for disjoint Int32Array ranges.
export function arraycopy(source, sourceOffset, target, targetOffset, length) {
  target.set(source.subarray(sourceOffset, sourceOffset + length), targetOffset);
}
