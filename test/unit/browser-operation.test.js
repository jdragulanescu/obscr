import { jest } from "@jest/globals";
import { JSDOM } from "jsdom";
import { admitImage, estimateCapacity, generateImageDiff, downloadBlob } from "../../app/src/lib/steg.js";

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
afterEach(() => { globalThis.Worker = originalWorker; jest.restoreAllMocks(); });

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

it("keeps completed comparison previews usable until the caller releases them", async () => {
  const revoke = jest.spyOn(URL, "revokeObjectURL");
  const pending = generateImageDiff(new Blob(["original"]), new Blob(["encoded"]));
  workers[0].reply({ ok: true, diffBlob: new Blob(["difference"]), averageDifference: "0.5000" });
  const result = await pending;
  const urls = [result.original, result.encoded, result.diff];
  try {
    expect(result).toMatchObject({ ok: true, averageDifference: "0.5000" });
    expect(revoke).not.toHaveBeenCalled();
    expect(await Promise.all(urls.map(async url => (await fetch(url)).text())))
      .toEqual(["original", "encoded", "difference"]);
  } finally {
    urls.forEach(url => URL.revokeObjectURL(url));
  }
});

it.each([2, 3])("revokes earlier previews when creation %i fails", async (failedCreation) => {
  const create = URL.createObjectURL.bind(URL);
  const urls = [];
  let calls = 0;
  jest.spyOn(URL, "createObjectURL").mockImplementation(blob => {
    if (++calls === failedCreation) throw new Error("private allocation detail");
    const url = create(blob);
    urls.push(url);
    return url;
  });
  const pending = generateImageDiff(new Blob(["original"]), new Blob(["encoded"]));
  workers[0].reply({ ok: true, diffBlob: new Blob(["difference"]), averageDifference: "0.5000" });
  const result = await pending;
  expect(result).toMatchObject({ ok: false, code: "PREVIEW_FAILED" });
  expect(result.error).not.toContain("private allocation detail");
  expect(result).not.toHaveProperty("original");
  for (const url of urls) await expect(fetch(url)).rejects.toThrow();
});

it("terminates cancelled comparison work and ignores its late result while a new comparison runs", async () => {
  const create = jest.spyOn(URL, "createObjectURL");
  const controller = new AbortController();
  const first = generateImageDiff(new Blob(["first"]), new Blob(["second"]), { signal: controller.signal });
  expect(await admitImage(new Blob(["competing"]))).toMatchObject({ code: "BUSY" });
  controller.abort();
  expect(await first).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(workers[0].terminated).toBe(true);
  const next = generateImageDiff(new Blob(["replacement"]), new Blob(["second"]));
  workers[0].reply({ ok: true, diffBlob: new Blob(["late"]) });
  workers[1].reply({ ok: false, code: "PNG_INVALID" });
  expect(await next).toMatchObject({ ok: false, code: "PNG_INVALID" });
  expect(workers[1].terminated).toBe(true);
  expect(create).not.toHaveBeenCalled();
});

it("cancelling after a comparison reply but before its continuation creates no previews", async () => {
  const create = jest.spyOn(URL, "createObjectURL");
  const controller = new AbortController();
  const pending = generateImageDiff(new Blob(["first"]), new Blob(["second"]), { signal: controller.signal });
  workers[0].reply({ ok: true, diffBlob: new Blob(["complete"]) });
  controller.abort();
  expect(await pending).toMatchObject({ ok: false, code: "CANCELLED" });
  expect(workers[0].terminated).toBe(true);
  expect(create).not.toHaveBeenCalled();
});

it("releases a download URL and link when the browser refuses the download", async () => {
  const dom = new JSDOM("<!doctype html><body></body>");
  const originalDocument = globalThis.document;
  globalThis.document = dom.window.document;
  const create = URL.createObjectURL.bind(URL);
  let allocated;
  jest.spyOn(URL, "createObjectURL").mockImplementation(blob => {
    allocated = create(blob);
    return allocated;
  });
  jest.spyOn(dom.window.HTMLAnchorElement.prototype, "click").mockImplementation(() => {
    throw new Error("Browser refused download");
  });
  try {
    expect(() => downloadBlob(new Blob(["complete output"]), "encoded.png")).toThrow("Browser refused download");
    expect(document.querySelector("a")).toBeNull();
    await expect(fetch(allocated)).rejects.toThrow();
  } finally {
    URL.revokeObjectURL(allocated);
    globalThis.document = originalDocument;
    dom.window.close();
  }
});
