import { jest } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { PNG } from "pngjs";
import {
  encodeMessageToImage,
  extractMessageFromImage,
  encryptMessageToImage,
  decryptMessageFromImage,
} from "../../lib/steg.js";

const fixture = fileURLToPath(new URL("../fixtures/test-medium.png", import.meta.url));
const workerURL = new URL("../../lib/steg-worker.js", import.meta.url);
const MAX_SOURCE_BYTES = 16 * 1024 * 1024;
let directory;
let destination;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "obscr-node-worker-"));
  destination = path.join(directory, "result.png");
});
afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(directory, { recursive: true, force: true });
});

function inputFile(bytes, name = "input.png") {
  const filename = path.join(directory, name);
  fs.writeFileSync(filename, bytes);
  return filename;
}

async function requestWorker(request) {
  const worker = new Worker(workerURL);
  try {
    return await new Promise((resolve, reject) => {
      worker.on("error", reject);
      worker.on("message", (reply) => {
        if (reply.type === "result") resolve(reply.result);
      });
      worker.postMessage(request);
    });
  } finally {
    await worker.terminate();
  }
}

describe("PNG-ADMIT through the Node operation owner", () => {
  it("keeps the existing format usable through worker-owned CLI encryption and decryption", async () => {
    const message = "Public test text\nwith a second line";
    const encoded = await encryptMessageToImage(fixture, message, "public-password", destination, { compress: true });
    expect(encoded.success).toBe(true);
    expect(encoded.outputPath).toBe(destination);
    const decoded = await decryptMessageFromImage(destination, "public-password");
    expect(decoded).toMatchObject({ success: true, data: message });
    const wrongPassword = await decryptMessageFromImage(destination, "other-password");
    expect(wrongPassword).toMatchObject({ success: false, code: "RECOVERY_FAILED" });
    expect(wrongPassword.data).toBeUndefined();
  });

  it.each(["extract", "decrypt", "encode", "encrypt"])("returns the public malformed-PNG error from %s", async (action) => {
    const source = inputFile(Buffer.from("not a PNG"));
    fs.writeFileSync(destination, "keep this output");
    const operations = {
      extract: () => extractMessageFromImage(source, "key"),
      decrypt: () => decryptMessageFromImage(source, "password", { outputPath: destination }),
      encode: () => encodeMessageToImage(source, "message", "key", destination),
      encrypt: () => encryptMessageToImage(source, "message", "password", destination),
    };
    expect(await operations[action]()).toMatchObject({ success: false, code: "PNG_INVALID" });
    expect(fs.readFileSync(destination, "utf8")).toBe("keep this output");
  });

  it("rejects non-opaque samples rather than converting them", async () => {
    const png = new PNG({ width: 16, height: 16 });
    png.data.fill(255);
    png.data[3] = 254;
    const source = inputFile(PNG.sync.write(png));
    expect(await extractMessageFromImage(source, "key")).toMatchObject({ success: false, code: "PNG_UNSUPPORTED" });
  });

  it("refuses an oversized sparse file before allocating its declared source size", async () => {
    const source = inputFile(Buffer.alloc(0));
    fs.truncateSync(source, MAX_SOURCE_BYTES + 1);
    const allocation = jest.spyOn(Buffer, "allocUnsafeSlow");
    expect(await extractMessageFromImage(source, "key")).toMatchObject({ success: false, code: "PNG_LIMIT" });
    expect(allocation).not.toHaveBeenCalled();
  });

  it("does not wait for input from a directory", async () => {
    expect(await extractMessageFromImage(directory, "key")).toMatchObject({ success: false, code: "INPUT_READ" });
  });

  it("reports disappearance before reading without publishing output", async () => {
    const missing = path.join(directory, "missing.png");
    expect(await encodeMessageToImage(missing, "message", "key", destination)).toMatchObject({ success: false, code: "INPUT_READ" });
    expect(fs.existsSync(destination)).toBe(false);
  });

  it("detects source growth after the initial size check", async () => {
    const source = inputFile(fs.readFileSync(fixture));
    const open = fs.promises.open.bind(fs.promises);
    jest.spyOn(fs.promises, "open").mockImplementation(async (...args) => {
      const handle = await open(...args);
      if (args[0] === source) {
        const read = handle.read.bind(handle);
        let first = true;
        handle.read = async (...readArgs) => {
          const result = await read(...readArgs);
          if (first) {
            first = false;
            fs.appendFileSync(source, Buffer.from([0]));
          }
          return result;
        };
      }
      return handle;
    });
    expect(await encodeMessageToImage(source, "message", "key", destination)).toMatchObject({ success: false, code: "INPUT_CHANGED" });
    expect(fs.existsSync(destination)).toBe(false);
  });

  it("handles a read error after earlier input bytes succeeded", async () => {
    const source = inputFile(Buffer.alloc(128 * 1024));
    const open = fs.promises.open.bind(fs.promises);
    jest.spyOn(fs.promises, "open").mockImplementation(async (...args) => {
      const handle = await open(...args);
      if (args[0] === source) {
        const read = handle.read.bind(handle);
        let reads = 0;
        handle.read = async (...readArgs) => {
          if (++reads === 2) throw Object.assign(new Error("private filesystem detail"), { code: "EIO" });
          return read(...readArgs);
        };
      }
      return handle;
    });
    const result = await encodeMessageToImage(source, "message", "key", destination);
    expect(result).toMatchObject({ success: false, code: "INPUT_READ" });
    expect(result.error).not.toContain("private filesystem detail");
    expect(fs.existsSync(destination)).toBe(false);
  });

  it("cancels a maximum-size input and releases the process operation slot", async () => {
    const source = inputFile(Buffer.alloc(MAX_SOURCE_BYTES));
    const controller = new AbortController();
    const pending = extractMessageFromImage(source, "key", {
      signal: controller.signal,
      onProgress(stage) {
        if (stage === "admitting") controller.abort();
      },
    });
    expect(await pending).toMatchObject({ success: false, code: "CANCELLED" });
    expect(await encodeMessageToImage(fixture, "next", "key", destination)).toMatchObject({ success: true });
  });

  it("cancels an admitted maximum-dimension image in the real worker without a late publication", async () => {
    const png = new PNG({ width: 1024, height: 1024 });
    png.data.fill(255);
    const source = inputFile(PNG.sync.write(png));
    fs.writeFileSync(destination, "previous result");
    const controller = new AbortController();
    const result = await encryptMessageToImage(source, "public text", "password", destination, {
      signal: controller.signal,
      onProgress(stage) {
        if (stage === "processing") controller.abort();
      },
    });
    expect(result).toMatchObject({ success: false, code: "CANCELLED" });
    expect(fs.readFileSync(destination, "utf8")).toBe("previous result");
    const next = path.join(directory, "next.png");
    expect(await encodeMessageToImage(fixture, "next", "key", next)).toMatchObject({ success: true });
    expect(fs.readFileSync(destination, "utf8")).toBe("previous result");
    expect(fs.readdirSync(directory).sort()).toEqual(["input.png", "next.png", "result.png"]);
  });

  it("rejects concurrent encryption and extraction instead of starting a second heavy operation", async () => {
    const controller = new AbortController();
    const first = encryptMessageToImage(fixture, "message", "password", destination, { signal: controller.signal });
    const second = await extractMessageFromImage(fixture, "key");
    expect(second).toMatchObject({ success: false, code: "BUSY" });
    controller.abort();
    expect(await first).toMatchObject({ success: false, code: "CANCELLED" });
  });

  it("rereads a replaced path instead of returning a prior admission", async () => {
    const source = inputFile(fs.readFileSync(fixture));
    expect(await encodeMessageToImage(source, "message", "key", destination)).toMatchObject({ success: true });
    fs.writeFileSync(source, "replacement is invalid");
    expect(await extractMessageFromImage(source, "key")).toMatchObject({ success: false, code: "PNG_INVALID" });
  });

  it("preserves an existing output if publication fails after the worker completed", async () => {
    fs.writeFileSync(destination, "existing output");
    jest.spyOn(fs, "renameSync").mockImplementation(() => {
      throw Object.assign(new Error("private rename detail"), { code: "EACCES" });
    });
    const result = await encodeMessageToImage(fixture, "message", "key", destination);
    expect(result).toMatchObject({ success: false, code: "OUTPUT_WRITE" });
    expect(fs.readFileSync(destination, "utf8")).toBe("existing output");
    expect(fs.readdirSync(directory)).toEqual(["result.png"]);
  });

  it("cancels after worker completion before publication", async () => {
    fs.writeFileSync(destination, "existing output");
    const controller = new AbortController();
    const result = await encodeMessageToImage(fixture, "message", "key", destination, true, {
      signal: controller.signal,
      onProgress(stage) {
        if (stage === "saving") controller.abort();
      },
    });
    expect(result).toMatchObject({ success: false, code: "CANCELLED" });
    expect(fs.readFileSync(destination, "utf8")).toBe("existing output");
    expect(fs.readdirSync(directory)).toEqual(["result.png"]);
  });
  it("rejects invalid caller parameters at the real worker after a successful source read", async () => {
    const result = await encodeMessageToImage(fixture, "message", null, destination);
    expect(result).toMatchObject({ success: false, code: "REQUEST_INVALID" });
    expect(fs.existsSync(destination)).toBe(false);
  });

  it("handles a real worker transport failure after reading and releases its operation slot", async () => {
    // Functions cannot cross the native structured-clone boundary.
    const result = await encodeMessageToImage(fixture, "message", () => {}, destination);
    expect(result).toMatchObject({ success: false, code: "WORKER_FAILED" });
    expect(fs.existsSync(destination)).toBe(false);
    expect(await encodeMessageToImage(fixture, "next", "key", destination)).toMatchObject({ success: true });
  });

  it("admits minimum dimensions before reporting the public carrier capacity limit", async () => {
    const png = new PNG({ width: 1, height: 1 });
    png.data.fill(255);
    const source = inputFile(PNG.sync.write(png));
    expect(await encodeMessageToImage(source, "", "key", destination)).toMatchObject({ success: false, code: "CAPACITY" });
    expect(fs.existsSync(destination)).toBe(false);
  });

  it("does not change admission or hidden-message identity when a path is renamed", async () => {
    expect(await encryptMessageToImage(fixture, "public text", "password", destination)).toMatchObject({ success: true });
    const renamed = path.join(directory, "different-name.data");
    fs.renameSync(destination, renamed);
    expect(await decryptMessageFromImage(renamed, "password")).toMatchObject({ success: true, data: "public text" });
  });

  it("removes a partial temporary write and preserves an existing output", async () => {
    fs.writeFileSync(destination, "existing output");
    const open = fs.promises.open.bind(fs.promises);
    jest.spyOn(fs.promises, "open").mockImplementation(async (...args) => {
      const handle = await open(...args);
      if (path.basename(String(args[0])).startsWith(".obscr-")) {
        const write = handle.write.bind(handle);
        handle.writeFile = async () => {
          await write(Buffer.from("partial output"));
          throw Object.assign(new Error("private write detail"), { code: "EIO" });
        };
      }
      return handle;
    });
    const result = await encodeMessageToImage(fixture, "message", "key", destination);
    expect(result).toMatchObject({ success: false, code: "OUTPUT_WRITE" });
    expect(result.error).not.toContain("private write detail");
    expect(fs.readFileSync(destination, "utf8")).toBe("existing output");
    expect(fs.readdirSync(directory)).toEqual(["result.png"]);
  });

  it("cancels during a temporary write and publishes none of it", async () => {
    fs.writeFileSync(destination, "existing output");
    const controller = new AbortController();
    const open = fs.promises.open.bind(fs.promises);
    jest.spyOn(fs.promises, "open").mockImplementation(async (...args) => {
      const handle = await open(...args);
      if (path.basename(String(args[0])).startsWith(".obscr-")) {
        const write = handle.writeFile.bind(handle);
        handle.writeFile = async (...writeArgs) => {
          await write(...writeArgs);
          controller.abort();
        };
      }
      return handle;
    });
    const result = await encodeMessageToImage(fixture, "message", "key", destination, true, { signal: controller.signal });
    expect(result).toMatchObject({ success: false, code: "CANCELLED" });
    expect(fs.readFileSync(destination, "utf8")).toBe("existing output");
    expect(fs.readdirSync(directory)).toEqual(["result.png"]);
  });

});

