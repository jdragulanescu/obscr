import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const command = fileURLToPath(new URL("../../bin/release-publish.js", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [command, ...args], {
  encoding: "utf8", timeout: 10000,
  env: { PATH: process.env.PATH, HOME: process.env.HOME, NO_COLOR: "1" },
});

describe("intentional npm release command", () => {
  test("help identifies protected workflow-only use and no local credential bypass", () => {
    const result = run("--help");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("GitHub");
    expect(result.stdout).toContain("--phase prepare|publish");
    expect(result.stdout).toContain("Ctrl-C");
  });

  test.each([[], ["--phase", "publish"], ["--phase", "prepare"], ["--unknown"]])(
    "refuses local or malformed requests %j without contacting npm", (...args) => {
      const result = run(...args);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Release request refused");
      expect(result.stderr).not.toContain("node:internal");
    });
});
