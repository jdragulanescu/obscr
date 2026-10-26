import { createProtectedTransport } from "../../../lib/protected-transport.js";

const operations = createProtectedTransport((message, failed) => {
  const worker = new Worker(new URL("./protected-worker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data }) => message(data);
  worker.onerror = event => { event.preventDefault(); failed(); };
  worker.onmessageerror = failed;
  return {
    post: (request, transfer) => worker.postMessage(request, transfer),
    stop: () => worker.terminate(),
  };
});

export const { prepareEncode, decode, discard } = operations;
