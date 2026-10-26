import { admitImage, estimateCapacity } from "../../app/src/lib/steg.js";

// The transport fake controls timing and failures; parser requests are also
// exercised against the real worker in browser-png-worker.test.js.
const originalWorker = globalThis.Worker;
let workers;
class ControlledWorker {
  constructor() { workers.push(this); }
  postMessage(request) { this.request = request; }
  terminate() { this.terminated = true; }
  reply(result, id = this.request.id) { this.onmessage({ data: { id, result } }); }
}
beforeEach(() => { workers = []; globalThis.Worker = ControlledWorker; });
afterEach(() => { globalThis.Worker = originalWorker; });

it("cancels obsolete capacity work and ignores its reply after a replacement starts", async () => {
  const controller = new AbortController();
  const first = estimateCapacity(new Blob(["first"]), "message", false, { signal: controller.signal });
  const oldWorker = workers[0];
  controller.abort();
  expect(await first).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(oldWorker.terminated).toBe(true);
  const next = admitImage(new Blob(["replacement"]));
  oldWorker.reply({ ok: true, totalBits: 100 });
  workers[1].reply({ ok: false, code: "PNG_INVALID", error: "Malformed PNG" });
  expect(await next).toMatchObject({ ok: false, code: "PNG_INVALID" });
});

it("refuses competing operations without disturbing the active one", async () => {
  const first = admitImage(new Blob(["first"]));
  expect(await admitImage(new Blob(["second"]))).toMatchObject({ ok: false, code: "BUSY" });
  workers[0].reply({ ok: false, code: "PNG_LIMIT" });
  expect(await first).toMatchObject({ ok: false, code: "PNG_LIMIT" });
});

it("releases ownership after a worker failure so a new selection can be checked", async () => {
  const first = admitImage(new Blob(["first"]));
  workers[0].onerror({ preventDefault() {} });
  expect(await first).toMatchObject({ ok: false, code: "WORKER_FAILED" });
  expect(workers[0].terminated).toBe(true);
  const next = admitImage(new Blob(["second"]));
  workers[1].reply({ ok: false, code: "PNG_UNSUPPORTED" });
  expect(await next).toMatchObject({ code: "PNG_UNSUPPORTED" });
});

it("refuses an already cancelled selection without starting work", async () => {
  expect(await admitImage(new Blob([]), { signal: AbortSignal.abort() })).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(workers).toEqual([]);
});

it("handles worker construction and structured-clone failures without leaving the tab busy", async () => {
  globalThis.Worker = class { constructor() { throw new Error("worker unavailable"); } };
  expect(await admitImage(new Blob([]))).toMatchObject({ code: "WORKER_FAILED" });
  globalThis.Worker = class extends ControlledWorker { postMessage() { throw new Error("clone failed"); } };
  expect(await admitImage(new Blob([]))).toMatchObject({ code: "WORKER_FAILED" });
  expect(workers[0].terminated).toBe(true);
  globalThis.Worker = ControlledWorker;
  const next = admitImage(new Blob([]));
  workers[1].onmessageerror();
  expect(await next).toMatchObject({ code: "WORKER_FAILED" });
});
