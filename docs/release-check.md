# Read-only release checks

Run with Node 24.x and Git installed:

```sh
npm run release:check -- --help
npm run release:check -- --manifest /path/to/bundle/manifest.json
```

For a clean result stream in a script, use `npm run --silent release:check --
--manifest /path/to/bundle/manifest.json`, or `node bin/release-check.js
--manifest /path/to/bundle/manifest.json`.

The active task is validation, not publication. The command never prompts, writes
files, builds, downloads, publishes, or grants approval. Ctrl-C cancels with exit
130. Refusal or incomplete work exits 1 with no result on stdout. Exit 0 prints
the candidate and evidence-index hashes and **Approval still required**.
Progress and actionable refusals use stderr. All status is plain text, including
with `NO_COLOR`; terminal controls and non-ASCII display text are escaped. Piped
URLs and hashes remain unbroken. Long report lists are summarized by count and
linked through the retained manifest instead of filling the terminal.

**Validation does not grant publication authority.** The candidate workflow
replaces direct npm publication with checks and retained artifacts. Protected
npm/PWA publication and account-level controls remain #56–#57. A JSON assertion
is not proof that a reviewer is independent or a phone run happened. The release
review and protected publishing jobs must establish the provenance and authority
of the retained records. This checker verifies their identity, completeness and
disposition. It always returns `publicationAuthorized: false`, including when a
matching approval record is supplied. Never use its exit status alone to publish.

## Build and retain a candidate

Use Node 24.x, npm and Git. Select a committed checkout and a new output directory:

```sh
npm run release:candidate -- --request check --output /path/to/new-bundle --run local-1
```

The command builds committed `HEAD`, not uncommitted edits. `--source <checkout>`
selects another local checkout. It clones a clean retained source and a separate
temporary build checkout. The build processes receive no inherited publication
tokens or user npm configuration. They run `npm ci`, the full `npm test`,
`npm run build`, and `npm pack --json --ignore-scripts`. Package checks require
the declared main/bin entries; PWA checks require a nonempty complete set of
regular files. No publishing command runs.

`--request check` exits 0 only after those baseline checks and output checks pass.
It prints exact candidate/index hashes and states that release evidence is still
incomplete. `--request release` intentionally requests full release validation
after the same checks. Missing mandatory evidence makes that request exit 1.
Neither choice grants approval or publishes. Complete #53/#52 evidence and
protected approval remain required for a future release.

Each output directory is new; an existing directory is refused, never reused.
The version-1 manifest selects the retained source, npm archive, complete PWA
inventory, reports and evidence index. Baseline records describe only observed
commands, runtime/tool versions and raw stdout/stderr. They use generic check
records, with no invented device or review records and no claimed normative
clause coverage. The existing validator refuses this incomplete index.

`stages.txt` records observed stage outcomes. `raw/` retains command output and
output-verification failures. A failed stage stops subsequent work and cannot
produce a complete manifest. Earlier observations remain. Ctrl-C stops the active
process group, removes the temporary build checkout and exits 130. Retained
evidence is not removed on failure or cancellation.

The GitHub workflow uploads one immutable artifact per run/attempt for 90 days.
Its tar archive preserves the retained Git metadata and file modes. Download and
keep needed evidence before it expires; never overwrite an old report. The job
summary links the archive and states the check/refusal outcome, not release success.

### Workflow entries and external draft controls

`.github/workflows/publish.yml` accepts non-draft PR events, `release: created`,
and a manual `request` choice. PR events run checks only. Draft creation and updates
skip the whole candidate job. `ready_for_review` starts checks;
`converted_to_draft` skips the new job and cancels the previous PR run through
workflow concurrency. There is no branch-push trigger, publication secret,
write permission, approval environment or direct-publish fallback in this workflow.

Start a safe check on a branch or tag containing this workflow version:

```sh
gh workflow run publish.yml --ref <branch-or-tag> -f request=check
```

An intentional release validation request uses `-f request=release`. It can fail
after a successful build because baseline CI is not the complete release review.
GitHub must know the workflow on the default branch; this replaces the existing
`publish.yml`. Use the CLI with `--ref` to select the candidate branch, rather than
assuming the default branch's workflow form has these new inputs.

