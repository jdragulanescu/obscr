import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const extractor = fileURLToPath(new URL("../../.github/scripts/extract-candidate.py", import.meta.url));
const makeArchive = (root, member, kind = "file") => {
  const result = spawnSync("python3", ["-c", `
import io, tarfile, zipfile, sys
buffer = io.BytesIO()
with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
    item = tarfile.TarInfo(sys.argv[2])
    data = b'checked bytes'
    if sys.argv[3] == 'link':
        item.type = tarfile.SYMTYPE
        item.linkname = '../outside'
        tar.addfile(item)
    else:
        item.size = len(data)
        tar.addfile(item, io.BytesIO(data))
with zipfile.ZipFile(sys.argv[1] + '/artifact.zip', 'w') as archive:
    archive.writestr('candidate-evidence.tar.gz', buffer.getvalue())
`, root, member, kind], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
};

describe("retained candidate archive extraction", () => {
  let root;
  beforeEach(async () => { root = await mkdtemp(path.join(tmpdir(), "obscr-bundle-")); });
  afterEach(async () => { await rm(root, { recursive: true, force: true }); });
  const run = () => spawnSync("python3", [extractor, path.join(root, "artifact.zip"), path.join(root, "bundle")], { encoding: "utf8" });

  test("extracts the exact regular-file payload without executing it", async () => {
    makeArchive(root, "./source/code.js");
    expect(run().status).toBe(0);
    expect(await readFile(path.join(root, "bundle/source/code.js"), "utf8")).toBe("checked bytes");
  });

  test.each([["../outside", "file"], ["/outside", "file"], ["source/link", "link"]])(
    "refuses an unsafe archive member %s", (member, kind) => {
      makeArchive(root, member, kind);
      expect(run().status).toBe(1);
    });
});
