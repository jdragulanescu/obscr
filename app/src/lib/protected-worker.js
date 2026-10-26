import { createProtectedImage } from "../../../lib/protected-image.js";
import { nativeCrypto } from "../../../lib/protected-native-browser.js";

const execute = createProtectedImage({ nativeCrypto });
self.onmessage = async ({ data: request }) => {
  const result = await execute(request, progress => self.postMessage({ id: request?.id, progress }));
  self.postMessage({ id: request?.id, result });
};
