import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { prepareImage, encodeImage, decodeImage, discardPreparation } from "../../lib/steg.js";
import { cover } from "../fixtures/protected.js";

let directory, source, output;
beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "obscr-workflow-"));
  source = path.join(directory, "source.png");
  output = path.join(directory, "encoded.png");
  await fs.writeFile(source, cover(640, 640));
});
afterEach(async () => { await fs.rm(directory, { recursive: true, force: true }); });

it.each([
  ["raw Unicode and terminal/HTML text", "\ufeff public é世界🙂\r\n\t <script>alert(1)</script>\u001b[31m ", false],
  ["gzip", "\ufeff public é世界🙂\r\n\t ".repeat(500), true],
  ["whitespace", " \t\r\n ", false],
])("exchanges exact %s through retained file preparation and authenticated recovery", async (_name, message, compress) => {
  const prepared = await prepareImage({ imagePath: source, message, compress });
  expect(prepared).toMatchObject({ ok: true, fits: true, compressionUsed: compress, originalBytes: Buffer.byteLength(message) });
  const password = "\ufeff e\u0301 exact public password\r\n ";
  expect(await encodeImage({ preparation: prepared.preparation, password, outputPath: output })).toMatchObject({ ok: true, outputPath: output });
  expect(await decodeImage({ imagePath: output, password })).toMatchObject({ ok: true, message });
  const saved = path.join(directory, "message.txt");
  expect(await decodeImage({ imagePath: output, password, outputPath: saved })).toMatchObject({ ok: true, outputPath: saved });
  expect(await fs.readFile(saved, "utf8")).toBe(message);
  expect(await fs.readFile(source)).toEqual(Buffer.from(cover(640, 640)));
}, 30000);

it("keeps the exact preparation when only the password changes and consumes it once", async () => {
  const prepared = await prepareImage({ imagePath: source, message: "Public text", compress: false });
  expect(prepared.ok).toBe(true);
  expect(await encodeImage({ preparation: prepared.preparation, password: "final password", outputPath: output })).toMatchObject({ ok: true });
  expect(await encodeImage({ preparation: prepared.preparation, password: "old password", outputPath: output })).toMatchObject({ ok: false, code: "PREPARATION_INVALID" });
  expect(await decodeImage({ imagePath: output, password: "old password" })).toMatchObject({ ok: false, code: "RECOVERY_FAILED" });
  expect(await decodeImage({ imagePath: output, password: "final password" })).toMatchObject({ ok: true, message: "Public text" });
}, 30000);

it("does not replace a saved message on authentication failure", async () => {
  const prepared = await prepareImage({ imagePath: source, message: "Public secret", compress: false });
  expect(await encodeImage({ preparation: prepared.preparation, password: "public password", outputPath: output })).toMatchObject({ ok: true });
  const saved = path.join(directory, "message.txt");
  await fs.writeFile(saved, "existing public text");
  const result = await decodeImage({ imagePath: output, password: "wrong", outputPath: saved });
  expect(result).toMatchObject({ ok: false, code: "RECOVERY_FAILED" });
  expect(result).not.toHaveProperty("message");
  expect(await fs.readFile(saved, "utf8")).toBe("existing public text");
}, 30000);

it("reports no frame, empty-only and oversized preparation without producing output", async () => {
  for (const [dimensions, message, expected] of [
    [[64, 64], "public", { hasFrameCapacity: false, fits: false }],
    [[256, 168], "public", { hasFrameCapacity: true, maxStoredBytes: 0, fits: false }],
    [[640, 640], "x".repeat(513), { hasFrameCapacity: true, maxStoredBytes: 512, fits: false }],
  ]) {
    await fs.writeFile(source, cover(...dimensions));
    const prepared = await prepareImage({ imagePath: source, message, compress: false });
    expect(prepared).toMatchObject({ ok: true, ...expected });
    expect(await encodeImage({ preparation: prepared.preparation, password: "public", outputPath: output })).toMatchObject({ ok: false, code: "CAPACITY" });
    await discardPreparation(prepared.preparation);
    expect(await fs.readdir(directory)).toEqual(["source.png"]);
  }
});
