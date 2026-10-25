import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

// A real dependency-free npm package. Its subprocesses are the build boundary.
export async function buildFixture({ testExit = 0 } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "obscr-candidate-build-"));
  const source = path.join(root, "repository");
  await mkdir(path.join(source, "bin"), { recursive: true });
  const put = (name, bytes) => writeFile(path.join(source, name), bytes);
  const pkg = {
    name: "public-candidate-fixture", version: "1.0.0", type: "module",
    main: "bin/index.js", bin: { "public-candidate-fixture": "bin/index.js" },
    files: ["bin"], scripts: { test: "node test.js", build: "node build.js" },
  };
  await put("package.json", JSON.stringify(pkg));
  await put("package-lock.json", JSON.stringify({
    name: pkg.name, version: pkg.version, lockfileVersion: 3,
    packages: { "": { name: pkg.name, version: pkg.version, bin: pkg.bin } },
  }));
  await put("bin/index.js", '#!/usr/bin/env node\nconsole.log("Public package fixture");\n');
  await put("test.js", `console.log("Public test boundary ran"); process.exit(${testExit});\n`);
  await put("build.js", 'import {mkdirSync,writeFileSync} from "node:fs"; mkdirSync("dist/assets",{recursive:true}); writeFileSync("dist/index.html","Public PWA fixture\\n"); writeFileSync("dist/assets/app.js","export const publicFixture=true;\\n");\n');
  const git = (...args) => execFileSync("git", args, {
    cwd: source, encoding: "utf8",
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_AUTHOR_NAME: "Public fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
      GIT_COMMITTER_NAME: "Public fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" },
  }).trim();
  git("init", "-q");
  git("add", ".");
  git("-c", "commit.gpgsign=false", "commit", "-qm", "Public build fixture");
  return { root, source, output: path.join(root, "candidate"), put, git, pkg,
    cleanup: () => rm(root, { recursive: true, force: true }) };
}