describe("PNG-ADMIT real worker request boundary", () => {
  it.each([
    null,
    { id: 1, action: "unknown", bytes: new Uint8Array(0), key: "key" },
    { id: 1, action: "extract", bytes: "not bytes", key: "key" },
    { id: 1, action: "extract", bytes: new Uint8Array(0), key: null },
    { id: 1, action: "decrypt", bytes: new Uint8Array(0), password: "" },
    { id: 1, action: "extract", bytes: new Uint8Array(10).subarray(1), key: "key" },
    { id: 1, action: "encode", bytes: new Uint8Array(0), key: "key", message: [], obfuscate: true },
  ])("rejects an invalid request without trusting the adapter", async (request) => {
    expect(await requestWorker(request)).toMatchObject({ success: false, code: "REQUEST_INVALID" });
  });

  it("enforces its own source byte ceiling", async () => {
    expect(await requestWorker({ id: 1, action: "extract", key: "key", bytes: new Uint8Array(MAX_SOURCE_BYTES + 1) }))
      .toMatchObject({ success: false, code: "PNG_LIMIT" });
  });

  it("refuses malformed PNG bytes in an otherwise valid request", async () => {
    expect(await requestWorker({ id: 1, action: "extract", key: "key", bytes: new Uint8Array([1, 2, 3]) }))
      .toMatchObject({ success: false, code: "PNG_INVALID" });
  });

  it.each([
    ["encode", "ASCII", "a".repeat(1048576)],
    ["encode", "multibyte", "é".repeat(524288)],
    ["encrypt", "ASCII", "a".repeat(1048576)],
    ["encrypt", "multibyte", "é".repeat(524288)],
  ])("%s admits exactly 1 MiB of %s text and refuses one more UTF-8 byte", async (action, _kind, message) => {
    const request = {
      id: 1, action, bytes: new Uint8Array(fs.readFileSync(fixture)),
      key: "key", password: "public-password", message, obfuscate: false, compress: false,
    };
    expect(await requestWorker(request)).toMatchObject({ success: false, code: "CAPACITY" });
    expect(await requestWorker({ ...request, message: message + "a" }))
      .toMatchObject({ success: false, code: "MESSAGE_LIMIT" });
  });
});
