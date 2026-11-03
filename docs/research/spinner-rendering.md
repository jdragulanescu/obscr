# Delayed spinner rendering and verification

Scope: #76, the presentation-only follow-up to #46. Genuine long-worker-stage
proof remains on acceptance #71; controlled component timing cannot supply it.

## Actual-app finding

At base `2e71eb1`, the actual `OperationStatus` mounted with the app's loaded
stylesheet rendered its empty inline spinner span as **4×25px**, despite
computed width and height of 14px. The standalone planning diagnostic's height
was 24px; the actual-app reproduction is the implementation baseline.

Making `.spinner` an `inline-block` establishes its existing **14×14px**
border-box and makes it transformable. No timing, stages, cancellation, worker,
crypto or reduced-motion policy changes are needed.

For a rotating square layout box, `getBoundingClientRect()` includes the
rotation and can exceed 14px (one fixed-candidate sample was 18.14px).
Measure `offsetWidth`/`offsetHeight` for layout dimensions, record changing
transforms and visible motion, and measure stationary geometry separately.
jsdom DOM-presence checks alone do not prove browser geometry or motion.

Baseline and post-fix reports, including failed attempts, are on
[#76](https://github.com/jdragulanescu/obscr/issues/76). Captures are external
temporary artifacts, not a committed browser harness.

## Verification pitfalls encountered

- Vite's root is `app`, so served component/style URLs start with `/src/`,
  not `/app/src/`. Use the dependency URLs from actual served modules;
  a guessed dependency URL can return the HTML fallback with HTTP 200.
- Bypass service workers and caches and verify the loaded worker imports name
  the worktree. Vite may reload after first optimizing a newly used dependency;
  a reload during an operation is not evidence of operation completion.
- Check `matchMedia('(prefers-reduced-motion: reduce)').matches` before and
  after the delayed render. An acknowledged one-shot CDP emulation command
  did not establish a persistent override in an earlier attempt; the browser
  CLI's reduced-motion setting did establish it.
- Wait for font transitions to settle, or temporarily disable transitions in
  the verification DOM, before asserting doubled button text. Doubling only
  the root font does not double controls that specify pixel font sizes.
- `Encrypt & Hide` names both a tab and a form action. Scope submission to the
  form, and use fresh, unambiguous file-input selectors for the two Diff slots.
- This run's Vite server listened on IPv6 loopback. `agent-curl` to `localhost`
  failed via IPv4 while the browser and ordinary curl still reached it.
  `agent-curl -I 'http://[::1]:5173/'` returned HTTP 200. A failed IPv4 probe
  alone did not establish that this server was down.

No production delays, debug hooks, weaker crypto profiles or extra workers
were added to make a spinner visible.
