import { parentPort } from "node:worker_threads";
import { createProtectedImage } from "./protected-image.js";

const execute = createProtectedImage();
parentPort.on("message", async (request) => {
  const result = await execute(request, progress => parentPort.postMessage({ id: request?.id, progress }));
  parentPort.postMessage({ id: request?.id, result });
});
