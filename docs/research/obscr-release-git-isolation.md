# Git reads in supplied candidate checkouts

Research date: **2026-10-25**. Implementation finding for [#54 — Validate a candidate and its evidence without publishing](https://github.com/jdragulanescu/obscr/issues/54), under [#42](https://github.com/jdragulanescu/obscr/issues/42).

## TL;DR

A Git read command can start a transport helper when the supplied repository is a partial clone with missing objects. Disabling global and system Git configuration does not disable the repository's own configuration. The release checker must disable lazy fetching and deny Git transports as well.

## Evidence and limits

Observed with Git `2.50.1 (Apple Git-155)` and Node `v24.13.0` on macOS arm64. The experiment used a temporary public fixture checkout, not a production repository or a remote server.

1. Retain the fixture's HEAD commit, but remove its root tree object.
2. Configure `remote.origin.promisor=true`, `remote.origin.partialclonefilter=blob:none`, and `protocol.ext.allow=always` in that checkout.
3. Set `remote.origin.url` to an `ext::touch` helper whose only action is to create a marker inside the temporary fixture directory.
4. Run the candidate validator. Before the fix, it refused the missing source object, but the marker existed: Git had already executed the helper during `ls-tree`.
5. Add `GIT_NO_LAZY_FETCH=1` and an empty `GIT_ALLOW_PROTOCOL` to every Git subprocess environment. The same regression and a real CLI run then refused the missing tree without creating the marker.

No network request or publication was part of this experiment. The temporary fixtures were removed. This result does not claim that Git is a general sandbox, or that arbitrary Git versions and commands have been audited.

## Retained check

[`test/unit/candidate-validation.test.js`](../../test/unit/candidate-validation.test.js), test `missing Git objects cannot invoke a supplied transport helper`, preserves the failing-before/passing-after case through the validation interface. [`lib/candidate-validation.js`](../../lib/candidate-validation.js) applies both environment restrictions in its shared Git-read wrapper.

The user-facing input contract and limits remain in [release-check.md](../release-check.md).
