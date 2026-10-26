import { createProtectedImage } from "../../../lib/protected-image.js";

const execute = createProtectedImage();
self.onmessage = async ({ data: request }) => {
  const result = await execute(request, progress => self.postMessage({ id: request?.id, progress }));
  self.postMessage({ id: request?.id, result });
};
