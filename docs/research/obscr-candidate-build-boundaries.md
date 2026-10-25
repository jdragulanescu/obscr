# Candidate build boundaries observed in #55

## A real repository is not the public fixture

The actual candidate command at `40f7c3a953d856f770b91d389887b2bfc69751ec`
completed clean installation, all 274 Jest tests, the PWA build and package checks.
It then exited 1 during source validation:

```text
manifest.source: source must contain regular tracked files, not links or submodules
```

`git ls-tree -r HEAD` showed `CLAUDE.md` with mode `120000` and blob
`47dc3e3d863cfb5727b87d785d09abf9743c0a72`. The version-1 source contract from
#54 rejected that Git entry type. The fixture's source had only regular files,
so its passing result did not establish that a real repository candidate passed.

A throwaway clone made with `git clone --no-hardlinks -c core.symlinks=false`
materialized the link's stored target text as a regular file. `stat` reported a
regular file, and `git hash-object CLAUDE.md` still returned the blob above.
The Git tree still records mode `120000`. The user
[approved this representation in #55](https://github.com/jdragulanescu/obscr/issues/55#issuecomment-6401290127).
The retained clone now sets `core.symlinks=false`; the validator accepts link
blobs only as regular files with their exact Git bytes. It still refuses actual
filesystem links and submodules. The separate build clone keeps native checkout
behavior, tested by running an npm test script through a tracked link.
No repository link was changed.

## Cross-filesystem output

Review found that moving `dist` from `os.tmpdir()` to a caller-selected output
can fail with `EXDEV`. A real public package was built with output on a separate,
temporary APFS disk image. Before the fix, its PWA stage failed:

```text
EXDEV: cross-device link not permitted, rename .../build/dist -> .../pwa
```

After placing the temporary build checkout beside the output directory, the same
cross-filesystem scenario retained its manifest, package and PWA assets. Both
source and output device IDs were checked and differed. The build and destination
now share a filesystem, so retention needs no asset copy. The temporary disk
image is smoke tooling, not a permanent test dependency.

## Separate npm configuration paths

This command refused to start npm:

```sh
env NPM_CONFIG_USERCONFIG=/dev/null NPM_CONFIG_GLOBALCONFIG=/dev/null npm --version
```

Observed reason: `double-loading config "/dev/null" as "global", previously loaded
as "user"`. The candidate runner instead selects two distinct paths inside its
private temporary home. Its real-package integration test exercises npm startup,
installation, tests, build and packing through that environment.

## Test concurrency

With Jest's default worker count, one existing full-workflow case hit its existing
5-second deadline while all new cases passed. The entire suite passed with two
workers. The repository now caps Jest at two workers; the default `npm test` then
passed all 274 cases. No case was removed and no timeout was increased.

A later local run at two workers timed out the existing large-report test; a
serial full run timed out the existing message-integrity case. The large-report
case passed alone in 4.3 seconds. At that point the workstation reported load
averages `51.38 44.87 35.74` on 16 logical CPUs and 6487.75 MiB of swap in use.
This is evidence of load, not proof of the cause of either timeout. All new
source-contract cases passed. No timeout was increased or test removed.

## GitHub cancellation needs both boundaries

The first real ready-to-draft transition on temporary PR #60 marked
[run 40222284956](https://github.com/jdragulanescu/obscr/actions/runs/40222284956)
cancelled, but its build step completed successfully. Draft conversion was
recorded at `18:39:53Z`; the build ended at `18:40:25Z`.
The workflow conclusion alone did not prove that work stopped.

GitHub [re-evaluates running jobs' conditions during cancellation](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation).
The job now includes `!cancelled()` so its own condition cannot keep it alive.
With that guard, run `40222642473` stopped during Jest, but the CLI did not
acknowledge cancellation and the runner cleaned up an orphan process.
The step now uses `exec node`, making the CLI the runner's signal target rather
than leaving a shell between them.

[Run 40223699666](https://github.com/jdragulanescu/obscr/actions/runs/40223699666)
then stopped during Jest and printed:

```text
Cancelled. No complete result. Raw observations remain. No publication.
```

Its retained `stages.txt` ends with
`jest: incomplete; no passing candidate result.` The archive contains raw logs,
reports, source and stage status, with no manifest, npm archive or PWA output.
This is the real workflow regression check; a copied YAML condition in a unit
test would not exercise GitHub's cancellation or runner signal delivery.

Cancellation remains asynchronous. Another run, `40223278577`, completed its
build before cancellation arrived. Do not accept a cancelled run merely because
its individual build step succeeded.

For the walkthrough, allow each draft update to settle before marking the PR
ready. In an immediate push/ready sequence, GitHub emitted a ready run for the
previous head, then a later draft-synchronize run for the new head cancelled it.
Record the event and actual head SHA, not just the PR's current state.

## Release-event workflow selection

GitHub [selects workflow files from the event's commit or ref](https://docs.github.com/en/actions/using-workflows/about-workflows);
a [release event uses the tagged commit](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release).
A temporary prerelease pinned to the reviewed checks-only commit exercised the
real `release.created` entry without invoking the old default-branch publisher.
[Run 40221958371](https://github.com/jdragulanescu/obscr/actions/runs/40221958371)
completed baseline checks and refused missing mandatory review/device evidence.
The verification release and tag were removed afterward; no product was published.

## Live Vercel Git-route enforcement

Owner login restored API access on 2026-10-25. The inventory covered both
accessible teams and all three projects; only `obscr`
(`prj_CkRxSApwynpozSMrdUDhemR0ybvp`, team
`team_sudBv9dxGtqj5Wt1pgbGdBjt`) was connected to `jdragulanescu/obscr`.
Its Git link named production branch `main` and had no deploy hooks. The
dedicated custom-environment endpoint returned HTTP 200 with an empty list.

The actual deployment list contained the earlier draft-PR #59 preview:
`dpl_3QJQRe6f9u7XBbuFVWm5Kf1A5uHb`, source `git`, commit `69ea7b8`,
state `READY`. This confirms that the API inventory observed the route from
note 54.1, rather than a different project or only GitHub check records.

At `2026-10-25T19:55:45Z`, the approved Git disconnection returned HTTP 200.
A fresh project read confirmed no Git link. All 22 existing deployment IDs
remained present, and none was building or queued. This uses the documented
[Git disconnect control](https://vercel.com/docs/project-configuration/git-settings#disconnect-your-git-repository),
also exposed by [`vercel git disconnect`](https://vercel.com/docs/cli/git).
The installed Vercel CLI 63.1.1 implements it as
`DELETE /v9/projects/{projectId}/link`; the call was made through an authenticated
browser API request, not a shell network command. No provider client, runtime
action or credential was added to the repository.

Temporary PR #61 then exercised the real events. Authenticated project and
[deployment-list reads](https://vercel.com/docs/rest-api/deployments/list-deployments)
after each transition showed the Git link absent, all previous deployments
retained, and no new or active provider deployment:

| Action | GitHub run | GitHub result | New Vercel deployments |
| --- | --- | --- | --- |
| Create draft | [40228549543](https://github.com/jdragulanescu/obscr/actions/runs/40228549543) | Skipped, no runner or steps | 0 |
| Update draft | [40228616961](https://github.com/jdragulanescu/obscr/actions/runs/40228616961) | Skipped | 0 |
| Ready, then draft during the candidate step | [40228732894](https://github.com/jdragulanescu/obscr/actions/runs/40228732894) | Cancelled; build finished before cancellation arrived | 0 |
| Converted-to-draft event | [40228765949](https://github.com/jdragulanescu/obscr/actions/runs/40228765949) | Skipped | 0 |
| Ready again, allowed to finish | [40228904080](https://github.com/jdragulanescu/obscr/actions/runs/40228904080) | Success; 280 tests and all baseline stages passed | 0 |

The final provider read at `20:05:11Z` still found the same 22 deployment IDs.
A separate authenticated browser navigation to the deployment-list endpoint,
filtered since disconnection, returned `deployments: []` and pagination count 0.
The ready run retained
[artifact 12612052123](https://github.com/jdragulanescu/obscr/actions/runs/40228904080/artifacts/12612052123)
with digest
`sha256:a1a50d0a1c27558289bfd55ac520e86fe6cd0798ca1b141d9a69aba23fc7f8f7`.
Baseline success still does not authorize publication.

Keep the Git connection disconnected to cover branches without
`git.deploymentEnabled: false`. Reconnecting restores the automatic route.
This change does not delete existing deployments or restrict an owner's
CLI/dashboard/API authority; protected production distribution remains #57.
It is not a deployment-policy or public-access-protection claim.

Do not confuse `gitProviderOptions.createDeployments` with this control.
The [project API schema](https://vercel.com/docs/rest-api/projects/update-an-existing-project)
defines it as creation of **GitHub deployment records**, not Vercel builds.
Disabling that field or bot comments can hide evidence without stopping work.

## References

- [Implementation ticket #55](https://github.com/jdragulanescu/obscr/issues/55)
- [Existing source and evidence contract](../release-check.md#bundle-and-hashes)
- [Git `core.symlinks`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-coresymlinks)
- [Live provider walkthrough, settings evidence and screenshots](https://github.com/jdragulanescu/obscr/issues/55#issuecomment-6402595487)
