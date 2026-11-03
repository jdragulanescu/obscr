import { PNG } from "pngjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prepareImage, encodeImage } from "../../lib/steg.js";

it("refuses transparent carrier input without replacing an existing output", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "obscr-admit-"));
  try {
    const source = path.join(directory, "source.png");
    const output = path.join(directory, "output.png");
    const png = new PNG({ width: 32, height: 32 });
    png.data.fill(255);
    png.data[3] = 254;
    await fs.writeFile(source, PNG.sync.write(png));
    await fs.writeFile(output, "existing output");
    const prepared = await prepareImage({ imagePath: source, message: "public", compress: false });
    const result = prepared.ok
      ? await encodeImage({ preparation: prepared.preparation, password: "public-key", outputPath: output })
      : prepared;
    expect(result).toMatchObject({ ok: false, code: "PNG_UNSUPPORTED" });
    expect(await fs.readFile(output, "utf8")).toBe("existing output");
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
