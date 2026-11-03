import { jest } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { PNG } from "pngjs";
import * as operations from "../../lib/steg.js";
import { cover } from "../fixtures/protected.js";

let directory;
let source;
let destination;
let cleanupController;
const pendingOperations = new Set();
const preparations = new Set();
const workers = new Set();

function ownedOperation(operation) {
  return (args, control = {}) => {
    const pending = operation(args, {
      ...control,
      signal: control.signal ? AbortSignal.any([control.signal, cleanupController.signal]) : cleanupController.signal,
    }).then(result => {
      if (result.preparation) preparations.add(result.preparation);
      return result;
    }).finally(() => pendingOperations.delete(pending));
    pendingOperations.add(pending);
    return pending;
  };
}
const prepareImage = ownedOperation(operations.prepareImage);
const encodeImage = ownedOperation(operations.encodeImage);
const decodeImage = ownedOperation(operations.decodeImage);
const prepare = (message = "Public text", control) => prepareImage({ imagePath: source, message }, control);
async function encode(message = "Public text", control, password = "public-password") {
  const prepared = await prepare(message, control);
  if (!prepared.ok) return prepared;
  return encodeImage({ preparation: prepared.preparation, password, outputPath: destination }, control);
}

beforeEach(() => {
  cleanupController = new AbortController();
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "obscr-node-worker-"));
  source = path.join(directory, "input.png");
  destination = path.join(directory, "result.png");
  fs.writeFileSync(source, cover());
});
afterEach(async () => {
  cleanupController.abort();
  await Promise.all([...workers].map(worker => worker.terminate()));
  workers.clear();
  while (pendingOperations.size) await Promise.allSettled([...pendingOperations]);
  for (const preparation of preparations) await operations.discardPreparation(preparation);
  preparations.clear();
  jest.restoreAllMocks();
  fs.rmSync(directory, { recursive: true, force: true });
});