GitHub Actions and Vercel are separate routes. `vercel.json` sets
`git.deploymentEnabled: false`, the documented control that stops automatic Git
deployments before a build. This also disables automatic ready-PR previews and
production updates from Git; it does not remove an existing deployment.
An Ignored Build Step is not an alternative: it runs after `BUILDING` begins.
See [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
and [Ignored Build Step](https://vercel.com/docs/project-configuration/project-settings#ignored-build-step).

**Live enforcement is not yet verified.** Draft PR #59 previously received a
Vercel preview. During #55, the dashboard required login and the saved CLI
credential returned HTTP 403 with `invalidToken: true`. No account setting was
changed. A repository setting on this branch alone is not proof that every
connected project, older branch, deploy hook or custom environment is restricted.
The remaining walkthrough must inspect project/team deployment policies or the
Git connection, then compare provider deployment/build records across draft
creation, updates and ready/draft transitions. Non-draft Actions checks must still
run. #57 separately proves protected production distribution; this candidate
workflow does not establish that account-level gate.

Vercel [Deployment Policies](https://vercel.com/docs/deployments/deployment-policy)
can restrict deployment sources before creation. An account owner must inspect
the effective project and inherited team rules. Do not disable status comments
and mistake that for disabling builds. Do not open a deploy-hook URL to inspect
it: even a GET can request a deployment.


## Bundle and hashes

The saved contract is version 1, approved in
[#54](https://github.com/jdragulanescu/obscr/issues/54#issuecomment-6399528850).
Hash original file bytes with SHA-256, encoded as 64 lowercase hex characters.
Do not parse and reserialize a file before hashing it. Reformatting an identity
or index changes its hash and invalidates prior approval. Preserve original
files, including old reports, raw observations and exclusions.

All references have `{ "path": "relative/path", "sha256": "…" }`. The ellipsis
here describes a digest field; use the actual digest, not that text. Paths resolve
from the manifest's directory, not the current working directory or a report's
directory. References must remain inside the bundle. Absolute paths, `..`, empty
segments, backslashes, control characters, symbolic links and special files are
refused. Each JSON file is bounded to 16 MiB; large raw artifacts are streamed.
Keep the bundle stable throughout validation. Changed files and asset inventories
are refused. This is a read-time check, not a filesystem lock: publishing jobs
must validate again immediately before using the retained files.

A bundle contains a manifest, identity, evidence index, a retained source Git
checkout, its lockfile, an npm archive, the complete PWA directory, and the
referenced reports/fixtures/history. Their filenames are selected by the manifest;
`identity.json` and `evidence-index.json` are the recommended names.

### Manifest

| Field | Required value |
|---|---|
| `schemaVersion` | `1` |
| `purpose` | `public-fixture` or `release`; must match the index and every report |
| `identity` | Hash reference to the versioned identity JSON |
| `evidenceIndex` | Hash reference to the versioned evidence-index JSON |
| `source` | Relative directory of the retained Git checkout |
| `lockfile` | Exactly `<source>/package-lock.json` |
| `npmArchive` | Relative path to the retained archive |
| `pwaDirectory` | Relative directory containing the complete PWA asset set |
| `approval` | Optional bound approval record; see below |

The source checkout must contain exactly its tracked regular files plus Git
metadata: no links, submodules, build output, dependencies or untracked files.
Keep build output outside the source directory. The checker compares HEAD to the
40-character Git commit ID and hashes every tracked file against its Git blob.
It does not run checkout hooks, clean files, refresh the Git index, install
packages or apply Git content filters. Lazy fetching is disabled and Git transports
are denied, including transports enabled by the supplied repository configuration.
Missing Git/source objects refuse validation.
The [Git read-isolation finding](research/obscr-release-git-isolation.md) records
the local reproduction and regression check.
The checker binds the npm archive's bytes; it does not replace npm/package checks
or attest how either distribution was built.

### Identity

| Field | Required value |
|---|---|
| `schemaVersion` | `1` |
| `sourceRevision` | Full lowercase 40-character Git commit ID |
| `lockfileSha256` | SHA-256 of the source checkout's lockfile |
| `format` / `profile` | Integer `1` / `1`, the accepted fixed format and Argon2id profile |
| `npmSha256` | SHA-256 of the exact retained npm archive |
| `pwaAssets` | Nonempty array of `{path, sha256}`, paths relative to `pwaDirectory` |

Every PWA regular file must appear exactly once, including nested files. Missing,
extra, duplicate or altered assets refuse validation. Version text is not identity.
The candidate key is the SHA-256 of the complete original identity JSON bytes;
do not put that key inside the identity itself.

## Required evidence

`lib/release-checklist.json` is the shipped catalogue. Its SHA-256 is the
`checklistRevision`. It retains source-linked text from the accepted contracts:
[#13](https://github.com/jdragulanescu/obscr/issues/13#issuecomment-6372728819),
[#17](https://github.com/jdragulanescu/obscr/issues/17#issuecomment-6386604139),
[#18](https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6374176664)
and its [key/sampler contract](https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6373122896),
[#19](https://github.com/jdragulanescu/obscr/issues/19#issuecomment-6387228703),
[#20](https://github.com/jdragulanescu/obscr/issues/20#issuecomment-6384584117),
[#21](https://github.com/jdragulanescu/obscr/issues/21#issuecomment-6387616398),
[#22](https://github.com/jdragulanescu/obscr/issues/22#issuecomment-6387870623),
[#25](https://github.com/jdragulanescu/obscr/issues/25#issuecomment-6372936093),
[#27](https://github.com/jdragulanescu/obscr/issues/27#issuecomment-6373868960),
and the [cancelled research scope](https://github.com/jdragulanescu/obscr/issues/17#issuecomment-6384497512).

Each catalogue entry is a source-linked sentence, list item, table row or reference
block. A check mapped to an entry must cover its whole text, not just one example.
The catalogue's precedence rules preserve the accepted narrowings: #19's smaller
resource bounds and hidden-profile timing; no legacy migration; no cancelled
corpus/detector programme; physical-device proof deferred to release, not waived.
Older statements are retained for traceability, interpreted under these rules.
Changes to accepted requirements need a reviewed catalogue update and new index
revision. A candidate cannot supply its own shorter checklist.

### Evidence index

| Field | Required value |
|---|---|
| `schemaVersion` | `1` |
| `purpose` | Matches the manifest |
| `candidate` | Identity-file SHA-256 |
| `checklistRevision` | SHA-256 of the shipped catalogue bytes |
| `clauses` | Exactly one `{id, check, run}` per catalogue requirement |
| `records` | Nonempty array of the records below |
| `carryForward` | Explicit array of reviewed reuse records, or `[]` |

Check/run identifiers contain 1–128 ASCII letters, digits, `.`, `_`, `:`, or `-`,
starting with a letter or digit. Each check/run pair is unique in the index.
Every record is mandatory: only `pass` can validate. Failed, unmet, skipped,
not-run, missing or stale records refuse validation. A passing old run cannot hide
a failed mandatory row. No optional-row flag or exclusion waives a required check.

### Retained report records

Each record contains:

- `schemaVersion: 1`, `purpose`, `candidate`, `check`, `run`, `status: "pass"`;
- `category`: one of A1–A13, with all thirteen present across the index;
- `kind`: `check`, or one of the mandatory kinds below;
- `fixtureManifest`: hash reference; `fixtures`: nonempty array of hash references;
- `environment.os`; `environment.runtime: {name, version}`;
  `environment.tools`: nonempty `{name, version}` array;
- `environment.device: {kind, model, osVersion, ram}`; use an explicit instrumentation
  limit for RAM when it is not measurable, never leave it blank;
- `actions`: nonempty text array; `expected`, `actual`: nonblank text;
  `limits`: nonempty text array, with explicit `none` when there are none;
- `verifier: {name, role, competence}`;
- `observations`: nonempty array of retained raw-artifact references;
  `exclusions`: array of `{reason, artifact}` retaining excluded observations,
  or `[]` when none;
- `report`: reference to a JSON file containing exactly this record **without**
  the `report` member. The indexed values must equal the retained report values.

The mandatory kinds are `physical-iphone-safari`, `physical-android-chrome`,
`desktop-safari`, `desktop-chrome`, `desktop-firefox`, `node-lts`,
`independent-review`, `application-review`, and `tools-review`. Phone records must
name `device.kind: "physical"`. Browser records include `device.browser: {name,
version}`, and the browser name must match the kind (case-insensitive). `node-lts`
names Node 24.x with its complete version. Recording a platform's name alone does
not replace its actual timing, memory, cancellation and app-exchange evidence.
Those outcomes must be present in the mapped reports under the accepted clauses.

Review records add `review` with `scope` containing `format` and `implementation`,
nonempty `implementationAuthors`, and `findings`. The independent verifier must
not be a named implementation author. Tools review names `issue: 52`. Application
review names `issue: 53`, `includes: [52]`, and `coveredRecords`: `{check, run}`
references covering every other current index record, including the tools review.
It must be renewed when those referenced runs change.

Every finding has an `id`, `status: "fixed"` or `"accepted"`, and an `evidence`
reference. Accepted residual risks also require `mandatoryCriterionChanged: false`
and a `humanDecision` JSON reference containing `decision: "accepted"`, `reviewer`,
`reason`, `finding` and `candidate`. A mandatory-criterion change requires an
explicit contract/catalogue revision; residual-risk acceptance cannot hide it.

## Carry-forward and approval

A record for another candidate is stale unless an index `carryForward` entry
supplies hash references `{identity, index, impact}` to its original identity,
original index and a reviewed impact JSON file. Original records, including failed
observations and exclusions, remain unchanged and readable. Historical reviews
can retain open findings; only current passing records with completed dispositions
can satisfy the release checks. The old index must use the same checklist revision
and purpose. A changed checklist requires fresh mapping, not automatic reuse.

The impact record contains `schemaVersion: 1`, `fromCandidate`, `toCandidate`,
`previousIndex` (the old index's hash), `checklistRevision`, `decision: "approved"`,
`reason`, `reviewer: {name, role, competence}`, nonempty `observations` references
and an explicit `exclusions` array. Its `affectedChecks` and `unaffectedChecks`
form one complete, nonoverlapping classification of old and new check IDs.

Affected checks rerun for the current candidate with new run IDs. An unaffected
record may remain keyed to its original candidate/check/run only when it equals
the original indexed record in full. Relabelling an old report, silently changing
its candidate key, losing raw observations or using an unreviewed impact refuses
validation. A renewed application review must cover the selected current runs.

An optional manifest `approval` has `schemaVersion: 1`, `candidate`, `evidenceIndex`,
`decision: "approved"` and the named `reviewer`. Both hashes must match. Public
fixtures refuse approval even when their hashes match. Matching a record verifies
only its binding, not the reviewer's authority; protected publishing jobs still
require and verify actual human approval. No command flag bypasses missing evidence.

## Public fixture walkthrough

This creates a unique temporary bundle with simulated records and prints its
manifest path. It is test tooling, not a candidate builder or release evidence:

```sh
node --input-type=module -e 'const {candidateFixture}=await import("./test/fixtures/release-candidate.js"); const f=await candidateFixture(); console.log(f.manifestPath)'
```

Run `release:check` with the printed path. A complete fixture returns exit 0 and
an explicit public-fixture warning. Change `package.tgz`: it must refuse the npm
hash. Remove a report: it must refuse that check. Edit an index: update its manifest
hash to exercise content validation; leave the hash unchanged to exercise tamper
refusal. Keep originals when testing carry-forward. Delete only the exact temporary
bundle directory you created when finished.

The fixture's archive/PWA bytes and review/device records are deliberately public
simulations. They do not implement or prove the unfinished product. Do not relabel
them as release evidence. Real publication still requires complete #53, including
#52, the required physical-device/independent records and protected approval.

## Module interface

`validateCandidate(manifestPath, {signal, onProgress})` in
`lib/candidate-validation.js` reads the bundle and resolves to `{candidate,
evidenceIndex, purpose, recordCount, clauseCount, approvalRequired: true,
publicationAuthorized: false}`. It throws a safe error with a `field` for refused
inputs, or the abort reason for cancellation. `onProgress` receives static stage
names; it must not change inputs. The CLI adapts these outcomes to text and exit
codes. `lib/evidence-record.js` owns the catalogue, report coverage, dispositions
and reuse checks; it reads retained files through the candidate reader.
