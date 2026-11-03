import { createProtectedTransport } from "../../lib/protected-transport.js";
import { createProtectedImage } from "../../lib/protected-image.js";
import { generateImageDiff } from "../../app/src/lib/steg.js";
import { cover } from "../fixtures/protected.js";

function controlledRuntime() {
  const workers = [];
  const api = createProtectedTransport((reply, failed) => {
    const execute = createProtectedImage();
    const pending = [];
    const runtime = {
      reply, failed, pending,
      async deliver() {
        const request = pending.shift();
        reply({ id: request.id, result: await execute(request) });
      },
      post: request => pending.push(request),
      stop: () => {},
    };
    workers.push(runtime);
    return runtime;
  });
  return { api, workers };
}
const fields = () => ({ pngBytes: cover(256, 168), message: "", compress: false });

it("suppresses a late cancelled reply while the new generation completes", async () => {
  const { api, workers } = controlledRuntime();
  const controller = new AbortController();
  const old = api.prepareEncode(fields(), { signal: controller.signal });
  controller.abort();
  expect(await old).toMatchObject({ ok: false, code: "CANCELLED" });
  const fresh = api.prepareEncode(fields());
  await workers[0].deliver();
  await workers[1].deliver();
  const result = await fresh;
  expect(result).toMatchObject({ ok: true, hasFrameCapacity: true, fits: true });
  const release = api.discard(result.preparation);
  await workers[1].deliver();
  expect(await release).toEqual({ ok: true, discarded: true });
});

it("keeps competing work blocked until cancellation has stopped the old worker", async () => {
  const { api, workers } = controlledRuntime();
  const controller = new AbortController();
  let stopped;
  const pending = api.prepareEncode(fields(), { signal: controller.signal });
  workers[0].stop = () => new Promise(resolve => { stopped = resolve; });
  controller.abort();
  expect(await api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });
  const file = new Blob([cover(256, 168)]);
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "BUSY" });
  stopped();
  expect(await pending).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "WORKER_FAILED" });
  const fresh = api.prepareEncode(fields());
  await workers[1].deliver();
  const result = await fresh;
  const release = api.discard(result.preparation);
  await workers[1].deliver();
  await release;
});

it("invalidates idle handles on worker exit and permits a new worker", async () => {
  const { api, workers } = controlledRuntime();
  const pending = api.prepareEncode(fields());
  await workers[0].deliver();
  const result = await pending;
  workers[0].failed();
  expect(await api.discard(result.preparation)).toEqual({ ok: true, discarded: false });
  const fresh = api.prepareEncode(fields());
  workers[0].reply({ id: 2, result: { ok: true, preparation: { generation: 1, revision: 1 } } });
  await workers[1].deliver();
  const next = await fresh;
  expect(next).toMatchObject({ ok: true, storedBytes: 0 });
  const release = api.discard(next.preparation);
  await workers[1].deliver();
  await release;
});

it("reports missing workers/CSP instead of running image work on the caller", async () => {
  const api = createProtectedTransport(() => { throw new Error("private CSP error"); });
  const result = await api.prepareEncode(fields());
  expect(result).toMatchObject({ ok: false, code: "WORKER_FAILED" });
  expect(result).not.toHaveProperty("preparation");
  expect(result.error).not.toContain("private CSP");
});

it("a throwing presentation callback cannot strand an operation or lease", async () => {
  const { api, workers } = controlledRuntime();
  const pending = api.prepareEncode(fields(), { onProgress: () => { throw new Error("UI"); } });
  workers[0].reply({ id: 1, progress: "checking inputs" });
  await workers[0].deliver();
  const result = await pending;
  expect(result).toMatchObject({ ok: true, fits: true });
  const release = api.discard(result.preparation);
  await workers[0].deliver();
  await release;
});

it("an already cancelled replacement releases an idle preparation", async () => {
  const { api, workers } = controlledRuntime();
  const pending = api.prepareEncode(fields());
  await workers[0].deliver();
  const result = await pending;
  const controller = new AbortController();
  controller.abort();
  expect(await api.prepareEncode(fields(), { signal: controller.signal })).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(await api.discard(result.preparation)).toEqual({ ok: true, discarded: false });
});

it("reserves the raster budget until the retained preparation is discarded", async () => {
  const { api, workers } = controlledRuntime();
  const pending = api.prepareEncode({ pngBytes: cover(1024, 1024), message: "", compress: false });
  await workers[0].deliver();
  const result = await pending;
  const file = new Blob([cover(1024, 1024)]);
  const comparison = await generateImageDiff(file, file);
  const release = api.discard(result.preparation);
  await workers[0].deliver();
  await release;
  expect(comparison).toMatchObject({ ok: false, code: "BUSY" });
  // This reaches the browser boundary only after preparation releases its raster.
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "WORKER_FAILED" });
});

it("settles active worker failure only after termination, ignores late replies and restarts", async () => {
  const { api, workers } = controlledRuntime();
  let stopped;
  const pending = api.prepareEncode(fields());
  workers[0].stop = () => new Promise(resolve => { stopped = resolve; });
  workers[0].failed();
  expect(await api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });
  const file = new Blob([cover(256, 168)]);
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "BUSY" });
  await workers[0].deliver();
  stopped();
  expect(await pending).toMatchObject({ ok: false, code: "WORKER_FAILED" });
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "WORKER_FAILED" });
  const fresh = api.prepareEncode(fields());
  await workers[1].deliver();
  const result = await fresh;
  expect(result).toMatchObject({ ok: true, fits: true });
  const release = api.discard(result.preparation);
  await workers[1].deliver();
  await release;
});