// PROTECTED-OPERATION with the bounded file/delivery adapter and real Node workers.
describe("protected Node file workflows", () => {
  it.each([false, true])("prepares exact bytes then publishes and recovers a complete result (compression %s)", async compress => {
    const message = "\ufeffPublic Unicode é\r\n".repeat(12);
    const password = " exact password \n";
    const prepared = await prepareImage({ imagePath: source, message, compress });
    expect(prepared).toMatchObject({ ok: true, originalBytes: Buffer.byteLength(message), compressionUsed: compress, fits: true });
    expect(await encodeImage({ preparation: prepared.preparation, password, outputPath: destination })).toMatchObject({ ok: true, outputPath: destination });
    expect(await decodeImage({ imagePath: destination, password })).toMatchObject({ ok: true, message });
    expect(await decodeImage({ imagePath: destination, password: password.trim() })).toMatchObject({ ok: false, code: "RECOVERY_FAILED" });
    expect(await encodeImage({ preparation: prepared.preparation, password, outputPath: destination })).toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  });

  it("saves authenticated empty wire text as a complete empty file", async () => {
    expect(await encode("")).toMatchObject({ ok: true });
    const textPath = path.join(directory, "message.txt");
    expect(await decodeImage({ imagePath: destination, password: "public-password", outputPath: textPath })).toMatchObject({ ok: true, outputPath: textPath });
    expect(fs.readFileSync(textPath, "utf8")).toBe("");
  });

  it.each(["prepare", "decode"])("keeps public PNG failures distinct during %s", async action => {
    fs.writeFileSync(source, "not a PNG");
    fs.writeFileSync(destination, "keep this output");
    const result = action === "prepare" ? await prepare() : await decodeImage({ imagePath: source, password: "password", outputPath: destination });
    expect(result).toMatchObject({ ok: false, code: "PNG_INVALID" });
    expect(fs.readFileSync(destination, "utf8")).toBe("keep this output");
  });

  it("rejects non-opaque samples rather than converting them", async () => {
    const png = new PNG({ width: 16, height: 16 });
    png.data.fill(255);
    png.data[3] = 254;
    fs.writeFileSync(source, PNG.sync.write(png));
    expect(await prepare()).toMatchObject({ ok: false, code: "PNG_UNSUPPORTED" });
  });

  it("bounds a sparse source before allocating its declared size", async () => {
    fs.truncateSync(source, 16 * 1024 * 1024 + 1);
    const allocation = jest.spyOn(Buffer, "allocUnsafeSlow");
    expect(await prepare()).toMatchObject({ ok: false, code: "PNG_LIMIT" });
    expect(allocation).not.toHaveBeenCalled();
  });

  it("refuses directories and missing paths without output", async () => {
    expect(await prepareImage({ imagePath: directory, message: "text" })).toMatchObject({ ok: false, code: "INPUT_READ" });
    expect(await prepareImage({ imagePath: path.join(directory, "missing"), message: "text" })).toMatchObject({ ok: false, code: "INPUT_READ" });
    expect(fs.existsSync(destination)).toBe(false);
  });

  it.each(["growth", "read error"])("handles %s after a successful partial input read", async mode => {
    fs.writeFileSync(source, Buffer.alloc(128 * 1024));
    const open = fs.promises.open.bind(fs.promises);
    jest.spyOn(fs.promises, "open").mockImplementation(async (...args) => {
      const handle = await open(...args);
      if (args[0] === source) {
        const read = handle.read.bind(handle);
        let reads = 0;
        handle.read = async (...readArgs) => {
          if (++reads === 2 && mode === "read error") throw Object.assign(new Error("private detail"), { code: "EIO" });
          const result = await read(...readArgs);
          if (reads === 1 && mode === "growth") fs.appendFileSync(source, Buffer.from([0]));
          return result;
        };
      }
      return handle;
    });
    const result = await prepare();
    expect(result).toMatchObject({ ok: false, code: mode === "growth" ? "INPUT_CHANGED" : "INPUT_READ" });
    expect(result.error).not.toContain("private detail");
    expect(fs.existsSync(destination)).toBe(false);
  });

  it("releases an obsolete preparation even when its replacement cannot be read", async () => {
    const old = await prepare();
    fs.unlinkSync(source);
    expect(await prepare()).toMatchObject({ ok: false, code: "INPUT_READ" });
    expect(await encodeImage({ preparation: old.preparation, password: "password", outputPath: destination })).toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
    fs.writeFileSync(source, cover());
    expect(await encode()).toMatchObject({ ok: true });
  });

  it.each(["reading", "preparing text/capacity", "deriving keys", "saving"])("cancels at %s without late publication and permits the next operation", async stage => {
    fs.writeFileSync(source, cover(1024, 1024));
    fs.writeFileSync(destination, "previous result");
    const controller = new AbortController();
    const result = await encode("public text", {
      signal: controller.signal,
      onProgress(next) { if (next === stage) controller.abort(); },
    });
    expect(result).toMatchObject({ ok: false, code: "CANCELLED" });
    expect(fs.readFileSync(destination, "utf8")).toBe("previous result");
    expect(await encode()).toMatchObject({ ok: true });
    expect(fs.readdirSync(directory).sort()).toEqual(["input.png", "result.png"]);
  });

  it("refuses a concurrent request without starting another heavyweight operation", async () => {
    const controller = new AbortController();
    const first = prepare("public text", { signal: controller.signal });
    expect(await decodeImage({ imagePath: source, password: "password" })).toMatchObject({ ok: false, code: "BUSY" });
    controller.abort();
    expect(await first).toMatchObject({ ok: false, code: "CANCELLED" });
  });

  it.each(["rename", "partial write", "cancel write"])("preserves source and existing output after %s failure", async mode => {
    const original = fs.readFileSync(source);
    fs.writeFileSync(destination, "previous result");
    const controller = new AbortController();
    if (mode === "rename") jest.spyOn(fs, "renameSync").mockImplementation(() => { throw new Error("private rename detail"); });
    else {
      const open = fs.promises.open.bind(fs.promises);
      jest.spyOn(fs.promises, "open").mockImplementation(async (...args) => {
        const handle = await open(...args);
        if (path.basename(String(args[0])).startsWith(".obscr-")) {
          handle.writeFile = async () => {
            await handle.write(Buffer.from("partial output"));
            if (mode === "cancel write") controller.abort();
            else throw new Error("private write detail");
          };
        }
        return handle;
      });
    }
    const result = await encode("text", { signal: controller.signal });
    expect(result).toMatchObject({ ok: false, code: mode === "cancel write" ? "CANCELLED" : "OUTPUT_WRITE" });
    expect(result.error).not.toContain("private");
    expect(fs.readFileSync(source)).toEqual(original);
    expect(fs.readFileSync(destination, "utf8")).toBe("previous result");
    expect(fs.readdirSync(directory).sort()).toEqual(["input.png", "result.png"]);
  });

  it("preserves the source itself when an in-place publication fails", async () => {
    const original = fs.readFileSync(source);
    const prepared = await prepare();
    jest.spyOn(fs, "renameSync").mockImplementation(() => { throw new Error("cannot rename"); });
    expect(await encodeImage({ preparation: prepared.preparation, password: "password", outputPath: source })).toMatchObject({ ok: false, code: "OUTPUT_WRITE" });
    expect(fs.readFileSync(source)).toEqual(original);
  });

  it("keeps renamed PNG content usable independent of its extension", async () => {
    expect(await encode()).toMatchObject({ ok: true });
    const renamed = path.join(directory, "renamed.data");
    fs.renameSync(destination, renamed);
    expect(await decodeImage({ imagePath: renamed, password: "public-password" })).toMatchObject({ ok: true, message: "Public text" });
  });

  it.each(["", "\ud800", "é".repeat(513)])("refuses invalid passwords without saving a partial file", async password => {
    expect(await encode("text", undefined, password)).toMatchObject({ ok: false, code: Buffer.byteLength(password) > 1024 ? "INPUT_LIMIT" : "INPUT_INVALID" });
    expect(fs.existsSync(destination)).toBe(false);
    expect(await encode()).toMatchObject({ ok: true });
  });

  it("cancels real recovery, preserves the prior text file and permits recovery again", async () => {
    expect(await encode()).toMatchObject({ ok: true });
    const outputPath = path.join(directory, "message.txt");
    fs.writeFileSync(outputPath, "previous text");
    const controller = new AbortController();
    expect(await decodeImage({ imagePath: destination, password: "public-password", outputPath }, {
      signal: controller.signal,
      onProgress(stage) { if (stage === "deriving keys") controller.abort(); },
    })).toMatchObject({ ok: false, code: "CANCELLED" });
    expect(fs.readFileSync(outputPath, "utf8")).toBe("previous text");
    expect(await decodeImage({ imagePath: destination, password: "public-password", outputPath })).toMatchObject({ ok: true });
    expect(fs.readFileSync(outputPath, "utf8")).toBe("Public text");
  });

  it("does not expose or publish recovered text when delivery fails after a partial write", async () => {
    expect(await encode()).toMatchObject({ ok: true });
    const outputPath = path.join(directory, "message.txt");
    fs.writeFileSync(outputPath, "previous text");
    const open = fs.promises.open.bind(fs.promises);
    jest.spyOn(fs.promises, "open").mockImplementation(async (...args) => {
      const handle = await open(...args);
      if (path.basename(String(args[0])).startsWith(".obscr-")) {
        handle.writeFile = async () => {
          await handle.write(Buffer.from("partial"));
          throw new Error("private detail");
        };
      }
      return handle;
    });
    const result = await decodeImage({ imagePath: destination, password: "public-password", outputPath });
    expect(result).toMatchObject({ ok: false, code: "OUTPUT_WRITE" });
    expect(result.message).toBeUndefined();
    expect(fs.readFileSync(outputPath, "utf8")).toBe("previous text");
    expect(fs.readdirSync(directory).sort()).toEqual(["input.png", "message.txt", "result.png"]);
  });
});

