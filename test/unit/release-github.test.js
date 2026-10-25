import { selectArtifact, resolveRequest, createGithubApi } from "../../lib/release-github.js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const context = { repository: "jdragulanescu/obscr", runId: 123, runAttempt: 1,
  sourceRevision: "a".repeat(40) };
const request = { schemaVersion: 1, artifactId: 456, artifactSha256: "b".repeat(64),
  candidate: "c".repeat(64), evidenceIndex: "d".repeat(64) };
describe("retained GitHub release selection", () => {
  const artifact = { id: 456, expired: false, digest: `sha256:${request.artifactSha256}`,
    workflow_run: { id: 88, head_sha: context.sourceRevision } };
  const run = { id: 88, event: "workflow_dispatch", status: "completed", conclusion: "success",
    path: ".github/workflows/publish.yml", head_sha: context.sourceRevision,
    repository: { full_name: context.repository }, head_repository: { full_name: context.repository } };
  const provider = (item = artifact, execution = run) => ({
    artifact: async () => item, run: async () => execution,
  });

  test("selects only a successful same-repository candidate with matching source and bytes", async () => {
    expect(await selectArtifact(request, context, provider())).toEqual(artifact);
  });

  test("accepts completed review artifacts without rebuilding the candidate", async () => {
    expect(await selectArtifact(request, context, provider(artifact, {
      ...run, path: ".github/workflows/application-review.yml",
    }))).toEqual(artifact);
  });

  test.each([
    { ...artifact, expired: true },
    { ...artifact, digest: `sha256:${"f".repeat(64)}` },
    { ...artifact, workflow_run: { id: 88, head_sha: "f".repeat(40) } },
  ])("refuses an unusable artifact before downloading it %#", async item => {
    await expect(selectArtifact(request, context, provider(item))).rejects.toThrow("artifact");
  });

  test.each([
    { ...run, conclusion: "failure" }, { ...run, event: "pull_request" },
    { ...run, head_repository: { full_name: "another/repo" } },
  ])("refuses a candidate from the wrong or failed build route %#", async execution => {
    await expect(selectArtifact(request, context, provider(artifact, execution))).rejects.toThrow("run");
  });

  test("manual selection and release asset selection resolve to the same immutable request", async () => {
    const manual = await resolveRequest("workflow_dispatch", { inputs: { request: "release",
      artifact_id: "456", artifact_sha256: request.artifactSha256,
      candidate: request.candidate, evidence_index: request.evidenceIndex } }, {});
    const release = await resolveRequest("release", { action: "created", release: { id: 7 } }, {
      releaseAssets: async () => [{ id: 9, name: "release-request.json" }],
      releaseRequest: async () => request,
    });
    expect(manual).toEqual(request);
    expect(release).toEqual(request);
  });

  test("a release without its saved selection refuses before approval", async () => {
    await expect(resolveRequest("release", { action: "created", release: { id: 7 } }, {
      releaseAssets: async () => [],
    })).rejects.toThrow("release-request.json");
  });
});

describe("GitHub provider response contract", () => {
  test("downloads Actions archives using the API media type, not release-asset media", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "obscr-artifact-http-"));
    try {
      const api = createGithubApi("public-test-token", { fetch: async (url, options) => {
        if (url.endsWith("/actions/artifacts/456/zip")) {
          if (options.headers.Accept !== "application/vnd.github+json") return new Response("", { status: 415 });
          return new Response(null, { status: 302, headers: { location: "https://storage.example.invalid/archive" } });
        }
        if (url === "https://storage.example.invalid/archive" && !options.headers?.Authorization) {
          return new Response("abc");
        }
        return new Response("", { status: 403 });
      } });
      const destination = path.join(root, "artifact.zip");
      await api.download({ ...request, artifactSha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" }, destination);
      expect(await readFile(destination, "utf8")).toBe("abc");
      await expect(api.download(request, path.join(root, "changed.zip"))).rejects.toThrow("digest differs");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  test("reads a release asset through the binary API without forwarding authorization to storage", async () => {
    const api = createGithubApi("private-test-token", { fetch: async (url, options) => {
      if (url === "https://api.github.com/repos/jdragulanescu/obscr/releases/assets/9") {
        if (options.headers.Accept !== "application/octet-stream") return new Response("", { status: 406 });
        return new Response(null, { status: 302, headers: { location: "https://storage.example.invalid/asset" } });
      }
      if (url === "https://storage.example.invalid/asset" && !options.headers?.Authorization) {
        return new Response(JSON.stringify(request));
      }
      return new Response("wrong provider request", { status: 403 });
    } });
    expect(await api.releaseRequest(9)).toEqual(request);
  });

  test("does not expose provider response secrets on access refusal", async () => {
    const api = createGithubApi("private-test-token", {
      fetch: async () => new Response("secret provider detail", { status: 403 }),
    });
    await expect(api.environment()).rejects.toThrow("GitHub request refused (403)");
    await expect(api.environment()).rejects.not.toThrow("secret");
  });
});
