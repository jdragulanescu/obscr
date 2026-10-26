import { acquireImageOperation, releaseImageOperation } from "./image-operation.js";
import { MAX_SOURCE_BYTES } from "./png.js";

const failure = (code, error) => ({ ok: false, code, error });
const cancelled = () => failure("CANCELLED", "Operation cancelled. No result was produced.");

/** One owner per platform module; handles never expose the worker's state key. */
export function createProtectedTransport(startWorker) {
  let worker = null;
  let generation = 0;
  let sequence = 0;
  let active = null;
  let current = null;
  const handles = new WeakMap();

  function loseWorker() {
    const previous = worker;
    worker = null;
    current = null;
    return previous?.stop();
  }

  async function finish(operation, result, terminate = false) {
    if (active !== operation || operation.settled) return;
    operation.settled = true;
    operation.signal?.removeEventListener("abort", operation.abort);
    if (terminate) await loseWorker();
    else worker?.unref?.();
    active = null;
    releaseImageOperation(operation);
    operation.resolve(result);
  }

  function run(action, fields, { signal, onProgress } = {}) {
    if (active) return Promise.resolve(failure("BUSY", "Another image operation is active. Cancel it or wait."));
    const operation = { id: ++sequence, signal, settled: false, action };
    if (!acquireImageOperation(operation)) return Promise.resolve(failure("BUSY", "Another image operation is active. Cancel it or wait."));
    return new Promise((resolve) => {
      operation.resolve = resolve;
      active = operation;
      if (action === "prepareEncode") current = null;
      operation.abort = () => { void finish(operation, cancelled(), true); };
      signal?.addEventListener("abort", operation.abort, { once: true });
      try {
        if (signal?.aborted) { operation.abort(); return; }
        if (action === "prepareEncode") {
          const { pngBytes, message, compress } = fields;
          const valid = pngBytes instanceof Uint8Array && pngBytes.buffer instanceof ArrayBuffer &&
            pngBytes.byteOffset === 0 && pngBytes.byteLength === pngBytes.buffer.byteLength &&
            typeof message === "string" && typeof compress === "boolean";
          if (!valid || pngBytes.byteLength > MAX_SOURCE_BYTES || message.length > 1048576) {
            const code = !valid ? "INPUT_INVALID" : pngBytes.byteLength > MAX_SOURCE_BYTES ? "PNG_LIMIT" : "INPUT_LIMIT";
            void finish(operation, failure(code, "Use owned PNG bytes up to 16 MiB and valid text up to 1 MiB."), true);
            return;
          }
        }
        if (!worker) {
          const workerGeneration = ++generation;
          worker = startWorker((reply) => {
            if (generation !== workerGeneration || !worker || !active || active.settled || reply?.id !== active.id) return;
            const pending = active;
            if (reply.progress) {
              try { pending.onProgress?.(reply.progress); } catch { /* Presentation cannot retain worker state. */ }
              return;
            }
            if (typeof reply.result?.ok !== "boolean") {
              void finish(pending, failure("WORKER_FAILED", "Invalid worker response. Try again."), true);
              return;
            }
            const result = reply.result;
            if (result.ok && result.preparation) {
              const handle = Object.freeze({});
              handles.set(handle, result.preparation);
              current = handle;
              result.preparation = handle;
            }
            void finish(pending, result, !result.ok || pending.action === "discard");
          }, () => {
            if (generation !== workerGeneration || !worker) return;
            if (active) void finish(active, failure("WORKER_FAILED", "Image processing stopped. Try again."), true);
            else void loseWorker();
          });
        }
        operation.onProgress = onProgress;
        worker.ref?.();
        worker.post({ action, id: operation.id, generation, ...fields }, fields.pngBytes ? [fields.pngBytes.buffer] : []);
      } catch {
        void finish(operation, failure("WORKER_FAILED", "This runtime cannot start image processing. Use a supported browser or the local CLI."), true);
      }
    });
  }

  return {
    prepareEncode(args, control) {
      if (active) return Promise.resolve(failure("BUSY", "Another image operation is active. Cancel it or wait."));
      return run("prepareEncode", { pngBytes: args?.pngBytes, message: args?.message, compress: args?.compress }, control);
    },
    async discard(preparation) {
      if (active) return failure("BUSY", "Another image operation is active. Cancel it or wait.");
      if (!preparation || preparation !== current) return { ok: true, discarded: false };
      const key = handles.get(preparation);
      return run("discard", { preparation: key });
    },
  };
}
