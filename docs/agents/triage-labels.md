# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Canonical role             | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate the issue |
| `needs-info`               | `question`          | Waiting on the reporter for information |
| `ready-for-agent`          | `ready-for-agent`   | Fully specified and ready for implementation |
| `ready-for-human`          | `ready-for-human`   | Requires human implementation, a human acceptance check, or an answer to a hand-over |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Workflow labels

The skills set these themselves. `to-spec`, `to-tickets` and `implement` create any the tracker lacks when they first use it; `wayfinder`'s labels must exist first. Their names are fixed: keep them as they are, so every repo's tracker reads the same way. On a local tracker, `needs-tickets` is a `Status:` value, an acceptance ticket and a wayfinder ticket carry a `Type:` line, and the rest show in the file's path (`epic.md`, `spec.md`, `issues/`, `map.md`).

| Label | Set by | Meaning |
| --- | --- | --- |
| `epic` | `to-spec` | A parent of specs that share one surface |
| `spec` | `to-spec` | A feature: one PR, its tickets are its children |
| `slice` | `to-tickets` | A vertical slice of a spec |
| `acceptance` | `to-tickets`; `to-spec` for a review ticket | A spec's acceptance ticket, or an epic's review ticket |
| `needs-tickets` | `implement` | Acceptance failed; the failures posted on the ticket wait on `/to-tickets <spec>`. Neither ready nor claimed |
| `wayfinder:map`, `wayfinder:<type>` | `wayfinder` | A decision map and its tickets |

An acceptance ticket is also `ready-for-agent` while it waits to run,
and an epic's review ticket `ready-for-human` while its Try it steps
wait on you. Any ticket or spec is `ready-for-human` while a hand-over
(its `## Needs you` comment) waits for your answer, and goes back to
`ready-for-agent` once you reply and relabel it.
