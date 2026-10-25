import { spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { candidateFixture, digest } from "../fixtures/release-candidate.js";

const command = fileURLToPath(new URL("../../bin/release-publish.js", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [command, ...args], {
  encoding: "utf8", timeout: 10000,
  env: { PATH: process.env.PATH, HOME: process.env.HOME, NO_COLOR: "1" },
});

describe("intentional npm release command", () => {
  test.each([[], ["--phase", "publish"], ["--phase", "prepare"], ["--unknown"]])(
    "refuses local or malformed requests %j without contacting npm", (...args) => {
      const result = run(...args);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Release request refused");
      expect(result.stderr).not.toContain("node:internal");
    });
});

describe("real release command across GitHub and npm process boundaries", () => {
  let fixture, root, env, request;
  beforeEach(async () => {
    fixture = await candidateFixture();
    root = await mkdtemp(path.join(tmpdir(), "obscr-release-provider-"));
    await mkdir(path.join(root, "package"));
    await writeFile(path.join(root, "package/package.json"), JSON.stringify({ name: "obscr", version: "1.1.1" }));
    const packed = spawnSync("tar", ["-czf", path.join(fixture.root, "package.tgz"), "-C", root, "package"], { encoding: "utf8" });
    if (packed.status !== 0) throw new Error(packed.stderr);
    fixture.identity.npmSha256 = digest(await readFile(path.join(fixture.root, "package.tgz")));
    await fixture.save();
    fixture.index.candidate = fixture.manifest.identity.sha256;
    for (const record of fixture.index.records) record.candidate = fixture.index.candidate;
    // Simulated records reach the real subprocess adapter, but HTTP and the npm
    // executable are local fakes. They cannot grant authority or publish a package.
    fixture.manifest.purpose = fixture.index.purpose = "release";
    for (const record of fixture.index.records) record.purpose = "release";
    await fixture.saveReports();
    await fixture.save();
    const zip = path.join(root, "artifact.zip");
    const packedBundle = spawnSync("python3", ["-c", [
      "import io,tarfile,zipfile,sys", "data=io.BytesIO()",
      "with tarfile.open(fileobj=data,mode='w:gz') as t: t.add(sys.argv[1],arcname='.')",
      "with zipfile.ZipFile(sys.argv[2],'w') as z: z.writestr('candidate-evidence.tar.gz',data.getvalue())",
    ].join("\n"), fixture.root, zip], { encoding: "utf8" });
    if (packedBundle.status !== 0) throw new Error(packedBundle.stderr);
    request = { schemaVersion: 1, artifactId: 456, artifactSha256: digest(await readFile(zip)),
      candidate: fixture.manifest.identity.sha256, evidenceIndex: fixture.manifest.evidenceIndex.sha256 };
    const inputs = { request: "release", artifact_id: "456", artifact_sha256: request.artifactSha256,
      candidate: request.candidate, evidence_index: request.evidenceIndex };
    await writeFile(path.join(root, "event.json"), JSON.stringify({ inputs }));
    await writeFile(path.join(root, "http.mjs"), `
      import { readFile } from 'node:fs/promises';
      const request = ${JSON.stringify(request)};
      const source = ${JSON.stringify(fixture.identity.sourceRevision)};
      globalThis.fetch = async url => {
        const route = new URL(url).pathname;
        if (route.endsWith('/456/zip')) return new Response(await readFile(${JSON.stringify(zip)}));
        let value;
        if (route.endsWith('/artifacts/456')) value = { id:456,expired:false,digest:'sha256:'+request.artifactSha256,
          workflow_run:{id:88,head_sha:source} };
        else if (route.endsWith('/runs/88')) value = {id:88,status:'completed',conclusion:'success',
          event:'workflow_dispatch',path:'.github/workflows/application-review.yml',head_sha:source,
          repository:{full_name:'jdragulanescu/obscr'},head_repository:{full_name:'jdragulanescu/obscr'}};
        else if (route.endsWith('/123/approvals')) value = [{state:'approved',user:{login:'jdragulanescu'},
          environments:[{name:'Production'}]}];
        else return new Response('unexpected request',{status:404});
        return new Response(JSON.stringify(value));
      };
    `);
    await writeFile(path.join(root, "npm"), `#!${process.execPath}
      const fs = require('node:fs'), crypto = require('node:crypto');
      const args = process.argv.slice(2);
      if (args[0] === '--version') { console.log('11.6.2'); process.exit(0); }
      if (args[0] !== 'publish' || !args.includes('--ignore-scripts') ||
          !args.includes('--registry=https://registry.npmjs.org') ||
          !args.includes('--provenance') || !args.includes('--fetch-retries=0') ||
          process.env.GITHUB_TOKEN || process.env.NODE_AUTH_TOKEN) process.exit(3);
      const bytes = fs.readFileSync(args[1]);
      fs.writeFileSync(${JSON.stringify(path.join(root, "attempted"))}, 'one publication');
      console.log(JSON.stringify({id:'obscr@1.1.1',name:'obscr',version:'1.1.1',
        shasum:crypto.createHash('sha1').update(bytes).digest('hex'),
        integrity:'sha512-'+crypto.createHash('sha512').update(bytes).digest('base64')}));
    `);
    await chmod(path.join(root, "npm"), 0o700);
    env = { PATH: `${root}${path.delimiter}${process.env.PATH}`, HOME: root,
      GITHUB_ACTIONS: "true", GITHUB_REPOSITORY: "jdragulanescu/obscr",
      GITHUB_EVENT_PATH: path.join(root, "event.json"), GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_SHA: fixture.identity.sourceRevision, GITHUB_TOKEN: "public-test-read-token",
      GITHUB_RUN_ID: "123", GITHUB_RUN_ATTEMPT: "1",
      GITHUB_WORKFLOW_REF: "jdragulanescu/obscr/.github/workflows/publish.yml@refs/heads/main",
      RUNNER_ENVIRONMENT: "github-hosted", RELEASE_REQUEST: JSON.stringify(request),
      ACTIONS_ID_TOKEN_REQUEST_URL: "https://oidc.example.invalid",
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: "public-test-oidc-token",
      GITHUB_STEP_SUMMARY: path.join(root, "summary.md") };
  });
  afterEach(async () => {
    await fixture?.cleanup();
    if (root) await rm(root, { recursive: true, force: true });
  });
  const publish = () => spawnSync(process.execPath, ["--import", path.join(root, "http.mjs"),
    command, "--phase", "publish", "--output", path.join(root, "result")], { env, encoding: "utf8", timeout: 10000 });

  test("publishes through the real subprocess contract and retains the approved identity", async () => {
    const result = publish();
    expect(result.status).toBe(0);
    const receipt = JSON.parse(await readFile(path.join(root, "result/npm-receipt.json"), "utf8"));
    expect(receipt.npm.status).toBe("published");
    expect(receipt.candidate).toBe(request.candidate);
    expect(receipt.approval.reviewer).toBe("jdragulanescu");
  });

  test("a summary write failure cannot turn an observed publication into refusal", async () => {
    env.GITHUB_STEP_SUMMARY = path.join(root, "missing/summary.md");
    const result = publish();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("npm: published");
    const outcome = JSON.parse(await readFile(path.join(root, "result/release-result.json"), "utf8"));
    expect(outcome).toMatchObject({ npm: "published", receiptRetained: true });
  });

  test.each([
    ["ACTIONS_ID_TOKEN_REQUEST_URL", ""], ["ACTIONS_ID_TOKEN_REQUEST_TOKEN", ""],
    ["NPM_TOKEN", "public-test-token"], ["NODE_AUTH_TOKEN", "public-test-token"],
    ["npm_config_auth", "public-test-token"],
  ])("refuses invalid production credentials %s before starting npm", async (key, value) => {
    env[key] = value;
    const result = publish();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("npm.oidc");
    const receipt = JSON.parse(await readFile(path.join(root, "result/npm-receipt.json"), "utf8"));
    expect(receipt).toMatchObject({ npm: { status: "refused" }, error: { code: "NPM_REFUSED", field: "npm.oidc" } });
    await expect(readFile(path.join(root, "attempted"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
