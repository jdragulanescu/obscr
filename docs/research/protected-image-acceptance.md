# Protected-image acceptance evidence (#71)

## Released acceptance pass — current reconciliation, not a final verdict

This addendum is the **in-progress released #71 pass**, following the approval/release recorded in `/tmp/obscr-46-comments.md` (2026-10-28 closeout; [release disposition](https://github.com/jdragulanescu/obscr/issues/71#issuecomment-6477369774)). Proof-only failures 2, 3, 4 and 6 remain acceptance-owned; code fixes 1 and 5 belong to #73/#74. Release of the acceptance ticket is not a passing acceptance result, merge approval or release authorization.

- Current production candidate: **`a3a21178e63a144700adc47c65d29f49c41bf93b`**. Whole-feature fixed point: **`4c8f7c5d1e2ca9ac37810cc74a997f4819309736`**, the earliest implementation base, not an acceptance-only diff. Current tests-only candidate: **`7f3b2d45c4e3355b1be317a97cd716480ef3c0bf`**, following the five-file proof/fixture addition `a2ad2124bfa640d958a7a53f6380b0bdc5aaf155`. Production paths match a3a2117; the later28d84fd proof revision is recorded below. This is an acceptance evidence document, not a release verdict.
- **Current completed automated results, supplied by the acceptance owner:** the [posted automated proof](https://github.com/jdragulanescu/obscr/issues/71#issuecomment-6522357908) records the final exact test bytes at 7f3b2d4. Named integration: **6 tests passed, 45.686 s**. Full `npm test`: **563 tests / 23 suites passed, 291.378 s**. Separate new proof-unit run: **2 tests passed, 6.16 s**. PWA build: **passed, 1.72 s**, retaining bundle-size/Browserslist/outDir warnings. Typecheck, lint, format, mutation and e2e: configured **none**. These are owner-run results, not tests executed by this document task. They do not make unsupported clause mappings pass.
- **Current still not run/completed:** fresh stable-server browser/TUI walkthrough and formal whole-feature Standards/Spec/Security review rounds remain main-owner work. No such completion is claimed here. Human7 remains THEIRS; downstream and release gates stay separate.
- **Prior results, not the final run:** 558/22 predates these test edits; the initial a2ad212 proof tree passed 563/23 in 300.137 s and integration6 in25.194 s before 7f3b2d4 expanded tags to every length0..15. The older 538/22 and four-case integration results below belong to their historical candidates. None replaces the final exact-byte results above.
- The original document is retained **byte-for-byte after the historical divider** (pre-addendum SHA-256 `92b8f67f67f71acf3cf5145cde6ff470bd9c3c12ed45cd5ffa85c0e11b5b53b9`). Its failures, statuses, source digests, observations and next-action wording are historical facts, not current instructions to reopen implementation tickets.

### Latest proof revision — 28d84fd

The assertion audit below was first made at 7f3b2d4. Two additional test-only observations now close M01 and M07 without changing production. Current test identity is **28d84fdf66043940b5afd605ece6c52d0b59992d**. `npm test` on these exact bytes passed **568 tests, 24 suites, 267.47 s**; the focused proof pair passed **7 tests, 2 suites, 9.271 s**. The six-case named integration passed again within that full suite (48.164 s); its separate named-command result45.686 s and the unchanged-production PWA build1.72 s are recorded above. No new e2e, lint, format, typecheck or mutation command exists.

| ID / clauses closed | Exact current observation |
|---|---|
| PROTECTED-PROOF-03 / M01, K-L049-02 | `test/unit/protected-proof.test.js:115–145`: through complete prepare/encode/decode, null/empty/lone-high/lone-low-surrogate/1025 ASCII/513 é passwords return typed refusal and no PNG/text. A spy delegates the real pinned Sodium primitive: **zero Argon calls throughout all refusals and preparations**, then exactly one real call on a successful independent-PNG positive control. Pair with the unchanged both-platform invalid-request gate cases in `protected-recovery-worker.test.js` and `protected-encoding-worker.test.js`. PASS at28d84fd. |
| PROTECTED-PROOF-04 / M07, S-L109-01 cancellation constituents | `test/unit/protected-cancellation-proof.test.js`: four cases, Node/browser actual gate × KDF/compression. A test-bootstrap observer delegates the **real synchronous call without injected sleep or replacement output**, marking shared state1 at entry and2 only on return. Cancel observes state1, worker termination returns CANCELLED with no message/preparation/PNG, and state remains1 after exit; the call did not return. Compression uses the maximum1MiB original input. Fresh workers complete real preparation/discard/recovery and state2. This observes termination in an active primitive/compressor **call interval**, not a particular WASM instruction, secure erasure or device timing. Both unchanged production entry gates run. PASS at28d84fd. |

Any older mapping below that retains M01 or M07 as a missing constituent is superseded **only for those named observations** by this table. Disclosure/help, fresh real-screen/timing proof, formal review and downstream/release gates are not supplied by these tests. The remaining directly identified mandatory feature gaps number16 (M02–M06); fresh walks may settle observations or expose further failures. No production fix is performed in acceptance.

### Reading current dispositions

`MAPPED` records PASS for the cited exact assertion at its stated candidate/evidence class (or explicitly historical real-program evidence where stated). A combined clause retaining an UNMET constituent is UNMET as a whole, not PASS. It is an assertion-level mapping, **not a blanket clause or feature PASS**. It is not PASS inferred from a related title. `REVIEWED` means a source/design/ownership/non-claim was checked against the exact normative source and specified production range; it is not a fabricated executable test or an independent audit. `UNMET` retains an absent mandatory observation or an identified source discrepancy. `DOWNSTREAM` and `RELEASE` remain unmet at their existing owners, not waived or silently moved into #46. `THEIRS` is Human 7. Combined requirements retain their unresolved parts even when some constituents are mapped.

Ranges such as `K-L065-02..06` enumerate **each** stable ID through that suffix, inclusively; comma-separated items are separate IDs. The source letter and line retain the meanings in the historical index. A grouped entry shares an actual assertion/review rationale; distinctions inside a group are stated explicitly. The tables below reconcile all **872 historical UNMET rows** (865 clause rows plus G03/G04/G09/G10/G11/G12/G13). Original PASS/FAIL observations remain intact too; supersession of a failed observation requires a fresh observation, not source inspection.

### Exact primary-source identity and narrowing

The primary inputs for this pass are `/tmp/contract-{6373122896,6374176664,6386604139,6387228703,6387616398}.md`, `/tmp/obscr-46-body.md` and filtered `/tmp/obscr-46-comments.md`, not the earlier verdict as a substitute specification. The five contract files differ from the archived `/tmp/obscr-71-evidence/contract-*.md` only by one additional terminal blank line: normative line IDs and content are unchanged. Preserve both digest sets rather than replacing the historical set.

| Source | SHA-256 of the current exact input |
|---|---|
| K / `6373122896` | `6ed4378b2b694dd115648ca2ea11ab51c2f5499f613b644906a7277310b4c80a` |
| P / `6374176664` | `d250916beb84259f28a921a3b671cfc53c7b13c9140ccde5f84f7fef1f2cda84` |
| C / `6386604139` | `e27e8bfd98282a3a24200272a685e6a9737e432ef33ffade5ab83632c2cff2bf` |
| F / `6387228703` | `86e05d84d827c0b4a4c5e50358d50bc9cb14b672fcd336a57597db3a4f5fb8fd` |
| A / `6387616398` | `87929d48891dbdcc7df3b631b0658b815388b30cdb672be7865aeea6d51d1cc7` |
| S / #46 body | `4206505aa6122793ffb8dfcf892016ea6ccef6023cba500c275e901a785f0137` |
| Filtered #46 comments | `8e542a7d6cec431c0b141885b275f3f3b7d63807df27f9c63a08d1210269bfef` |

F §§1/5 and S implementation bounds narrow P's provisional 4096-side/12,192,768-pixel/525,312-draw experiment ceilings to 1024-side/1,048,576 pixels/24,320 draws. F §1 expressly moves hidden-profile checking after the fixed KDF; no public profile selector exists. S ownership/flow supersedes A's suggested `lib/steg-core.js` retention with the private carrier in the complete shared operation; absence of that legacy filename is not permission for duplicated application policy. S Further Notes explicitly retains P3 (#47) guidance/password choices, P4 (#48) exact file/stdin/output policy, P5 (#49) offline/update work, and independent device/security/release gates. The 2026-10-28 comments release proof work only and change none of those requirements.

### New and extended exact catalogue (current test bytes)

These entries supplement the immutable older catalogue. All fixture data is public. Line ranges identify inspected assertion bodies, not merely declarations. Node execution of the browser request gate/WebCrypto is **not** actual-browser evidence.

| ID | Exact title, fixture, assertions and execution qualification |
|---|---|
| PROTECTED-PROOF-01 | `test/unit/protected-proof.test.js:9–47` — `PROTECTED-PROOF-01: failed GCM does no payload decompression; successful authentication precedes real gzip work`. Independent `referencePNG` gzip of `Public authenticated gzip 日本 ` repeated 100 times; tag byte 0 changed **before RS**. Real operation/native decrypt, delegated real pako calls: bad image yields exact common failure, events exactly `GCM start,GCM rejected` (zero gzip initialization **and** work). Good image returns exact text; events start `GCM start,GCM accepted,gzip init`, followed by a nonempty all-`gzip work` tail. PNG inflate uses windowBits 15; only payload gzip initialization 31 is counted. Positive control validates the observer, not a mocked decompressor. PASS in the owner-run proof units and final full suite at 7f3b2d4. |
| PROTECTED-PROOF-02 | `test/unit/protected-proof.test.js:49–113` — `PROTECTED-PROOF-02: maximum complete recovery respects allocations, salt/KDF/repair/GCM attempts and stream ownership`. Independent **1024×1024 opaque RGBA**, raw 512-byte text; fixture/Sodium initialization precede instrumentation. `test/fixtures/protected-observation.js:3–37` delegates real constructors/Map methods, excludes buffer views, observes pre-KDF raster sample accesses after domain allocation. Assertions: score allocation `[2097152]`; large uint32 allocations `[12196,3145728]`; large uint8 allocations `[4195328,4194304]` (one filtered raster and one RGBA, not two RGBA); exactly one 576-byte repaired-body allocation; exactly 128 salt accesses `i*32768`; exactly one **real Sodium crypto_pwhash** call, salt bytes 0..15 once, output32/ops3/memory67108864/algorithm2; repair lengths **`[48,255,255,66]`**, sum624; one GCM body528; one sparse Map, peak >896 and ≤11648, final size0; ≤24 stream chunks; same reusable4096-byte zero input, previous outputs cleared before replacement, paired input/output8192, continuous counters +256 blocks, final input/output cleared. No whole-process/RSS, JS Map byte-size or physical-device claim. PASS in the owner-run proof units and final full suite at 7f3b2d4. |
| K12 | `test/unit/protected-keys.test.js:322–336` — `enforces the final cumulative 24320-draw boundary without restarting the stream`. Controlled little-endian words, domain30001: 1920 rejected +896 accepted prefix draws consume2816; `setLimit(11648)` retains the count; next acceptance at zero-based draw24319 returns scalar29105; at24320 rejects; exactly24 CTR chunks in both cases. This proves the final cumulative boundary, not just a position limit. PASS in the owner-run final full suite at 7f3b2d4. |
| K13 | `test/unit/protected-keys.test.js:225–236` — `enforces the fixed prefix and exact total position ceilings`: draw896 positions then reject; reject limits -1/0.5/11649/NaN; limit11648 emits11648 unique values then rejects. PASS in the owner-run final full suite at 7f3b2d4. |
| PROTECTED-ACCEPT-01 (extended) | Exact two expanded titles remain those in the older catalogue. `test/integration/protected-image.test.js:51–90`, especially65–67: for raw TEXT and gzip TEXT×100, both origin variants compare **all seven encoded summary fields exactly to the consumed preparation** (`originalBytes,storedBytes,compressionUsed,maxStoredBytes,hasFrameCapacity,fits,metadataNotice`), not merely their presence. PASS in the final integration/full-suite runs at 7f3b2d4, closing the missing assertion behind historical F1/#73. Self-roundtrip portions are still compatibility evidence only; independent E01/E09 remain necessary. |
| PROTECTED-ACCEPT-04 | `test/integration/protected-image.test.js:130–148` — `PROTECTED-ACCEPT-04: independent physically shortened tags never release text through either real gate`. Independent640×640 images; empty text, `Short public tag fixture`,224 and512 raw bytes; positive full-tag control recovers exact text through both gates. For **every retained tag length 0..15**, physically remove tag bytes **before the separate RS/interleaver/matrix writer**, keep the canonical full-tag header, and require the entire exact common-failure object, with no message. The final 7f3b2d4 loop expands the earlier five representative lengths; it covers all16 shortened lengths at each of the four stored sizes through each gate (128 negative recoveries), plus eight full-tag positive recoveries. `test/fixtures/protected-reference.js:341–354,425–451` supplies that independent construction; no production encoder import or native-AEAD-only truncation. **The short text is24 UTF-8 bytes, not23**; a23-byte claim is not supported. PASS in final integration6/45.686 s and full-suite563/23 at 7f3b2d4. |
| PROTECTED-ACCEPT-05 | `test/integration/protected-image.test.js:150–162` — `PROTECTED-ACCEPT-05: real gates authenticate independent gzip and refuse its bad tag without text`. Independent gzip positive/changed-tag pair, both actual gates, exact good message or exact common-failure object. Pair with PROTECTED-PROOF-01: -05 alone does **not** observe non-invocation/order. PASS in the final integration/full-suite runs at 7f3b2d4. |
| O12 | `test/unit/protected-operation.test.js:129–148` — `returns the consumed preparation's exact summary with its complete PNG %#`: exact object including seven fields, raw Unicode/BOM, gzip, empty-only and512-byte cases, then recovery. `:150–172` — `binds the result to replacement inputs, not caller-edited summaries or an earlier password`: old/foreign handles refused, caller mutation cannot change worker summary, changed password binds output, consumed handle refused. `:174–182` — `returns no PNG or successful summary for a non-fitting preparation and consumes it`: exact CAPACITY object then PREPARATION_INVALID. Prior production-fix checks, not a fresh run here. |
| U06 | `test/unit/browser-components.test.js:485–502` — `overlapping Diff selections starting in slot %i admit serially and compare the current pair` (both slots): second selection does not abort first; one pending admission, disabled compare until both current dimensions admitted, ordered original/comparison arguments and three result images. `:611–697` — `overlapping form requests pass the real PNG gate at maximum dimensions and recover from rejected inputs`: actual gate under Node, two1024-square covers, malformed/alpha/1025-width refusal, unequal dimensions, corrected pair and exact1048576-pixel comparison. Source #74 fix evidence, **not** a fresh browser B15 pass. |
| U07 | `test/unit/browser-components.test.js:166–184` — `safe progress keeps recovery locked, delays its spinner and ignores late stages`: fake timer/operation, spinner absent initially, present after1000ms, password/task locks, Cancel removes spinner and ignores late progress. This is controlled timing only; real timing remains unmet. |
| T01 | `test/integration/cli.test.js:117–168` exact cases `refuses %j without waiting for piped input`, `preserves existing output on scripted %s refusal`, `shows available help flags without prompting for %j`, `shows usable examples through a plain pipe`, `fails a missing required file argument for %s`, `does not print terminal control characters from invalid user arguments`. Open stdin does not stall refusal; exit1/no stdout/file mutation; help flags/keys/old-format warning; no ANSI/control injection. |
| T02 | `test/integration/cli.test.js:171–223` exact cases `shows help and keys at %ix%i`, `encrypts with editor/password prompts and decrypts the resulting file`, `accepts nonempty public editor text and reports actual compression`, `refuses preparation at %ix%i before asking for a password`: 80×24/120×40 help, task/result path/byte summary, no printed password, whitespace preserved, raw/gzip use, no-frame/empty-only/513-byte refusal without password/deriving/success or output file. |
| T03 | `test/integration/cli.test.js:225–276,317–358` exact cases `announces authenticated empty text while leaving piped result bytes empty`, `recovers text through a stdout pipe without mixing prompts or progress into it`, `escapes recovered terminal controls without changing text saved to a file`, `runs the guided decrypt action and saves its actual result`, `reports a public PNG failure after prompts without recognition details or partial output`, `escapes a long output path while preserving the real filename`, `does not claim success or replace output for a wrong password`. Exact safe display/file bytes and preserved existing files for the specified failures, not P4's future exact stdout policy. |
| T04 | `test/integration/cli.test.js:278–315,360–421` exact cases `runs the guided encrypt action without bypassing PNG admission`, `leaves the guided menu without starting an image operation`, `keeps an existing file when a terminal user declines replacement`, `refuses empty editor text before asking for a password`, `keeps the prepared image when correcting only password confirmation`, `refuses a password above the UTF-8 limit then accepts an exact boundary password`, `cancels a prompt with Ctrl-C without writing result bytes`, `cancels worker processing with Ctrl-C and leaves an existing output unchanged`. Exact prompts, one preparation,513/512 é boundary, cancellation/no saved success/no temp file. This does not assert an actual in-Argon entry counter. |

Inspected new-test identities: proof file `720e763ed968aa72e610dc3af9b9ae52a09cee94c25c2056196684c2b756da16`; observer `58224fe58d75ef5ff6e3a7e9b0de17e45965e181fd441c13cd022c457a6354c0`; key file `ce69fb6b48c92f818f904967e183eb7d85d77ac2efeb03018276899bdc7b57e3`; integration `58e65878ef2cd1731a58b536a44f2fd0b0569498a03069ea2c14006402dfea5b`; independent reference `0bca933615950db983ca5fc9774bb1dab28e9741d5b6d66219e16e3c2172d6b4` (SHA-256). These match the inspected files at the final tests-only candidate 7f3b2d4; the owner confirms the final full suite used these exact test bytes. Later edits require a new identity/result; the linked proof comment is the run record.

### Assertion/review keys used by the reconciliation

These keys expand precise evidence rather than conferring a blanket pass. Historical check IDs retain their exact titles above/below.

| Key | Exact observation or source-review boundary |
|---|---|
| KEY | K01 `protected-keys.test.js:48–68`: fixed independent root seen twice by HKDF, same root object cleared, exact two labels, anchored32-byte children, unchanged password bytes. K05 `:109–127`: composed/decomposed, spaces/case/BOM/CRLF give distinct keys, changed salt changes both keys. R10 `protected-recovery.test.js:22–32`: invalid/empty/surrogate/over1024 rejected with no message, **HKDF** forbidden, not an Argon counter. R11 `protected-recovery-worker.test.js:77–83`: exact1024-byte ASCII/multibyte independent recovery through both gates. `lib/protected-keys.js:11–43` explicitly calls raw Sodium32/3/67108864/ARGON2ID13 once, fixed v19/p1/empty secret/AD API, no key cache; native HKDF adapters `protected-native-node.js:62–69`, `protected-native-browser.js:48–60` fix zero32 salt/SHA256/output32. Package pins in package.json/package-lock.json are source evidence, not completed artifact/license audit. |
| STREAM | K02/K03 `protected-keys.test.js:70–107` compare independent128-byte zero-counter stream/24 positions on each native adapter, carry beyond bit63, final counter usable but17-byte wrap rejected,4097-byte chunk refused, fixed GCM vector, changed payload/AAD and primitive truncation rejected. K09 `:198–223` compares896+1153 positions to uninterrupted2049, counters0/0x100/0x200 and4096-byte chunks, clears retained chunks. `lib/protected-keys.js:46–162` plus native browser`:62–72`/Node`:71–91` show full128-bit increment and length128, not a reduced seed. |
| SAMPLE | K06 `protected-keys.test.js:166–176` injects words `[ffffffff,1,ffffffff,0]`, asserts exact `[7,13,2]` from canonical `[2,7,13]` excluding9; K07`:178–189` singleton draws once,37-domain full uniqueness; K08`:191–196` emits786431 despite budget1; K10`:238–256` rejects all2816 exhausted prefix draws, accepts last permitted draw2815, retains prefix count across setLimit897. K11`:274–289` zero-demand no CTR, one budget negotiation, invalid demands rejected. K12/K13 add final boundaries. `lib/protected-keys.js:116–157` uses numeric2^32, LE uint32, rejection **before** modulo, sparse swap/delete, no biased fallback; final profile MAX_ELIGIBLE786432 is stricter than theoreticalN≤2^32. |
| CARRIER | E01/E09 `protected-encoding-format.test.js:21–64` compare every output RGBA byte to independent full-sort scoring/RS/matrix/PNG expectations for **all S0..512**, plus both native adapters/raw/gzip/TEXT/whitespace. Fixture `protected-reference.js:130–179,255–312,370–382` makes checkerboard score ties, upper-bit scoring, canonical row-major scalar list, salt exclusions, separate header/body MSB-first symbols/padding. E02`:66–81` checks every alpha/upperRGB bit and ≤128+1664 changed scalars. O04 `protected-operation.test.js:105–117` demonstrates exact salt exclusion changes no-frame outcome and all-LSB toggling leaves capacity unchanged. These are independent samples, not self-roundtrips. `lib/protected-image.js:55–117` uses integer4-neighbor score, histogram3049, positive top quarter, row-major ties, no sort, full eligible domain. |
| FRAME | R02 `protected-recovery-worker.test.js:48–75` asserts exact independent text for everyS0..512 through **each** real gate. R03 `protected-recovery.test.js:61–79` exact common failure/no message for changed salt, authenticated nonce, tag,16 damaged header/body bytes, concatenated/reversed body blocks, nonzero padding, S/L overflow, unequal raw lengths, invalidUTF8 and every fixed/reserved header offset20..31. R04`:51–59` exact512-byte recovery after1/7/8 independently damaged bytes in each header/body block. Fewer-than16-tag complete images are separately PROTECTED-ACCEPT-04; ordinary altered-tag R03 does not substitute for it. `lib/protected-recovery.js:19–79,112–157`, `lib/protected-encoding.js:17–103` fix layout, partition, AAD, bounds, one GCM, exact interleave; `lib/protected-repair.js:29–56,150–185,220–267` fixes GF/parity/eight-error/residual checks and bounded allocations. Retained LICENSE/NOTICE and pinned provenance are source-reviewed, not an independent release audit. |
| CAP | O03/O05 `protected-operation.test.js:40–70` admits exact1MiB/1024-square and rejects one extra UTF8 byte; table`:49–58` distinguishes no-frame/empty-only and223/224,462/463 transitions, flat no-capacity; all S0..512 fit roomy cover,513 does not. E06 `protected-encoding.test.js:27–40` cryptoWork remains0 for no-frame/empty-only nonempty/oversize. `lib/protected-image.js:119–130,179–199` computes largestS0..512 by C=S+16,r=ceil(C/239),G=128+ceil(8(C+16r)/3), both inequalities, and checks fits before RNG/keys/output. F's capacity table is an arithmetic/design review of these formulae, not a claim of observed exact-B threshold fixtures at every row. |
| TEXT | O03 plus `protected-operation.test.js:27–38` exact UTF8 counts for empty/whitespace/BOM/é/emoji/decomposed and lone-surrogate refusals. R01 independent raw/gzip/empty through both gates; E09 independent encoder samples preserve TEXT's BOM/Unicode/CRLF/tab. R03 invalidUTF8 fails. `lib/protected-image.js:16–33`; `lib/protected-recovery.js:137–156` fatalUTF8/ignoreBOM preserves U+FEFF, exact length, no text before successful return. |
| ZIP | `protected-compression.test.js:10–31` exact gzip header, exact compressorUTF8 bytes and independent native gunzip/full-input consumption; `:33–44` null/throw/false compressor gives exact COMPRESSION_FAILED and releases prior handle; O06`:65–71` partial `[31,139]`/false never returns compressed success; O07`:46–63` raw fallbackabc, empty-only nonfit and deterministic2000-byte incompressible nonfit refused at encode. R05 `protected-recovery.test.js:81–101` independently authenticated bad flags/time/XFL/OS, CRC/ISIZE, truncation, trailing byte, second member and L±1 each gives exact common failure; positive stream exact text. R07`:121–128`400000-byte output succeeds, authenticatedL1000 overrun fails. `lib/protected-recovery.js:81–110` allocates boundedL plus one overflow byte, checks total_out and complete input consumption while decoding. Pair PROTECTED-PROOF-01/-05 for auth-before-init/work, not the R05 title. |
| LIFE | O02 `protected-worker.test.js:40–51` both gates exact latest revision/foreigngeneration/idempotent discard; operation`:72–103` replacement/discard/input transfer-detachment and failed-replacement invalidation. E04 `protected-encoding.test.js:60–98` one compression, encrypt input equals retained compressed bytes even after caller zeroes source, input cleared after encode. O12 exact summary/worker-bound handles. `lib/protected-transport.js:39–165` frozen opaque handles/WeakMap, generation/id suppression, termination awaited before release; `lib/protected-image.js:204–263` one preparation/busy/revision, no app-visible key state. O01 `protected-worker.test.js:73–82` forbidden platform RNG/derivation APIs during successful preparation; this is not a direct Sodium invocation count, paired with source which never calls deriveKeys on prepare. |
| CANCEL | O08 `protected-transport.test.js:27–62,127–147` late cancelled replies ignored/new generation completes, lease held until stop, failure termination awaited. O10 `protected-recovery-worker.test.js:147–194` **inside actual repair**, controlled Atomics wait after real repair, observe repairEntered and stopped, CANCELLED/no message, next exact recovery. `:126–135` cancels on deriving/recovering phases and restarts; operation`:82–93` cancels checking/preparing phases. E-worker `protected-encoding-worker.test.js:155–186` phase cancellation through both gates/old handle invalidated/fresh operation. These prove stage cancellation, not directly observed termination inside a running Argon call or compressor call; M07 below retains that distinction. PROTECTED-ACCEPT-03 tests real replacement after cancelled recovery. |
| RUNTIME | `protected-recovery-worker.test.js:85–123` malformed requests/overrides/SharedArrayBuffer/16MiB+1 rejected, valid request follows; missingWASM RESOURCE_FAILED/no text and max-image score-allocation failure then fresh success through both gates. `protected-keys.test.js:129–164,291–320` clears root/first child on second-HKDF failure, missing native/WebCrypto/WASM and malformed stream failure/clear. E07 `protected-encoding.test.js:120–152` after-encryption serialization allocation failure gives exact RESOURCE_FAILED/no PNG/source unchanged/secrets zero, old handle consumed; `:100–118` RNG/HKDF/CTR/encrypt failures then fresh success. `protected-encoding-worker.test.js:239–263` missing browser RNG/native crypto consumes handle; O09 `protected-transport.test.js:81–87` failed constructor no main-thread image fallback. Controlled failures are not actual deployment CSP/phone results. |
| PIXEL | P1 `lib/png.js:29–32,133–161,199–232,254–280,288–328`: geometry before raster allocation; one bounded filtered raster, one ownedRGBA; one complete zlib stream/exact declared raster; export cap checked before output allocation; direct serialization, no canvas codec input. P02 high-expansion observation and P03 valid16MiB input; P04 owned rendering declarations; E08 and integration-01 preserve cHRM/gAMA/sRGB bytes and strip all personal chunks; P05 preserves output on unsupportedalpha. PROTECTED-PROOF-02 observes maxRGBA recovery allocation/counts, not all process allocations. Preview/Diff own at most two raster leases via `lib/image-operation.js`/transport; transport tests`:112–125,149–245` hold/release raster budget through retained/discarded/failed work. |
| UI | U01 `browser-components.test.js:295–333` no initial capacity/compressionoff, exact display, password-only edits don't discard, no-frame/empty-only distinctions/failure removesfit; `:134–151` empty creation never prepares, compressed display exact; `:186–260` edits/discard-pending/late handles/retry; `:262–293` password edits remove complete output/previews, failure clearspassword/keepsimage. U02`:437–483` locks, cancellation keeps inputs/clearspassword/rejectslatetext/no download; `:335–344` empty authenticated success and script text has no script element; `:346–383` reveal remasks on lock/clear. U03`:796–836` Stay/Escape retain draft and restore exact trigger focus; Switchandclear aborts/resets; U04`:838–848` arrow/Home/End movefocus without changingactive; navigation`:850–921` guardlocked/draft/unload. These are simulatedDOM/operation checks, paired with LIFE/FRAME real gates and historical B/W/T, not fresh viewport/accessibility proof. |
| WALK | Historical B1–B17/W18–W22/T1–T9 in the linked walkthrough and immutable record, captures/manifest at `/tmp/obscr-71-evidence/`. Explicit successes: raw/gzipactualCLI↔PWA with four byte comparisons; empty/damaged/altered/plain/legacy outcomes; subsequent stagecancel/restarts; W20's **24** prepared/result/recovery/Diff views at320/768/1440×normal/doubledtext, W21keyboardreveal; T7sizes/longpaths/NO_COLOR,T8nonTTY. Failures B1/B10reload and B15overlap remain failed on that old candidate. No fresh B1/B10/B15, no real spinner-timing or all-secondary-state claim. |
| REVIEW-KEY | K D3–D7/P D2/F §§1/3/7; `lib/protected-keys.js:11–162`, `protected-encoding.js:54–120`, `protected-recovery.js:120–157`: one expensive raw root precedes every keyed recognizer; no public password check/seed/passwordhash field/key persistence/secondAESsearch; raw salt is public, HKDFzero salt is extraction domain, labels are key-schedule domains, not format selectors. Full32-byte native keys, CTR placement only/GCM payload only; finally clears owned secret arrays, worker termination drops references, no guaranteedJS-erasure claim. Earliest header/repair/padding rejection is allowed **after** root, so not every guess costs fulldecode. This source argument does not certify absence of unknown attacks or phone performance. |
| REVIEW-APP | S Ownership/Moduleflow/Cutover; `lib/steg.js:19–64,72–114,161–230`, `lib/protected-transport.js:39–165`, Node/browser worker entry points, `app/src/components/EncryptForm.jsx:1–131`, `DecryptForm.jsx:1–71`, `App.jsx:21–127`. Forms/CLI consume complete operations; bounded source reads precede fullbuffer allocation; native adapters implement crypto, not framing. No derive fallback/mainthreadcodec/algorithmoverride/secretstorage API is added. `bin/index.js:19–40,139–245` safe text/TTY/stages/editor/result paths, not P4's future no-clobber/stdout route. Source review is limited to named code paths, not network/cache audit or formal review-round completion. |
| REVIEW-HISTORY | `git log 4c8f7c5d1e2ca9ac37810cc74a997f4819309736..a3a21178e63a144700adc47c65d29f49c41bf93b`: preparation8540b1e, recoverya89f05a, encodingb037ddf, jointcutover0040cca then acceptance544f774; later summaryb458fb7 and overlappingDiffdcfa356. Current production has no legacycrypto/carrier fallback; README current preparation/encode/recovery/examples and next changelog describe new contract. Historical changelog text remains historical. This checks sequence/source ownership, not a fresh formal whole-feature review. |

### Current unresolved mandatory feature observations

The initial audit identified18 clauses in seven reasons. The latest proof revision above closes M01/M07, leaving **16 directly identified missing mandatory source clauses** in M02–M06, plus pending execution gates. The original diagnostic reasons below remain as the audit trail, with those two explicit resolutions. Repeated/enclosing coverage/scenario/story clauses in the mapping remain explicitly partial; they are not counted as additional distinct missing behaviors. Automated targeted/full-suite/build gates are now recorded above; fresh real-program observations and formal whole-feature review remain pending. Release/downstream rows and the three Human7 rows are not hidden inside the eighteen.

| Reason | Stable IDs (18 clauses) | Exact remaining limitation / owner |
|---|---|---|
| M01 | K-L049-02 | R10 forbids HKDF, not the preceding real Argon call. Source `protected-image.js:154–176,179–199` validates before recover/encode and appears ordered correctly; no direct invalid-credential **zero-KDF** observation is established. Keep before-derivation proof unmet; not a diagnosed production defect. |
| M02 | K-L049-04 | CLI T04 observes the1024-UTF8-byte rejection explanation, and module errors state1024; equivalent user-facing explanation across **both apps** is not established. No silent truncation was found. P3 owns broader guidance, but this specific exact-byte-limit obligation is not deleted. |
| M03 | A-L083-01..04 | Before-encode disclosures across both apps are incomplete/unproven: CLI `bin/index.js:139–185` prints metadata/color rejection explanation **after successful encoding**, not before. Browser ImageUpload gives opaqueRGB/RGBA/size hint and preparation gives metadata notice, but the complete noninterlaced/profile/rejected-valid-PNG disclosure is not established. Tests/captures showing result notices cannot prove pre-encode disclosure. Potential production/UI work requires main-owner review/disposition; this task changes no code. |
| M04 | A-L089-02..03 | CLI help/README explain old-image incompatibility, but no prominently presented browser equivalent or both-app general help explaining **plain and old images share the common failure** was found (`App.jsx:95–127`, forms, ImageUpload/PrivacyNote; source search). Correct hidden-failure output does not prove user guidance. Potential guidance work belongs in the main disposition, not a tautological test here. |
| M05 | S-L081-02..03 | U07's fake timer establishes controlled1000ms behavior, not real short-operation no-flash or real long-wait spinner/Cancel timing. Historical walkthrough expressly did not observe it. Fresh real timing evidence is required. |
| M06 | S-L077-01..06, S-L078-01 | W20 covers24 named views, not every changed/secondary screen at the required widths/text size. Complete wrapping/action reachability, every announced control name/live focus/color alternative and **every** keyboard action remain unobserved for the remaining states. Source labels/style and selective keyboard/component checks are useful but not a blanket real-screen acceptance pass. Human7's visual judgment is a different gate. |
| M07 | S-L109-01 | Phase cancellation and the genuinely in-repair O10 observation do not directly establish worker termination **inside running KDF and compression calls**. These parts of the lifecycle coverage group remain unmet; no claim of defective cancellation follows. |
| M08 | (execution gates, not extra clause count) | Final targeted integration/proof units/full suite/build are recorded as owner-run passes at 7f3b2d4 above. Fresh stable-environment real walkthrough (especially old B1/B10/B15 and M05/M06) and formal whole-feature Standards/Spec/Security reviews remain **pending main-owner work**. Automated success and this source reconciliation do not substitute for them. |

The eight rows above include seven missing-observation categories plus the execution-gate category. Human7 (`G09`, `S-L132-01..03`) remains **THEIRS**. P3/P4/P5, physical-device timings/process-memory, deployedCSP/offline assets, independent final security/artifact/license/attack/detection gates remain unmet with their existing owners. No production fix is made or authorized by this reconciliation.

### Reconciliation of the old gap rows and historical failures

| Stable IDs / failure | Current disposition | Exact basis and remaining boundary |
|---|---|---|
| G03; historical F2 / numbered2 | MAPPED; exact negative proof PASS at 7f3b2d4 | PROTECTED-PROOF-01 observes failedGCM⇒zero payloadgzipinit/work and positive authenticategzip order; PROTECTED-ACCEPT-05 pairs both real gates. R05 alone still cannot close it. |
| G04; historical F3 / numbered3 | MAPPED; exact integrated proof PASS at 7f3b2d4 | PROTECTED-ACCEPT-04 independent physically shortened tags, full-tag header, both real gates, full-tag positive controls; **all16 lengths0..15 at S0/24/224/512**. No S23 claim. |
| G10; numbered6 resource part | MAPPED for named application counters; RELEASE for process memory | PROTECTED-PROOF-02 plus K10/K12/K13 and PIXEL: exact score/histogram/eligible/filtered/RGBA/sparse/stream/salt/KDF/repair/GCM observations. Counts/allocations are not physicalphoneRSS or portableMapbyte measurement. M05/M06/M07 and the remaining real-program/review gates still prevent blanket failure6 closure; its named resource proof passed at 7f3b2d4. |
| G09 | THEIRS | Human7; no screenshots/tests/source-review substitution. |
| G11 | RELEASE (UNMET) | Named physicaliPhone/Android/desktop/Node cold/warmkeyready and whole-processmemory/responsiveness; actual deployedCSP/WASM/support. RUNTIME is controlled/Node gate evidence only. |
| G12 | RELEASE (UNMET) | REVIEW-KEY is a precise first-party source argument, not independent final audit/artifact/license review or bounded attack/detection results. |
| G13 | DOWNSTREAM / RELEASE (UNMET) | P3generator/guidance, P4exactfile/stdout/output, P5fullversionedoffline/update/network-cache checks; S FurtherNotes retains owners. |
| historical F1 / numbered1 | #73 source fixed; exact summary assertions PASS at 7f3b2d4 | `protected-encoding.js:103` returns `{ok:true,pngBytes,...summary}`; O12 exact worker-owned summary and integration-01's seven equality assertions. Old missing-summary result remains true ofb471500, not a3a2117. |
| numbered4; old G06/G07 and S-L126-01..02/S-L129-01,06 | Fresh observation pending, old FAIL retained | Stable-server B1/B10 must be repeated. Later independent old-stage successes do not erase interrupted observations. No production cause inferred from Vite reloads. |
| numbered5; old G08 and S-L131-01..02 | #74 source fixed; fresh browser observation pending | U06 observes serialized two-current-selection admissions; `ImageDiffForm.jsx` fixdcfa356. It does not turn historical B15 into PASS; rerun actual concurrent selection and export/Diff journey. |

### K — every formerly UNMET clause

| Stable IDs | Current disposition and exact evidence |
|---|---|
| K-L049-02 | UNMET M01: before-Argon observation absent; KEY invalid-input tests and exact source order are not mislabelled as that observation. |
| K-L049-04 | UNMET M02: both-app byte-limit explanation not established; T04 proves CLI rejection explanation only. |
| K-L051-02 | MAPPED E05 `protected-encoding.test.js:207–223`: two complete attempts yield16/12/16/12 bytes, unequal salt/nonce pairs, successful exact recovery. RUNTIME's failed-attempt/retry cases do not assert randomness equality and are not substituted. |
| K-L051-03, K-L051-05 | REVIEWED REVIEW-KEY: saltFrom/writeSalt store public16-byte salt; raw root stays in deriveKeys/finally, no passwordhash/root image field; exact F§3 header/AAD/body contains no secretkey field. |
| K-L053-03..05 | REVIEWED K D3/P D2.1/F§3 and KEY: labels version the key schedule, zeroHKDFsalt differs from randomArgonsalt, a future changed schedule requires new domains. No speculative future implementation test is needed. |
| K-L055-01..02 | MAPPED clearing portions KEY/R09/E07 (`protected-recovery.test.js:144–172`, encoding`:120–152`, key`:129–141`); REVIEWED private/ephemeral/no-log/no-persist portions REVIEW-KEY/APP (no publickeyresult/cache). No universalJS-erasure inference. |
| K-L055-03, K-L055-05..07 | REVIEWED K D3/F§3/7: no guaranteederasure, format owns serialization, HKDF adds no passwordentropy and correctguess yieldsAESkey without secondsearch; REVIEW-KEY confirms implementation/claim boundary. |
| K-L055-04 | MAPPED STREAM K04/FRAME/PROTECTED-ACCEPT-04 and -05; Node native`:93–123` retains updateoutput untilfinal and clearsfailure; Browser native`:74–97` resolves only full128-bittag WebCrypto. No preauthtext; no self-roundtrip substituted for independent frame. |
| K-L059-02..04 | MAPPED STREAM: both adapters compare independently anchoredstream, fullcountercarry/wrap and uninterruptedprefix/chunkcontinuity; source setsWebCrypto length128. |
| K-L059-05..06 | REVIEWED K D4 with E05/STREAM: freshplacementkey permits fixedzero counter; decoder deterministically derives samekey/stream for sameinputs. This explains a design choice, not extra entropy or nonce reusepermission. |
| K-L061-01..04 | REVIEWED K D4, nativeadapters/REVIEW-KEY: AESCTR existingnativeprimitive, ChaChaalternative rationale not a productionmode, CTRplacementnotpayload, no fillerstream now; futurestreams require separatedomains. |
| K-L065-01 | MAPPED CARRIER O04/E01 and SAMPLE: canonical rowmajorRGB domain excludesrawsalt beforecapacity/sampling. |
| K-L065-02..06 | MAPPED SAMPLE exactforcedtrace/LEwords/rejectthreshold/sparseorder and STREAM independentpositions; `protected-keys.js:116–144` matches conceptualswap. |
| K-L065-07 | REVIEWED K D5/SAMPLE arithmetic: rejection gives unbiasedrangereduction conditional on uniformwords; finitekeyedgenerator does not claim allpermutations. |
| K-L067-01, K-L067-03 | REVIEWED explicit final-profile narrowing F§5: legalproductiondomain1..786432⊂1..2^32, numericUINT32_RANGE not32-bittruncated, demands≤domain checked. MAPPED invalid/overdomain tests `protected-keys.test.js:143–152`,K11/K13; no unallocated2^32-domain runtime claim. |
| K-L067-02, K-L067-04 | MAPPED SAMPLE K11zerowork and K06/K02exactconceptualorder; no full-domain runtime permutation. |
| K-L067-05 | REVIEWED sparseMap implementation `protected-keys.js:53–79,136–143`; MAPPED PROTECTED-PROOF-02 oneMap≤k, no fullpermutation. |
| K-L067-06 | RELEASE UNMET for portablebyte/processmemorymeasurement; PROTECTED-PROOF-02 establishes actualentryhighwater/clear, explicitly notMapbytes or nameddevices (P D5.1 warnsentrycap≠measurement). |
| K-L069-01 | MAPPED CAP/PIXEL/PROTECTED-PROOF-02/K10/K12/K13; REVIEWED F§5 limitsbeforeallocation in pixel/frame/parser/sourcepaths, not wholeprocess guarantee. |
| K-L069-02..03 | MAPPED SAMPLE K10/K12exhaustionfails withoutbiasedfallback/restart; source rejectedwords incrementcumulativecount. |
| K-L069-04..06 | REVIEWED K D5/F§5: mathematicaldomainnotallocationpermission; carrier/repairownedelsewhere; samplerdoesnotproveconcealment. CARRIER/FRAME implementtheirseparatepolicies. |
| K-L073-01 | REVIEWED **narrowed by F§1**: publicPNG/resourcechecks beforeKDF allowed; hiddenprofile checkedafterroot (`protected-recovery.js:38–55,130–137`), never selectsKDF. R08/FRAME observeplain/fixedfieldfailures. |
| K-L073-02..04 | REVIEWED REVIEW-KEY/F§1/7: fixedrawsaltlayout public; allkeyedrecognizersafterroot; no separatepasswordcheckfield. R08 observes twoHKDFcalls/plainfailure/noGCM, not a directArgoncounter. PROOF02 counts realKDFonce for a validframe. |
| K-L073-05..06 | REVIEWED REVIEW-HISTORY/S Cutover/F§1/7: obsoleteMT/SECRET_KEY/fastplacementremoved, no legacyfallback; legacydecisionseparate, historicalW22fixture exactcommonfailure. |
| K-L075-01..06 | REVIEWED K D6/F§7/REVIEW-KEY: rootcostfloorconditional, earlyinnerrecognizerallowed, offlineguessing/weakreuse/oldsaltimagesremain, fullwidthplacementkeynot32-bitseed, generatedguidanceownedP3. None is a concealment/attacker-timeclaim. |
| K-L077-01 | REVIEWED K D6/F§7/REVIEW-KEY: sourceargument notindependentaudit/no-shortcutproof. |
| K-L077-02 | RELEASE UNMET independentcomplete-formatrecognizer/bootstrap/repair/extractedciphertextreview; current namedsourceinspection is recorded in REVIEW-KEY, not substituted for it. |
| K-L081-01..02 | MAPPED KEY/STREAM/SAMPLE: independentlyanchoredpassword/salt/profile/root/children/128streambytes/24positions plus exactaccepted/rejectedworkedtrace; bothnativeadaptersruncomposedchain. HistoricalNoble/densereferenceprovenance remains historical, notselfwrapperindependence. |
| K-L081-03 | REVIEWED independentprovenance/fixtureimports `protected-keys.test.js:7–22`, `protected-reference.js:1–18`: noexpectedbytescomputedbyproductionwrapper. |
| K-L083-01 | MAPPED KEY K05/R10/R11 exactUnicode/rejections; beforederivationportionretainedatM01, notaddedto thisedge-list clause. |
| K-L083-02 | MAPPED K05changedpublicsaltchangesbothchildren. |
| K-L083-03 | MAPPED STREAM K03/K09carry/chunkboundaries. |
| K-L083-04..06 | MAPPED SAMPLE K06forcedreject, K07singleton/nonpower37uniqueness. |
| K-L083-07 | MAPPED CARRIER O04/E01 and SAMPLE canonicalexcluded9trace. |
| K-L083-08 | MAPPED CAP/RUNTIME/K10/K12/K13boundaryfailures. |
| K-L083-09..10 | MAPPED FRAME R03nonce/fields/body and wrongpassword exactfailure (`protected-recovery.test.js:42–49`). |
| K-L083-11 | MAPPED PROTECTED-ACCEPT-04 PASS at 7f3b2d4, plus primitive K04 only as primitive evidence. |
| K-L083-12 | REVIEWED fixture-controlledpublicrandomness, notproductionrequestoption (CARRIER/E09privateadapter). |
| K-L083-13 | MAPPED E05fresh16/12pairs plus realnativeCSPRNG; source rejectsappoverride, RUNTIMErealgates. |
| K-L083-14 | REVIEWED evidencecost/rationale; KEY/STREAM/TEXT include nonASCII/longstreams, not ordinaryASCIIselfagreement. |
| K-L083-15 | MAPPED historicalWALKrealexchange; currentfreshwalk/reviewsM08 pending; RELEASE independentsecurityreviewremainsmandatory. |

### P — every formerly UNMET clause

| Stable IDs | Current disposition and exact evidence |
|---|---|
| P-L030-01, P-L030-04 | MAPPED KEY independentroot/childbytes and PROTECTED-PROOF-02realSodiumcalltuple; REVIEWED `protected-keys.js:23–35` rawAPI fixesv19/p1/emptysecretAD, neverhashstring/defaulttuple. |
| P-L030-02..03 | REVIEWED P D2/F§3: profile0x01exacttuple, protectedheaderoffset24/AAD; FRAMEfixedfieldrefusal, no publicselector. |
| P-L032-01..04, P-L034-01..03 | REVIEWED P D2rationale: provisionallymeasureda64t3notphones,64vs128MiB/3vs2passescomparisonsnotalgorithmstrength-equivalence; PBKDF2/scrypttradeoffsnotfallbackapproval. No phone/attackerbenchmark fabricated. |
| P-L034-04 | REVIEWED REVIEW-KEY oneSodiumroute; MAPPED RUNTIMEmissingWASMfails, noPBKDF2/scryptfallback. |
| P-L038-01 | REVIEWED KEY lockedbothSodiumpackages0.8.4 in manifest/lock; RELEASE artifact/licenseauditstillopen. |
| P-L038-02..03 | MAPPED KEY/STREAM/PROTECTED-PROOF-02 rawacceptedUTF8 and32/3/67108864/algorithm2, nativeHKDF/AES; sourceexactAPIarguments. |
| P-L040-01, P-L040-04 | REVIEWED P D2.1/KEY: onefixedadapter; profiledescribesalgorithmparametersnotnpmversion. |
| P-L040-02..03 | RELEASE/DOWNSTREAM UNMET notices/artifact/upgrade/dependencyreview/CSP/offlineassetcosts; packagepin/sourceprovenancealoneisnotcompletion. |
| P-L040-05 | MAPPED RUNTIMEtypedfailures/noalgorithmfallback, REVIEWED noalternatecostpath; actualdeployedCSP/devicegateremainsG11. |
| P-L042-01..02 | MAPPED KEY exactUnicodeandinvalidpasswordboundaries; clausehereassertsrejection, unlikeK-L049-02'sunobservedbefore-KDFnegativecount. |
| P-L042-03 | MAPPED E05freshCSPRNG16/12eachcompleteattempt; RUNTIME rejectsrequestoverrides. |
| P-L042-04..05 | MAPPED KEYindependentHKDFanchors/STREAMfixedGCM16tag and FRAME/-04; nativeadaptersusezero32salt/exactlabels/tag128. |
| P-L042-06 | REVIEWED REVIEW-KEY privateworkerroot/childrennotimagefields; MAPPED KEY/R09/E07ownedbufferscleared. |
| P-L046-01, P-L048-01..03 | REVIEWED **narrowed** F§5/Sbounds1024/1,048,576, notpermissionfor4096/12,192,768; policyexperimentnotdemonstrateddevicesafety. MAPPED CAP/PIXELadmissionboundaries. |
| P-L049-01 | MAPPED K13/PROOF02finalk≤11648and≤E; stricterthan262144. |
| P-L049-02 | REVIEWED P D5.1/F§4/CAP: positionbudgetnotmessagebytes; tag/header/RS/paddingcharged. |
| P-L050-01..03 | MAPPED K10/K12exactprefix/cumulativeexhaustion; REVIEWED F§5absolute24320overrides525312, no restart/biasedfallback. |
| P-L051-01..04 | MAPPED PROOF02sparsepeak≤k/oneMap/reused4096zero+4096output/clear and STREAM K09continuousleftovers; REVIEWED sparseimplementationnotfullpermutation. |
| P-L052-01 | MAPPED PIXEL/PROOF02oneRGBAmaxrecovery; transportleasechecksmaxtwoownedrasters, stricterF§5aggregate8388608not97542144. This is appownership, not allruntimebuffers. |
| P-L052-02 | REVIEWED P D5.1/F§5nonclaim; RELEASE process/GPU/WASM/runtime/decoderphysicalmeasurementsnotcoveredbyappbuffercounts. |
| P-L053-01 | MAPPED LIFE/PIXELlease/BUSY/terminationordering. |
| P-L053-02 | REVIEWED **explicitF§1override**: checkfixedsupportedimplementation/runtimebeforeKDF; imagehiddenprofileafterKDF (FRAME). Noimage-suppliedcosttuple/routing. |
| P-L053-03..04 | MAPPED CAP/PIXEL/K10/K12/K13/PROOF02; sourcegeometrybeforeallocation, parsedboundedlengthbeforebodyarrays, cumulativedraw/statechecksprocessing. |
| P-L055-01..04 | REVIEWED P D5.1/F§5policy/narrowing/revisionrationale; MAPPED CAPoversize/budgetfails, noautomaticgrowth. Futuretighteningrequiresdecision. |
| P-L055-05 | REVIEWED P D5.1: Mapentrycapnotportablebytepeakmeasurement; RELEASE byte/processmemoryremainsopen despitePROOF02entryhighwater. |
| P-L057-01 | MAPPED STREAM128-bitfullkey/continuity/wrap. |
| P-L057-02 | MAPPED SAMPLE LE/rejection/swaptrace/CARRIERcanonicaldomain. |
| P-L057-03 | REVIEWED F§5narrowedoperationalceilings, MAPPED K13over11648rejected. |
| P-L059-01..03 | REVIEWED F§§1–5/PIXEL/CARRIER/FRAME/ZIP completeboundsandbootstrapdefined; KDFworkspacealonecannotdefinecarrier/decompression. Arithmetic/designownership, notnewtesttitles. |
| P-L063-01..03 | RELEASE UNMET namedphysicalmatrix/recordedversions/coldwarm3s/keyready/processmemory/responsiveness; historicalWALKexchangeispartialconstituentonly. |
| P-L063-04 | REVIEWED no unnameddeviceclaim here; RELEASE supportapprovalnotprovided. |
| P-L065-01 | MAPPED KEY/STREAM/SAMPLE independentanchoredchain. |
| P-L065-02..03 | MAPPED KEY Unicodeedges/changedsalt. |
| P-L065-04 | MAPPED STREAM K03/K09. |
| P-L065-05..06 | MAPPED SAMPLE K06/K07. |
| P-L065-07..08 | MAPPED FRAME R03nonce/fields/wrongpassword. |
| P-L065-09 | MAPPED PROTECTED-ACCEPT-04 PASS at 7f3b2d4; not primitive-only evidence. |
| P-L065-10 | REVIEWED P D7.1evidenceboundary: primitiveexperimentnotparser/appworkflowproof; CARRIER/FRAME/WALKsupplyseparateevidence. |
| P-L065-11 | RELEASE UNMET completedindependentfinalformat/implementationanddependency/noticeaudit. |
| P-L067-01..06 | REVIEWED P D7.1/F§7/REVIEW-KEY exactpublicvskeyedroute, extractedciphertextsameexpensiveroot, earliestpostrootrejectallowed/notfulldecodecost, rawsaltno fastpasswordmap. R08/PROOF02giveboundedoperationobservations, notuniversalattackproof. |
| P-L069-01 | REVIEWED REVIEW-HISTORYcutoverremovesMT/SECRET_KEY/obsoletecallers. |
| P-L069-02 | REVIEWED namedbootstrap/repairsourceargument REVIEW-KEY/FRAME; RELEASE independentno-cheaper-verifieracceptanceremainsUNMET. |
| P-L069-03..05 | REVIEWED P D7.1fullwidth≠passwordentropy; weak/reused/oldcheaperimageattackremain; P3ownsstrongsuggestions. |
| P-L071-01..04 | REVIEWED release-policyconstraint, RELEASE gateUNMET: missingaccessdoesnotwaiveit; failedtargetrequireshumanrevision, neverautomaticweakerparameters. |

### C — every formerly UNMET clause

| Stable IDs | Current disposition and exact evidence |
|---|---|
| C-L035-01 | REVIEWED C Carrierintro/REVIEW-HISTORY: originalObscrscore/matrixnotStenoxide/HILL/validatedsteganalysis. |
| C-L037-01, C-L038-01, C-L039-01, C-L040-01, C-L041-01, C-L042-01 | REVIEWED sixlistordinalsentences; retaintheirfollowingrequirements, no runtimeassertionattachedto anordinal. |
| C-L037-02..04 | MAPPED PIXEL/CARRIER E02/E09 rawRGB/RGBA/opaquealpha andeveryupperbitpreserved, U=RGB&254; no canvasconversion/resampling. |
| C-L038-02..04, C-L038-06..07 | MAPPED CARRIER independentcorners/edges/interior/ties/outputsampleequality; REVIEWED `protected-image.js:55–76` validneighborintegerdegree/mathrange0..3048/noedgepadding. |
| C-L038-05 | REVIEWED C Carrier2: crossLaplacianheuristic, notstandardHILL. |
| C-L039-02..04, C-L039-06 | MAPPED CARRIER independentpositivequarter/rowmajorties and CAPflatno-frame; REVIEWED histogramnotproductionfullsort (`protected-image.js:78–117`). Referencefullsortisdeliberatelyindependent. |
| C-L039-05 | REVIEWED C Carrier3:25%engineeringpolicy, notvalidatedsafehidingthreshold. |
| C-L040-02, C-L040-04..05 | MAPPED CARRIER/SAMPLE/STREAMcontinuousfull-domaincanonicalorder/saltexclusion; sourceoneplacementkeynotweakseed/detail-sortedmessageorder. |
| C-L040-03 | REVIEWED C Carrier4/REVIEW-KEY publiceligiblemapnotextrasecret. |
| C-L041-02..07 | MAPPED CARRIER independentallSsampleequality/E02maxchangebound; source`protected-encoding.js:17–33`, recovery`:19–36` sevenMSBsymbol/XORcolumns1..7/≤oneLSB/extractionfromencodedgroups. |
| C-L042-02..07 | MAPPED CARRIER/FRAME everyS/paddingfail; REVIEWED source separate48-byteheaderandbodygroups, onlyfinalsymbolszeropadded, rawsaltoutsideRS/matrix/no fullimagefiller. |
| C-L048-01..05 | MAPPED CARRIERindependentsamples/recoverywithoutoriginal; REVIEWED scoringinteger/oneimagescan/positivequarterrestriction/noSTCclassifier. |
| C-L048-06 | REVIEWED C D1heuristicnotphotograph-suitability/concealmentproof. |
| C-L052-01..02 | MAPPED CAP/PIXEL/TEXT/ZIP/FRAMEstored512,original1MiB,16MiB,1024side/1,048,576, crypto/parser/workersretained. |
| C-L052-03..04 | REVIEWED C D2/Sscope: noStenoxidebuild/WASMrule (SodiumWASMstillrequired); productboundsnotmeasuredconcealment/performanceguarantee. |
| C-L054-01..02 | MAPPED CAP/O04/K08fullE/Bbudget; REVIEWED exactintegerfloor(B/50)formula in`protected-image.js:119–130`. |
| C-L054-03 | REVIEWED C D2retained0.02ratenotvalidatedconcealmentclaim. |
| C-L056-01..06 | MAPPED CARRIER/FRAME/CAPallSshortblocks/padding andsaltexclusions; REVIEWED F§4exactH/T/G/tag/nonce/parity/minbudgetaccounting. |
| C-L056-07..08 | MAPPED E01independentallsampleequalityincludesuntouchedunusedsamples; SAMPLEdemandceilings/continuousprefix, notfullpermutation/filler. |
| C-L058-01 | MAPPED CAP/E06andUI/T02exactnetcapacity/refusebeforeoutput; fullfreshwalkM08pending. |
| C-L058-02 | MAPPED CAP/E06/K13refusal; REVIEWED fixedprofile/noresize/truncate/repairratefallbackpaths. |
| C-L058-03..05 | REVIEWED C D2/F§4arithmetic: no655codecAPIlimit, actualrate/samplesgovern; CAPflat/no-frame/empty-onlyproveadmittedimage≠512guarantee. |
| C-L062-01..03 | MAPPED FRAME/CARRIERallSRS/interleave/matrixinverse; REVIEWED F§4narrowsatmostfourtoonetothree, licensedprovenanceat`protected-repair.js:1–27`/LICENSE/NOTICE. Artifactauditseparate. |
| C-L062-04 | MAPPED PROTECTED-PROOF-01/-05 exactauthbeforepayloadinflate/output; FRAMEindependentfailurecases. |
| C-L062-05 | REVIEWED REVIEW-KEYsingledecode/no retries/modes; MAPPED FRAME/RUNTIMEnofallbacksuccess. |
| C-L064-01..03 | REVIEWED C D3map/saltchangesdesynchronizeandoldSTCdamagebenefitnotcurrentproof; R03saltfailure/R06geometryfailureareexamples, notsurvivalguarantee. |
| C-L064-04..05 | MAPPED R06 `protected-recovery.test.js:111–119` supportedRGB→RGBArewriteexacttext/changedgeometryfailure; FRAMEdamagedfixturesandtagfailureproduceonlycompleteauthenticatedtext/commonfailure. |
| C-L066-01..02 | REVIEWED C D3limitedrepair-overheadtradeoffnotchanged-mapguarantee; directtransportalternativeisrationale, notapprovedmode. |
| C-L070-01..02 | MAPPED PIXEL/E08 andFRAMEpublicheaderabsence; REVIEWED F§6allowlistrejectsICC/unknown, metadatanoticeexplicitnon-undetectability. |
| C-L070-03..04 | REVIEWED C Hardening/F§6: nocompressorfingerprintimitation/JPEGhistorydetectorproject; F/appownprecisemetadatapolicy. |
| C-L072-01 | MAPPED E05/KEY/FRAME/TEXT/ZIPfreshkeys/randomness/commonfailure/input-expansionbounds. |
| C-L072-02 | REVIEWED C Hardening/encoding`:70–75`: randomnonce, notimage-derivedStenoxidepolicy. |
| C-L072-03..05 | DOWNSTREAM UNMET broadercover/unpublishedoriginal/repeatedcover/backupguidance (P3/S FurtherNotes); notprovedbyLSBinvariantsormetadatanotices. |
| C-L072-06 | MAPPED CARRIER/FRAMEactualnewcarrier; RELEASE UNMETexistingattack/detection/deviceevidence, notsupersededbyprimitivechecks. |
| C-L072-07 | REVIEWED C Hardening/F§8/Sscope: no newdetectorprogrammeauthorized. |

### F — every formerly UNMET clause

| Stable IDs | Current disposition and exact evidence |
|---|---|
| F-L033-01..03 | MAPPED CARRIER/E02/O04/FRAME; REVIEWED `saltFrom`/`writeSalt` scalar3*(y*w+x)+c→RGBAoffset, noalpha, minimumframecapacitystricterthan3P≥128. |
| F-L035-01..04 | MAPPED CARRIERindependentsaltpositions/upperbits/allS and PROOF02exact128maxRGBAreadindices; REVIEWED monotonefloorlayoutgivesdistinct128andonlythoseexcluded. |
| F-L035-05 | REVIEWED F§1/source`saltFrom:9–17`/`canonicalPositions:90–106`: no checksum/repair/magic/search/largerpool. |
| F-L035-06 | MAPPED PROOF02exact128saltsampleaccesses/one16-bytesaltpassedonceintorealKDF; independentlayoutalreadyCARRIER. |
| F-L037-01..03 | REVIEWED F§1/KEY/RUNTIME singlefixedsupportedSodiumconfiguration, nocostsfromimage; missingWASM/nativecapabilityfailsbeforekeyedwork. |
| F-L037-04..06 | MAPPED FRAMEfixedprofilefield24/failureafterkeyedheader; REVIEWED `recover:130–137` postrootfieldcheckneverroutes/retriesKDF. |
| F-L039-01..02 | REVIEWED exactF§1explicitnarrowingofPpre-KDFhiddenprofileinstruction/no publicfield. |
| F-L039-03 | MAPPED R08detailedplain/HKDFschedule; historicalW22legacyfixedfixturecommonfailure; REVIEWED futureunknownformatmaycostonecurrentroot, no futurecompatibilityclaim. |
| F-L039-04..05 | REVIEWED F§1/REVIEW-KEY noformatnegotiation; futuregenerationrequiresnewexplicitroutingdecision. |
| F-L043-01..04 | MAPPED CARRIER independentranking/ties/eligible/saltexclusion; sourcehistogrampositivequarter/canonicaldomain. |
| F-L043-05..07 | MAPPED K08full786432domain/oneposition786431 andE01roomyE>Bsampleequality; REVIEWED Bonlycapacitybudget. |
| F-L045-01..05 | MAPPED CARRIER/FRAME/STREAMindependentprefix/body/MSBfullimageassertions; sourceonepositionsobject,896header/48bytes,separategroups. |
| F-L045-06..09 | MAPPED R03noncanonicalpaddingfailure/allS E01/R02paddingtransitions; REVIEWED384headerbitsdivisibleby3, nonzeropaddingrejectbeforeRSdespitepotentialrepair. |
| F-L047-01..04 | REVIEWED F§2/recovery`:133–141`/encoding`:76–94`: clear32-bytekeyedheaderrepairedthenexactAAD, lengthfieldsboundreadsnotauthenticate/decompress/output. MAPPED FRAMEalterednonceafterauthfails. |
| F-L051-01..03, F-L053-01, F-L057-01 | MAPPED CARRIERindependentcompleteimageheader/AAD/lengthsamples andFRAMEoverflow; REVIEWED `DataView`defaultBEatheaderoffsets12/16/AAD48/52,32dataheader, zero-basedlayout/tableheadingretained. No tautologicaltestforatableheading. |
| F-L067-01..03, F-L067-05 | MAPPED FRAME R03rawunequal/overflow/fields/reservedrefusals; R01rawempty/gzip; REVIEWED `frameShape:38–55` exactlyL=S or0<S<L,unsupportedvaluesrejectnoalternateinterpretation. |
| F-L067-04 | MAPPED UIemptycreationneverprepares/T04emptyeditorrefused; independentR01emptywireaccepted. WirevaliditydoesnotrequireemptycreationUI. |
| F-L069-01 | MAPPED KEYexactpassword/root/HKDFanchorstiedtoFRAME; nostandaloneencryption-onlyvectorclaim. |
| F-L069-02..04 | MAPPED CARRIERindependentAEADbody/sampleequality, PROOF02singleGCM528 and -04shorttagrejection; REVIEWED encryption`:76–92` nonceonlyheader, S+16bodyonce. |
| F-L069-05 | MAPPED E05fresh16salt/12noncepairsoneachcompleteattempt. |
| F-L069-06 | REVIEWED F§3/8controlledpublicfixtureexceptiononly; RUNTIMErequestoverridesrejected. |
| F-L071-01 | MAPPED K04fixedAADvector/CARRIERindependentcompleteimages; REVIEWED `additionalData:112–118` andencoding`:82–86` exact56bytes salt16+header32+BEwidth4+height4. |
| F-L075-01 | MAPPED FRAMEalteredpostauthnonce/tag/geometryfails,CARRIERexactAADindependentsamples; REVIEWED56bytecompositionbindsalllistedfields, notextraindependentfieldselectors. |
| F-L075-02..04 | REVIEWED F§3/REVIEW-KEYfixedpartition/layout/score/sampler/matrix/RS, nokeysinstorage/nosecondencryptiondomain; sourceoneencrypt/decryptandoneheadernonce. |
| F-L077-01..02 | REVIEWED F§3/REVIEW-KEYAADexcludescover/PNGmetadata; authenticationnotentirecoverappearance. |
| F-L077-03..04 | MAPPED R06supportedRGB→opaqueRGBArewriteexacttext andintegration-01samplepreservingreencode/recovery; notautomaticcolorconversion/resizingguarantee. |
| F-L081-01 | REVIEWED `protected-repair.js:1–27` exactZXing0.23.0commit/provenanceandadjacentLICENSE/NOTICE; RELEASEcompleteartifact/licenseauditstillUNMET. |
| F-L081-02..06 | MAPPED CARRIERindependentpolynomialdivisionparity/fullSsamples andFRAMEcompleteindependentrecovery; REVIEWED RSfield0x11d/alpha2/roots0..15/highest-first/systematic/omittedzero-shortening inrepair`:29–56,220–267`. |
| F-L083-01..05 | MAPPED E01/R02allS includesC239/478exactmultiplesandnextbytes; PROOF02repair48/255/255/66; REVIEWEDbody239split+16parity/noemptyextra/maxthree inencoding`:36–50`/recovery`:57–79`. |
| F-L085-01..04 | MAPPED CARRIERallS/R02andR03wrongbodyorder/reverseblocks; PROOF02oneattemptper48/255/255/66. REVIEWED `repairBody:57–79` columns0..254skipexhausted/separateheader/nozeropad. |
| F-L085-05..06 | MAPPED R04one/seven/eighterrorsrecoveredandR03sixteendistincterrorsfailure; REVIEWED `repair:220–240`, errorlocator`:172–185` count≤8/residualzero/noretry/erasuresearch. This doesnotclaimnineerrorsalwaysfail (miscorrectionpossible). |
| F-L085-07 | REVIEWED F§4/FRAME: beyondradiusmiscorrectionpossible; onlyGCMacceptanceestablishesplaintextauthenticity. |
| F-L087-01..02, F-L089-01, F-L090-01 | MAPPED CAPallS/transitions/flat/empty-only andCARRIER; REVIEWED exactformula/twoinequalities in`capacity:119–130`; notobservedeverypossibleB. |
| F-L092-01..04 | MAPPED CARRIER/O04excluded128rawsalt, E01allSparity/tag/paddingcharged; REVIEWED F§4arithmeticheader48/tag16/everyparity/symbolpaddingcountedonce. |
| F-L092-05..07 | MAPPED CAP/E06exactmax/no-framevs empty-only/refusebeforeRNG/output; sourceiterates0..512largestadmittedS. |
| F-L094-01, F-L096-01, F-L097-01, F-L098-01, F-L099-01, F-L100-01, F-L101-01 | REVIEWED exactF§4design-tablearithmetic/CAPformula: S=0/223/224/462/463/512→codewords32/255/(255,17)/(255,255)/(255,255,17)/(255,255,66); chargedbits642/2424/2562/4464/4602/4992; positions1498/5656/5978/10416/10738/11648; minimumB=50×chargedbits32100/121200/128100/223200/230100/249600. MAPPED allS E01/R02andCAPtransitioncases, **not** an inventedexactminimumB-imagefixtureforeverytablerow. |
| F-L103-01..02 | MAPPED PROOF02repairsum624/GCM528plus16rawsalt; REVIEWED minimumB249600from4992×50/11648positions.CAPnonroomycasesdistinguishactualcapacity. |
| F-L103-03 | REVIEWED F§4policy/noconcealment/nouniversal512guarantee; CAPflat/no-frame/empty-onlycounterexamples. |
| F-L107-01..03 | MAPPED TEXT/CAPindependentUnicode/BOM/CRLF/spacepreservation/surrogates/invalidUTF8/1MiBlimit; sourcefataldecoderpreservesBOM. |
| F-L109-01..08 | MAPPED ZIPcanonicalgzip/optin/smaller/rawfallback/outputbound/partialstreamerror/explicitunavailableerror; CAP/E06refusesnonfittingencodingwhilepreparationreturnssummaryas#70commentrequires. REVIEWED `compressedBytes:35–53` outputboundwhileproducing. |
| F-L111-01..02, F-L111-05..08 | MAPPED ZIPheader/trailer/CRC/ISIZE/member/trailing/overrun/L±1/exacttext; PROOF01authbeforeinit/work. REVIEWED boundedGzipallocatesonlyauthenticatedL+1andchecksfullconsumption, notunboundedthenlengthcheck. |
| F-L111-03..04 | REVIEWED F§5encoderDEFLATEchoiceallowedtodiffer; E09comparesagainstindependentzlibinputsforitsselectedfixtures, notuniversalcompressedbyteidentity. |
| F-L113-01 | REVIEWED F§5policyceilingsnotmeasureddevicesupport; RELEASEactualdevicematrixUNMET. |
| F-L115-01..03 | MAPPED PIXEL/P03andCAPsource/export16MiB,1..1024/1,048,576; RUNTIMErealgateover16MiBrefusal, operationnonopaque/1025failure. |
| F-L116-01 | MAPPED PROOF02maxrecoveroneRGBAplusfiltered; PIXEL/leaseatmosttwoappownedRGBAaggregate≤8388608. NottwoRGBAplusunboundedDiff/retainedpreparation. |
| F-L116-02..03 | REVIEWED PIXEL/REVIEW-APP: codecinputrawPNGsamplesnotcanvas; previewdecode/diffobjectURLsseparatefromcodecinput, resourceleasesboundrasterownership. |
| F-L117-01..04 | MAPPED PIXEL/P02boundedexpansion/exactstreamandPROOF02one4195328filteredallocation; sourceinflateRastercheckswhileinflating/onefinishedmember/trailing/earlyendfailure. |
| F-L118-01, F-L118-04 | MAPPED PROOF02observed2MiBscore/3049uint32hist/3MiBeligible/sparsepeak≤k/paired8192/reusedinput/clearedoutputs; STREAMcontinuous4096chunks. |
| F-L118-02..03 | REVIEWED F§5allowslowerallocation/domainrepresentationnotfullpermutation; `eligiblePositions:109–117`/sparseMapstate. |
| F-L119-01..05 | MAPPED K10/K12/K13prefix896/prefixdraw2816/cumulative2k+1024/noreset/final11648/24320; CARRIERfixed48header andPROOF02streamcountercontinuity. |
| F-L119-06 | REVIEWED F§5stricterfinalframeoverridesolderabsoluteceilings; MAPPED K13reject11649, K12draw24321rejected. |
| F-L120-01..04 | MAPPED PROOF02exact128saltaccesses/oneSodiumcall/continuousstream/repairs48,255,255,66/oneGCM528/repaired576/sum624. Countsonmaxvalidframe; notwholeprocessCPUtime. |
| F-L120-05..06 | MAPPED FRAMEallSrepairwordbounds/PROOF02maxwords; REVIEWED `protected-repair.js:52–56,220–223,253–256` and`frameShape:38–55`/PIXELcheckbeforeallocation≤255,shapecomputedbeforebodyarrays. InternalboundedallocationguardreviewisnotmistakenforRSSobservation. |
| F-L121-01..03 | MAPPED LIFE/CANCELrealtermination/leases/noresult/freshoperation; directinKDF/compressioncasecoverageM07remainsseparate. |
| F-L121-04..05 | REVIEWED explicitnon-guarantee F§5; RELEASEtimingwholeprocess/WASM/browser/GPU/runtimephysicalmatrixUNMET. |
| F-L137-01, F-L139-01, F-L140-01, F-L141-01, F-L142-01, F-L143-01, F-L144-01 | REVIEWED decode-routeheading/stepordinals; exactfollowingstepclausesretainedandmappedbelow. |
| F-L139-02..04 | MAPPED KEYinvalidinputs/PIXEL/CAPminimumframe/plainimagepublicchecks; REVIEWED `decodeRequest:154–176` validates/admit/raweligiblecapacitybefore`saltFrom`/root. M01 retainsmissingdirectzeroKDFobservationforinvalidcredentials. |
| F-L140-02..03 | MAPPED PROOF02saltreads/onefixedrawSodiumtuple/KEYtwochildren; nosecondKDFretry. |
| F-L141-02 | MAPPED CARRIER/FRAME/R03headerfieldsandPROOF02one48repair; SOURCEextract/frameShapeboundsbeforebodyallocation. |
| F-L141-03..04 | REVIEWED F§7untrustedheader/unsupportedfieldrejectionnotroute, FRAMEbadfixedfieldscommonfailure. |
| F-L142-02..03 | MAPPED CAP/FRAMEallS/K10/K12prefix-to-cumulativecontinuity; REVIEWED maxStoredcomputedfrombothinequalitiesbeforebodyallocation. |
| F-L143-02..04 | MAPPED CARRIER/R03padding/order/-04shorttags/R02allS/PROOF02repaircount/GCMbody; exactS+16/fulltag/AAD, notnative-onlyproof. |
| F-L144-02 | MAPPED PROOF01/-05authbeforeactualgzipinit/work, TEXT/ZIPexactlength/fatalUTF8/no partialtext. |
| F-L144-03..04 | REVIEWED nativeNode`:93–123` updatebytesprivateuntilfinal andfailureclears; browser`:74–97` completedAEADonly; operationreturnsmessageonlyafterTEXTvalidation. MAPPED FRAME/-04/-05failureexactobjecthasnotext; appcodehasnounauthenticatedpreview/savehook. |
| F-L146-01..09 | REVIEWED exactF§7/REVIEW-KEY: publicgeometry/capacity/rawsaltpasswordindependent; saltno redundancy; everyRS/field/padding/GCMrecognizerrequiresroot-derivedpositions; earliestpostrootrejectallowed; fullwidthsearchnotentropy/amplifiedpasswordstrength; extractedframedoesnotremoveencryption; weak/reusewarningsarelimits, notbenchmarks. RELEASEindependentno-shortcutreviewstillUNMET. |
| F-L148-01..02 | REVIEWED F§7nonclaim: nomarkerdoesnotmeanundetectable, salt/adaptation/repair/metadata/encodingdetectabilityremain; sourceargumentnotindependentaudit. |
| F-L150-01 | MAPPED RUNTIME/KEY/CAP/PIXELpublictypedfailuresdistinct; CANCELnotRECOVERY_FAILED. |
| F-L150-02, F-L152-01..02 | MAPPED FRAME/-04/-05exactcommonobject/no messageforsalt/header/repair/padding/tag; notrecognizer-stageuserdiagnostics. |
| F-L154-01..02 | MAPPED FRAMEplain/badprofile/tag/authenticatedbadUTF8/ZIPbadgzipcommonfailure/notext; historicalW22legacy. |
| F-L154-03..04 | REVIEWED recovercatch`:145–156`/REVIEW-APPsafeprogress/no secretslogged/noalternatemode,retry,secondpasswordorlegacybranch; MAPPED FRAME/RUNTIMEhiddenfailuresno internalerrorleak. ChangedgeometryfailureR06notall-damagepromise. |
| F-L158-01..03 | REVIEWED exactF§8framing-onlyvector/directkey/publicfixedinputsnotproduction; K04matchesitbutisnotArgon/fullPNGproof; E05productionfreshness. |
| F-L171-01..05 | REVIEWED F§8arithmetic: Hi S2→C18,D34,272bodybits→91groups+onezero bit;128headergroups→219groups,657chargedbits,1533positions,saltseparate. MAPPED FRAME/E01S2independentPNG/samplehandling, notinventedfullPNGfromtheframingvector. |
| F-L171-06 | REVIEWED F§8explicitframing-onlyevidenceclass, no completePNGclaimedbyHi. |
| F-L173-01 | MAPPED KEY/STREAM/SAMPLE/CARRIER/FRAMEallS/ties/exclusions/padding/exactsamples; independentreferenceimportsnoapplicationcodec. |
| F-L173-02 | PARTIAL / UNMET RELEASE and M07/M08: independentformattedgecases/-04/-05/ZIP/CANCEL/historicalWALKmapped; nameddevices, attack/detection/license/independentauditandfreshacceptancegatesnotcompleted. Do notturnthiscombinedrequirementintoPASS. |
| F-L173-03..05 | REVIEWED F§8design/evidence/non-new-detectorconstraints; noframingexerciseapprovesrelease/corpusprogramme. |
| F-L179-01..02 | MAPPED CARRIER/PROOF02fixedraw128salt/keyedprofile; REVIEWED no publicmarker/saltsearch. |
| F-L179-03..05 | REVIEWED F D1cost/routingtradeoff and explicitpre-KDFnarrowing; R08plainpostrootfailure/historicalW22legacy, saltfailureR03examplesnotdamageguarantee. |
| F-L183-01 | MAPPED CARRIER/FRAMEindependent32header/56AAD/singleGCM; PROOF02oneverification. |
| F-L183-02..05 | REVIEWED F D2tradeoff: nosecondcrypto, boundeduntrustedheaderuntilGCM, separateheaderauthwouldcostbytes; notextramode. |
| F-L187-01..02 | MAPPED CARRIER/FRAMEallS/PROOF02maxframe; REVIEWED F§4exact11648/249600arithmetic. |
| F-L187-03..04 | REVIEWED F D3limitedcapacity/nodamageguarantee/nohigher-rateweaker-repairfallback; CAPrefusalsenforce. |
| F-L191-01 | MAPPED ZIP/TEXT/PROOF01/-05singleboundedgzip/rawexacttext/authordering/trailing/member/overrunfailures. |
| F-L191-02..03 | REVIEWED F D4sharedboundedparsevspermissivedefault/raw-onlytradeoff; bothappsusecommonmodule. |
| F-L199-01..02 | MAPPED FRAME/CANCEL/RUNTIME andREVIEW-KEYsingleboundedroute/commonfailure/no retry/legacy; earliestpostrootrecognizerallowed. |
| F-L199-03..04 | RELEASE UNMETdevice/securityacceptance; REVIEWED F D6limiteddiagnosis/no concealment/damageguarantee. |

### A — every formerly UNMET clause

| Stable IDs | Current disposition and exact evidence |
|---|---|
| A-L034-01, A-L034-03 | REVIEWED REVIEW-APP/Sownership: commonprotected-imageorchestratorwithnativeNode/browserandworker/fileadapters. MAPPED realgatesLIFE/FRAME. |
| A-L034-02 | REVIEWED **Sownership/moduleflow/cutovernarrowing**: carrierlivesprivatelyin`protected-image.js`, obsolete`steg-core.js`removed; notsecondapplicationpolicy/compatibilitylayer. |
| A-L034-04..05 | REVIEWED A D1module-depth/driftrationale, REVIEW-APP/HISTORYjointcallermigration; notanexecutableperformanceclaim. |
| A-L036-01, A-L038-01 | REVIEWED A D1interface/tableheading; MAPPED LIFE/FRAME/O12asynchronousworker-backedoperations, notstubs. |
| A-L040-01 | MAPPED LIFE/O01/CAP/TEXT/ZIPallsevenpreparationfields/opaquehandle/exactbytes/noRNG; sourcepreparepathneverderiveKeys. Final full-suite PASS supports these assertions; this is not a direct real-Argon zero counter. |
| A-L041-01 | MAPPED O12/extendedPROTECTED-ACCEPT-01 exactsevenconsumedsummaryfields+completePNG/singleuse; sourceencoding`:103` nowspreadssummary. MAPPED passwordvalidationE-case`:42–58`; operationitselfnofile/download(onlyadaptersdeliver). Final integration/full-suite PASS at 7f3b2d4. |
| A-L042-01 | MAPPED FRAME/TEXT/ZIP/RUNTIME/CANCEL exactauthenticatedtext/safetypedfailure; complete-contractaggregate retainsM01/M07andfreshgatesM08, notblanketacceptancePASS. |
| A-L043-01 | MAPPED LIFE/O02/replacement/idempotentdiscard andUIedits/clear/unmount; sourceworkerclose/terminationdropsretainedstate. |
| A-L045-01..05 | MAPPED LIFE/E04/O12 opaquegeneration/revision/current/singleuse/replacement/inputtransfer/no recompression; REVIEWEDcontrolonlysignal/onProgress/noprofileoverride. |
| A-L045-06 | MAPPED RUNTIME16MiBgate/PIXEL/sourcebounds; REVIEWED `lib/steg.js:19–64`, browserboundedreadchecksfilesizebeforearrayBuffer, moduleboundsagain. |
| A-L045-07 | MAPPED LIFEbusy/operation`:19–25`,oneactive/retainedlease; nooverlapprepareencode. |
| A-L047-01..03 | REVIEWED REVIEW-APP/KEY/PIXEL: platformIO/workers/nativecrypto,CSPRNGonly; sharedSodium/PNG/frame/UTF8/gzip/capacity/repair/failurepolicy, notduplicatedforms/commandhandlers. |
| A-L047-04..05 | REVIEWED A D1/F§5permittedlowlevelcompressionchoices/notidenticalcompressedbytes; ZIP/E09assertconformingstreams/exacttext, notuniversalDEFLATEidentity. |
| A-L049-01..04 | REVIEWED REVIEW-HISTORYjointcutover/currentCLI+browser/sharedcapacity; legacycrypto/frame/MT/SECRET_KEY/dummyestimation/fillers/aliasesremoved. MAPPED LIFE/FRAMErealgates/currentroutes, historicalW22legacyrefusal. |
| A-L049-05..06 | MAPPED PIXEL/P01/U06boundedPNG/Diffseparatelease, UIvisualcomparisonlabel; source`EncryptionResult.jsx`/`ImageDiffForm.jsx` nosecurity/recoverytestclaim. FreshB15M08stillpending. |
| A-L049-07 | REVIEWED RSprovenance/LICENSE/NOTICEandSodiumpins/nostenoxideSTC; RELEASE completeindependentauditnotdone. |
| A-L049-08..09 | REVIEWED REVIEW-HISTORYcurrentREADME/examples/nextCHANGELOG/newtestsdescribecurrentcontract; oldchangelogremainshistory. Noerasureofoldclaims/results. |
| A-L079-01 | MAPPED UIexactoriginal/stored/max/compressiondisplay,T02CLIbytes/actualcompression; O12resultsummarynotjustprepare. HistoricalWALKseparaterealpresentation; freshM08pending. |
| A-L079-02..03 | MAPPED CAP/FRAME/CARRIER/PIXELformula/allS/completeoverhead, notdummyencryption/RGBbitestimate. |
| A-L079-04..05 | MAPPED CAP/UI/T02no-framevs empty-onlydistinctnonemptyrefusalsbeforepassword/keywork. |
| A-L081-01..04 | MAPPED ZIP/UI/T02optin(defaultoff),strictlysmaller/rawfallback/explicitcompressorerror; retainedbytesE04norecompression. |
| A-L081-05..06 | MAPPED CAP/PIXEL/TEXT/ZIPboundsanddetailednonfit; REVIEWED nofixed50–90%savingclaimincurrentpreparationflow. |
| A-L081-07 | MAPPED T02nonfitguidance/UI`:437–465`shorter/largerimage; REVIEWED noauto-resize/rate/repairfallback inCAP/sharedoperation. Thisisguidancealternatives, notpromisethatdetailedinputalwaysfits. |
| A-L083-01..04 | UNMET M03before-encodeprofile/metadata/rendering/rejected-validPNGdisclosure; post-encodeCLI/resultnoticeisnotbefore-encodeevidence. |
| A-L083-05..06 | MAPPED UIedits/discard/failureclearcurrentcapacityandpassword; no retainedoldfit/spinneronerror, currentopaqueinputownershipLIFE. Realshort/longspinnerM05separate. |
| A-L085-01..02 | MAPPED KEY/PIXEL/CAP/RUNTIME/CANCEL/T03typedpublic/resource/IOguidance, hiddenfailuresseparate; REVIEWED REcoverycatch/transporttypedpolicy. |
| A-L085-03, A-L087-01..02 | MAPPED FRAME/ZIP/-04/-05exactcommonfailureandnotext, notstage-revealingunsupportedhiddenprofile. |
| A-L089-01 | MAPPED FRAMEfixedprofile/plain/wrongpass/legacyhistoricalW22commonfailure; REVIEWED REVIEW-APPnofieldstageinusererror. |
| A-L089-02..03 | UNMET M04both-appplain/oldcommonfailurehelpandprominentbrowserformatbreakwarningnotestablished. T01/READMEcoverCLI/docsnotbrowsernotice. |
| A-L089-04 | REVIEWED A D4/F§7diagnostictradeoff/cleanbreaknotweakfallback; substantiveguidancegapsremainM04. |
| A-L093-01..02 | MAPPED recoveryexactstages`protected-recovery.test.js:14–20`, O01/ZIPpreparestages,T02/T04safeCLIstage; REVIEWED recoveronlybroadrecoveringnotheader/tag/repairphases. |
| A-L093-03..04 | MAPPED U07controlledspinner/phase/T01nonTTYnoANSI, historicalWALKphases; REVIEWED `OperationStatus.jsx:4–17` and`bin/index.js:104–135` spinner/phasewithoutpercentages/timepromise; realtimingM05unmet, no currentwalkclaim. |
| A-L095-01 | MAPPED LIFE/FRAME/PIXEL/PROOF02maxallocations/leases/realworkers; RELEASEphysicalprocessmemoryunmet. |
| A-L095-02..04 | MAPPED CANCEL/T04realworkertermination/nooutput/lategenerationdiscard/freshoperation; historicalW18/W19stagerestarts. No claimofdirectinArgon/compressorentry(M07). |
| A-L095-05..06 | MAPPED UIreplacement/preparationcancel/password-onlyeditkeepsvalidpreparation/locksactiveencode; LIFE/FRAMEpairedrealgateinputpolicy. |
| A-L097-01..02 | MAPPED RUNTIMEcontrolledmissingcapabilities/explicitruntimeerrors/noprofilefallback/mainthreadcodec; actualdeploymentCSP/deviceG11notestablished. |
| A-L097-03..05 | REVIEWED A D5/F§5/Sruntimepolicy: noarbitraryoperationtimeout, three-secondreleasegoalnotweakeningtimer;1000msspinnerand300msdebouncearepresentationnotsecuritytimeouts. |
| A-L097-06 | RELEASE UNMET nameddevices/completeprocessmemory; sourceappcapsnotmeasurement. |
| A-L113-01, A-L115-01 | REVIEWED A futureacceptancescenario/tableheading; donotreadplanningasobservedresults; constituentrowsfollow. |
| A-L117-01 | MAPPED historicalWALKactualraw/gzipbothdirections/exactcomparisons plusR06/integration-01supportedrewrites; currentfreshM08pending, selfroundtripnotindependentvectorproof. |
| A-L118-01 | PARTIAL / DOWNSTREAM UNMET exactfuturefile/stdoutP4; KEY/TEXT/UI/T04coverUnicode/BOM/CRLF/space/confirmationmismatch/invalid/empty. Do notclaimtextarea/editorprovesexactfile/stdout. |
| A-L119-01 | DOWNSTREAM UNMET P3sixwordgenerator/repeats/regenerate/acknowledgement/editedclaim/RNGfallback; none inferredfromkeyrandomness. |
| A-L120-01 | MAPPED CAP/FRAME/CARRIER/PIXEL/ZIP/UI/T02allS/limits/rendering/stripping/unsupportedprofile; historicalP1/WALKpreservedjourneys, currentM08pending. |
| A-L121-01 | MAPPED FRAME/ZIP/RUNTIME/-04/-05/WALKhostile/plain/old/wrongpassword/damage/shorttag/notext/commonmeaning; final integration/full-suite PASS at 7f3b2d4. |
| A-L122-01 | PARTIAL / UNMET M07/M08; RELEASEdevicecost. RUNTIME/CANCEL/UIprovemissingruntimecontrolledcases,stages/actualrepair/late-replyownership, notallactualKDF/compressorentry/deployedCSP/phones. |
| A-L123-01 | DOWNSTREAM UNMET P4alias/no-clobber/exactstdoutpolicyandreleasepersistent/networkinspection; T03/T04preserve specifiedfailed/cancelledfiles andterminalcontrols, UItextnotHTML, REVIEW-APPnosecretstorageAPI. Current`lib/steg.js:100–104`renamepublicationisnotP4no-clobberproof. |
| A-L124-01 | DOWNSTREAM / RELEASE UNMET P5fullinstallation/offlinebothdirections/missingassets/versionisolation/networkandcacheaudit. No SWregistration/buildassumption. |
| A-L126-01 | REVIEWED A future-acceptanceplanningstatementnotthatsession'sresults; currentresultsseparatelyidentified. |
| A-L126-02 | RELEASE UNMET existingindependentsecurity/dependency/license/physicaldevice/boundedattack-recoverygates. |
| A-L126-03..04 | REVIEWED A scope: nonewdetector/legacy/productionauthorizationbyplanning; noglossary/ADRduplicatedhere. |

### S — every formerly UNMET clause

| Stable IDs | Current disposition and exact evidence |
|---|---|
| S-L022-01, S-L023-01, S-L024-01, S-L025-01 | REVIEWED storystepordinals; substantivefollowingstorysentencesretained. |
| S-L022-02 | MAPPED CARRIER/FRAME/E09independenceandhistoricalWALKactualexchange, currentM08freshproofpending. |
| S-L023-02 | MAPPED CAP/LIFE/UI/T02exactstoredcapacitybeforekeywork/nonfitrefusal. |
| S-L024-02 | PARTIAL / UNMET M07/M08: CANCEL/RUNTIME/FRAMEprove specifiedfailure/nooutput/stalehandling; noall-workflow/freshacceptancecompletionclaimed. |
| S-L025-02 | REVIEWED REVIEW-HISTORYjointcutover/noobsoletefallback; MAPPED currentrealgate/appcases, freshformalreviewM08pending. |
| S-L030-01..03 | REVIEWED S Ownership/REVIEW-APP/PIXEL/KEYclearenginevsPNGvsplatformdeliveryownership. |
| S-L031-01..02 | MAPPED LIFE/FRAME/O12fourasynchronousoperations/opaquehandle/completeoutcomes; REVIEWEDcontrolsignal/progressnotprofileoverride. |
| S-L032-01 | MAPPED O12/LIFEallsevenpreparefieldsandopaquehandle. |
| S-L032-02 | MAPPED O01successfulpreparewithplatformRNG/deriveAPIsforbidden; REVIEWED sharedprepare`:233–255`hasnoSodium/deriveKeysroute (notdirectArgoncount). |
| S-L032-03..04 | MAPPED E04exactretainedcompressedbytes/onecompression/callerzeroedsource/encodeoneuse,O12singleconsume. |
| S-L032-05 | MAPPED E06zeroobservedcryptoWorkplusCAPsourcefitsguardbeforederive/RNG, not aninventedArgonspy. |
| S-L033-01..04 | MAPPED LIFE/PIXELgenerationrevision/oneactiveoneprepared/replace/discard/termination/inputtransferdetached/BUSY. |
| S-L033-05 | MAPPED UIpasswordonlyeditsdon'tdiscardbutremoveresults,O12newexactpasswordnotoldpassword; E-worker`:80–90`actualgatevalidpreparationretained. |
| S-L036-01..04 | REVIEWED REVIEW-APP/KEYdeepmodule/privatekeypositionsnoprofileoverride/keytrace/fallback; MAPPED realgateoverridefailuresRUNTIMEandKEYindependentprivatevectors. |
| S-L037-01..03 | REVIEWED REVIEW-APP/PIXELP1PNG/Diffretentionandplatform/presentationownership; MAPPED U06realgatepolicy/P1exportcases. |
| S-L038-01..03 | MAPPED LIFE/FRAME/RUNTIMEactualNode/browserrequestgatesvalid/malformed/policyoutcomes; REVIEWED flowboundedIO→worker→module→PNG/native→completeoutcome→delivery, stand-innotdefiningcontract. |
| S-L039-01..03, S-L039-05 | REVIEWED namedsourcearchitecture REVIEW-APP/KEY/CARRIER/FRAME: localinprocesssharedformat/twonativeadapters/localworkers/files/noremoteservice/newnetworkdependency. Notnetwork/cacheexfiltrationaudit. |
| S-L039-04 | MAPPED RUNTIMEcontrolledfailure+bothrealgatechecks,CANCELactualrepairpairedwithcontrolledtransport, UI/WALKformchecks. M07stillretainsmissingactualKDF/compression-entrycase. |
| S-L040-01..04 | REVIEWED S Prefactors/REVIEW-HISTORYsequence8540b1e→recovery→encode→jointcutover; retainedworkerownershipimplementedinsidefirstslice, no separatelegacycompatibilityprefactor. |
| S-L041-01..06 | REVIEWED REVIEW-HISTORYsequenceandcurrentrealoperationexportsnotstubs/oldfallback; MAPPED firstoperationgatesLIFE/FRAME/E09. Intermediatebranchstatesarenotclaimedreleases. |
| S-L044-01..03 | MAPPED KEYexactnonempty1024/surrogates/Unicodecase-space-BOM/CRLF; no trimming/newlineremoval. BeforeArgonnegativeobservationseparatelyM01. |
| S-L044-04 | REVIEWED REVIEW-KEYonepassword→twochildren/oneKDF; MAPPED KEY/FRAMErealoperationusesonepasswordfield, overridesrejected. |
| S-L045-01..04 | MAPPED KEY/PROOF02exactrawArgon2tuple/onecall; REVIEWED lockedSodium0.8.4/profile1/sourceAPI, artifactauditnotimplied. |
| S-L046-01 | MAPPED E05fresh16/12CSPRNGpercompleteattempt; requestoverridefailuresRUNTIME. |
| S-L046-02..04 | MAPPED KEY independentlyanchoredroot/HKDFlabels/children32; REVIEWED nativezero32salt/SHA256outputs32. |
| S-L046-05..06 | REVIEWED REVIEW-KEYpublicsaltvsprivateephemeralroot/children/noderivedkeycache; MAPPED KEY/R09/E07ownedclearing. |
| S-L047-01..02 | MAPPED STREAMfull32-byteplacementkey/zero128counter/fullcarry/continuousleftovers/norestart/wrap. |
| S-L048-01..04 | MAPPED SAMPLEexactLErejection/sparsewithoutreplacement/fullE/notbudgettrace/ceilingfailure; REVIEWED numeric2^32/notfullpermutation/retry. |
| S-L048-05 | MAPPED PROOF02paired8192/reused4096zeroandcurrent4096output/oldcleared, STREAMK09continuouschunks. |
| S-L048-06 | REVIEWED F§5stricterfinalprefix2816/total24320/k11648; MAPPED K10/K12/K13. |
| S-L050-01..02 | MAPPED CARRIERindependentsamples/saltandPROOF02exact128maxRGBAoffsets; sourcewriteSalt/sampleOffset/saltFromcanonicalMSBlayout. |
| S-L050-03 | MAPPED CAP/E06minimumframecheckbeforecrypto/output; REVIEWED minframecapacityimplies3P≥128. |
| S-L050-04 | REVIEWED F§1/REVIEW-KEYrawsaltno repair/checksum/magic/search/alternateposition. |
| S-L050-05 | MAPPED PROOF02exact128readsonce/oneSodiumsaltbytes0..15; rootafterreads. |
| S-L051-01..04 | MAPPED CARRIERindependentupperbit4-neighborinteger0..3048/topquarterpositive/rowmajorties; sourcepixelScoreandcanonicalPositions. |
| S-L051-05 | REVIEWED `eligiblePositions:109–117` histogram3049/notfullsort; MAPPED PROOF02one12196-bytehistallocation. |
| S-L051-06 | MAPPED CAPflat1024squarehasFrameCapacityfalse/max0. |
| S-L052-01..03 | MAPPED CARRIER/O04excludedrawsalt/fullE; SAMPLE K08emitsbeyond262144; REVIEWED Bminonlycapacitybudget. |
| S-L053-01..05 | MAPPED CARRIERindependentmatrix/header-body/MSB/paddingallS; FRAMErejectnonzeropadding; codeXORcolumn1..7oneindicatedLSB. |
| S-L053-06 | MAPPED E02everyalphabyteunchangedandupperRGBbits. |
| S-L053-07 | REVIEWED REVIEW-HISTORY/noproductionfiller/STC/Stenoxide; E01independentallsampleequalityalsoobservesunusedsamplesuntouched. |
| S-L055-01..02 | MAPPED CARRIER/FRAMEfirst89648-byteheader/onecontinuingstream/separategroups; STREAMK09prefixcontinuityandPROOF02onecountersequence. |
| S-L055-03..04 | REVIEWED REVIEW-KEY/F§1profileimplicit/allkeyedrecognitionafterroot; R08plainHKDFschedule andPROOF02onefixedroot. |
| S-L056-01..11 | MAPPED CARRIERindependentcompleteheaderAADS0..512/FRAMEoffset20..31refusals; REVIEWED encoding`:76–85`/frameShape`:38–55` exactnonce0..11,BE12/16,16/1/compression/1/1/1/1/zeros. |
| S-L056-12..15 | MAPPED FRAMEoverflow/unequalraw/invalidsettings/rawgzipemptyindependentfixtures; sourceexactS0..512/L0..1MiB/rawL=S/gzip0<S<L. |
| S-L056-16 | MAPPED UI`:134–151`emptycreationnoprepare,`:295–315`spaceinputvalid; T04emptyrefusal/T02nonemptywhitespaceaccepted. |
| S-L057-01..03 | MAPPED CARRIERindependentciphertexttag/AADsampleequality/PROOF02one528body/-04physicallyshorttags; KEYprimitivevectorisadditionalnotfullimageevidence. |
| S-L057-04 | REVIEWED F§3AADauthenticatesmessage/settingsnotallcover/metadata; R06supportedRGB/RGBArewriteobserved. |
| S-L058-01..05 | MAPPED CARRIER/FRAMEallSparity/block/interleave/saltpadding; PROOF02repairwords48/255/255/66; REVIEWED RSfield/provenance/omittedshortening/exactmultiples/noheaderinterleave. |
| S-L059-01..02 | MAPPED FRAME1/7/8damageand16beyondradiusfailure/PROOF02oneattemptpercodeword; REVIEWED repair`:172–185,220–240` eight-error/residualchecks/noretries/erasures. |
| S-L059-03 | REVIEWED F§4GCMacceptanceafterrepairnotmiscorrectionguarantee; FRAMEtagfailures/-04neverpartialtext. |
| S-L060-01..04 | MAPPED CAP/CARRIER/FRAMEallS223/224/462/463/no-frame/empty-only; REVIEWED exactC/r/D/G/twoinequalities/largestSformula. |
| S-L060-05 | MAPPED K12/K13/PROOF02maxk/drawbound; REVIEWED F§4S512→4992bits×50=249600minimumB/11648positions. |
| S-L060-06 | REVIEWED F§4S0→642bits×50=32100minimumB; MAPPED CAPno-framevs empty-only/O04saltexclusionnearminimum, notinventedexactB-imagefixture. |
| S-L062-01..04 | MAPPED TEXTsurrogates/exactUTF8/BOM/CRLF/whitespace/fatalUTF8/1MiB; sourcevalidationbeforeencoding. |
| S-L062-05..06 | REVIEWED SexplicitownershipP3guidance/P4exactfile-stdin; DOWNSTREAM behaviorsunmetnotdeleted. |
| S-L063-01..06 | MAPPED ZIPoptin/smaller/rawfallback/boundedproduction/header/CRC/ISIZE/onecompletedmember/trailing/memberrefusal/explicitcompressorerror, E04retainedbytes. |
| S-L064-01..03 | MAPPED PROOF01/-05authbeforeinflateinit/work, ZIPauthenticatedL/fullinput/boundedoverrun andTEXTfatalUTF8/no partialmessage. |
| S-L065-01 | MAPPED PIXEL/P1admission/exportpolicyretainedcurrentoperations; notWaivingP1journeys. |
| S-L065-02 | MAPPED PROOF02score/hist/eligible/sparse/stream/RSwords/528/576/624; REVIEWED repairallocate≤255andPIXELshapechecks. RELEASEprocessmemorynotestablished. |
| S-L066-01 | MAPPED PROOF02one128sampleread/oneSodium/continuousCTR/48+threebodyrepairs/oneGCM. |
| S-L066-02..03 | MAPPED K10/K12/K13prefix2816andcumulative2k+1024/final24320withoutreset, sourceheaderparsebeforebudgetextension. |
| S-L066-04 | REVIEWED REVIEW-KEYsinglefixedprofile/keyroute/nolegacyretry; MAPPED RUNTIME/FRAMEfailedcasesnotfallbacksuccess. |
| S-L068-01..03 | MAPPED KEY/PIXEL/CAP/RUNTIME/CANCELpublicspecifictypedfailuresvs FRAME/ZIP/-04/-05exacttwo-sentencecommonhiddenfailure/no text. |
| S-L069-01..02 | MAPPED LIFE/CANCELprivateworker/currentrevision/termination/suppresslatepartialoutput; actualKDF/compressorterminationcoverageM07separate. |
| S-L069-03..04 | MAPPED RUNTIMEworker/WASM/native/RNG/allocationcontrolledfailures/realgates; REVIEWED no mainthreadheavyfallback/weakeralgorithm. ActualdeployedCSP/deviceUNMETRELEASE. |
| S-L069-05 | REVIEWED sourceREVIEW-APP/transportnoarbitraryoperationtimeout; spinner/debouncepresentationtimersnotweakenedsecurity. |
| S-L070-01..02 | MAPPED exactrecoveryprogress`protected-recovery.test.js:14–20`,ZIPpreparestages/T04derivation; REVIEWED recoveryonebroadstage/notinternalrecognizers. |
| S-L070-03 | MAPPED KEY/R09/E07secretarrayclear,UI/T04passwordclearafteroutcomes/cancel; REVIEWED privatefinally/reference-release/best-effortnotguaranteederasure. |
| S-L071-01..05 | REVIEWED REVIEW-HISTORYwholefeaturesequence/currentbothapps/oldAPIsandfillersremoved/currentdocs-examples-nextchangelogupdated/historicalchangelogretained; notfreshformalreviewcompletion. |
| S-L076-01 | REVIEWED S Screenssourcesmatchedtoexistingcards/tabs/forms/buttons/password/message/resultcomponentsinREVIEW-APP. Human7judgmentnotperformed. |
| S-L076-02 | REVIEWED `app/src/styles.css:1–45` terminaltheme/900pxmaxwidthandexistingcomponents, notnewvisualsystem; contrast/tone/focusjudgmentTHEIRS. |
| S-L077-01..06 | UNMET M06remainingrealstates/matrix/announcednames/livefocus/colornoncolorproof. W20named24viewssubsetretained; sourceaccessibleattributes/labelsarenotcompletewalkthroughobservation. |
| S-L078-01 | UNMET M06every-actionkeyboardclaimnotestablishedbyselectedW21/U04actions. |
| S-L078-02 | MAPPED U03Stay/Escaperestoreexacttriggerfocus, historicalB12/W21discard/focus; Switchclearpathsource`App.jsx:51–57`. |
| S-L078-03 | REVIEWED accessibleheadingmarkup `DecryptForm.jsx:65–69` labelledsection/h3 and`EncryptionResult.jsx` resultheading; MAPPED UIemptytextsuccess/notHTML. RealallstateaccessibilityM06/Human7remainseparate, nofullscreenpass. |
| S-L078-04 | MAPPED historicalW21keyboardreveal andUIrevealbuttons`:346–383`; notpointeronly. |
| S-L078-05 | MAPPED UIvalidation/capacityreason`:437–465,295–333` andT02refusalnextaction; sourcebuttonaria-describedby/reasontext, notcolornoticealone. |
| S-L079-01..03 | MAPPED U03/U04activearia-selected/Stay/Switchandclear/confirmclear/newemptyform; historicalB12/W21pairedrealbehavior. |
| S-L079-04 | REVIEWED REVIEW-APPnobrowserpersistenceaddedinworkflowpaths; RELEASEnetwork/cacheauditnotimplied. |
| S-L080-01..03 | MAPPED UIlocksnavigation/password/message/keepCancel, inputeditscancelobsoletecapacity, cancellationkeepseditableinputs/clearspassword/rejectslatesuccess; CANCELrealgateownership. FreshB10M08pending. |
| S-L080-04 | MAPPED historicalB12clearedform/nextaction; REVIEWED `EncryptForm.jsx:82`/`DecryptForm.jsx:37–38` explicitCleared/ChoosesupportedPNGguidance; noHuman7tonejudgment. |
| S-L081-01 | MAPPED progress/UI/T04safephases; REVIEWED nostagepercentages/hiddenrecognizerprogress inREVIEW-APP. |
| S-L081-02..03 | UNMET M05realshortoperationno-flash/longwaitspinnerandCancel; U07controlledfakeclocknotreplacement. |
| S-L081-04..05 | MAPPED UIrecoveryfailurekeepsimage/clearssecret/restart andcompleteoutputkeptuntilpasswordedit/clear/leave, historicalB3/B12/W21; sourceinput-adjacentrolealert. |
| S-L082-01..03 | MAPPED UI`:295–315,134–151`initialnocapacity/compressionoff/exactbytes/actualuse, T02CLIbyteandcompressiondisplay; currentrealscreenM08pending. |
| S-L082-04..06 | MAPPED CAP/UI/T02no-frame/empty-only/oversizepublicreasons/fitbuttonenabled/completePNGonly; O12completeoutputnotsuccessfulpartialsummary. |
| S-L083-01..02 | MAPPED UIreplacement/failureclearsoldcapacity/no-fit-retention; latecancelledsuccessnotdownloadable andCANCELnooutput. |
| S-L083-03 | REVIEWED metadatanotice`protected-image.js:7`explicitnotundetectability; result/READMEalsoavoidconcealmentinference. |
| S-L085-01..02 | MAPPED U02/UIemptyone-passwordform/safestages/Cancel/lock; realgatesCANCEL, historicalW18recovery. |
| S-L085-03..04 | MAPPED FRAME/ZIP/commonfailurevsPIXELpublictypederrors andUIauthenticatedemptyexplicitheading/success/nottruthiness. |
| S-L086-01..03 | MAPPED UIinputchange/cancel/clear/restartremovesstaletext,`authenticated text remains visible and is rendered safely: %s`empty/scriptcases; sourceReacttext`MessageDisplay.jsx`, notHTML. |
| S-L088-01..02 | MAPPED T02/T04guidedmenu/currenthelp/TaskEncrypt-Decrypt; REVIEWED S ScreensnamesexistingCLIassource. |
| S-L088-03..04 | MAPPED T01/T02/T03help80×24/120×40,longpath/controltext/plainpipe/NO_COLOR/textstatuses; historicalT7additionalactualscreens, nofullcurrentwalkclaim. |
| S-L089-01..03 | MAPPED T01openstdinrefusal/nohang/no prompt, helpflags/keys andT02actualTTYprompts. P4futuresecretroutesstillDOWNSTREAM. |
| S-L089-04..05 | MAPPED T04actualCtrlCduringderivingphase/no success/noexistingoutputchange/noremnanttemp; T03PNG/wrongpasswordfailedoutputpreservation; noall-futurepathaliasguarantee. |
| S-L090-01..05 | MAPPED T01argumentcontrols/T03recoveredcontrols/fileexactbytes/longpaths/stdoutvsstderr/wrongpassword/publicPNGfailures/nohiddenstage/noresultsuccess; source`terminalText:21–26`safeescaping. P4exactfuturestdoutnotclaimed. |
| S-L091-01..03 | MAPPED T04actualguidedencrypt/decryptwithpubliceditorfixture, historicalWALKpubliceditorroute; REVIEWED Sexplicitretainedexternaleditornotfutureinprocessinput. |
| S-L091-04 | DOWNSTREAM UNMET P4mustmigratethisscenariowhenremovingeditor; notsilentlydroppingfutureacceptance. |
| S-L097-01..02 | MAPPED LIFE/FRAME/extendedintegrationrealtransport/gates/bothplatforms; REVIEWED asynccompleteoperationseamnotforwardingonly. |
| S-L098-01..04 | MAPPED KEY/STREAM/SAMPLEprivateindependentroot/child/CTR/rejection/positionsvectors; REVIEWED test-onlyfixedinputs/adaptersnotproductiontrace/profileoverride/fallback. |
| S-L099-01..03 | MAPPED UI/T01–T04andhistoricalWALKAPP-INTERACTION; RUNTIME/LIFE/FRAME/U06realgatespaircontrolledform/transportcases. FreshwalkM08pending, notallfake-opbranchesbecomingrealbrowsertests. |
| S-L100-01..04 | REVIEWED Sthree-seamallocationandREVIEW-HISTORYslice/testownership: prepareoperation,encode/recoveroperation+privatekeys,jointoperation+app; coveragegroupsnotextraseams. MAPPED referencednamedinterfacecases, notclaimingformalreviewroundcompleted. |
| S-L104-01..06 | REVIEWED S Coveragegroups/normativeownership, thisaddendumretainsalloldclausesanddistinguisheskeypositions/operation/appfromcoveragegroupnames; no title- orsurface-groupingwaiver. ActualunmetcasesstaylistedM01–M08. |
| S-L106-01..02 | MAPPED KEY/STREAM/SAMPLE/E05/R08independentprimitivechain/publicexpectedbytesnotproductiongenerated; REVIEW-KEYnocheappasswordrecognizerargument. Final automated proof/full suite passed; the missing invalid-input-before-KDF observation M01 is not lost. |
| S-L107-01 | MAPPED CARRIER/FRAME/CAP/PIXELallS0..512/headerAAD/ties/padding/block/saltexclusion/no-frame/empty-only,bothnativeadapters. |
| S-L107-02..03 | MAPPED FRAMEchangedpayload/nonce/fields/profile/reserved/geometry/bodypermutations/wrongpassandPROTECTED-ACCEPT-04physicallyshorttag/publicfixtures; final integration/full-suite PASS at 7f3b2d4. |
| S-L108-01 | MAPPED TEXT/ZIPrawgzipUnicode/BOM/CRLF/whitespace/empty/invalidsurrogatesUTF8/headerCRCISIZEmembertrailing/incompressible/overrun/unavailableerror. |
| S-L108-02 | MAPPED PROOF01/-05failedGCMzeropayloadgzipinit/workpluspositiveauth-beforework; notR05titlealone. |
| S-L109-01 | UNMET M07actualinKDF/compressiontermination; otherconstituentsLIFE/CANCEL/RUNTIME/PROOF02/K12mapped. Phaseeventsarenotexactin-callobservations. |
| S-L109-02 | MAPPED CANCEL O10realrepairentered/workerstopped/noresult/freshrecovery; notmockforwardingcall. RemainingrequiredcasesM07notwaived. |
| S-L110-01 | MAPPED FRAME/integrationcompleteworker-backedPNGoperationseam. |
| S-L110-02 | MAPPED historicalWALKrealCLI/PWArawgzipbothdirections; currentfreshM08pending. |
| S-L110-03 | REVIEWED Sexplicitnon-substitution: browsercompatiblecrypto/gateunderNodeisnotactualbrowser. |
| S-L111-01..02 | REVIEWED S priorart/migrationconstraints/REVIEW-HISTORY: legacyassertionsreplacednotweakpathsretained; realchecksFRAME/KEY/UI/T01–T04/PIXEL. |
| S-L111-03..04 | REVIEWED F§8Hiisframingonly; MAPPED CARRIER/FRAMEindependentcompleteimagesnorelianceonthatvectorasinteroperabilityproof. |
| S-L112-01..04 | MAPPED retainedP1PNG-ACCEPT01/02/13,E08,P01/P05/U06/current640covers; REVIEWED 64²quarter×3=3072<32100emptyminimum, suitablesupportedfixturesreplacecoversnotpolicyjourneys. FreshconcurrentB15M08pending, oldfailurepreserved. |
| S-L113-01 | REVIEWED namedtestbodiesCARRIER/FRAME/LIFE/UI/T01–T04behaviorassertionsnotforwarding/source-text/incidentalwording; designnonclaimssourcereviewnottautologicaltests. |
| S-L113-02..03 | REVIEWED deterministicpublicreference/cover/exportfixtures; T01–T04`:16–24`uniquemkdtempandown-directorycleanup, integrationprotectedfileusesnomutablefileoutputs; noother-testcleanup. |
| S-L113-04..05 | REVIEWED REVIEW-HISTORYobsoleteformatassertionsreplaced/acceptancefileaddedat544f774andextendedherebyowner; thisdocumenttaskdoesnotedittests. |
| S-L113-06..07 | MAPPED / PASS automated command gates: owner-run final integration6/45.686 s and full suite563/23/291.378 s at 7f3b2d4, plus proof units2/6.16 s. Historical538/22 and prior558/22 remain separately scoped, not reused as current proof. |
| S-L113-08 | REVIEWED S harnessscope/e2enone, no newe2eharnessadded. |
| S-L113-09..10 | MAPPED historicalWALKnumberedactualbrowser/terminal; REVIEWED noNode-as-browserinference; freshM08pending. |
| S-L116-01..08 | REVIEWED exactS Normativecoverage: K/P→KEY; C/F1–4→FRAME; F5text→TEXT/bounds→LIFE/P1; F7–8/D1–4/D6mappedbybehavior; fullimagereference→FRAME; A D1/4/5→LIFE+realexchange; releaseA1–5/A7/A8consumethese(notpassedbythem). |
| S-L116-09..10 | REVIEWED this872-rowreconciliationpreservesexacthistoricalclauses/IDs/sourceidentity/fixtures/checkassertions/currentexecutionqualification; M01–M08/RELEASE/DOWNSTREAM/THEIRSremainexplicit. It is anindex, notblanketproof. |
| S-L116-11..12 | REVIEWED allevidenceinitiallynotrun/missingmandatorycasesunmet; currentrunstateexplicitatheadandnewcatalogue, no source/title/selfroundtrippromotedtofreshPASS. |
| S-L120-01 | PARTIAL / UNMET M08: FRAME/PROTECTED-ACCEPTcompleteoperationandhistoricalWALKAPP-INTERACTIONmapped; freshwholefeatureacceptancenotcompleted. |
| S-L121-01 | PARTIAL / UNMET M08 real browser/TUI check still pending; final named integration6/45.686 s passed at 7f3b2d4. Historical four-case run remains historical. |
| S-L122-01 | REVIEWED S Affected e2enone; no unapprovedharnessneededtoavoidrealwalkthrough. |
| S-L123-01..02 | PARTIAL / UNMET M01–M08: fourstoriescoveredbynamedassertionsandhistoricalstepsonlytoprovedextent; fresh/fullmandatoryobservationsnotcomplete. |
| S-L123-03, S-L124-01 | REVIEWED commandexecutionalonecannotproveUI; numberedHumancheckretained/currentM08pending, Human7THEIRS. |
| S-L132-01..03 | THEIRS (UNMET): Human7compareeverychangedscreen/commandwithnamedsource; judgecontrast/focusoutlines/tone. No automated/source/capturepasssubstituted. |

## Historical evidence — immutable original record

Everything from the next heading onward is the pre-released-pass record, verbatim. Its production candidate, acceptance identity, observed passes/failures and UNMET statuses are scoped to that history; the addendum above supplies current reconciliation without rewriting them.

## Identity and result

The targeted acceptance check passed (4 tests, 1 suite, 14.379 s). The full configured fast suite passed (538 tests, 22 suites, 265.986 s). The PWA build passed (1.56 s; outDir, Browserslist and large-chunk warnings). These results do not approve the feature or release: the unmet proof obligations below remain open.

- Feature: [#46](https://github.com/jdragulanescu/obscr/issues/46); acceptance: [#71](https://github.com/jdragulanescu/obscr/issues/71).
- Production candidate: `b471500ea04a247cd7e434f47e65fe6d5cd1457b`; empty claim commit: `b790576`. Whole-feature base: `4c8f7c5d1e2ca9ac37810cc74a997f4819309736`.
- Acceptance test identity: `544f7748eba420e66443ce3a85eda218536e53d9`, with the same test bytes used in the targeted and full-suite runs. Later evidence-only edits do not change the production candidate.
- `PASS` records an observed check. `UNMET` means the required observation has not been established by this index. A test can pass while proving only part of a clause; that clause remains unmet. An unmet mapping is not evidence of a production defect, and does not by itself require a new test.
- Each sentence or table entry has a stable source ID: source letter, snapshot line, sentence/subclause number. Quoted source text is retained so that a broad summary cannot silently drop a requirement. Semicolon-separated obligations are separate rows. Named checks below are candidate evidence, not proof from reading source. A row cannot become PASS merely because a related test passed: its own asserted observation must be present. Review/claim clauses need review evidence, not a test title.
- Commands: `agent-local npm test -- test/integration/protected-image.test.js`; `agent-local npm test`; `agent-local npm run build`. The real browser/TUI record and Human step 7 are separate gates. Typecheck, lint, format, mutation and e2e commands are configured as none.

## Whole-feature review and verdict

**Acceptance fails.** One review round compared `4c8f7c5d1e2ca9ac37810cc74a997f4819309736...544f7748eba420e66443ce3a85eda218536e53d9`. Standards reported two proof gaps; Spec reported those same two gaps and one missing result contract; Security reported zero concrete attacks. Duplicate findings are one failure each. All three are `ticket` dispositions: acceptance records missing work for `/to-tickets 46`, rather than changing production code.

The [numbered acceptance failures](https://github.com/jdragulanescu/obscr/issues/71#issuecomment-6446268855) also record the browser reloads, concurrent Diff admission and remaining normative observations. #71 is open, unassigned and labelled `needs-tickets`; PR #72 remains draft. Next: `/to-tickets 46`. No implementation ticket was created and no production behavior was changed in this acceptance run.

| Failure | Requirement | Evidence |
|---|---|---|
| F1 | Incorporated application D1: encode returns complete PNG bytes plus its capacity summary. | `lib/protected-encoding.js:103` returns only `{ ok: true, pngBytes }`. A real Node worker probe on this candidate returned a complete 1,229,598-byte PNG and keys `ok,pngBytes`; `originalBytes`, `storedBytes`, `compressionUsed`, `maxStoredBytes`, `hasFrameCapacity`, `fits`, and `metadataNotice` were absent. |
| F2 | FORMAT-TEXT: authentication precedes decompression, with proof at PROTECTED-OPERATION. | `protected-recovery.test.js:81-100` supplies authenticated malformed gzip. Its separate bad-tag case checks the returned failure but does not observe whether decompression ran. The source order was not found defective; the required negative observation is missing. |
| F3 | FORMAT-FRAME: shortened-tag rejection through complete protected-image recovery. | `protected-keys.test.js` truncates native AEAD input only. Complete-image fixtures alter tag bytes but do not shorten the tag. Neither passing primitive checks nor round trips prove this required integrated case. |

Security traced CLI/forms, bounded file input, both worker gates, PNG parsing, key/frame processing, output delivery, rendering, cancellation, dependencies and build changes. This source review is not the independent release audit, physical-device proof or publication approval.

The first assembled-test attempt reused transferred buffers and failed in the test harness; it also left an unresolved worker after a transfer error. Supplying a separate owned input for each operation and routing asynchronous send errors to the transport resolved the harness failures. The production code was unchanged. The corrected targeted and full-suite runs above passed.

Lessons: none. The three acceptance findings are not repeated findings from the earlier review ledgers. This run records them at the required assembled-feature gate; it adds no global rule.

## Real-program evidence

[Current candidate walkthrough and captures](https://github.com/jdragulanescu/obscr/issues/71#issuecomment-6446201559) records initial Browser steps 1–17, TUI steps 1–9, and supplemental observations 18–22. `B` below names initial Browser steps; `W18`–`W22` name supplemental observations; `T` names the initial TUI steps. Raw/gzip files crossed the actual guided CLI and actual browser in both directions. Four `cmp` calls independently confirmed exact recovered bytes.

Two initial document reloads interrupted preparation and an encode-cancellation restart (B1/B10). These remain failed observations, not a demonstrated production cause. Vite dependency URLs changed during the walk. B15 also failed: starting both standalone Diff admissions together left Generate Diff disabled with both filenames selected. Sequential admission passed separately and does not erase the failed concurrent case.

W18–W22 added actual recovery-stage cancellation/restart, CLI Ctrl-C during deriving keys with no output, keyboard activation, a 24-view prepared/result/recovery/Diff matrix at 320/768/1440 and normal/doubled text, and old-format refusal. Browser diagnostic lists contain no console errors, uncaught errors or HTTP failures. The TUI report's strict error-list verdict includes expected cancellation/refusal text; those negative cases produced their specified outcomes.

Public legacy fixture: `legacy-4c8f7c5.png`, SHA-256 `d169b45fc5155bcae6f4d85a7ba28f4d3953e4421e765c70a02be9a988e8663e`. Exact historical crypto/carrier modules from `4c8f7c5` encoded and recovered `Public legacy fixture from 4c8f7c5`; the current Node worker and browser returned the common hidden failure. Temporary historical modules were removed; the image and provenance remain in `/tmp/obscr-71-evidence/fixture-manifest.json`.

All captures, public fixtures, exact output files and runtime logs remain under `/tmp/obscr-71-evidence/`. The walkthrough comment lists every capture. Tabs, terminal sessions and this run's server were closed. Human step 7 remains yours. Spinner-delay/flash timing and every secondary-state/viewport combination are not claimed.

## Sources and explicit overrides

The exact incorporated snapshots, including their line numbers and SHA-256 digests, are listed below. The links, not this index, define the contract.

- **K**: [contract-6373122896.md](https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6373122896); SHA-256 `4cc8c801ee9356389ffb882a72ac51e01c319b33b65e58181b07a765ae95e608`.
- **P**: [contract-6374176664.md](https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6374176664); SHA-256 `edbecd5044764c856651111771090ff58c772cfddf64715c1d90fcee2ff42847`.
- **C**: [contract-6386604139.md](https://github.com/jdragulanescu/obscr/issues/17#issuecomment-6386604139); SHA-256 `11ab24f374dda60153d065a88d4e1acae1f3c738634c789106a1945bc8fc07a4`.
- **F**: [contract-6387228703.md](https://github.com/jdragulanescu/obscr/issues/19#issuecomment-6387228703); SHA-256 `6c2d26c8f435aeb9b85733aab9bfa9b1811e665ff4e4a448de9044a6582ba501`.
- **A**: [contract-6387616398.md](https://github.com/jdragulanescu/obscr/issues/21#issuecomment-6387616398); SHA-256 `af57b41be0cfc724579e4d3822e2262f0acb77f862c4863e08a5c420f647ab83`.
- **S**: [spec-46.md](https://github.com/jdragulanescu/obscr/issues/46); SHA-256 `4206505aa6122793ffb8dfcf892016ea6ccef6023cba500c275e901a785f0137`.

Final carrier/format bounds replace the provisional profile experiment ceilings: 1,024 per side and 1,048,576 pixels, not 4,096 and 12,192,768; two owned RGBA buffers total at most 8,388,608 bytes, not 97,542,144. `B=min(E,262144)` is a rate budget, not a truncated domain. The final frame uses at most 11,648 positions and 24,320 cumulative draws, with 2,816 draws before accepting the header; the earlier 262,144-position/525,312-draw ceiling cannot authorize a larger frame. There are at most three body codewords under 512 stored bytes, within the earlier maximum of four. The former 655-byte STC limit is not a codec limit. Hidden image profile checks occur after the one fixed KDF; there is no public selector or profile retry. The fixed implementation configuration can still be checked before derivation.

Spec #46 retains the external-editor CLI route until P4, rather than claiming the future exact file/stdin route already exists. P3 owns generated-password choices/guidance, P4 exact file/stdin/output policy, and P5 offline release/update work. Those broader application scenarios remain listed as UNMET downstream/release gates; they are not deleted or treated as passed by #46.

## Evidence classes and fixtures

- **Independent primitives:** `test/unit/protected-keys.test.js` records the historical `a64t3` vector from commit `acec5c4`, `results/node-vectors.json`, [#27](https://github.com/jdragulanescu/obscr/issues/27) ([profile record](https://github.com/jdragulanescu/obscr/issues/27#issuecomment-6373868960)). Its comments identify independent Noble Argon2id/HKDF and a dense sampler reference. This is historical provenance, not a newly observed pass. Public password bytes are `204f6273637220636166c3a92065cc8120f09f949020`; salt is `000102030405060708090a0b0c0d0e0f`. The test holds fixed root, both keys, 128 stream bytes and 24 positions. Browser crypto here is Node WebCrypto, not browser evidence.
- **Framing only:** F section 8's `Hi` vector uses a supplied encryption key. K04 checks its ciphertext/tag and AAD. It proves neither Argon2id nor a complete PNG nor real application exchange.
- **Independent complete images:** `test/fixtures/protected-reference.js` imports no application codec. It uses separate full-sort ranking, polynomial-division RS, matrix and PNG writers. It shares the pinned Sodium primitive with production; that is not an independent Argon implementation. Public password is `public reference password / not a secret`, salt bytes 0..15, nonce bytes 0xa0..0xab. Default text is `\uFEFFProtected image — Καλημέρα 世界\r\n  exact whitespace \t\n`. Cases name every changed text/damage/header option. R01/R02 and E01 use these independent complete-format expectations.
- **Self-roundtrip:** E03 and PROTECTED-ACCEPT-01 use production encoding and decoding through different platform gates. This demonstrates compatibility when run, but cannot replace the independent complete-image checks. Browser-module gates running in Node cannot replace actual browser use.
- **Public cover/PNG fixtures:** `test/fixtures/protected.js` and `test/fixtures/pngExport.js` supply deterministic detailed covers and metadata. Small 64×64 covers have insufficient capacity for this format; the retained export journeys use sufficiently large detailed covers. No fixture is private user data.
- **Controlled lifecycle/component checks:** supplied native adapters, transport replies and simulated DOM exercise error paths. They do not by themselves establish real-worker termination, browser CSP support, visual accessibility or physical-device cost.

## Named check catalogue

Every named test in this catalogue, including R10/R11, passed in the 538-test full-suite run on the candidate above. This is check-level evidence, not a global clause pass. Rows marked UNMET remain UNMET even when their related tests passed. File names and case titles are exact, including parameter templates.

| ID | File and exact case title | Evidence class |
|---|---|---|
| K01 | `test/unit/protected-keys.test.js` — derives the fixed root once and both independently anchored child keys | independent primitive; Node and Node WebCrypto |
| K02 | `test/unit/protected-keys.test.js` — matches the independent stream and full-width position trace | independent primitive |
| K03 | `test/unit/protected-keys.test.js` — increments all 128 counter bits and rejects wrap before producing output | independent primitive |
| K04 | `test/unit/protected-keys.test.js` — authenticates the accepted exact GCM serialization without partial output | framing-only primitive; not a complete image |
| K05 | `test/unit/protected-keys.test.js` — does not normalize, trim, fold case, or reuse keys across salt/password changes | KEY-POSITIONS |
| K06 | `test/unit/protected-keys.test.js` — rejects biased words and applies sparse swaps in the supplied eligible order | controlled KEY-POSITIONS |
| K07 | `test/unit/protected-keys.test.js` — consumes a singleton draw and exhausts non-power-of-two domains uniquely | controlled KEY-POSITIONS |
| K08 | `test/unit/protected-keys.test.js` — uses the full domain, not the position or 262144-sample budget | controlled KEY-POSITIONS |
| K09 | `test/unit/protected-keys.test.js` — preserves leftover stream bytes across the prefix and 4096-byte boundary | controlled KEY-POSITIONS |
| K10 | `test/unit/protected-keys.test.js` — counts rejected draws against the prefix ceiling and does not reset after setLimit | controlled KEY-POSITIONS |
| K11 | `test/unit/protected-keys.test.js` — does no stream work for zero demand and cannot renegotiate a parsed budget | controlled KEY-POSITIONS |
| R01 | `test/unit/protected-recovery-worker.test.js` — recovers raw, gzip and empty independent PNGs with exact text | complete independent image; actual gates under Node |
| R02 | `test/unit/protected-recovery-worker.test.js` — recovers every stored length through the real worker, including every block and padding transition | complete independent image; actual gates under Node |
| R03 | `test/unit/protected-recovery.test.js` — returns one hidden failure and no text for %s | complete independent malformed images; parameter table |
| R04 | `test/unit/protected-recovery.test.js` — repairs %i independently damaged bytes per header and body block | complete independent damaged images; counts 1,7,8 |
| R05 | `test/unit/protected-recovery.test.js` — authenticates before decompression and rejects malformed authenticated gzip without partial text | complete independent malformed gzip images; see limitation G03 |
| R06 | `test/unit/protected-recovery.test.js` — preserves recovery through a sample-preserving RGB to RGBA rewrite but not changed geometry | complete independent image |
| R07 | `test/unit/protected-recovery.test.js` — bounds authenticated decompression while producing a large exact result | complete independent image; 400000 bytes and authenticated length 1000 |
| R08 | `test/unit/protected-recovery.test.js` — does not recognize a detailed plain image before the fixed derivation | complete plain image; observes two HKDF calls, no GCM |
| R09 | `test/unit/protected-recovery.test.js` — performs one complete key schedule and one authentication at maximum stored size, then clears keys | complete independent image with native adapter observations |
| E01 | `test/unit/protected-encoding-format.test.js` — matches independent samples for every stored length, including all block and padding boundaries | independent complete-image comparison; fixed public inputs |
| E02 | `test/unit/protected-encoding-format.test.js` — preserves all alpha and upper RGB bits while changing only carrier LSBs | complete-image sample invariant |
| E03 | `test/unit/protected-encoding-worker.test.js` — exchanges exact raw, gzip and empty text with the other platform | self-roundtrip; two real gates under Node, not browser walkthrough |
| E04 | `test/unit/protected-encoding.test.js` — encrypts the exact retained compressed bytes once, without admitting the source again | controlled PROTECTED-OPERATION |
| E05 | `test/unit/protected-encoding.test.js` — uses fresh salt and nonce on each complete encode attempt | PROTECTED-OPERATION randomness observation |
| E06 | `test/unit/protected-encoding.test.js` — refuses impossible preparations before salt, nonce or key work | controlled PROTECTED-OPERATION |
| E07 | `test/unit/protected-encoding.test.js` — returns no partial PNG on allocation failure after encryption and clears secret buffers | controlled PROTECTED-OPERATION |
| E08 | `test/unit/protected-encoding.test.js` — strips admitted personal metadata while preserving supported rendering chunks | complete PNG export |
| E09 | `test/unit/protected-encoding-format.test.js` — %s output matches independent complete-image expectations for raw and gzip exact text | independent raw/gzip complete-image comparison; Node and browser-compatible native crypto |
| O01 | `test/unit/protected-worker.test.js` — prepares with randomness and key derivation forbidden by the runtime | real worker gate; forbidden native APIs, not direct Argon invocation counter |
| O02 | `test/unit/protected-worker.test.js` — accepts preparation and discard, retains only the exact latest revision | actual Node and browser-module gates under Node |
| O03 | `test/unit/protected-operation.test.js` — admits the exact text and image limits, but not one extra UTF-8 byte | PROTECTED-OPERATION |
| O04 | `test/unit/protected-operation.test.js` — excludes salt scalars before capacity and ignores all lower RGB bits | PROTECTED-OPERATION |
| O05 | `test/unit/protected-operation.test.js` — supports every stored length 0..512 without expanding the stored-byte limit | PROTECTED-OPERATION |
| O06 | `test/unit/protected-compression.test.js` — never reports an incomplete stream as compressed text | controlled PROTECTED-OPERATION |
| O07 | `test/unit/protected-compression.test.js` — reports exact raw capacity after a bounded or larger stream and refuses non-fitting encoding | PROTECTED-OPERATION |
| O08 | `test/unit/protected-transport.test.js` — suppresses a late cancelled reply while the new generation completes | controlled transport, not real cancellation timing |
| O09 | `test/unit/protected-transport.test.js` — reports missing workers/CSP instead of running image work on the caller | controlled construction failure, not browser CSP deployment |
| O10 | `test/unit/protected-recovery-worker.test.js` — terminates a worker inside a controlled repair call, drops its output and recovers again | real worker termination with controlled repair |
| U01 | `test/unit/browser-components.test.js` — preparation reports exact bytes and survives password-only edits | APP-INTERACTION; simulated DOM and operation stand-ins |
| U02 | `test/unit/browser-components.test.js` — decrypt cancellation clears the password and rejects a late decrypted message | APP-INTERACTION; simulated DOM |
| U03 | `test/unit/browser-components.test.js` — Stay and Escape preserve the task; Switch and clear aborts pending work and resets it | APP-INTERACTION; simulated DOM |
| U04 | `test/unit/browser-components.test.js` — tab keys move focus without changing the active task | APP-INTERACTION; simulated DOM |
| U05 | `test/unit/browser-components.test.js` — comparison requires both admissions and equal dimensions | APP-INTERACTION; simulated DOM |
| P01 | `test/unit/png-diff.test.js` — counts RGB sample changes, not PNG encoding or color-type differences | P1 PNG/Diff retained |
| P02 | `test/unit/png.test.js` — stops a high-expansion stream at the declared raster, without allocating the expansion | P1 bounded PNG inflation |
| P03 | `test/unit/png.test.js` — accepts exactly 16 MiB of valid bounded input | P1 source boundary |
| P04 | `test/unit/png.test.js` — admits all rendering declarations together and owns their bytes | P1 rendering metadata |
| P05 | `test/unit/png-policy.test.js` — refuses transparent carrier input without replacing an existing output | P1 output preservation |

R10 and R11 are additional exact credential checks; both passed in the full-suite run:

| ID | File and exact case title | Exact assertion and limit |
|---|---|---|
| R10 | `test/unit/protected-recovery.test.js` — rejects invalid credentials and request overrides before key work | Invalid credentials return INPUT_INVALID/INPUT_LIMIT and no message. Native HKDF throws if reached; this is not a direct Argon invocation counter. |
| R11 | `test/unit/protected-recovery-worker.test.js` — accepts exact 1,024-byte ASCII and multibyte passwords without normalization | Both actual platform gates recover independent PNGs with 1024 ASCII characters or 512 `é` characters. |

### Parent-owned new integration cases

| ID | File | Required observation | Status |
|---|---|---|---|
| PROTECTED-ACCEPT-01 | `test/integration/protected-image.test.js` | Node/browser gate variants: raw/gzip exact BOM, Unicode and line endings; single-use preparation; complete PNG/export metadata, upper bits, alpha/source; sample-preserving rewrite and cross recovery; wrong password returns no text. Production self-roundtrip, not independent-vector or actual-browser proof. | PASS; targeted and full-suite runs |
| PROTECTED-ACCEPT-02 | `test/integration/protected-image.test.js` | Both gates recover independent empty and eight-symbol-damaged header fixtures; altered AAD nonce gives hidden failure. | PASS; targeted and full-suite runs |
| PROTECTED-ACCEPT-03 | `test/integration/protected-image.test.js` | Real recovery cancellation followed by fresh preparation, encoding and recovery. | PASS; targeted and full-suite runs |

These new cases supplement, not replace, the detailed normative checks below. Exact titles in `test/integration/protected-image.test.js` are:

- `PROTECTED-ACCEPT-01 ${origin}: prepares exact text, exchanges complete PNGs and preserves PNG/Diff policy`, expanded for `Node` and `browser gate`.
- `PROTECTED-ACCEPT-02: independent damaged and empty frames recover; authentication failure releases no text`.
- `PROTECTED-ACCEPT-03: cancelled real recovery cannot consume a replacement preparation or publish stale text`.

The fixtures are 640×640 RGBA `exportFixture` for -01 and 640×640 `referencePNG` for -02/-03. -01 uses reference `TEXT` raw and `TEXT.repeat(100)` gzip. -02 changes eight header bytes, uses raw empty text, and sets authenticated header byte 0 to zero after authentication. -03 cancels on the Node `recovering` stage and then uses `Fresh public text after cancellation`. No actual browser or CLI runs occur in these tests.

## Retained P1 checks

P1 remains required, including PNG admission/export and Diff. The full suite passed `test/integration/png-admission.test.js`, including `PNG-ACCEPT-01` for both color types, `PNG-ACCEPT-02: a refused replacement preserves the prior export and cannot become a successful Diff`, and `PNG-ACCEPT-13: cancelling publication to the input path preserves the original source`. `test/unit/png-export.test.js`, `test/unit/png.test.js`, `test/unit/png-diff.test.js` and browser PNG worker checks also passed. Human step 6 remains a separate observation.

## Concrete missing mandatory observations

These are proof gaps, not assertions that implementation is defective. A successful source inspection or a self-roundtrip cannot close them.

| Gap | Required proof and present limitation | Status |
|---|---|---|
| G01a | Candidate-targeted acceptance result on the identified test addition. | PASS; 4 tests / 1 suite, 14.379 s |
| G01b | Full existing suite results with candidate plus acceptance test identity. | PASS; 538 tests / 22 suites, 265.986 s |
| G02 | Actual guided CLI → actual browser and reverse, raw and compressed, exact recovered text. Sample-preserving rewrites are checked separately through complete operations. | PASS; B4/B5, T1–T4, four exact file comparisons, PROTECTED-ACCEPT-01 |
| G03 | Observe that a bad GCM tag prevents decompressor invocation. R05's title says authentication precedes decompression, but its inspected cases supply authenticated malformed streams; that alone does not observe non-invocation on tag failure. R03's tag rejection alone also does not observe ordering. | UNMET; FORMAT-TEXT / F144 |
| G04 | A complete protected-image fixture with a deliberately shortened GCM tag, crossing PROTECTED-OPERATION and giving common failure/no text. K04 checks shortened native AEAD input only; it is not the required complete-image assertion. | UNMET; FORMAT-FRAME / K83 / F173 |
| G05 | Specifically identified legacy protected image gives common failure after fixed derivation, with no fallback. | PASS; Node probe and W22; fixture digest recorded above |
| G06 | Real preparation/derivation/recovery cancellation and restart, password clearing, retained inputs, no stale output. | FAIL for original B10 restart interrupted by reload; independent B11/W18/W19 stage observations passed |
| G07 | Browser widths, doubled text, keyboard/focus, locks and stale-result controls. | PASS for B2/B3/B12 and W20/W21's named state matrix; initial B1 reload remains a separate failed observation; secondary-state combinations unclaimed |
| G08 | CLI sizes, long paths/text, NO_COLOR/non-TTY, PNG export/Diff and file preservation. | FAIL for concurrent Diff admission B15; T1–T8/W19 and export/sequential-Diff observations passed |
| G09 | Human comparison of every changed screen/command with its named source: contrast, focus outlines and tone. No machine check substitutes for the user's decision. | UNMET; Human 7, user-owned |
| G10 | Exact maximum-image allocation/high-water observations for every final score/histogram/eligible/sparse/paired-buffer cap and single salt/header/body-repair count. R09 bounds stream output and counts HKDF/GCM; it does not measure all these arrays or count all repair attempts. | UNMET for unobserved counters; F116/F118/F120 |
| G11 | Real browser CSP/WASM/worker/allocation support and separate named physical iPhone/Android/desktop/Node cold/warm key-ready and whole-process memory/responsiveness results. Controlled constructor failure is not deployment/device evidence. | UNMET release gate |
| G12 | Completed-format no-cheaper-verifier argument independently reviewed, pinned dependency/license/notice and artifact review, existing bounded detection/damage and attack checks. Primitive vectors or source comments do not establish these release results. | UNMET release gate |
| G13 | Full offline installation, disabled-network exchange, missing-asset/update isolation and network/cache secret inspection; exact future file/stdout and generated-passphrase scenarios. #46 leaves their established product owners intact; no release claim follows. | UNMET downstream/release gate |

## Clause-to-evidence index

Source IDs are stable against later edits to this document. Each source link points to the exact accepted issue/comment. Snapshot lines are quoted below. `UNMET — review/observation absent` means there is no sufficiently specific established check in this index; it is not waived. Each mapped row names one exact catalogue check and uses that check’s recorded status. Related candidates that do not assert the whole clause are explicitly UNMET. They must not inherit PASS when a suite passes. A combined requirement remains UNMET until each part has proof. Review-only rationale and non-claims remain explicit because they constrain the acceptance wording.

### K: [contract-6373122896.md](https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6373122896)

| Clause ID | Required sentence / table entry | Named evidence | Status |
|---|---|---|---|
| K-L049-01 | Encode the password as UTF-8, without trimming, case conversion or Unicode normalization. | K05 | PASS |
| K-L049-02 | Reject empty input, unpaired UTF-16 surrogates, and passwords longer than 1,024 UTF-8 bytes before derivation. | R10 asserts rejection of undefined/empty, lone high/low surrogate, 1025 ASCII and 513 two-byte characters; R11 asserts acceptance at exactly 1024 bytes. Neither directly counts Argon invocations for invalid input. | UNMET for before-derivation observation; R10/R11 passed |
| K-L049-03 | This preserves the exact password but means visually identical Unicode spellings can differ | K05 | PASS |
| K-L049-04 | the byte limit bounds input handling and must be explained rather than silently truncating. | R10 tests rejection, not the explanation presented in both apps. | UNMET; user-facing limit explanation not established |
| K-L051-01 | For each new encoding attempt, generate a fresh 16-byte KDF salt and a fresh 12-byte AES-GCM nonce using the platform CSPRNG. | E05 | PASS |
| K-L051-02 | Retrying encryption starts a new attempt with new randomness. | Related only: E05 K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L051-03 | Public salt is not secret key material. | Related only: E05 K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L051-04 | Derive a raw 32-byte root with the selected KDF | K01 | PASS |
| K-L051-05 | do not store a password-hash verification string or encrypt/store the root in the image. | Related only: E05 K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L053-01 | Proposed exact child-key contract: HKDF-SHA256 extract-and-expand, input key material = raw root, HKDF salt = 32 zero bytes, output = 32 bytes per key. | K01 | PASS |
| K-L053-02 | Info is exactly UTF-8 `obscr/keys/1/encryption` or `obscr/keys/1/placement`, without a trailing zero byte. | K01 | PASS |
| K-L053-03 | These labels name this key-schedule version, not the eventual image-format number. | Related only: K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L053-04 | A changed key schedule requires different labels. | Related only: K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L053-05 | The random password salt and the fixed HKDF extraction salt have different roles. | Related only: K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L055-01 | Keep root and child keys private and ephemeral. | Related only: R09 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L055-02 | Clear owned byte buffers when practical, release references and never log or persist them | Related only: R09 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L055-03 | do not claim guaranteed erasure in JavaScript. | Related only: R09 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L055-04 | Retain AES-256-GCM with a 16-byte tag, authenticate canonical meaning-affecting metadata and release no plaintext before authentication. | Related only: R09 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L055-05 | The format ticket owns the exact metadata serialization. | Related only: R09 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L055-06 | HKDF and extra fast hashes do not add password entropy | Related only: R09 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L055-07 | a correct password guess yields the encryption key without a second AES brute-force search. | Related only: R09 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L059-01 | Encrypt zero bytes under the placement key, starting with a 16-byte all-zero counter and incrementing the full counter as a big-endian 128-bit integer. | K02 checks the zero-counter stream; K03 separately checks carry and wrap. | PASS; both observations passed |
| K-L059-02 | Web Crypto uses counter length 128 | Related only: K02 K03 K09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L059-03 | Node must match its bytes. | Related only: K02 K03 K09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L059-04 | Consume the stream continuously across chunks, preserve unused bytes, and never wrap or restart it during sampling. | Related only: K02 K03 K09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L059-05 | A fixed initial counter is permitted here because each new encoding derives a fresh placement key and has only one placement stream. | Related only: K02 K03 K09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L059-06 | Reading the same image intentionally reproduces that stream. | Related only: K02 K03 K09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L061-01 | This uses the AES APIs already needed for GCM and avoids binding placement to the eventual password library. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L061-02 | ChaCha20 is also a viable alternative, particularly with Sodium, but would tie this path to an added primitive. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L061-03 | CTR is only the position generator, not the payload cipher. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L061-04 | Any future filler or additional stream needs its own separately specified key/domain, not reuse of this one. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L065-01 | The carrier supplies one canonical ordered list of eligible positions with bootstrap positions excluded. | Related only: K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L065-02 | Start a conceptual pool containing indices `0..N-1`. | Related only: K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L065-03 | For each requested position with `b` entries remaining, consume the next four stream bytes as an unsigned little-endian integer `x`. | Related only: K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L065-04 | Let `L = floor(2^32 / b) * b`. | Related only: K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L065-05 | Reject `x >= L` | Related only: K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L065-06 | otherwise choose `j = x % b`, emit pool entry `j`, replace it with the last live entry and shrink the pool. | Related only: K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L065-07 | This is unbiased range reduction under uniform input, not a claim that a finite keyed generator reaches every permutation. | Related only: K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L067-01 | Permit this sampler only for `1 <= N <= 2^32` and payload demand no greater than `N` | Related only: K07 K11; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L067-02 | zero-demand operations need no draw. | Related only: K07 K11; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L067-03 | Compute the `2^32` sentinel without 32-bit truncation. | Related only: K07 K11; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L067-04 | A sparse swap representation may emit only the needed prefix, but must produce exactly the same order as the conceptual pool. | Related only: K07 K11; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L067-05 | This avoids an unconditional full-image permutation | Related only: K07 K11; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L067-06 | its peak memory still needs measurement. | Related only: K07 K11; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L069-01 | The eventual approved profile must also set finite image, payload, allocation and total-draw limits, checked before allocation and enforced during processing. | Related only: K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L069-02 | Exhaustion fails | Related only: K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L069-03 | it must never switch to modulo-only sampling. | Related only: K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L069-04 | The mathematical domain above is not permission to allocate a four-billion-entry image. | Related only: K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L069-05 | Carrier ordering, repair and content-adaptive eligibility remain with their existing decisions | Related only: K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L069-06 | this sampler does not by itself select or prove a hiding method. | Related only: K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L073-01 | The decoder may reject unsupported profiles, malformed lengths or excessive resources before password processing. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L073-02 | Salt and profile retrieval must not require a fast password-derived map. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L073-03 | Every password-dependent position or recognition value must instead descend from the expensive root. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L073-04 | Do not add a separate password-check field. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L073-05 | Retire Mersenne Twister, the public SECRET_KEY suffix and obsolete fast-placement callers during the later production migration | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L073-06 | legacy handling remains a separate decision. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L075-01 | The intended cost floor is the selected root calculation, subject to attacker optimizations—not full-image extraction or GCM work for every guess. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L075-02 | An inner header or repair constraint may reject a wrong guess immediately after that root. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L075-03 | GCM authentication still permits offline guessing | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L075-04 | strong generated passwords remain necessary. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L075-05 | Independent placement-key attacks must use the full key rather than a reduced seed. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L075-06 | Salt reuse, reused passwords and the weakest accessible old/new image remain attack considerations. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L077-01 | This is a design argument, not proof that an unfinished format has no shortcut. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L077-02 | The complete-format and release decisions must inspect every earlier recognizer, bootstrap/repair structure and extracted-ciphertext path before accepting that claim. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L081-01 | Record password bytes, salt, KDF profile, root, both child keys, stream prefix, accepted/rejected draws and emitted positions for fixed non-secret inputs. | Related only: K01 K02 K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L081-02 | Compare primitive outputs with an independent implementation or published vectors, then require browser/Node agreement for the composed chain. | Related only: K01 K02 K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L081-03 | Do not use two calls to the same wrapper as independent evidence. | Related only: K01 K02 K06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-01 | Cover Unicode distinctions and rejected input | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-02 | repeated password with changed salt | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-03 | stream chunk boundaries and counter carry | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-04 | forced rejection draws | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-05 | one-element and non-power-of-two pools | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-06 | full-domain uniqueness on small domains | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-07 | bootstrap exclusions | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-08 | limit failures | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-09 | altered metadata | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-10 | wrong passwords | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-11 | and shortened GCM tags. | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-12 | Controlled vectors may use fixed randomness | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-13 | production encoding may not. | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-14 | This costs dedicated interoperability work but prevents two apps from agreeing only on ordinary ASCII or short streams. | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| K-L083-15 | Later real CLI/browser exchange and security review remain mandatory. | Related only: K03 K05 K07 K09 R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |

### P: [contract-6374176664.md](https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6374176664)

| Clause ID | Required sentence / table entry | Named evidence | Status |
|---|---|---|---|
| P-L030-01 | Use **Argon2id v19, memory 65,536 KiB (67,108,864 bytes), time cost 3, parallelism 1, a 16-byte salt, a raw 32-byte root, and empty optional secret and associated data**. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L030-02 | Reserve profile identifier `0x01` for this exact tuple in the new format's profile namespace | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L030-03 | the format decision owns its field location and authenticated serialization. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L030-04 | Do not use library defaults or password-hash strings. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L032-01 | This selects measured candidate `a64t3` as a provisional design, not as a proven phone profile. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L032-02 | Compared with the tested 128-MiB candidates, it leaves more memory for images but charges attackers less memory. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L032-03 | Three passes retain more computation than the tested two-pass option. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L032-04 | Neither comparison establishes equivalent attack strength across algorithms. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L034-01 | Native PBKDF2 would remove the added password library but give up tunable memory hardness. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L034-02 | Shared-library scrypt would avoid WASM but change the construction and runtime costs. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L034-03 | Prefer Argon2id because memory-hard processing remains the accepted direction and the bounded experiment supports this candidate's interoperability. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L034-04 | There is no automatic fallback to either alternative. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L038-01 | Use `libsodium-wrappers-sumo@0.8.4` with `libsodium-sumo@0.8.4` explicitly locked. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L038-02 | Pass the raw accepted password bytes to `crypto_pwhash`, set output length 32, `opslimit=3`, `memlimit=67108864`, and select `crypto_pwhash_ALG_ARGON2ID13` explicitly. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L038-03 | Keep native HKDF and AES APIs as agreed. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L040-01 | This avoids introducing another unmeasured KDF adapter. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L040-02 | Its price is the worker/WASM package, CSP and offline-asset handling, notices and dependency review. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L040-03 | Package upgrades require fresh artifact review and matching vectors | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L040-04 | the profile identifier describes algorithm parameters, not an npm version. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L040-05 | A load, CSP or allocation failure reports an error rather than changing the algorithm or cost. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L042-01 | The existing exact contract still applies: UTF-8 without normalization or trimming | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L042-02 | reject empty input, unpaired surrogates and input above 1,024 UTF-8 bytes. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L042-03 | Each new encoding attempt gets a fresh CSPRNG 16-byte salt and 12-byte GCM nonce. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L042-04 | HKDF-SHA256 uses the raw root, 32 zero salt bytes, and the exact UTF-8 info labels `obscr/keys/1/encryption` and `obscr/keys/1/placement`, without a terminator, for separate 32-byte keys. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L042-05 | AES-256-GCM keeps its 16-byte tag. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L042-06 | Root and child keys stay secret and are never stored in the image. | Related only: K01 K04 K05 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L046-01 | For the next complete-format design and measurements, use these **provisional upper bounds, not demonstrated safe device limits**: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L048-01 | - Width and height each at most 4,096 | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L048-02 | total pixels at most 12,192,768. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L048-03 | This permits the measured photo and its rotation without approving the unmeasured 4096×4096 case. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L049-01 | - Requested positions `k` at most 262,144 and no greater than eligible positions `N`. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L049-02 | This is a position budget, not a promise of message bytes: framing and repair consume capacity too. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L050-01 | - At most `2*k + 1024` 32-bit draws, including rejected draws | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L050-02 | absolute maximum 525,312. | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L050-03 | Exhaustion fails without biased sampling or a restart. | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L051-01 | - Sparse swap state at most `k` entries | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L051-02 | no full `N`-entry permutation. | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L051-03 | Stream chunks at most 4,096 bytes, with at most 8,192 bytes for their paired input/output buffers. | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L051-04 | Preserve unused stream bytes between chunks. | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L052-01 | - At most two application-owned full RGBA8 pixel buffers, together at most 97,542,144 bytes at the pixel ceiling. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L052-02 | This does not count decoder, canvas, GPU, WASM or runtime allocations and is not a whole-process memory limit. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L053-01 | - One active derivation/placement operation per app instance. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L053-02 | Reject unsupported profile IDs and any parameters that disagree with the fixed tuple before running the KDF. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L053-03 | Check dimensions and demands before the corresponding app allocations | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L053-04 | check draw/state limits while processing. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L055-01 | These limits stay within the largest represented pixel and position counts. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L055-02 | Their price is rejecting larger images or payloads even on capable desktops. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L055-03 | They may need to become smaller after device measurements | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L055-04 | they must not grow automatically to make an input work. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L055-05 | JavaScript map entries have no portable byte size, so an entry cap is not a memory measurement. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L057-01 | Retain the agreed AES-256-CTR generator: full 32-byte placement key, all-zero initial 128-bit counter, big-endian counter increment, continuous stream and no wrap. | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L057-02 | Retain four-byte little-endian draws, rejection above `floor(2^32/b)*b - 1`, and swap-with-last selection from the canonical eligible domain. | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L057-03 | The mathematical `N <= 2^32` bound does not override these operational limits. | Related only: K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| P-L059-01 | [Define the complete protected image format](https://github.com/jdragulanescu/obscr/issues/19) must set bounded source-file, decoding, frame, decompression, bootstrap-search and repair work before that design is complete. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L059-02 | It must also define the eligible domain and reserve bootstrap positions. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L059-03 | Those carrier-dependent limits are not supplied by a KDF workspace number or by this sampler contract. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L063-01 | Carry this selected tuple and these provisional ceilings into [Define the evidence required before release](https://github.com/jdragulanescu/obscr/issues/22). | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L063-02 | Require its named physical iPhone/Android and desktop-browser/Node matrix, cold and warm three-second key-ready target, whole-operation memory, responsiveness, cancellation, failure behavior and both real CLI/browser exchange directions. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L063-03 | Record exact devices and versions before their runs | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L063-04 | no unnamed device is declared supported here. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L065-01 | Keep the accepted independent-vector plan: root, both child keys, stream and position traces | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-02 | Unicode boundaries | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-03 | changed salts | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-04 | counter/chunk boundaries | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-05 | rejected draws | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-06 | unique small-domain selections | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-07 | altered metadata | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-08 | wrong passwords | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-09 | and short-tag rejection. | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-10 | The experiment's existing vectors are evidence to reuse, not proof of the unfinished parser or app workflows. | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L065-11 | Complete dependency/notice review and independent review of the final format and implementation remain required. | K01 K02 R03 K04 | UNMET — release/downstream observation absent |
| P-L067-01 | The no-shortcut argument is conditional and explicit: public parsing can check structure and resource limits but cannot check a password. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L067-02 | Every password-dependent position or recognizer must descend from the Argon2id root. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L067-03 | Extracted ciphertext still uses the encryption child of that same root. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L067-04 | An inner header, repair condition or GCM tag may reject a guess just after root derivation | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L067-05 | do not charge every guess the full legitimate decode time. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L067-06 | Salt discovery must not restore a fast password-derived path. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L069-01 | Remove Mersenne Twister, the public `SECRET_KEY` suffix and obsolete fast-placement callers during production migration, under the separate legacy decision. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L069-02 | Inspect the completed bootstrap and repair design before claiming that no cheaper verifier remains. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L069-03 | Full-width keys remove the deliberate 32-bit seed bottleneck | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L069-04 | they do not give a weak password 256 bits of entropy. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L069-05 | Strong suggested passwords still matter, and an old cheaper image can expose a reused password. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L071-01 | This gate costs real-device work and independent review. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L071-02 | Missing access does not waive it. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L071-03 | A failed target returns for an explicit human decision before release | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| P-L071-04 | it never authorizes weaker automatic settings. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |

### C: [contract-6386604139.md](https://github.com/jdragulanescu/obscr/issues/17#issuecomment-6386604139)

| Clause ID | Required sentence / table entry | Named evidence | Status |
|---|---|---|---|
| C-L035-01 | These are proposed original implementation rules, not Stenoxide/HILL code or a validated steganalysis model: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L037-01 | 1. | Related only: E02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L037-02 | Work on the supported opaque RGB/RGBA8 raster without color conversion or resampling. | Related only: E02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L037-03 | For scoring, use `U(p,c) = RGB(p,c) & 254` | Related only: E02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L037-04 | never change alpha or upper channel bits. | Related only: E02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L038-01 | 2. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L038-02 | Use the valid up/down/left/right neighbors of pixel `p`. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L038-03 | Let their count be `d`. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L038-04 | Compute the integer score `S(p) = sum over RGB channels of abs(d * U(p,c) - sum over valid neighbors q of U(q,c))`. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L038-05 | This is a small cross-Laplacian detail measure, not standard HILL. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L038-06 | Its range is 0–3,048 | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L038-07 | no floating-point or edge padding convention is needed. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L039-01 | 3. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L039-02 | Keep at most `floor(pixelCount / 4)` pixels with positive scores, ranked by descending score, then ascending row-major pixel index. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L039-03 | This retains the highest-detail quarter at most | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L039-04 | all-flat images supply no eligible pixels. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L039-05 | The 25% choice is an engineering policy, not a measured safe-hiding threshold. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L039-06 | Use the bounded score histogram and row-major tie resolution rather than a full-image comparison sort. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L040-01 | 4. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L040-02 | Define the eligible scalar domain in row-major pixel/RGB order over retained pixels, excluding every reserved public-salt position. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L040-03 | The eligible map is public, not an additional secret. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L040-04 | Use the accepted full-strength keyed sampler over this domain, with one continuous stream for header then body, distinct positions and the existing bounded-work rules. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L040-05 | Do not sort by detail for message order or mix in another weak seed. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L041-01 | 5. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L041-02 | Group the keyed header positions and then keyed body positions separately into groups of seven. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L041-03 | Number each group's columns 1–7. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L041-04 | The XOR of columns whose current LSB is 1 is the three-bit symbol. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L041-05 | To encode a target symbol, XOR it with the current symbol and flip the one indicated LSB if that difference is nonzero. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L041-06 | Use ordinary LSB replacement so upper bits cannot change. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L041-07 | Extract the three-bit symbols from the encoded groups, never from sender-only information. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L042-01 | 6. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L042-02 | Pack each symbol most-significant-bit first. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L042-03 | Zero-pad only the final incomplete symbol of each header/body bitstream to three bits | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L042-04 | charge that padding to capacity and require canonical padding when extracting. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L042-05 | Exact authenticated byte lengths come from the bounded framing rules. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L042-06 | These keyed final-group bits are not full-image filler. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L042-07 | The public salt stays raw, outside the matrix encoder. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L048-01 | Adopt the integer scoring and stable ranking above. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L048-02 | This gives a concrete adaptive rule without a learned classifier, floating-point drift or STC solver. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L048-03 | It spends an image scan and restricts available positions. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L048-04 | The receiver reproduces it from the upper seven bits | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L048-05 | it does not need the original image. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L048-06 | Local variation is a heuristic, not proof that an image is a suitable photograph or that a message is concealed. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L052-01 | Keep at most 512 stored message bytes after optional size-reducing compression, at most 1 MiB original/decompressed UTF-8 text, opaque noninterlaced RGB/RGBA8 PNG input, at most 1,024 pixels per side/1,048,576 pixels total and 16 MiB source bytes. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L052-02 | Keep the existing cryptographic/parser/worker bounds. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L052-03 | Remove the Stenoxide-specific WASM allocation/build requirements rather than recreate them. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L052-04 | These retained bounds are policy limits, not measured performance or concealment guarantees for our own implementation. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L054-01 | Let `E` be the eligible scalar count after salt exclusions, and `B = min(E, 262144)`. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L054-02 | Retain the conservative stored-bit rate ceiling as an exact integer rule: at most `floor(B / 50)` keyed coded bits. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L054-03 | Do not present that inherited 0.02 ceiling as a validated rate for this new method. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L056-01 | Let `H` and `T` be the complete fixed protected-header and body bit lengths **after** authentication/framing and their respective Reed–Solomon repair, with nonce/profile fields counted once. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L056-02 | Set `G = ceil(H/3) + ceil(T/3)`. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L056-03 | Require both `3*G <= floor(B/50)` and `7*G <= B`. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L056-04 | The reserved raw-salt pool is excluded before calculating `E` | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L056-05 | it consumes its own image positions and does not become free capacity. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L056-06 | Separate header/body final-symbol padding and all final shortened-RS blocks count. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L056-07 | Extract only the needed keyed prefix, within the accepted sampler bounds | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L056-08 | do not generate or alter unused samples. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L058-01 | Show the actual net capacity and reject insufficient input before output. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L058-02 | No truncation, higher rate, weaker repair or automatic resizing. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L058-03 | The old 655-byte STC ceiling is no longer a codec API limit | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L058-04 | any similar arithmetic ceiling comes only from the retained rate/sample policy. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L058-05 | Do not claim that every eligible image admits 512 bytes. | Related only: O03 O05 E01 E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L062-01 | Retain shortened Reed–Solomon with 16 parity bytes per body block, separate 16-byte header parity and whole-byte round-robin across at most four body codewords. | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L062-02 | Retain its licensed existing implementation and final-block rules | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L062-03 | matrix coding follows repair and is removed before attempting repair on extraction. | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L062-04 | Authenticate before decompression or output. | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L062-05 | No decoder retries or alternate modes. | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L064-01 | If upper RGB bits or geometry change, the eligible map can change and desynchronize placement. | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L064-02 | Salt damage can independently prevent key derivation. | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L064-03 | The old STC mild-damage benefit is not evidence of that same benefit here. | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L064-04 | Only unchanged encoded files and sample-preserving PNG rewrites within supported parsing limits are promised | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L064-05 | other changes get authenticated output if recoverable or the agreed failure, never partial text. | Related only: R02 R04 R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L066-01 | This retains limited repair capability at an overhead cost without promising that repair fixes a changed map. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L066-02 | Keeping only direct unprotected transport would be smaller, but would discard the already selected outer repair behavior. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L070-01 | The existing format/app work incorporates bounded PNG-envelope handling, no identifying public marker/text, safe rendering-metadata handling and removal of personal metadata with explicit limits. | Related only: E08 P04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L070-02 | Do not blindly copy ICC/unknown chunks or imply that stripping metadata is invisible. | Related only: E08 P04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L070-03 | No full compressor-fingerprint imitation project or imported JPEG-history detector is added. | Related only: E08 P04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L070-04 | The existing format/app decisions own the precise metadata policy. | Related only: E08 P04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| C-L072-01 | Keep fresh random salt/nonce, separate strong keys, common authentication-failure meaning and input/decompression limits. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L072-02 | Do not copy Stenoxide's image-derived nonce design or other unrelated features. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L072-03 | Recommend unpublished detailed photographs | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L072-04 | warn against publishing originals or comparing repeated covers. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L072-05 | Preserve the exported file and an untouched backup. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L072-06 | Existing implementation/release checks must exercise our actual carrier | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L072-07 | no new detector programme is required. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |

### F: [contract-6387228703.md](https://github.com/jdragulanescu/obscr/issues/19#issuecomment-6387228703)

| Clause ID | Required sentence / table entry | Named evidence | Status |
|---|---|---|---|
| F-L033-01 | Let `P = width * height`, and index RGB scalars as `q = 3 * (y * width + x) + c`, with `c = 0,1,2` for R,G,B. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L033-02 | Alpha is never a carrier. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L033-03 | Require `3P >= 128`, in addition to the full capacity check. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L035-01 | For salt bit `i = 0..127`, reserve scalar `q_i = floor(i * 3P / 128)`. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L035-02 | Put bit `7 - (i mod 8)` of salt byte `floor(i/8)` in that scalar's LSB. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L035-03 | These 128 positions are distinct. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L035-04 | Reserve only those positions, whether or not their pixels qualify for the detail region. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L035-05 | There is no larger unused bootstrap pool, salt checksum, repetition, repair, magic or scan. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L035-06 | Read exactly one 16-byte salt at exactly this layout. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L037-01 | The decoder is configured for this single format generation and Argon2id profile `0x01` before reading any hidden bytes. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L037-02 | All profile parameters come from code, never from an untrusted image field. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L037-03 | Check that the implementation supports this fixed configuration before starting. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L037-04 | An image carries its profile identifier only inside the fixed keyed header. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L037-05 | Check it after derivation | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L037-06 | it cannot select another KDF or trigger a retry. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L039-01 | This explicitly narrows the earlier requirement to reject image-supplied profile IDs before the KDF. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L039-02 | No such public field exists here. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L039-03 | A future format, old image or plain image may consume one current-profile derivation and then return the common failure. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L039-04 | This effort adds no automatic format negotiation. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L039-05 | A later format change needs its own explicit routing decision. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L043-01 | Use the accepted detail score and ranking exactly: compute from `RGB & 254` | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L043-02 | retain at most `floor(P/4)` positive-score pixels, with descending score and row-major ties. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L043-03 | Enumerate their RGB scalars in row-major/RGB order and remove the 128 salt positions where present. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L043-04 | This gives `E` eligible scalars. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L043-05 | Do not truncate that domain to the position budget | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L043-06 | the sampler draws across all `E`. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L043-07 | Set `B = min(E,262144)` only for budget calculations. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-01 | Run the accepted full-key sampler once. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-02 | The first **896 positions** form 128 seven-sample groups and carry the fixed **48-byte repaired header**. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-03 | The body starts at the next sampler position, with no restart, duplicate, sorting or gap. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-04 | Its groups are separate from the header groups. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-05 | A byte's bits and each three-bit symbol are most-significant-bit first. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-06 | Zero-pad the last body symbol if needed and reject nonzero extracted padding | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-07 | no padding is needed for the 48-byte header. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-08 | Padding damage can therefore cause failure even if byte repair could otherwise succeed | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L045-09 | this follows the accepted canonical-padding rule. | Related only: E01 O04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L047-01 | The fixed header is not separately encrypted. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L047-02 | It is stored at secret keyed positions, repaired, and later authenticated as GCM additional data. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L047-03 | It has no integrity status merely because repair or field checks passed. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L047-04 | Its length fields can authorize only the bounded read described below, never decompression or output. | Related only: R08 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L051-01 | All multibyte integers in this header and in GCM additional data are unsigned **big-endian**. | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L051-02 | Header offsets are zero-based. | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L051-03 | There are exactly 32 header data bytes: | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L053-01 | &#124; Offset &#124; Bytes &#124; Meaning and accepted value &#124; | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L055-01 | &#124; 0–11 &#124; 12 &#124; Fresh CSPRNG AES-GCM nonce &#124; | E01 checks fixed-reference placement; E05 checks fresh randomness in separate encodes. | PASS; both observations passed |
| F-L056-01 | &#124; 12–15 &#124; 4 &#124; Stored message length `S`, 0–512 bytes &#124; | E01 | PASS |
| F-L057-01 | &#124; 16–19 &#124; 4 &#124; Original UTF-8 length `L`, 0–1,048,576 bytes &#124; | E01 checks raw lengths through 512, not the full original-length boundary; O03 prepares 1 MiB but does not recover a 1 MiB frame. | UNMET for the complete original-length boundary |
| F-L058-01 | &#124; 20 &#124; 1 &#124; Body parity bytes: `0x10` &#124; | E01 | PASS |
| F-L059-01 | &#124; 21 &#124; 1 &#124; Whole-byte round-robin interleave: `0x01` &#124; | E01 | PASS |
| F-L060-01 | &#124; 22 &#124; 1 &#124; Compression: `0x00` raw UTF-8; `0x01` gzip &#124; | E01 E09 | PASS |
| F-L061-01 | &#124; 23 &#124; 1 &#124; New binary format version: `0x01` &#124; | E01 | PASS |
| F-L062-01 | &#124; 24 &#124; 1 &#124; Argon2id profile: `0x01` &#124; | E01 | PASS |
| F-L063-01 | &#124; 25 &#124; 1 &#124; Credential mode: `0x01`, one password &#124; | E01 | PASS |
| F-L064-01 | &#124; 26 &#124; 1 &#124; Accepted adaptive matrix carrier: `0x01` &#124; | E01 | PASS |
| F-L065-01 | &#124; 27–31 &#124; 5 &#124; Reserved, all zero &#124; | E01 | PASS |
| F-L067-01 | For raw text require `L = S`. | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L067-02 | For gzip require `0 < S < L`. | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L067-03 | Empty text has only the raw representation | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L067-04 | accepting an empty wire message does not require the app forms to offer empty-message creation. | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L067-05 | Reject every unsupported value, nonzero reserved byte or inconsistent length, without another mode or interpretation. | Related only: R02 R03 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L069-01 | Keep the accepted exact password bytes, Argon2id tuple and HKDF labels unchanged. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L069-02 | Encrypt the `S` stored bytes once with the accepted encryption child key and the header nonce, using AES-256-GCM with **exactly 16 tag bytes**. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L069-03 | The AEAD body before repair is `ciphertext[S] &#124;&#124; tag[16]`. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L069-04 | The nonce occurs only in the header. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L069-05 | Fresh encoding attempts get both a fresh 16-byte salt and a fresh 12-byte nonce | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L069-06 | controlled vectors are the only exception. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L071-01 | The exact 56-byte GCM additional data is: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L073-01 | `rawSalt[16] &#124;&#124; headerData[32] &#124;&#124; width_u32be[4] &#124;&#124; height_u32be[4]`. | K04 | PASS |
| F-L075-01 | This authenticates the salt, nonce, both lengths, all settings, version, reserved bytes and geometry. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L075-02 | Header/body partition, salt coordinates, scoring, sampler, matrix rule and RS parameters are fixed by this format/profile, not independently selectable fields. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L075-03 | Do not store root or child keys. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L075-04 | No second encryption or nonce domain is needed. | Related only: K04 E05 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L077-01 | PNG file bytes, unrelated RGB values, color type, alpha representation and rendering metadata are not GCM additional data. | Related only: R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L077-02 | The guarantee authenticates the recovered message and decoding settings, not the entire cover image or its appearance. | Related only: R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L077-03 | RGB and opaque RGBA encodings of the same samples can interoperate. | Related only: R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L077-04 | PNG rewrites that preserve RGB samples and geometry remain readable if they pass the supported envelope policy. | Related only: R06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L081-01 | Retain the pinned licensed ZXing-derived implementation and notices. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L081-02 | The wire code is systematic shortened RS over `GF(256)`, primitive polynomial `0x11d`, primitive element `0x02`, generator base zero, 16 parity bytes. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L081-03 | Equivalently, the generator has roots `alpha^0` through `alpha^15` | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L081-04 | data is highest-coefficient first and parity follows data. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L081-05 | Shorten by omitting leading zero data symbols | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L081-06 | transmit no zero fill. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L083-01 | Encode the 32 header bytes as one 48-byte codeword. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L083-02 | For the body, split `S+16` bytes into consecutive data blocks of at most **239** bytes. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L083-03 | Append 16 parity bytes to every block, including the last short block. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L083-04 | Do not append an empty block when the length is an exact multiple of 239. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L083-05 | Under the current limit there are one to three body codewords, within the accepted maximum of four. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L085-01 | Interleave body codewords by column: output byte 0 of each codeword in order, then byte 1 of each, continuing through column 254 and skipping a codeword once it is exhausted. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L085-02 | Do not pad a short codeword. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L085-03 | Do not interleave the separate header with the body. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L085-04 | The decoder calculates these exact block lengths, reverses interleaving, and attempts each codeword once. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L085-05 | Use bounded unknown-error correction, no erasure search or retries | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L085-06 | reject a reported correction count above eight or a nonzero residual syndrome. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L085-07 | A codeword can miscorrect beyond its radius, so only GCM establishes acceptance. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L087-01 | Let `C = S + 16`, `r = ceil(C/239)`, `D = C + 16r` repaired body bytes, and `G = 128 + ceil(8D/3)` matrix groups. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L087-02 | Require both accepted inequalities: | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L089-01 | - `3G <= floor(B/50)`; | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L090-01 | - `7G <= B`. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L092-01 | The 128 raw salt samples are excluded before `E` and are accounted for separately. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L092-02 | The 48-byte header includes its nonce and 16 parity bytes. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L092-03 | Body sizes include the full GCM tag and every parity byte. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L092-04 | Matrix symbol padding also counts. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L092-05 | Compute net capacity as the largest `S` in 0–512 satisfying both inequalities | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L092-06 | distinguish no frame capacity from an empty-message-only capacity. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L092-07 | Reject before modifying/exporting the output if the selected stored message does not fit. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L094-01 | &#124; Stored bytes &#124; Body codeword sizes &#124; Keyed coded bits, including symbol padding &#124; Keyed positions &#124; Minimum `B` &#124; | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L096-01 | &#124; 0 &#124; 32 &#124; 642 &#124; 1,498 &#124; 32,100 &#124; | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L097-01 | &#124; 223 &#124; 255 &#124; 2,424 &#124; 5,656 &#124; 121,200 &#124; | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L098-01 | &#124; 224 &#124; 255, 17 &#124; 2,562 &#124; 5,978 &#124; 128,100 &#124; | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L099-01 | &#124; 462 &#124; 255, 255 &#124; 4,464 &#124; 10,416 &#124; 223,200 &#124; | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L100-01 | &#124; 463 &#124; 255, 255, 17 &#124; 4,602 &#124; 10,738 &#124; 230,100 &#124; | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L101-01 | &#124; 512 &#124; 255, 255, 66 &#124; 4,992 &#124; 11,648 &#124; 249,600 &#124; | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L103-01 | At maximum payload there are 624 keyed coded bytes before matrix packing, plus the separate 16-byte raw salt. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L103-02 | The retained rate ceiling permits 512 stored bytes only when the actual eligible domain is large enough. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L103-03 | It does not promise that every admitted-size PNG has that capacity or that this rate is concealed. | Related only: R02 R04 E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L107-01 | The sender rejects unpaired UTF-16 surrogates rather than substituting replacement characters, encodes exact UTF-8 without normalization, and bounds the original bytes by 1 MiB. | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L107-02 | The receiver uses fatal UTF-8 validation and preserves a leading UTF-8 BOM as U+FEFF rather than silently removing it. | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L107-03 | No line-ending or text normalization is permitted. | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L109-01 | Retain gzip, already used by both apps. | Related only: O06 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L109-02 | Use it only when requested and strictly smaller than the raw UTF-8 bytes | Related only: O06 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L109-03 | otherwise store raw bytes if those fit. | Related only: O06 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L109-04 | An unavailable/failed compressor is an explicit operation error, not that size comparison. | Related only: O06 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L109-05 | Reject when neither permitted representation fits. | Related only: O06 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L109-06 | Bound compression output while producing it | Related only: O06 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L109-07 | a size-bound abort may select raw only when raw fits. | Related only: O06 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L109-08 | Never encode a partial compressed stream. | Related only: O06 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L111-01 | For interoperability, use one gzip member with fixed header bytes `1f8b08000000000000ff`: DEFLATE, no flags or optional fields, zero time, XFL zero, OS unspecified. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L111-02 | Its trailer uses standard gzip CRC32 and original-length fields, **little-endian as required by gzip**. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L111-03 | Compressor DEFLATE choices may differ | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L111-04 | compressed bytes need not be identical across implementations. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L111-05 | The decoder requires that exact header, a valid CRC/length trailer, one completed member and no trailing bytes or second member. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L111-06 | It must use a bounded decoder that reports complete input consumption. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L111-07 | After GCM succeeds, bound expansion by authenticated `L` and 1 MiB, then require exactly `L` bytes and valid UTF-8. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L111-08 | A final length comparison after unbounded expansion is not sufficient. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L113-01 | Operational ceilings are policy, not measured device support: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L115-01 | - Source and exported PNG: at most 16 MiB each. | Related only: O03 P03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L115-02 | Width and height: 1–1,024 each | Related only: O03 P03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L115-03 | pixels at most 1,048,576. | Related only: O03 P03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L116-01 | - At most two application-owned full RGBA8 buffers, together at most 8,388,608 bytes. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L116-02 | No duplicate canvas raster for codec input. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L116-03 | Preview decoding is separate from raw-sample processing. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L117-01 | - PNG filtered-raster inflation must produce exactly `(width * channels + 1) * height` bytes, at most 4,195,328 | Related only: P02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L117-02 | check the ceiling while inflating. | Related only: P02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L117-03 | At most one such filtered-raster buffer, or bounded row buffers instead. | Related only: P02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L117-04 | Reject extra compressed streams, trailing compressed bytes, an early end or excess output. | Related only: P02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L118-01 | - Score storage at most one `Uint16` value per pixel (2 MiB), histogram 3,049 counters, eligible indices at most 786,432 `Uint32` values (3 MiB). | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L118-02 | A lower-allocation equivalent is allowed. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L118-03 | This is an eligible-domain representation, not a full shuffled permutation. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L118-04 | Keep the accepted sparse sampler, at most `k` swap entries, 4,096-byte stream chunks and at most 8,192 paired stream-buffer bytes. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L119-01 | - Header extraction is fixed at 896 positions. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L119-02 | Before accepting header lengths, enforce the prefix draw ceiling `2*896+1024 = 2816`. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L119-03 | After bounded header parsing, enforce `2*k+1024` cumulatively for the exact total requested `k` | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L119-04 | no reset of the draw counter. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L119-05 | This frame needs at most 11,648 positions and 24,320 draws. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L119-06 | The earlier absolute ceilings remain, but cannot authorize a larger frame. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L120-01 | - One salt read, one KDF, one placement stream, one header repair attempt, at most three body repair attempts, and one GCM verification. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L120-02 | Maximum AEAD body 528 bytes | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L120-03 | repaired body 576 bytes | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L120-04 | total keyed repaired frame 624 bytes. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L120-05 | Repair arrays never exceed 255 symbols per codeword. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L120-06 | Check all sizes before their allocations. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L121-01 | - At most one active operation per app instance. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L121-02 | Expensive work runs in a cancellable worker | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L121-03 | cancellation stops it and discards all partial results. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L121-04 | Bounds and cancellation do not constitute a measured wall-clock or whole-process memory guarantee. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L121-05 | KDF/WASM, library, browser, GPU and runtime memory still need the existing device checks. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L137-01 | The only decode route is: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L139-01 | 1. | Related only: E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L139-02 | Validate password input and the bounded PNG envelope | Related only: E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L139-03 | obtain the raw raster. | Related only: E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L139-04 | Reproduce eligibility and reject an image too small even for the minimum frame. | Related only: E06; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L140-01 | 2. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L140-02 | Read the raw salt once | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L140-03 | derive the fixed Argon2id root and accepted encryption/placement keys once. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L141-01 | 3. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L141-02 | Generate the fixed header prefix, matrix-extract 48 bytes, repair once, and check fixed fields and bounded lengths. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L141-03 | These are still untrusted values. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L141-04 | An unsupported field is a rejection, never a routing instruction. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L142-01 | 4. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L142-02 | Compute exact body/repair/group sizes and enforce both capacity inequalities before further reads or allocations. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L142-03 | Continue the same sampler and enforce cumulative budgets. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L143-01 | 5. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L143-02 | Matrix-extract exactly the body bytes and canonical final padding | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L143-03 | reverse interleaving and repair each body codeword once. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L143-04 | Require exactly `S+16` bytes, split exactly 16 bytes as the tag, and verify GCM with the exact AAD. | Related only: R02 R03 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L144-01 | 6. | Related only: R01 R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L144-02 | Only after authentication, decompress if indicated, require the exact original byte length and fatal UTF-8 decoding, then release text. | Related only: R01 R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L144-03 | Native decrypt-update output stays private until final authentication | Related only: R01 R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L144-04 | no preview, log or partial save sees it. | Related only: R01 R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-01 | Public PNG/geometry/capacity checks and the raw salt reveal no test of the supplied password. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-02 | The salt has no recognition or repair redundancy. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-03 | Header RS syndromes, fixed fields, lengths, matrix padding, body RS and the GCM tag can reject a password guess, but each requires positions derived from the expensive Argon2id root. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-04 | An attacker can stop at the earliest such rejection | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-05 | do not charge each guess the full legitimate decode cost. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-06 | Direct searches over the placement/encryption keys remain full-width key attacks, not reduced-seed paths. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-07 | Extraction of the entire frame does not remove password-based confidentiality. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-08 | Weak or reused passwords remain weak | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L146-09 | no claim of 256 bits of password entropy follows. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L148-01 | No public format marker is introduced, but fixed salt writes, adaptive selection, repair relationships, metadata changes and PNG encoding can still contribute to detection. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L148-02 | This is an argument about routing and recognizers, not proof of concealment or an independent security review. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L150-01 | Before hidden decoding, missing/invalid password input, unsupported PNGs, resource failures and explicit cancellation can have specific guidance. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L150-02 | After hidden decoding starts, salt/keyed-header/repair/padding/tag failures use the accepted common meaning: | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L152-01 | > Could not recover an authenticated message. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L152-02 | The password may be wrong, or the image may be damaged or changed. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L154-01 | Do not identify an unknown hidden profile or plain/legacy image from unauthenticated header bytes. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L154-02 | Authenticated but invalid text/compression also produces no text. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L154-03 | Do not expose internal recognizer-stage diagnostics to users or log secrets. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L154-04 | There is no compatibility fallback, second password, alternate carrier, repair downgrade, retry or recovery promise for changed salt, geometry or upper bits. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L158-01 | The following is a **framing-only test vector**, not an Argon2id vector. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L158-02 | Supply the stated encryption key directly. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L158-03 | Fixed salt/nonce/key values are forbidden in real encoding. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L161-01 | UTF-8 message: Hi | K04 | PASS |
| F-L162-01 | width = height = 1024 | K04 | PASS |
| F-L163-01 | key = 000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f | K04 | PASS |
| F-L164-01 | salt = 000102030405060708090a0b0c0d0e0f | K04 | PASS |
| F-L165-01 | header = a0a1a2a3a4a5a6a7a8a9aaab0000000200000002100100010101010000000000 | K04 | PASS |
| F-L166-01 | AAD = 000102030405060708090a0b0c0d0e0fa0a1a2a3a4a5a6a7a8a9aaab00000002000000021001000101010100000000000000040000000400 | K04 | PASS |
| F-L167-01 | plaintext = 4869 | K04 | PASS |
| F-L168-01 | ciphertext &#124;&#124; tag = ae718862b4a46f027f90688844858e705203 | K04 | PASS |
| F-L171-01 | The header becomes one 48-byte RS codeword. | Related only: E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L171-02 | The 18-byte AEAD body becomes one 34-byte codeword. | Related only: E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L171-03 | Its 272 bits need 91 body groups and one zero padding bit | Related only: E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L171-04 | with 128 header groups this is 219 groups, 657 charged bits and 1,533 keyed positions. | Related only: E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L171-05 | Salt positions are separately reserved | Related only: E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L171-06 | no complete PNG fixture is claimed by this vector. | Related only: E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L173-01 | The later specification must retain the accepted independent root/key/stream/position vectors and add complete-format fixtures with salt exclusions, eligibility ties, final-symbol padding, all shortened-block transitions and exact PNG/sample handling. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L173-02 | Required integrated checks still include both real browser/CLI exchange directions, Unicode/BOM, compression limits and malformed streams, altered authenticated fields, full-tag enforcement, plain/old/wrong-password images, resource/cancellation behavior, existing bounded detection and damage checks, named physical devices, dependency/license review and independent review of the finished format and implementation. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L173-03 | This agreement supplies the design | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L173-04 | none of those release checks is marked passed by this framing exercise. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L173-05 | No new corpus, detector training or confirmation study is required. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L179-01 | Use 128 fixed, spread-out raw salt positions and put profile IDs in the keyed header. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L179-02 | This avoids a public profile marker and any salt search. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L179-03 | The price is one derivation even for many plain, old or unsupported hidden images, and unrecoverable salt damage. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L179-04 | Explicitly narrow the earlier pre-KDF image-profile check as stated in the contract. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L179-05 | A public selector would allow earlier dispatch but add recognizable structure. | Related only: R08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L183-01 | Reuse the pilot's clear 32-byte header at keyed positions and one GCM tag, with the exact fields and AAD above. | Related only: R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L183-02 | This avoids another encryption/key/nonce scheme and keeps the frame small. | Related only: R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L183-03 | The price is that header lengths remain untrusted until final authentication | Related only: R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L183-04 | they may authorize only tightly bounded extraction. | Related only: R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L183-05 | Separate header authentication would reject bad metadata earlier but consume additional bytes and protocol machinery. | Related only: R03 K04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L187-01 | The contract fixes shortened blocks, interleaving and matrix boundaries without changing the carrier. | Related only: E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L187-02 | The largest stored message uses 11,648 keyed positions and needs at least 249,600 eligible-budget samples. | Related only: E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L187-03 | Its price is limited net capacity and no repair guarantee when salt or placement changes | Related only: E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L187-04 | raising the rate or weakening repair is not an automatic option. | Related only: E01 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L191-01 | Keep the existing compression family, authenticate before expansion, preserve the exact text and reject extra members, trailing data and excess output. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L191-02 | This needs a bounded shared parsing contract rather than each platform's permissive defaults. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L191-03 | Raw-only text would be simpler but would discard the accepted optional-compression route. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| F-L199-01 | Use the single bounded decode path and common failure, without retry or legacy fallback. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L199-02 | Every password-dependent recognizer follows Argon2id, but the earliest one can end an attacker's guess. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L199-03 | The cost is limited error diagnosis and the existing device/interoperability/security work before release | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L199-04 | this draft supplies no concealment or damage-survival guarantee. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |

### A: [contract-6387616398.md](https://github.com/jdragulanescu/obscr/issues/21#issuecomment-6387616398)

| Clause ID | Required sentence / table entry | Named evidence | Status |
|---|---|---|---|
| A-L034-01 | Create `lib/protected-image.js` as the shared orchestration module. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L034-02 | Retain `lib/steg-core.js` as its carrier implementation | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L034-03 | retain the Node/browser adapter locations for real platform differences. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L034-04 | This concentrates security decisions, at the cost of migrating both callers together. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L034-05 | Keeping two full implementations would reduce immediate restructuring but retain drift risk. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L036-01 | The application-facing interface is asynchronous and worker-backed: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L038-01 | &#124; Operation &#124; Input and result &#124; | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L040-01 | &#124; `prepareEncode({ pngBytes, message, compress }, control)` &#124; Validates bounded PNG/text inputs and prepares the selected raw/gzip bytes. Returns an opaque preparation handle and `{ originalBytes, storedBytes, compressionUsed, maxStoredBytes, hasFrameCapacity, fits, metadataNotice }`. Runs no KDF and consumes no salt or nonce. &#124; | Related only: O01 O03 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L041-01 | &#124; `encode({ preparation, password }, control)` &#124; Consumes the current preparation, validates the password, performs one fresh encode and returns complete PNG bytes plus its capacity summary. Does not write a file or download anything. &#124; | Related only: E04 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L042-01 | &#124; `decode({ pngBytes, password }, control)` &#124; Applies the complete accepted decode contract and returns exact authenticated text, or a safe typed failure. Never returns intermediate plaintext or a partially recovered result. &#124; | Related only: R01 R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L043-01 | &#124; `discard(preparation)` &#124; Releases an unused preparation when its inputs change, the user clears the form or the worker closes. &#124; | Related only: O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L045-01 | `control` carries cancellation and safe progress events, not algorithm/profile overrides. | Related only: O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L045-02 | A preparation is worker-owned, single-use, tied to exact input bytes/text/compression, and limited to one per app instance. | Related only: O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L045-03 | Replacing it releases the old one. | Related only: O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L045-04 | Transfer owned buffers where possible | Related only: O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L045-05 | do not retain another raster or recompress the same prepared text at encode time. | Related only: O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L045-06 | Public file-size limits are checked before reading the entire source into memory, and the shared module enforces its own bounds too. | Related only: O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L045-07 | Preparing and encoding do not overlap. | Related only: O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L047-01 | Platform adapters supply bounded file reads/writes, browser downloads, worker lifecycle, CSPRNG and the agreed native crypto interfaces. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L047-02 | The fixed Sodium implementation and format rules stay common. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L047-03 | PNG admission/metadata, framing, UTF-8, gzip validation, capacity, repair, key/profile settings and safe failure mapping must not be implemented again in either form or command handler. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L047-04 | Low-level compression implementations may differ only within the accepted contract | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L047-05 | their outputs need not be byte-identical. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-01 | The later migration switches the CLI, browser forms and capacity display together. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-02 | Strip framing/compression policy out of the two crypto adapters | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-03 | remove obsolete exports/callers, dummy-password estimates, `SECRET_KEY`, Mersenne Twister placement, filler and its switch. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-04 | Keep no legacy decoder or compatibility alias. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-05 | Bring the image-diff flow under the same bounded PNG admission policy | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-06 | run it separately from a protected-image operation and label it a visual comparison, not a security or recovery test. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-07 | Retain necessary licensed crypto/repair implementations and notices, without adding Stenoxide or a full STC solver. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-08 | Update README, the next changelog entry, examples and obsolete format tests with the new contract | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L049-09 | historical changelog entries remain historical. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L079-01 | Both apps show `storedBytes / maxStoredBytes`, original UTF-8 bytes, and whether compression was actually used. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L079-02 | Capacity includes every accepted header, tag, repair and symbol-padding cost | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L079-03 | use the format's exact calculation, not RGB bit count or a dummy encryption. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L079-04 | Distinguish an image with no complete-frame capacity from one that admits only an empty wire message. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L079-05 | The creation form admits neither case for a nonempty message. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L081-01 | Compression stays opt-in. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L081-02 | Use the prepared representation only when the accepted rules permit it and it is smaller. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L081-03 | Show raw fallback when compression does not save space | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L081-04 | compressor errors remain errors. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L081-05 | Do not promise “50–90% reduction.” Cap stored text at 512 bytes, original text at 1 MiB, PNG source/output at 16 MiB, and dimensions at 1,024 per side, subject to all stricter format checks. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L081-06 | A detailed image can still have insufficient net capacity. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L081-07 | If it does not fit, suggest a shorter message, optional compression, or a different supported detailed PNG—not an automatic resize, higher rate or weaker repair. | Related only: U01 O05 O07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L083-01 | Before encoding, disclose: only the accepted opaque, noninterlaced RGB/RGBA8 PNG profile is supported | Related only: U01 E08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L083-02 | personal metadata is removed | Related only: U01 E08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L083-03 | only approved rendering metadata is preserved | Related only: U01 E08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L083-04 | some otherwise valid PNGs will be rejected. | Related only: U01 E08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L083-05 | Report preparation errors instead of leaving a capacity spinner running. | Related only: U01 E08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L083-06 | Invalidate stale preparation/results when an input changes. | Related only: U01 E08; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L085-01 | Use common typed outcomes for invalid input, unsupported PNG, input/resource limit, insufficient capacity, unavailable runtime, cancellation, I/O and failed recovery. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L085-02 | Input/public-envelope problems and local runtime failures can give specific, safe guidance. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L085-03 | Hidden profile/header/repair/padding/tag failures and invalid recovered text/compression all return no text and the settled message: | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L087-01 | > Could not recover an authenticated message. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L087-02 | The password may be wrong, or the image may be damaged or changed. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L089-01 | Do not label unauthenticated hidden bytes “unsupported format,” identify an old/plain image, or expose which recognizer failed. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L089-02 | General help explains that old images and plain images can produce the same failure. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L089-03 | State prominently that the new format cannot read old images, with no legacy option, migration tool or old-release recovery journey. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L089-04 | These restrictions reduce diagnostic detail but preserve the agreed failure meaning and clean format break. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L093-01 | Use shared progress phases: checking inputs, preparing text/capacity, deriving keys, encoding or recovering, and preparing the result. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L093-02 | Recovery uses one broad stage rather than exposing header/repair/tag success. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L093-03 | Show a spinner and phase, not invented percentages, crack times or a promised completion time. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L093-04 | CLI hides the spinner outside a TTY. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L095-01 | All expensive preparation and encode/decode work runs in a Web Worker or Node worker thread, with one active operation per app instance and all accepted allocation/work bounds. | Related only: O08 O10 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L095-02 | Browser Cancel and CLI Ctrl-C terminate the operation, discard partial results and suppress late worker responses | Related only: O08 O10 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L095-03 | cancellation is not an authentication failure. | Related only: O08 O10 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L095-04 | The next action starts with a fresh worker state. | Related only: O08 O10 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L095-05 | A changed input cancels obsolete capacity work | Related only: O08 O10 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L095-06 | it must not silently cancel or restart an encode using a different password. | Related only: O08 O10 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L097-01 | If required crypto, secure randomness, workers, WASM, CSP permissions or allocation are unavailable, explain that this runtime cannot complete the operation and suggest a release-supported browser or local CLI. | Related only: O09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L097-02 | Do not switch KDFs, reduce costs, retry profiles or run an uncancellable main-thread fallback. | Related only: O09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L097-03 | Do not add an arbitrary wall-clock timeout: retain user cancellation and the accepted work ceilings. | Related only: O09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L097-04 | The three-second key-ready target remains a release measurement, not a timer that changes security settings. | Related only: O09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L097-05 | This costs worker lifecycle work | Related only: O09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L097-06 | named-device support and complete-process memory remain unproved until the existing release checks pass. | Related only: O09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| A-L113-01 | The later browser/CLI acceptance walkthroughs must exercise this contract: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L115-01 | &#124; Scenario &#124; Required observation &#124; | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L117-01 | &#124; CLI encode → browser decode, and browser encode → CLI decode &#124; Exact authenticated text in both directions, raw and compressed; unchanged and supported sample-preserving PNGs. No requirement for byte-identical encoder output. &#124; | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L118-01 | &#124; Text and password edges &#124; Unicode, composed/decomposed distinctions, leading BOM, CRLF/trailing newlines, spaces, custom confirmation mismatch, invalid surrogates/UTF-8, empty creation rejection and successful empty-wire decoding; exact file/stdout bytes. &#124; | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L119-01 | &#124; Passphrase choices &#124; Six words selected by the common unbiased generator; repeats allowed; explicit regenerate and retained-secret acknowledgement; custom warning without rejection; no generated-strength claim after edits; no RNG fallback. &#124; | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L120-01 | &#124; Capacity and PNG handling &#124; Both apps agree on net capacity and all shortened-block transitions; no-frame/empty-only cases, compressed/raw fallback and size-bound failures; supported rendering metadata retained, personal metadata stripped, unsupported color/alpha/chunks rejected without conversion. &#124; | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L121-01 | &#124; Hostile or incompatible images &#124; Wrong password, plain/old image, changed authenticated fields, shortened tags, damage, malformed/bomb/trailing gzip and invalid recovered text produce no partial plaintext; hidden failures use the common meaning. Public limits remain specifically reportable. &#124; | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L122-01 | &#124; Runtime and cancellation &#124; Worker/WASM/CSP/allocation failures, operation cancellation during preparation/derivation/recovery, input changes and late results leave no output or stale success; no profile fallback or retry. Device cost is measured on the separate release matrix. &#124; | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L123-01 | &#124; Output and secret handling &#124; Existing/source files and aliases remain unchanged; failed/cancelled work publishes nothing; stdout is exact and diagnostics stay on stderr; no secrets in URLs, logs or persistent storage; visible terminal/browser text cannot execute control sequences/HTML. &#124; | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L124-01 | &#124; Offline and update behavior &#124; Reload and complete both directions with networking disabled after full installation; missing assets fail clearly; a staged update cannot mix versions or replace active work; inspect app network traffic and caches for secret leakage. &#124; | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L126-01 | These are future acceptance scenarios, not results of this session. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L126-02 | They feed [Define the evidence required before release](https://github.com/jdragulanescu/obscr/issues/22), including its independent review, dependency/license review, physical-device checks and existing bounded attack/recovery checks. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L126-03 | No new detector programme, legacy support or production work is authorized. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |
| A-L126-04 | No glossary or ADR text is proposed: the ticket holds the application decision without duplicating settled domain terms or format decisions. | Separate release/product scenario; no feature-test substitution | UNMET — release/downstream observation absent |

### S: [spec-46.md](https://github.com/jdragulanescu/obscr/issues/46)

| Clause ID | Required sentence / table entry | Named evidence | Status |
|---|---|---|---|
| S-L022-01 | 1. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L022-02 | As an app user, I want text encoded in either app to recover exactly in the other, so that one authenticated format works across both products. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L023-01 | 2. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L023-02 | As an app user, I want exact stored-byte capacity before password derivation, so that an impossible message is refused without an expensive guess or hidden overhead. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L024-01 | 3. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L024-02 | As an app user, I want failure and cancellation to produce no partial output or stale result, so that the app never silently weakens or retries processing. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L025-01 | 4. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L025-02 | As a maintainer, I want both callers and tests to move together to the new format, so that obsolete placement, filler and compatibility paths cannot remain in production. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L030-01 | - The shared protected-image module owns text validation, preparation, key processing, position generation, carrier, framing, repair, authentication and typed failure (stories 1–4). | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L030-02 | P1 owns PNG admission/serialization. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L030-03 | Platform adapters own workers, CSPRNG/native crypto, byte input and completed-output delivery, not algorithm policy. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L031-01 | - Preserve the agreed async interfaces: prepareEncode({pngBytes,message,compress}, control), encode({preparation,password}, control), decode({pngBytes,password}, control), and discard(preparation). | Related only: O01 O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L031-02 | Control carries cancellation and safe progress, not profile overrides. | Related only: O01 O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L032-01 | - prepareEncode returns an opaque preparation and originalBytes, storedBytes, compressionUsed, maxStoredBytes, hasFrameCapacity, fits and metadataNotice. | Related only: O01 O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L032-02 | It runs no KDF and consumes no salt/nonce randomness. | Related only: O01 O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L032-03 | It validates/prepares exact bytes once | Related only: O01 O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L032-04 | encode consumes that current handle without recompressing. | Related only: O01 O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L032-05 | No KDF runs when preparation cannot fit. | Related only: O01 O02 E04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L033-01 | - A preparation is keyed by worker generation plus input revision, single-use and worker-owned, bound to exact admitted image/message/compression. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L033-02 | One preparation and one active heavyweight operation exist per tab/process. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L033-03 | Replacement, discard, cancellation, exit or an input change releases it. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L033-04 | Transfer owned buffers rather than duplicating rasters. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L033-05 | Password changes invalidate old results but do not change a valid image/text preparation. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L036-01 | - The shared protected-image module is the new deep module behind the four operations. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L036-02 | Its private key-schedule and continuous position-source interface supports the independent key/position checks | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L036-03 | it is not another interface that apps assemble. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L036-04 | Keep root/key state private to the worker and add no app-visible key trace, profile override or fallback. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L037-01 | - The existing PNG admission/serialization and comparison modules retain P1's policies and limits. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L037-02 | Node/browser adapters retain bounded input, worker transport, native crypto/CSPRNG and completed-output delivery. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L037-03 | CLI/PWA workflow modules own interaction and presentation, consuming complete operations rather than implementing format policy. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L038-01 | - Flow: app or operation caller → bounded input and worker request validation → shared operation → existing PNG module and native adapters → complete PNG bytes, authenticated text, preparation summary or typed failure → caller presentation/delivery. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L038-02 | Validate requests at the real worker gate | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L038-03 | a test stand-in does not define a separate accepted request contract. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L039-01 | - Text, framing, ranking and repair are in-process implementation. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L039-02 | Native crypto has two real platform adapters. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L039-03 | Worker/file operations are local | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L039-04 | controlled timing/error adapters are paired with real worker/request-gate checks. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L039-05 | No remote service or new network dependency is introduced. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L040-01 | - Prefactors: none as a separate ticket. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L040-02 | The current one-result worker lifetime cannot retain prepared bytes for encoding. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L040-03 | Build the worker lifetime and preparation ownership inside the first preparation slice, unblocking stories 1–4. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L040-04 | The final joint caller slice removes duplicated legacy policy rather than retaining a compatibility interface. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L041-01 | - Build complete worker-backed operations before switching either app. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L041-02 | Each operation slice returns a real result through the agreed interface and required platform adapters | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L041-03 | do not export unbuilt operations as stubs. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L041-04 | Existing app routes remain on their old path until the joint caller slice switches both apps and capacity together, then removes that path. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L041-05 | The new interface never falls back to it. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L041-06 | No intermediate branch state is a release. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L044-01 | - Passwords are exact nonempty UTF-8, at most 1,024 bytes. | Related only: K05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L044-02 | Reject unpaired surrogates | Related only: K05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L044-03 | perform no trimming, normalization or newline removal. | Related only: K05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L044-04 | Use one password, never separate-stage passwords. | Related only: K05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L045-01 | - Fix Argon2id v19 to memory 65,536 KiB (67,108,864 bytes), t=3, p=1, salt 16 bytes, root 32 bytes and empty secret/associated data. | Related only: K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L045-02 | Profile identifier is 0x01. | Related only: K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L045-03 | Pin libsodium-wrappers-sumo and libsodium-sumo to 0.8.4. | Related only: K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L045-04 | Use raw crypto_pwhash with opslimit 3, memlimit 67,108,864 and ARGON2ID13, not a library default or a password-hash string. | Related only: K01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L046-01 | - Generate a fresh CSPRNG salt of 16 bytes and GCM nonce of 12 bytes on every encode attempt. | Related only: K01 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L046-02 | HKDF-SHA256 uses root as IKM and 32 zero bytes as salt. | Related only: K01 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L046-03 | Its exact UTF-8 info strings, without a terminator, are obscr/keys/1/encryption and obscr/keys/1/placement | Related only: K01 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L046-04 | each output is 32 bytes. | Related only: K01 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L046-05 | Keep salt/public fields separate from secret keys. | Related only: K01 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L046-06 | Retain no derived-key cache. | Related only: K01 E05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L047-01 | - Placement consumes native AES-256-CTR encryption of zero bytes with the entire placement key and initial zero 16-byte counter. | Related only: K02 K03 K09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L047-02 | Increment the full 128-bit counter big-endian, continuously across chunks, preserve unused bytes and forbid wrap. | Related only: K02 K03 K09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L048-01 | - Draw little-endian uint32 values. | Related only: K06 K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L048-02 | Sample without replacement over the full eligible domain by swapping a selected live entry with the last live entry, represented sparsely. | Related only: K06 K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L048-03 | For live size b reject x >= floor(2^32/b)*b before x modulo b. | Related only: K06 K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L048-04 | No modulo-only shortcut, full-image permutation or retry fallback. | Related only: K06 K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L048-05 | Keep stream chunks at most 4,096 bytes and their paired input/output buffers at most 8,192 bytes | Related only: K06 K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L048-06 | the complete-format limits below are tighter than the general sampler ceiling. | Related only: K06 K08 K09 K10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L050-01 | - For pixel P=width*height, scalar q=3*(y*width+x)+channel in row-major RGB order. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L050-02 | Write salt bit i=0..127 at floor(i*3P/128), MSB-first from the 16 salt bytes. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L050-03 | Require 3P>=128 and real frame capacity. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L050-04 | These raw bits have no repair, magic, checksum, alternate location or search. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L050-05 | Read this salt once before the one KDF. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L051-01 | - Rank pixels from upper RGB bits U=sample & 254. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L051-02 | Score is the sum over RGB of abs(d*U - sum(valid four-neighbor U)), with d the number of valid up/down/left/right neighbors. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L051-03 | Scores range 0..3,048. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L051-04 | Admit at most floor(P/4) positive-score pixels, highest score first and row-major order at ties. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L051-05 | Use a 3,049-entry histogram, not a full pixel sort. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L051-06 | Flat images have no capacity. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L052-01 | - Eligible scalars are RGB channels of selected pixels in row-major/RGB order, excluding salt positions. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L052-02 | E is the full eligible count | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L052-03 | B=min(E,262,144) is a budget, not a truncation of the sampled domain. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L053-01 | - Key-order groups of seven eligible positions. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L053-02 | XOR the column numbers 1..7 whose sample LSB is one | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L053-03 | the resulting three-bit symbol is changed to the target by flipping at most the indicated single bit. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L053-04 | Pack symbols MSB-first with canonical zero final padding. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L053-05 | Header and body use separate seven-position groups. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L053-06 | Alpha stays unchanged. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L053-07 | There is no random filler, STC or Stenoxide dependency. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L055-01 | - The first 896 sampled positions (128 groups) carry the 48-byte repaired header. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L055-02 | Continue the same sampler stream for the body, without resetting, sorting or gaps. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L055-03 | Profile discovery is implicit and fixed | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L055-04 | all hidden recognition follows the expensive root. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-01 | - The 32-byte header is: nonce at bytes 0–11 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-02 | S stored length as uint32 big-endian at 12–15 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-03 | L original length likewise at 16–19 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-04 | parity=0x10 at 20 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-05 | interleave=0x01 at 21 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-06 | compression 0x00 raw or 0x01 gzip at 22 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-07 | format=0x01 at 23 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-08 | Argon profile=0x01 at 24 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-09 | credential=0x01 at 25 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-10 | matrix carrier=0x01 at 26 | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-11 | zero bytes at 27–31. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-12 | S is 0–512 and L is 0–1,048,576. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-13 | Raw requires L=S | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-14 | gzip requires 0<S<L. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-15 | Empty wire text is valid raw text | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L056-16 | creation UI refuses an empty message, not whitespace-only text. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L057-01 | - AES-256-GCM encrypts the S stored bytes once with a full 16-byte tag. | Related only: K04 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L057-02 | Body is ciphertext followed by tag. | Related only: K04 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L057-03 | The exact 56-byte AAD is salt[16] &#124;&#124; header[32] &#124;&#124; width_u32be &#124;&#124; height_u32be. | Related only: K04 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L057-04 | This authenticates decoding settings and message, not every cover sample, PNG encoding or rendering chunk. | Related only: K04 E01; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L058-01 | - Use a pinned, licensed ZXing-derived systematic shortened Reed–Solomon implementation: GF(256), primitive polynomial 0x11d, primitive element 0x02, generator base 0, roots alpha^0 through alpha^15, highest coefficient first and omitted leading zero shortening. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L058-02 | Header is 32 data + 16 parity bytes. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L058-03 | Body C=S+16 is split into at most 239 data bytes per block with 16 parity each, one to three blocks and no empty block at an exact multiple. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L058-04 | Interleave whole body bytes column-wise across blocks, skipping exhausted blocks | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L058-05 | do not interleave the header. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L059-01 | - Permit one repair attempt per block, at most eight corrected symbols and zero residual syndromes. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L059-02 | No erasure search or alternative repairs. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L059-03 | Out-of-radius miscorrection cannot yield accepted plaintext without GCM authentication. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L060-01 | - Let r=ceil(C/239), D=C+16r and G=128+ceil(8D/3). | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L060-02 | Require both 3G<=floor(B/50) and 7G<=B. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L060-03 | Return the largest S in 0..512 satisfying both, distinguishing no frame from empty-only capacity. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L060-04 | Test block transitions at S=223/224 and 462/463. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L060-05 | S=512 needs B>=249,600, uses 11,648 positions and at most 24,320 draws | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L060-06 | an empty frame needs B>=32,100. | Related only: E01 R02 R03 O04 O05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L062-01 | - Validate text for unpaired surrogates before encoding. | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L062-02 | Preserve BOM, line endings and whitespace | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L062-03 | decode with fatal UTF-8 while preserving BOM. | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L062-04 | Original text is at most 1 MiB. | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L062-05 | P3 owns guidance | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L062-06 | P4 owns exact file/stdin byte routes. | Related only: R01 O03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L063-01 | - Gzip is opt-in and used only when smaller. | Related only: O06 O07 R05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L063-02 | Its exact ten-byte header is 1f8b08000000000000ff, with one member, valid CRC32 and little-endian ISIZE. | Related only: O06 O07 R05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L063-03 | Reject trailing data and extra members. | Related only: O06 O07 R05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L063-04 | Bound compression output | Related only: O06 O07 R05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L063-05 | if it is larger or hits its size bound, use raw only if raw fits. | Related only: O06 O07 R05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L063-06 | A failed/unavailable compressor is an explicit error, not a falsely marked stream. | Related only: O06 O07 R05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L064-01 | - Authenticate before bounded decompression. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L064-02 | Require exactly authenticated L bytes, at most 1 MiB, full compressed-input consumption, valid gzip structure and fatal UTF-8. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L064-03 | No partial text is returned on any failure. | Related only: R05 R07; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L065-01 | - Keep P1's PNG limits. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L065-02 | Additional ceilings: one Uint16 score per pixel (at most 2 MiB), histogram 3,049 entries, at most 786,432 eligible uint32 indices (3 MiB), sparse sampled state, RS arrays at most 255 entries, AEAD body at most 528 bytes, repaired body 576 and complete frame 624. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L066-01 | - Decode performs one salt read, one KDF, one continuous stream, one header repair, at most three body repairs and one GCM check. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L066-02 | Before parsing the repaired bounded header allow at most 2,816 draws | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L066-03 | then enforce cumulative 2*k+1,024, with k and maxima above. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L066-04 | No format/profile/key retries or legacy fallbacks. | Related only: K10 R09; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L068-01 | - Public input/PNG/resource/cancellation failures can be specific. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L068-02 | Hidden profile, repair, padding, tag, authenticated-text and compression failures return no text and the common message: Could not recover an authenticated message. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L068-03 | The password may be wrong, or the image may be damaged or changed. | Related only: R03; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L069-01 | - A worker owns the active operation, input revision and secrets. | Related only: O08 O09 O10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L069-02 | Cancellation terminates it, releases partial output and suppresses late replies. | Related only: O08 O09 O10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L069-03 | Missing worker, WASM, CSP permission, RNG or allocation support fails explicitly | Related only: O08 O09 O10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L069-04 | never move expensive work onto the main thread or select a weaker algorithm. | Related only: O08 O09 O10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L069-05 | Do not add an arbitrary timeout. | Related only: O08 O09 O10; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L070-01 | - Safe stages are checking inputs, preparing text/capacity, deriving keys, encoding or recovering, and preparing result. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L070-02 | Recovery progress does not expose recognizers. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L070-03 | Clear password/key state after success, failure or cancellation, with best-effort memory release rather than a secure-erasure claim. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L071-01 | - Switch both Node and browser callers/capacity together. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L071-02 | Remove legacy envelope/framing/placement APIs, SECRET_KEY, password-seeded Mersenne Twister, filler toggles and obsolete tests/comments. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L071-03 | No aliases, old decoder or compatibility branch. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L071-04 | Update current examples/docs/changelog | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L071-05 | retain historical changelog entries as history. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L076-01 | - Source: the existing Encrypt, Decrypt and Diff cards, tabs, Button, Card, ImageUpload, PasswordInput, MessageDisplay and result components. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L076-02 | Keep the current terminal-inspired dark theme and 900-pixel content limit rather than introducing a new visual system. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L077-01 | - Check 320, 768 and 1440 CSS-pixel viewports and 200% text size. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L077-02 | Wrap long text and labels | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L077-03 | keep actions reachable. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L077-04 | Each control has an announced name | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L077-05 | live status is announced without moving focus. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L077-06 | Color is accompanied by text or shape. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L078-01 | - Keyboard reaches every action. | Related only: U03 U04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L078-02 | Dialog close restores focus to its trigger | Related only: U03 U04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L078-03 | a completed result has an accessible heading. | Related only: U03 U04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L078-04 | Reveal is keyboard-operable, not pointer-only. | Related only: U03 U04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L078-05 | Disabled actions show their reason. | Related only: U03 U04; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L079-01 | - The active tab identifies the task. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L079-02 | Clear and an idle tab change that discard entered text, a phrase or an unsaved result require buttons named Stay and Switch and clear, or equivalent explicit outcome names. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L079-03 | Confirming clears the old form. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L079-04 | No browser persistence is added. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L080-01 | - During encode/decode, keep Cancel available and prevent edits/navigation until completion or cancellation. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L080-02 | Edits during capacity preparation cancel obsolete work. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L080-03 | Cancel suppresses late replies and clears passwords, not editable message/image inputs. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L080-04 | Empty-after-clear explains the next action. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L081-01 | - Use the agreed safe progress stages without percentages or hidden recognition details | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L081-02 | avoid flashing a spinner for work completed in about a second. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L081-03 | For a long wait show a spinner and Cancel. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L081-04 | Keep failure messages beside the affected input and preserve non-password inputs. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L081-05 | Successful results remain until edited, cleared or left. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L082-01 | - First use has no admitted image or capacity claim. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L082-02 | Compression defaults off. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L082-03 | Preparation displays original/stored bytes and maximum stored capacity, with all framing overhead included. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L082-04 | No frame, empty-only capacity and oversize message have distinct public refusal reasons. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L082-05 | A fit enables encoding | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L082-06 | success exposes only a complete result. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L083-01 | - A failed or obsolete estimate removes its prior capacity, never retaining an old fits indicator. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L083-02 | Cancellation produces no downloadable output. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L083-03 | A metadata notice does not imply concealment. | Related only: U01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L085-01 | - The empty form asks for image and one password. | Related only: R01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L085-02 | Recovery waits with safe stages and Cancel. | Related only: R01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L085-03 | Failure uses the common authenticated-message text for hidden failures and keeps public PNG/resource failures separate. | Related only: R01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L085-04 | A valid empty message displays explicit authenticated success rather than disappearing through a truthiness check. | Related only: R01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L086-01 | - A result belongs to its exact inputs | Related only: R01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L086-02 | changes, clear or another operation remove it. | Related only: R01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L086-03 | Exact text is rendered as text, not HTML. | Related only: R01 U02; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L088-01 | - Source: the current guided CLI menu and command help. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L088-02 | State the active task. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L088-03 | Check 80x24 and 120x40 terminals, long paths/text, plain piped output and NO_COLOR. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L088-04 | Text carries every status that color carries. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L089-01 | - Interactive prompts run only on a terminal | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L089-02 | scripted actions do not wait for input. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L089-03 | Help names available keys and flags. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L089-04 | Ctrl-C cancels promptly, releases this operation's resources and publishes no partial result. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L089-05 | Preserve existing files on every failure. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L090-01 | - Printed user-controlled content is terminal-safe. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L090-02 | Keep progress separate from result bytes | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L090-03 | errors explain the next action without dumping secrets or internal recognition stages. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L090-04 | Completed output names the actual result | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L090-05 | incomplete work never prints success. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L091-01 | - Migrate the existing encrypt/decrypt guided routes without depending on P4's future file/stdin flags. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L091-02 | Until P4 replaces it, the current encrypt flow uses an external editor for message input | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L091-03 | acceptance supplies only public test text through that path. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L091-04 | P4 must migrate this scenario when it removes the editor. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L097-01 | - **PROTECTED-OPERATION:** the asynchronous prepareEncode/encode/decode/discard interface, including real worker transport, request validation, typed outcomes and lifetime. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L097-02 | Exercise the shared module through this interface with both platform adapters. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L098-01 | - **KEY-POSITIONS:** the private key-schedule and continuous position-source interface inside the shared module. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L098-02 | Keep independent root, child-key, CTR, rejection and position vectors observable here without exposing secret state or debug controls to the apps. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L098-03 | Tests may use fixed public inputs and controlled dependency adapters | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L098-04 | production gets no profile override, key trace or fallback. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L099-01 | - **APP-INTERACTION:** the existing form and CLI action interfaces. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L099-02 | Keep component/CLI behavior checks and real browser/TUI walkthroughs | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L099-03 | pair fake-operation scenarios with requests accepted by the real worker gate. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L100-01 | - Preparation uses PROTECTED-OPERATION. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L100-02 | Recovery and encoding each use PROTECTED-OPERATION and KEY-POSITIONS. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L100-03 | Joint app migration uses PROTECTED-OPERATION and APP-INTERACTION. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L100-04 | Each implementation slice tests at no more than two seams. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L104-01 | FORMAT-KEY, FORMAT-FRAME, FORMAT-TEXT and FORMAT-LIFECYCLE below are coverage groups, not four additional interfaces. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L104-02 | KEY-POSITIONS supplies the independent key/position checks | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L104-03 | PROTECTED-OPERATION proves their complete-format effects and the frame/text/lifecycle groups | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L104-04 | APP-INTERACTION proves the screens and commands. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L104-05 | Every existing case and normative mapping remains required. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L104-06 | This distinction does not permit arbitrary test surfaces to be grouped under one name or required observations to be dropped. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L106-01 | - FORMAT-KEY observes stories 1/4: independent Argon/HKDF/CTR/sampler vectors, exact password bytes, counter/chunk boundaries, rejection sampling, uniqueness, fresh salt/nonce and absence of a pre-KDF password recognizer. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L106-02 | Independent expected bytes must not be generated by the implementation under test. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L107-01 | - FORMAT-FRAME observes stories 1/2/4: full PNG vectors, both platform crypto adapters, header byte layout/AAD, every S=0..512, repair/block/padding boundaries, no-capacity/empty-only limits and excluded salt positions. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L107-02 | Test payload changes and shortened tags, malformed header/profile/reserved bytes, dimensions, repaired-body permutations and wrong passwords. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L107-03 | Bit patterns are public fixtures, not private user data. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L108-01 | - FORMAT-TEXT observes stories 1/2: raw/gzip Unicode, BOM/CRLF/whitespace, empty valid wire text, invalid surrogate/UTF-8, gzip header/CRC/length/member/trailing-data failures, incompressible fallback, decompression overrun and compressor unavailable/error. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L108-02 | Authentication must precede decompression. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L109-01 | - FORMAT-LIFECYCLE observes stories 2–4: no KDF/random salt or nonce during preparation, exact immutable preparation consumption, stale input/reply handling, termination during KDF/repair/compression, missing runtime capabilities, ceilings at large allowed images and failure cleanup. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L109-02 | Assert observable cancellation and no output, not just a mock forwarding call. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L110-01 | - The highest automated seam drives the complete worker-backed PNG operations. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L110-02 | Real CLI/PWA exchange is a mandatory browser/TUI walkthrough | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L110-03 | executing browser-compatible crypto under Node does not prove it. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L111-01 | - Prior art: full-workflow integration, real Node/browser-worker checks, controlled transport failures, React component checks, CLI checks and crypto/steg unit tests. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L111-02 | Replace legacy-format assertions instead of preserving weak paths for their sake. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L111-03 | The pinned reference vector in the accepted format decision is framing-only | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L111-04 | add independent complete-image vectors, and do not present that vector as full interoperability evidence. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L112-01 | - During joint caller migration, retain P1's PNG export and Diff acceptance coverage. | Related only: E08 P01 P05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L112-02 | Its existing 64×64 journey covers have at most 3,072 eligible scalars before salt exclusions, below the 32,100 needed for an empty frame. | Related only: E08 P01 P05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L112-03 | Replace unsuitable covers with sufficiently detailed supported fixtures while preserving the PNG-policy assertions | Related only: E08 P01 P05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L112-04 | do not delete those journeys to accommodate the new format. | Related only: E08 P01 P05; no complete-clause assertion established | UNMET — related check does not prove the whole clause |
| S-L113-01 | Use behavior tests through the named interface, not forwarding, source-text or incidental wording tests. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-02 | Keep fixtures public and deterministic and allocate a unique temporary directory per test | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-03 | never clean another test's output. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-04 | Replace obsolete assertions when their behavior is removed. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-05 | The acceptance ticket writes the named new test file. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-06 | Run the full `npm test` fast suite for implementation gates | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-07 | run the named targeted command for this acceptance check. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-08 | There is no e2e harness and Affected e2e is none. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-09 | Actual browser and terminal behavior is checked through the numbered Human check | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L113-10 | Node execution of browser-compatible code is not browser evidence. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-01 | Key-contract D3–D7 and provisional D2/D2.1 map to FORMAT-KEY | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-02 | the final format overrides earlier profile/ceiling choices. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-03 | Every carrier-contract clause and format sections 1–4 map to FORMAT-FRAME | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-04 | section 5 text/gzip clauses map to FORMAT-TEXT and remaining bounded-operation clauses to FORMAT-LIFECYCLE (P1 owns PNG buffers/admission). | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-05 | Every clause of format sections 7–8 and D1–D4/D6 maps to FORMAT-KEY/FRAME/TEXT/LIFECYCLE as appropriate | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-06 | the complete-image reference requirement is FORMAT-FRAME. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-07 | Application D1/D4/D5 map to FORMAT-LIFECYCLE and the real exchange check. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-08 | Release A1–A5/A7/A8 consume these results. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-09 | Every sentence, table entry and boundary in each named accepted section is included, not only the examples repeated here. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-10 | The acceptance evidence index lists each clause/scenario, its named check ID, candidate/fixture identity and pass/fail/unmet result. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-11 | All new-implementation results start not run. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L116-12 | A missing clause or unexercised mandatory case is unmet, not silently out of scope. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L120-01 | - **Seam:** PROTECTED-OPERATION, the complete shared worker-backed protected-image interface, with APP-INTERACTION exercised by real CLI/PWA bidirectional exchange. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L121-01 | - **Check:** Rung 2: `npm test -- test/integration/protected-image.test.js` (new), plus the required real-browser and CLI Human check. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L122-01 | - **Affected e2e:** none | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L123-01 | - **Covers:** stories 1, 2, 3, 4 | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L123-02 | automated cases and the numbered real-program steps together cover them. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L123-03 | Commands alone do not prove UI behavior. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L124-01 | - **Human check:** | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| S-L126-01 | 1. | B1–B3 | FAIL; initial preparation reset on reload |
| S-L126-02 | In the browser, select a supported detailed PNG, enter public text and a custom password, and inspect original/stored/max bytes. | B1 failed; B3 separately observed 35/35/512 raw and 2560/74/512 compressed | FAIL for initial observation; later preparation observed |
| S-L126-03 | Toggle compression and change the image/message. | B2/B3 | PASS |
| S-L126-04 | Only the current preparation's capacity may remain. | B2/B3 | PASS for exercised replacements |
| S-L126-05 | Change only the password | B3 | PASS |
| S-L126-06 | the valid image/text preparation remains usable and any old result disappears. | B3 | PASS |
| S-L126-07 | Try no-frame, empty-only and oversize fixtures | B2 | PASS |
| S-L126-08 | each refuses creation for its stated reason before derivation. | B2; E06 proves no key/randomness work | PASS |
| S-L127-01 | 2. | B4/B5, T1–T4 | PASS |
| S-L127-02 | Encode raw and compressed public text through the guided CLI, using its current external editor, then recover it in the actual browser. | B4, T1/T2; exact output files | PASS |
| S-L127-03 | Reverse the direction. | B5, T3/T4; exact output files | PASS |
| S-L127-04 | Use the same custom test password | Fixture manifest and real prompts | PASS |
| S-L127-05 | if generated phrases are offered, choose the custom-password option. | Current forms use custom passwords; P3 is separate | PASS for current route |
| S-L127-06 | Use known Unicode, BOM/line-ending and whitespace fixtures through the operation interface where current interactive controls cannot preserve their bytes | PROTECTED-ACCEPT-01/02, R01, B6 | PASS |
| S-L127-07 | do not claim that a textarea/editor proves P4's future exact file-input route. | This record explicitly excludes that claim | PASS; reporting constraint |
| S-L127-08 | Compare exact recovered fixture text, not only a success label. | Four file comparisons plus operation assertions | PASS |
| S-L128-01 | 3. | B6–B8, W22 | PASS |
| S-L128-02 | Try wrong passwords, plain/old images, modified authenticated fields and defined damage fixtures. | B6/B7, W22 | PASS |
| S-L128-03 | Observe complete authenticated text or the common hidden-failure message, never partial text. | B6/B7, W22 | PASS for named fixtures |
| S-L128-04 | Keep public PNG/resource errors distinct. | B8 observes malformed PNG; runtime/resource cases in full suite | PASS for exercised public failures |
| S-L128-05 | Decode a valid empty wire message and observe explicit success. | B6, independent empty fixture | PASS |
| S-L129-01 | 4. | B10/B11, W18/W19 | FAIL for initial restart; subsequent independent stage cases passed |
| S-L129-02 | Cancel real preparation, derivation and recovery work, then start a new operation. | B11, W18/W19 | PASS for all named stages |
| S-L129-03 | No cancelled reply may display or save a result. | B10/B11/W18/W19; O08 observes late transport reply | PASS for exercised cancellation paths |
| S-L129-04 | Password state clears | B10/B11/W18 | PASS |
| S-L129-05 | editable image/message inputs remain | B10/B11/W18 | PASS |
| S-L129-06 | the next operation succeeds. | Initial B10 restart interrupted by document reload; later W18/W19 restart succeeded | FAIL for initial observation |
| S-L130-01 | 5. | B12, W20/W21, T7/T8 | PASS for named states/actions |
| S-L130-02 | Edit, clear and leave completed forms. | B3/B12/W21 | PASS |
| S-L130-03 | Confirm discard where required | B12/W21 | PASS |
| S-L130-04 | check that stale results/downloads disappear and focus returns correctly. | B3/B12/W21 | PASS |
| S-L130-05 | During encode/decode, Cancel remains available and edits/navigation cannot change the active request. | B10–B12/W18 | PASS |
| S-L130-06 | Check the required browser widths/text size, keyboard/reveal actions, terminal sizes, long text/paths and NO_COLOR. | W20's 24-view matrix, W21 keyboard activation, T7 | PASS for named prepared/result/recovery/Diff states; other state matrices not claimed |
| S-L130-07 | Non-terminal commands refuse missing secret-input routes rather than prompt. | T8 | PASS; exit 1 without prompt |
| S-L131-01 | 6. | B14–B17 and P1 suite | FAIL for concurrent Diff admissions |
| S-L131-02 | Retain the existing PNG export and Diff journeys after updating only the covers that cannot carry the new frame. | P1 tests passed; B15 concurrent admission failed, B16 sequential admission passed | FAIL for B15 |
| S-L131-03 | Inspect supported rendering data, removed personal metadata and the visual-comparison label | B14/B17 and png-export-results.json | PASS |
| S-L131-04 | preserve existing files on failure and cancellation. | T5/T6/W19 and PNG-ACCEPT-02/13 | PASS |
| S-L132-01 | 7. | User-owned visual judgment | UNMET; deliberately not substituted |
| S-L132-02 | Compare every changed screen and command output with its named existing source. | User-owned visual judgment; captures retained | UNMET |
| S-L132-03 | Judge contrast, focus outlines and the tone of the words. (yours) | User-owned visual judgment | UNMET |

