import { acquireImageOperation, releaseImageOperation } from "./image-operation.js";
import { MAX_SOURCE_BYTES } from "./png.js";

const failure = (code, error) => ({ ok: false, code, error });
const cancelled = () => failure("CANCELLED", "Operation cancelled. No result was produced.");
const busy = () => failure("BUSY", "Image resources are in use. Wait for active work to finish, cancel it, or discard the retained preparation.");

function preparationInputError({ pngBytes, message, compress }) {
  const valid = pngBytes instanceof Uint8Array && pngBytes.buffer instanceof ArrayBuffer &&
    pngBytes.byteOffset === 0 && pngBytes.byteLength === pngBytes.buffer.byteLength &&
    typeof message === "string" && typeof compress === "boolean";
  let code;
  if (!valid) code = "INPUT_INVALID";
  else if (pngBytes.byteLength > MAX_SOURCE_BYTES) code = "PNG_LIMIT";
  else if (message.length > 1048576) code = "INPUT_LIMIT";
  else return null;
  return failure(code, "Use owned PNG bytes up to 16 MiB and valid text up to 1 MiB.");
}

function recoveryInputError({ pngBytes, password }) {
  const valid = pngBytes instanceof Uint8Array && pngBytes.buffer instanceof ArrayBuffer &&
    pngBytes.byteOffset === 0 && pngBytes.byteLength === pngBytes.buffer.byteLength &&
    typeof password === "string" && password.length > 0;
  if (!valid) return failure("INPUT_INVALID", "Use owned PNG bytes and a nonempty Unicode password.");
  if (pngBytes.byteLength > MAX_SOURCE_BYTES) return failure("PNG_LIMIT", "PNG input must be at most 16 MiB.");
  if (password.length > 1024) return failure("INPUT_LIMIT", "Password must be at most 1,024 UTF-8 bytes.");
  return null;
}

function encodingInputError({ password }) {
  if (typeof password !== "string" || password.length === 0) {
    return failure("INPUT_INVALID", "Enter a nonempty Unicode password.");
  }
  if (password.length > 1024) return failure("INPUT_LIMIT", "Password must be at most 1,024 UTF-8 bytes.");
  return null;
}

/** One owner per platform module; handles never expose the worker's state key. */
export function createProtectedTransport(startWorker) {
  const lease = {};
  let worker = null;
  let generation = 0;
  let sequence = 0;
  let active = null;
  let current = null;
  let stopping = false;
  const handles = new WeakMap();

  function workerStopped() {
    stopping = false;
    if (!active) releaseImageOperation(lease);
  }

  function loseWorker() {
    const previous = worker;
    worker = null;
    current = null;
    stopping = true;
    const termination = previous?.stop();
    if (termination?.then) return termination.then(workerStopped);
    workerStopped();
  }

  async function finish(operation, result, terminate = false) {
    if (active !== operation || operation.settled) return;
    operation.settled = true;
    operation.signal?.removeEventListener("abort", operation.abort);
    if (terminate) await loseWorker();
    else worker?.unref?.();
    active = null;
    if (!current) releaseImageOperation(lease);
    operation.resolve(result);
  }

  function receive(workerGeneration, reply) {
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
    void finish(pending, result, !result.ok || pending.action === "discard" || pending.action === "decode" || pending.action === "encode");
  }

  function workerFailed(workerGeneration) {
    if (generation !== workerGeneration || !worker) return;
    if (active) void finish(active, failure("WORKER_FAILED", "Image processing stopped. Try again."), true);
    else void loseWorker();
  }

  function ensureWorker() {
    if (worker) return;
    const workerGeneration = ++generation;
    worker = startWorker(
      reply => receive(workerGeneration, reply),
      () => workerFailed(workerGeneration),
    );
  }

  function run(action, fields, { signal, onProgress } = {}) {
    if (active || stopping || !acquireImageOperation(lease)) return Promise.resolve(busy());
    const operation = { id: ++sequence, signal, onProgress, settled: false, action };
    return new Promise((resolve) => {
      operation.resolve = resolve;
      active = operation;
      if (action === "prepareEncode" || action === "decode" || action === "encode") current = null;
      operation.abort = () => { void finish(operation, cancelled(), true); };
      signal?.addEventListener("abort", operation.abort, { once: true });
      try {
        if (signal?.aborted) { operation.abort(); return; }
        let inputError = null;
        if (action === "prepareEncode") inputError = preparationInputError(fields);
        if (action === "decode") inputError = recoveryInputError(fields);
        if (action === "encode") inputError = encodingInputError(fields);
        if (inputError) {
          void finish(operation, inputError, true);
          return;
        }
        ensureWorker();
        worker.ref?.();
        worker.post({ action, id: operation.id, generation, ...fields }, fields.pngBytes ? [fields.pngBytes.buffer] : []);
      } catch {
        void finish(operation, failure("WORKER_FAILED", "This runtime cannot start image processing. Use a supported browser or the local CLI."), true);
      } finally {
        if (action === "decode" || action === "encode") fields.password = null;
      }
    });
  }

  return {
    prepareEncode(args, control) {
      if (active || stopping) return Promise.resolve(busy());
      return run("prepareEncode", { pngBytes: args?.pngBytes, message: args?.message, compress: args?.compress }, control);
    },
    encode(args, control) {
      if (active || stopping) return Promise.resolve(busy());
      const preparation = args?.preparation;
      if (!preparation || preparation !== current) {
        return Promise.resolve(failure("PREPARATION_INVALID", "Prepare this image and text again before encoding."));
      }
      return run("encode", { preparation: handles.get(preparation), password: args?.password }, control);
    },
    decode(args, control) {
      if (active || stopping) return Promise.resolve(busy());
      return run("decode", { pngBytes: args?.pngBytes, password: args?.password }, control);
    },
    async discard(preparation) {
      if (active || stopping) return busy();
      if (!preparation || preparation !== current) return { ok: true, discarded: false };
      const key = handles.get(preparation);
      return run("discard", { preparation: key });
    },
  };
}
