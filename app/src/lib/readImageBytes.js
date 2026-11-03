import { MAX_SOURCE_BYTES } from "../../../lib/png.js";

export async function readImageBytes(file) {
  const fail = (code, message) => Object.assign(new Error(message), { code });
  if (!(file instanceof Blob)) throw fail("INPUT_INVALID", "Select a supported PNG file.");
  if (file.size > MAX_SOURCE_BYTES) throw fail("PNG_LIMIT", "PNG input must be at most 16 MiB. Choose a smaller PNG.");
  try {
    return new Uint8Array(await file.arrayBuffer());
  } catch {
    throw fail("READ_FAILED", "Could not read the image. Select it again.");
  }
}
