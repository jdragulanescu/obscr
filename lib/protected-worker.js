import { parentPort } from "node:worker_threads";
import { createProtectedImage } from "./protected-image.js";
import { nativeCrypto } from "./protected-native-node.js";

const execute = createProtectedImage({ nativeCrypto });
parentPort.on("message", async (request) => {
  const result = await execute(request, progress => parentPort.postMessage({ id: request?.id, progress }));
  parentPort.postMessage({ id: request?.id, result }, result.ok && result.pngBytes ? [result.pngBytes.buffer] : []);
});
