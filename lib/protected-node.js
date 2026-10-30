import { Worker } from "node:worker_threads";
import { createProtectedTransport } from "./protected-transport.js";

const operations = createProtectedTransport((message, failed) => {
  const worker = new Worker(new URL("./protected-worker.js", import.meta.url));
  worker.on("message", message);
  worker.on("error", failed);
  worker.on("messageerror", failed);
  worker.on("exit", failed);
  return {
    post: (request, transfer) => worker.postMessage(request, transfer),
    stop: () => worker.terminate(),
    ref: () => worker.ref(),
    unref: () => worker.unref(),
  };
});

export const { prepareEncode, encode, decode, discard } = operations;
