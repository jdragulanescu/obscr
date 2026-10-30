// Test-only runtime observers. All constructors/methods delegate to the real
// implementation; no observation is part of a request or worker result.
export function observeAllocations() {
  const originals = { Uint8Array, Uint16Array, Uint32Array, Map };
  const allocations = { Uint8Array: [], Uint16Array: [], Uint32Array: [] };
  const maps = [];
  const saltReads = [];
  let domainAllocated = false;
  let readingSalt = true;
  for (const name of ["Uint8Array", "Uint16Array", "Uint32Array"]) {
    globalThis[name] = new Proxy(originals[name], {
      construct(Target, args) {
        const value = new Target(...args);
        // Views over existing buffers do not allocate application storage.
        if (!(args[0] instanceof ArrayBuffer)) allocations[name].push(value.byteLength);
        if (name === "Uint32Array" && value.length === 786432) domainAllocated = true;
        if (name !== "Uint8Array" || value.length !== 4194304) return value;
        // Maximum admitted RGBA: after the eligible domain allocation the
        // remaining pre-KDF raster accesses must be exactly the 128 salt reads.
        return new Proxy(value, { get(target, key) {
          if (domainAllocated && readingSalt && typeof key === "string" && /^\d+$/.test(key)) saltReads.push(Number(key));
          const item = Reflect.get(target, key, target);
          return typeof item === "function" ? item.bind(target) : item;
        } });
      },
    });
  }
  globalThis.Map = class ObservedMap extends originals.Map {
    constructor(...args) { super(...args); this.peak = this.size; maps.push(this); }
    set(key, value) { super.set(key, value); this.peak = Math.max(this.peak ?? 0, this.size); return this; }
  };
  return {
    allocations, maps, saltReads,
    stopSalt() { readingSalt = false; },
    restore() { Object.assign(globalThis, originals); },
  };
}