async function requestWorker(request) {
  const worker = new Worker(new URL("../../lib/protected-worker.js", import.meta.url));
  workers.add(worker);
  try {
    return await new Promise((resolve, reject) => {
      worker.on("error", reject);
      worker.on("exit", () => reject(new Error("Worker exited before replying")));
      worker.on("message", reply => { if (reply.result) resolve(reply.result); });
      worker.postMessage(request);
    });
  } finally {
    await worker.terminate();
    workers.delete(worker);
  }
}

describe("protected real worker request gate", () => {
  it("accepts the preparation request used by the guided action", async () => {
    expect(await requestWorker({ id: 1, generation: 1, action: "prepareEncode", pngBytes: cover(), message: "   ", compress: false }))
      .toMatchObject({ ok: true, originalBytes: 3, storedBytes: 3, compressionUsed: false, fits: true });
  });
  it.each([
    null,
    { id: 1, generation: 1, action: "unknown" },
    { id: 1, generation: 1, action: "prepareEncode", pngBytes: "not bytes", message: "text", compress: false },
    { id: 1, generation: 1, action: "decode", pngBytes: new Uint8Array(0), password: "" },
  ])("rejects invalid requests without trusting the file adapter", async request => {
    expect(await requestWorker(request)).toMatchObject({ ok: false, code: "INPUT_INVALID" });
  });
});
