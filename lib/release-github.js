import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const REPOSITORY = "jdragulanescu/obscr";
const hash = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const positive = value => Number.isSafeInteger(value) && value > 0;

function requireValue(condition, message) {
  if (!condition) throw Object.assign(new Error(message), { code: "RELEASE_REFUSED" });
}

function validateContext(context) {
  requireValue(context?.repository === REPOSITORY && positive(context.runId) &&
    positive(context.runAttempt) && /^[a-f0-9]{40}$/.test(context.sourceRevision),
  "Release context refused: use the repository's intentional release workflow.");
}


export async function selectArtifact(request, context, api) {
  validateContext(context);
  requireValue(positive(request?.artifactId) && hash(request.artifactSha256), "Invalid artifact selection.");
  const artifact = await api.artifact(request.artifactId);
  requireValue(artifact?.id === request.artifactId && artifact.expired === false &&
    artifact.digest === `sha256:${request.artifactSha256}` &&
    artifact.workflow_run?.head_sha === context.sourceRevision && positive(artifact.workflow_run.id),
  "Selected artifact is expired or has changed identity or source.");
  const run = await api.run(artifact.workflow_run.id);
  requireValue(run?.id === artifact.workflow_run.id && run.status === "completed" &&
    run.conclusion === "success" && run.event === "workflow_dispatch" &&
    run.head_sha === context.sourceRevision &&
    run.repository?.full_name === REPOSITORY && run.head_repository?.full_name === REPOSITORY,
  "Selected artifact run is not a successful same-repository manual candidate check.");
  return artifact;
}

export async function resolveRequest(eventName, event, api) {
  if (eventName === "workflow_dispatch" && event?.inputs?.request === "release") {
    const input = event.inputs;
    requireValue(typeof input.artifact_id === "string" && /^[1-9][0-9]*$/.test(input.artifact_id),
      "Select an artifact_id for the intentional release request.");
    return { schemaVersion: 1, artifactId: Number(input.artifact_id),
      artifactSha256: input.artifact_sha256, candidate: input.candidate, evidenceIndex: input.evidence_index };
  }
  requireValue(eventName === "release" && event?.action === "created" && positive(event.release?.id),
    "Only an intentional manual request or release-created event can request approval.");
  const assets = await api.releaseAssets(event.release.id);
  requireValue(Array.isArray(assets) && assets.length < 100, "Cannot establish the complete release asset list.");
  const selected = assets.filter(asset => asset.name === "release-request.json");
  requireValue(selected.length === 1 && positive(selected[0].id),
    "Attach exactly one release-request.json selection before creating the release.");
  return api.releaseRequest(selected[0].id);
}

export function createGithubApi(token, { fetch: fetcher = fetch, signal } = {}) {
  requireValue(typeof token === "string" && token.length > 0, "GitHub read token is required.");
  const response = async (route, binary = false) => {
    let result = await fetcher(`https://api.github.com/repos/${REPOSITORY}/${route}`, {
      headers: { Accept: binary && route.startsWith("releases/assets/") ? "application/octet-stream" : "application/vnd.github+json",
        Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" },
      redirect: "manual", signal,
    });
    if (binary && result.status === 302) {
      const location = new URL(result.headers.get("location"));
      requireValue(location.protocol === "https:" && !location.username && !location.password,
        "GitHub returned an unsafe artifact location.");
      // Signed storage URLs do not receive the repository token.
      result = await fetcher(location.href, { redirect: "error", signal });
    }
    requireValue(result.ok, `GitHub request refused (${result.status}).`);
    return result;
  };
  const json = async (route, binary = false) => {
    const result = await response(route, binary);
    const bytes = await result.text();
    requireValue(bytes.length <= 1024 * 1024, "GitHub metadata exceeds the supported size.");
    try { return JSON.parse(bytes); }
    catch { throw new Error("GitHub returned invalid metadata."); }
  };
  const id = value => {
    requireValue(positive(value), "Invalid GitHub resource identity.");
    return value;
  };
  return {
    environment: () => json("environments/Production"),
    reviews: run => json(`actions/runs/${id(run)}/approvals`),
    artifact: artifact => json(`actions/artifacts/${id(artifact)}`),
    run: run => json(`actions/runs/${id(run)}`),
    releaseAssets: release => json(`releases/${id(release)}/assets?per_page=100`),
    releaseRequest: asset => json(`releases/assets/${id(asset)}`, true),
    download: async (request, destination) => {
      requireValue(hash(request.artifactSha256), "Invalid artifact digest.");
      const result = await response(`actions/artifacts/${id(request.artifactId)}/zip`, true);
      const digest = createHash("sha256");
      let size = 0;
      const checked = new Transform({ transform(chunk, encoding, callback) {
        size += chunk.length;
        if (size > 2 * 1024 * 1024 * 1024) return callback(new Error("Candidate archive exceeds 2 GiB."));
        digest.update(chunk);
        callback(null, chunk);
      } });
      await pipeline(Readable.fromWeb(result.body), checked, createWriteStream(destination, { flags: "wx", mode: 0o600 }), { signal });
      requireValue(digest.digest("hex") === request.artifactSha256, "Downloaded artifact digest differs from the selected identity.");
    },
  };
}
