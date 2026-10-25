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
#54 rejects that Git entry type. The fixture's source has only regular files,
so its passing result did not establish that a real repository candidate passes.
This remains an open contract decision, not a reason to remove the source guard.

A throwaway clone made with `git clone --no-hardlinks -c core.symlinks=false`
materialized the link's stored target text as a regular file. `stat` reported a
regular file, and `git hash-object CLAUDE.md` still returned the blob above.
The Git tree still records mode `120000`. This proves a link-free representation
is available; it does not authorize changing the saved-source contract or make
the existing validator accept it. No repository link was changed.

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

## References

- [Implementation ticket #55](https://github.com/jdragulanescu/obscr/issues/55)
- [Existing source and evidence contract](../release-check.md#bundle-and-hashes)
- [Git `core.symlinks`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-coresymlinks)
