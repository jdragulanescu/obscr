import { selectArtifact, resolveRequest, createGithubApi } from "../../lib/release-github.js";

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

  test.each([
    { ...artifact, expired: true },
    { ...artifact, digest: `sha256:${"f".repeat(64)}` },
    { ...artifact, workflow_run: { id: 88, head_sha: "f".repeat(40) } },
  ])("refuses an unusable artifact before downloading it %#", async item => {
    await expect(selectArtifact(request, context, provider(item))).rejects.toThrow("artifact");
  });

  test.each([
    { ...run, conclusion: "failure" }, { ...run, event: "pull_request" },
    { ...run, path: ".github/workflows/untrusted.yml" },
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