it("lets the owner replace a retained preparation without releasing its raster budget", async () => {
  const { api, workers } = controlledRuntime();
  const other = controlledRuntime();
  const pending = api.prepareEncode(fields());
  await workers[0].deliver();
  const first = await pending;
  expect(await other.api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });
  expect(other.workers).toHaveLength(0);

  const replacement = api.prepareEncode({ ...fields(), message: "new text" });
  expect(await api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });
  await workers[0].deliver();
  const next = await replacement;
  expect(next).toMatchObject({ ok: true, originalBytes: 8 });
  expect(next.preparation).not.toBe(first.preparation);
  expect(await api.discard(first.preparation)).toEqual({ ok: true, discarded: false });
  expect(await other.api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });

  const release = api.discard(next.preparation);
  await workers[0].deliver();
  expect(await release).toEqual({ ok: true, discarded: true });
  const fresh = other.api.prepareEncode(fields());
  await other.workers[0].deliver();
  const result = await fresh;
  expect(result).toMatchObject({ ok: true, fits: true });
  const cleanup = other.api.discard(result.preparation);
  await other.workers[0].deliver();
  await cleanup;
});

it("keeps resources reserved until discarding has stopped the retained worker", async () => {
  const { api, workers } = controlledRuntime();
  const pending = api.prepareEncode(fields());
  await workers[0].deliver();
  const result = await pending;
  let stopped;
  workers[0].stop = () => new Promise(resolve => { stopped = resolve; });
  const release = api.discard(result.preparation);
  await workers[0].deliver();
  expect(await api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });
  const file = new Blob([cover(256, 168)]);
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "BUSY" });
  stopped();
  expect(await release).toEqual({ ok: true, discarded: true });
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "WORKER_FAILED" });
});

it("holds the lease through failed replacement termination and then permits fresh work", async () => {
  const { api, workers } = controlledRuntime();
  const pending = api.prepareEncode(fields());
  await workers[0].deliver();
  const result = await pending;
  let stopped;
  workers[0].stop = () => new Promise(resolve => { stopped = resolve; });
  const invalid = api.prepareEncode({ ...fields(), message: null });
  expect(await api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });
  const file = new Blob([cover(256, 168)]);
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "BUSY" });
  stopped();
  expect(await invalid).toMatchObject({ ok: false, code: "INPUT_INVALID" });
  expect(await api.discard(result.preparation)).toEqual({ ok: true, discarded: false });
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "WORKER_FAILED" });

  const fresh = api.prepareEncode(fields());
  await workers[1].deliver();
  const next = await fresh;
  expect(next).toMatchObject({ ok: true, fits: true });
  const release = api.discard(next.preparation);
  await workers[1].deliver();
  await release;
});

it("blocks all image work while an idle failed worker is still stopping", async () => {
  const { api, workers } = controlledRuntime();
  const pending = api.prepareEncode(fields());
  await workers[0].deliver();
  const result = await pending;
  let stopped;
  const termination = new Promise(resolve => { stopped = resolve; });
  workers[0].stop = () => termination;
  workers[0].failed();
  expect(await api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });
  expect(await api.discard(result.preparation)).toMatchObject({ ok: false, code: "BUSY" });
  const file = new Blob([cover(256, 168)]);
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "BUSY" });
  stopped();
  await termination;
  expect(await api.discard(result.preparation)).toEqual({ ok: true, discarded: false });
  expect(await generateImageDiff(file, file)).toMatchObject({ ok: false, code: "WORKER_FAILED" });

  const fresh = api.prepareEncode(fields());
  workers[0].reply({ id: 2, result: { ok: true, preparation: { generation: 1, revision: 1 } } });
  await workers[1].deliver();
  const next = await fresh;
  expect(next).toMatchObject({ ok: true, fits: true });
  const release = api.discard(next.preparation);
  await workers[1].deliver();
  await release;
});

it.each([
  [undefined, "INPUT_INVALID"],
  ["", "INPUT_INVALID"],
  ["x".repeat(1025), "INPUT_LIMIT"],
])("invalid encode input releases the consumed handle only after worker termination (%#)", async (password, code) => {
  const { api, workers } = controlledRuntime();
  const other = controlledRuntime();
  const pending = api.prepareEncode(fields());
  await workers[0].deliver();
  const prepared = await pending;
  let stopped;
  workers[0].stop = () => new Promise(resolve => { stopped = resolve; });

  const invalid = api.encode({ preparation: prepared.preparation, password });
  expect(workers[0].pending).toEqual([]);
  expect(await other.api.prepareEncode(fields())).toMatchObject({ ok: false, code: "BUSY" });
  stopped();
  const result = await invalid;
  expect(result).toMatchObject({ ok: false, code });
  expect(result).not.toHaveProperty("pngBytes");
  expect(await api.encode({ preparation: prepared.preparation, password: "public" }))
    .toMatchObject({ ok: false, code: "PREPARATION_INVALID" });

  const fresh = other.api.prepareEncode(fields());
  await other.workers[0].deliver();
  const next = await fresh;
  expect(next).toMatchObject({ ok: true, fits: true });
  const cleanup = other.api.discard(next.preparation);
  await other.workers[0].deliver();
  expect(await cleanup).toEqual({ ok: true, discarded: true });
});
