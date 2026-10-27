# Protected-image acceptance evidence (#71)

## Identity and result

This is an evidence index, not an acceptance or release approval. No test, build or walkthrough was run while this index was written.

- Feature: [#46](https://github.com/jdragulanescu/obscr/issues/46); acceptance: [#71](https://github.com/jdragulanescu/obscr/issues/71).
- Production candidate: `b471500ea04a247cd7e434f47e65fe6d5cd1457b`; empty claim commit: `b790576`. Whole-feature base: `4c8f7c5d1e2ca9ac37810cc74a997f4819309736`.
- Acceptance additions are working-tree changes on that candidate. A run must identify those changes as well as the commit. This index does not transfer a prior ticket's pass to this candidate.
- `NOT RUN`: a named check exists, but no result for this candidate is recorded here. `UNMET`: the required observation has not been established by the named material, or requires a separate real-program, review or release observation. Neither status means a production defect.
- Each sentence or table entry has a stable source ID: source letter, snapshot line, sentence/subclause number. Quoted source text is retained so that a broad summary cannot silently drop a requirement. Semicolon-separated obligations are separate rows. Named checks below are candidate evidence, not proof from reading source. A row cannot become PASS merely because a related test passed: its own asserted observation must be present. Review/claim clauses need review evidence, not a test title.
- The parent owns the targeted run, `npm test -- test/integration/protected-image.test.js`, and full-suite/build results. Their output is not available in this index. The real browser/TUI record and Human step 7 are separate gates.

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
- **Public cover/PNG fixtures:** `test/fixtures/protected.js` and `test/fixtures/png-export.js` supply deterministic detailed covers and metadata. Small 64×64 covers have insufficient capacity for this format; the retained export journeys use sufficiently large detailed covers. No fixture is private user data.
- **Controlled lifecycle/component checks:** supplied native adapters, transport replies and simulated DOM exercise error paths. They do not by themselves establish real-worker termination, browser CSP support, visual accessibility or physical-device cost.

## Named check catalogue

All catalogue entries are **NOT RUN** for this candidate. File names are repository-relative; case titles are exact, including parameter templates. Parameter-specific source clauses remain separate in the index.

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

### Parent-owned new integration cases

| ID | File | Required observation | Status |
|---|---|---|---|
| PROTECTED-ACCEPT-01 | `test/integration/protected-image.test.js` | Node/browser gate variants: raw/gzip exact BOM, Unicode and line endings; single-use preparation; complete PNG/export metadata, upper bits, alpha/source; sample-preserving rewrite and cross recovery; wrong password returns no text. Production self-roundtrip, not independent-vector or actual-browser proof. | NOT RUN; parent supplied IDs; run result pending |
| PROTECTED-ACCEPT-02 | `test/integration/protected-image.test.js` | Both gates recover independent empty and eight-symbol-damaged header fixtures; altered AAD nonce gives hidden failure. | NOT RUN; parent supplied IDs; run result pending |
| PROTECTED-ACCEPT-03 | `test/integration/protected-image.test.js` | Real recovery cancellation followed by fresh preparation, encoding and recovery. | NOT RUN; parent supplied IDs; run result pending |

These new cases supplement, not replace, the detailed normative checks below. Their exact full titles and fixture/run identities belong to the parent run record.

## Retained P1 checks

P1 remains required, including PNG admission/export and Diff. Preserve `test/integration/png-admission.test.js`: `PNG-ACCEPT-02: a refused replacement preserves the prior export and cannot become a successful Diff`, and `PNG-ACCEPT-13: cancelling publication to the input path preserves the original source`. Both are NOT RUN. Preserve `test/unit/png-export.test.js`, `test/unit/png.test.js`, `test/unit/png-diff.test.js`, browser PNG worker coverage and Human step 6; P01–P05 and E08 identify specific checks, not permission to drop other existing P1 cases. Changed covers must retain rendering/personal-metadata and supported-parser assertions.

## Concrete missing mandatory observations

These are proof gaps, not assertions that implementation is defective. A successful source inspection or a self-roundtrip cannot close them.

| Gap | Required proof and present limitation | Status |
|---|---|---|
| G01 | Candidate-targeted acceptance and full existing suite results, with candidate plus acceptance diff identity. No result was received while writing this index. | NOT RUN |
| G02 | Actual guided CLI → actual browser and reverse, each raw and compressed, exact recovered public text, supported sample-preserving rewrite, recorded browser/runtime and fixtures. Node execution of browser adapters is insufficient. | UNMET; Human 2 |
| G03 | Observe that a bad GCM tag prevents decompressor invocation. R05's title says authentication precedes decompression, but its inspected cases supply authenticated malformed streams; that alone does not observe non-invocation on tag failure. R03's tag rejection alone also does not observe ordering. | UNMET; FORMAT-TEXT / F144 |
| G04 | A complete protected-image fixture with a deliberately shortened GCM tag, crossing PROTECTED-OPERATION and giving common failure/no text. K04 checks shortened native AEAD input only; it is not the required complete-image assertion. | UNMET; FORMAT-FRAME / K83 / F173 |
| G05 | A specifically identified legacy protected image, not only a plain detailed cover, returns common failure after the fixed root without fallback. R08 supplies a plain cover. | UNMET; FORMAT-FRAME / Human 3 |
| G06 | Actual browser preparation/derivation/recovery cancellation and restart, password clearing, retained editable inputs and no result/download from a late reply. Controlled UI transport cases and Node worker runs are not the real-browser observation. | UNMET; Human 4 |
| G07 | Real changed-screen checks at 320/768/1440 CSS pixels and 200% text; keyboard, reveal, focus restoration, announced statuses, disabled reasons, active-request edit/navigation lock, stale-result/download removal. | UNMET; Human 1/5 |
| G08 | Real CLI 80×24 and 120×40, long paths/text, NO_COLOR and piped refusal, plus retained real PNG export/Diff journeys and failure/cancellation preservation. Existing automated CLI/P1 cases need candidate run evidence; screenshots/transcripts must identify scenarios. | UNMET; Human 5/6 |
| G09 | Human comparison of every changed screen/command with its named source: contrast, focus outlines and tone. No machine check substitutes for the user's decision. | UNMET; Human 7, user-owned |
| G10 | Exact maximum-image allocation/high-water observations for every final score/histogram/eligible/sparse/paired-buffer cap and single salt/header/body-repair count. R09 bounds stream output and counts HKDF/GCM; it does not measure all these arrays or count all repair attempts. | UNMET for unobserved counters; F116/F118/F120 |
| G11 | Real browser CSP/WASM/worker/allocation support and separate named physical iPhone/Android/desktop/Node cold/warm key-ready and whole-process memory/responsiveness results. Controlled constructor failure is not deployment/device evidence. | UNMET release gate |
| G12 | Completed-format no-cheaper-verifier argument independently reviewed, pinned dependency/license/notice and artifact review, existing bounded detection/damage and attack checks. Primitive vectors or source comments do not establish these release results. | UNMET release gate |
| G13 | Full offline installation, disabled-network exchange, missing-asset/update isolation and network/cache secret inspection; exact future file/stdout and generated-passphrase scenarios. #46 leaves their established product owners intact; no release claim follows. | UNMET downstream/release gate |

## Clause-to-evidence index

Source IDs are stable against later edits to this document. Each source link points to the exact accepted issue/comment. Snapshot lines are quoted below. `UNMET — review/observation absent` means there is no sufficiently specific established check in this index; it is not waived. Where a row lists several candidates, each applies only to the corresponding assertion in its case, and no combined pass is inferred. Review-only rationale and non-claims remain explicit because they constrain the acceptance wording.

### K: [contract-6373122896.md](https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6373122896)

| Clause ID | Required sentence / table entry | Named evidence | Status |
|---|---|---|---|
| K-L049-01 | Encode the password as UTF-8, without trimming, case conversion or Unicode normalization. | K05 | NOT RUN |
| K-L049-02 | Reject empty input, unpaired UTF-16 surrogates, and passwords longer than 1,024 UTF-8 bytes before derivation. | K05 | NOT RUN |
| K-L049-03 | This preserves the exact password but means visually identical Unicode spellings can differ | K05 | NOT RUN |
| K-L049-04 | the byte limit bounds input handling and must be explained rather than silently truncating. | K05 | NOT RUN |
| K-L051-01 | For each new encoding attempt, generate a fresh 16-byte KDF salt and a fresh 12-byte AES-GCM nonce using the platform CSPRNG. | E05 K01 | NOT RUN |
| K-L051-02 | Retrying encryption starts a new attempt with new randomness. | E05 K01 | NOT RUN |
| K-L051-03 | Public salt is not secret key material. | E05 K01 | NOT RUN |
| K-L051-04 | Derive a raw 32-byte root with the selected KDF | E05 K01 | NOT RUN |
| K-L051-05 | do not store a password-hash verification string or encrypt/store the root in the image. | E05 K01 | NOT RUN |
| K-L053-01 | Proposed exact child-key contract: HKDF-SHA256 extract-and-expand, input key material = raw root, HKDF salt = 32 zero bytes, output = 32 bytes per key. | K01 | NOT RUN |
| K-L053-02 | Info is exactly UTF-8 `obscr/keys/1/encryption` or `obscr/keys/1/placement`, without a trailing zero byte. | K01 | NOT RUN |
| K-L053-03 | These labels name this key-schedule version, not the eventual image-format number. | K01 | NOT RUN |
| K-L053-04 | A changed key schedule requires different labels. | K01 | NOT RUN |
| K-L053-05 | The random password salt and the fixed HKDF extraction salt have different roles. | K01 | NOT RUN |
| K-L055-01 | Keep root and child keys private and ephemeral. | R09 K04 | NOT RUN |
| K-L055-02 | Clear owned byte buffers when practical, release references and never log or persist them | R09 K04 | NOT RUN |
| K-L055-03 | do not claim guaranteed erasure in JavaScript. | R09 K04 | NOT RUN |
| K-L055-04 | Retain AES-256-GCM with a 16-byte tag, authenticate canonical meaning-affecting metadata and release no plaintext before authentication. | R09 K04 | NOT RUN |
| K-L055-05 | The format ticket owns the exact metadata serialization. | R09 K04 | NOT RUN |
| K-L055-06 | HKDF and extra fast hashes do not add password entropy | R09 K04 | NOT RUN |
| K-L055-07 | a correct password guess yields the encryption key without a second AES brute-force search. | R09 K04 | NOT RUN |
| K-L059-01 | Encrypt zero bytes under the placement key, starting with a 16-byte all-zero counter and incrementing the full counter as a big-endian 128-bit integer. | K02 K03 K09 | NOT RUN |
| K-L059-02 | Web Crypto uses counter length 128 | K02 K03 K09 | NOT RUN |
| K-L059-03 | Node must match its bytes. | K02 K03 K09 | NOT RUN |
| K-L059-04 | Consume the stream continuously across chunks, preserve unused bytes, and never wrap or restart it during sampling. | K02 K03 K09 | NOT RUN |
| K-L059-05 | A fixed initial counter is permitted here because each new encoding derives a fresh placement key and has only one placement stream. | K02 K03 K09 | NOT RUN |
| K-L059-06 | Reading the same image intentionally reproduces that stream. | K02 K03 K09 | NOT RUN |
| K-L061-01 | This uses the AES APIs already needed for GCM and avoids binding placement to the eventual password library. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L061-02 | ChaCha20 is also a viable alternative, particularly with Sodium, but would tie this path to an added primitive. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L061-03 | CTR is only the position generator, not the payload cipher. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L061-04 | Any future filler or additional stream needs its own separately specified key/domain, not reuse of this one. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L065-01 | The carrier supplies one canonical ordered list of eligible positions with bootstrap positions excluded. | K06 | NOT RUN |
| K-L065-02 | Start a conceptual pool containing indices `0..N-1`. | K06 | NOT RUN |
| K-L065-03 | For each requested position with `b` entries remaining, consume the next four stream bytes as an unsigned little-endian integer `x`. | K06 | NOT RUN |
| K-L065-04 | Let `L = floor(2^32 / b) * b`. | K06 | NOT RUN |
| K-L065-05 | Reject `x >= L` | K06 | NOT RUN |
| K-L065-06 | otherwise choose `j = x % b`, emit pool entry `j`, replace it with the last live entry and shrink the pool. | K06 | NOT RUN |
| K-L065-07 | This is unbiased range reduction under uniform input, not a claim that a finite keyed generator reaches every permutation. | K06 | NOT RUN |
| K-L067-01 | Permit this sampler only for `1 <= N <= 2^32` and payload demand no greater than `N` | K07 K11 | NOT RUN |
| K-L067-02 | zero-demand operations need no draw. | K07 K11 | NOT RUN |
| K-L067-03 | Compute the `2^32` sentinel without 32-bit truncation. | K07 K11 | NOT RUN |
| K-L067-04 | A sparse swap representation may emit only the needed prefix, but must produce exactly the same order as the conceptual pool. | K07 K11 | NOT RUN |
| K-L067-05 | This avoids an unconditional full-image permutation | K07 K11 | NOT RUN |
| K-L067-06 | its peak memory still needs measurement. | K07 K11 | NOT RUN |
| K-L069-01 | The eventual approved profile must also set finite image, payload, allocation and total-draw limits, checked before allocation and enforced during processing. | K10 | NOT RUN |
| K-L069-02 | Exhaustion fails | K10 | NOT RUN |
| K-L069-03 | it must never switch to modulo-only sampling. | K10 | NOT RUN |
| K-L069-04 | The mathematical domain above is not permission to allocate a four-billion-entry image. | K10 | NOT RUN |
| K-L069-05 | Carrier ordering, repair and content-adaptive eligibility remain with their existing decisions | K10 | NOT RUN |
| K-L069-06 | this sampler does not by itself select or prove a hiding method. | K10 | NOT RUN |
| K-L073-01 | The decoder may reject unsupported profiles, malformed lengths or excessive resources before password processing. | R08 | NOT RUN |
| K-L073-02 | Salt and profile retrieval must not require a fast password-derived map. | R08 | NOT RUN |
| K-L073-03 | Every password-dependent position or recognition value must instead descend from the expensive root. | R08 | NOT RUN |
| K-L073-04 | Do not add a separate password-check field. | R08 | NOT RUN |
| K-L073-05 | Retire Mersenne Twister, the public SECRET_KEY suffix and obsolete fast-placement callers during the later production migration | R08 | NOT RUN |
| K-L073-06 | legacy handling remains a separate decision. | R08 | NOT RUN |
| K-L075-01 | The intended cost floor is the selected root calculation, subject to attacker optimizations—not full-image extraction or GCM work for every guess. | R08 | NOT RUN |
| K-L075-02 | An inner header or repair constraint may reject a wrong guess immediately after that root. | R08 | NOT RUN |
| K-L075-03 | GCM authentication still permits offline guessing | R08 | NOT RUN |
| K-L075-04 | strong generated passwords remain necessary. | R08 | NOT RUN |
| K-L075-05 | Independent placement-key attacks must use the full key rather than a reduced seed. | R08 | NOT RUN |
| K-L075-06 | Salt reuse, reused passwords and the weakest accessible old/new image remain attack considerations. | R08 | NOT RUN |
| K-L077-01 | This is a design argument, not proof that an unfinished format has no shortcut. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L077-02 | The complete-format and release decisions must inspect every earlier recognizer, bootstrap/repair structure and extracted-ciphertext path before accepting that claim. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| K-L081-01 | Record password bytes, salt, KDF profile, root, both child keys, stream prefix, accepted/rejected draws and emitted positions for fixed non-secret inputs. | K01 K02 K06 | NOT RUN |
| K-L081-02 | Compare primitive outputs with an independent implementation or published vectors, then require browser/Node agreement for the composed chain. | K01 K02 K06 | NOT RUN |
| K-L081-03 | Do not use two calls to the same wrapper as independent evidence. | K01 K02 K06 | NOT RUN |
| K-L083-01 | Cover Unicode distinctions and rejected input | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-02 | repeated password with changed salt | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-03 | stream chunk boundaries and counter carry | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-04 | forced rejection draws | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-05 | one-element and non-power-of-two pools | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-06 | full-domain uniqueness on small domains | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-07 | bootstrap exclusions | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-08 | limit failures | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-09 | altered metadata | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-10 | wrong passwords | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-11 | and shortened GCM tags. | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-12 | Controlled vectors may use fixed randomness | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-13 | production encoding may not. | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-14 | This costs dedicated interoperability work but prevents two apps from agreeing only on ordinary ASCII or short streams. | K03 K05 K07 K09 R03 K04 | NOT RUN |
| K-L083-15 | Later real CLI/browser exchange and security review remain mandatory. | K03 K05 K07 K09 R03 K04 | NOT RUN |

### P: [contract-6374176664.md](https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6374176664)

| Clause ID | Required sentence / table entry | Named evidence | Status |
|---|---|---|---|
| P-L030-01 | Use **Argon2id v19, memory 65,536 KiB (67,108,864 bytes), time cost 3, parallelism 1, a 16-byte salt, a raw 32-byte root, and empty optional secret and associated data**. | K01 K04 K05 E05 | NOT RUN |
| P-L030-02 | Reserve profile identifier `0x01` for this exact tuple in the new format's profile namespace | K01 K04 K05 E05 | NOT RUN |
| P-L030-03 | the format decision owns its field location and authenticated serialization. | K01 K04 K05 E05 | NOT RUN |
| P-L030-04 | Do not use library defaults or password-hash strings. | K01 K04 K05 E05 | NOT RUN |
| P-L032-01 | This selects measured candidate `a64t3` as a provisional design, not as a proven phone profile. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L032-02 | Compared with the tested 128-MiB candidates, it leaves more memory for images but charges attackers less memory. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L032-03 | Three passes retain more computation than the tested two-pass option. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L032-04 | Neither comparison establishes equivalent attack strength across algorithms. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L034-01 | Native PBKDF2 would remove the added password library but give up tunable memory hardness. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L034-02 | Shared-library scrypt would avoid WASM but change the construction and runtime costs. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L034-03 | Prefer Argon2id because memory-hard processing remains the accepted direction and the bounded experiment supports this candidate's interoperability. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L034-04 | There is no automatic fallback to either alternative. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L038-01 | Use `libsodium-wrappers-sumo@0.8.4` with `libsodium-sumo@0.8.4` explicitly locked. | K01 K04 K05 E05 | NOT RUN |
| P-L038-02 | Pass the raw accepted password bytes to `crypto_pwhash`, set output length 32, `opslimit=3`, `memlimit=67108864`, and select `crypto_pwhash_ALG_ARGON2ID13` explicitly. | K01 K04 K05 E05 | NOT RUN |
| P-L038-03 | Keep native HKDF and AES APIs as agreed. | K01 K04 K05 E05 | NOT RUN |
| P-L040-01 | This avoids introducing another unmeasured KDF adapter. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L040-02 | Its price is the worker/WASM package, CSP and offline-asset handling, notices and dependency review. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L040-03 | Package upgrades require fresh artifact review and matching vectors | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L040-04 | the profile identifier describes algorithm parameters, not an npm version. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L040-05 | A load, CSP or allocation failure reports an error rather than changing the algorithm or cost. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L042-01 | The existing exact contract still applies: UTF-8 without normalization or trimming | K01 K04 K05 E05 | NOT RUN |
| P-L042-02 | reject empty input, unpaired surrogates and input above 1,024 UTF-8 bytes. | K01 K04 K05 E05 | NOT RUN |
| P-L042-03 | Each new encoding attempt gets a fresh CSPRNG 16-byte salt and 12-byte GCM nonce. | K01 K04 K05 E05 | NOT RUN |
| P-L042-04 | HKDF-SHA256 uses the raw root, 32 zero salt bytes, and the exact UTF-8 info labels `obscr/keys/1/encryption` and `obscr/keys/1/placement`, without a terminator, for separate 32-byte keys. | K01 K04 K05 E05 | NOT RUN |
| P-L042-05 | AES-256-GCM keeps its 16-byte tag. | K01 K04 K05 E05 | NOT RUN |
| P-L042-06 | Root and child keys stay secret and are never stored in the image. | K01 K04 K05 E05 | NOT RUN |
| P-L046-01 | For the next complete-format design and measurements, use these **provisional upper bounds, not demonstrated safe device limits**: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L048-01 | - Width and height each at most 4,096 | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L048-02 | total pixels at most 12,192,768. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L048-03 | This permits the measured photo and its rotation without approving the unmeasured 4096×4096 case. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L049-01 | - Requested positions `k` at most 262,144 and no greater than eligible positions `N`. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L049-02 | This is a position budget, not a promise of message bytes: framing and repair consume capacity too. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| P-L050-01 | - At most `2*k + 1024` 32-bit draws, including rejected draws | K08 K09 K10 | NOT RUN |
| P-L050-02 | absolute maximum 525,312. | K08 K09 K10 | NOT RUN |
| P-L050-03 | Exhaustion fails without biased sampling or a restart. | K08 K09 K10 | NOT RUN |
| P-L051-01 | - Sparse swap state at most `k` entries | K08 K09 K10 | NOT RUN |
| P-L051-02 | no full `N`-entry permutation. | K08 K09 K10 | NOT RUN |
| P-L051-03 | Stream chunks at most 4,096 bytes, with at most 8,192 bytes for their paired input/output buffers. | K08 K09 K10 | NOT RUN |
| P-L051-04 | Preserve unused stream bytes between chunks. | K08 K09 K10 | NOT RUN |
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
| P-L057-01 | Retain the agreed AES-256-CTR generator: full 32-byte placement key, all-zero initial 128-bit counter, big-endian counter increment, continuous stream and no wrap. | K08 K09 K10 | NOT RUN |
| P-L057-02 | Retain four-byte little-endian draws, rejection above `floor(2^32/b)*b - 1`, and swap-with-last selection from the canonical eligible domain. | K08 K09 K10 | NOT RUN |
| P-L057-03 | The mathematical `N <= 2^32` bound does not override these operational limits. | K08 K09 K10 | NOT RUN |
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
| C-L037-01 | 1. | E02 | NOT RUN |
| C-L037-02 | Work on the supported opaque RGB/RGBA8 raster without color conversion or resampling. | E02 | NOT RUN |
| C-L037-03 | For scoring, use `U(p,c) = RGB(p,c) & 254` | E02 | NOT RUN |
| C-L037-04 | never change alpha or upper channel bits. | E02 | NOT RUN |
| C-L038-01 | 2. | E01 O04 | NOT RUN |
| C-L038-02 | Use the valid up/down/left/right neighbors of pixel `p`. | E01 O04 | NOT RUN |
| C-L038-03 | Let their count be `d`. | E01 O04 | NOT RUN |
| C-L038-04 | Compute the integer score `S(p) = sum over RGB channels of abs(d * U(p,c) - sum over valid neighbors q of U(q,c))`. | E01 O04 | NOT RUN |
| C-L038-05 | This is a small cross-Laplacian detail measure, not standard HILL. | E01 O04 | NOT RUN |
| C-L038-06 | Its range is 0–3,048 | E01 O04 | NOT RUN |
| C-L038-07 | no floating-point or edge padding convention is needed. | E01 O04 | NOT RUN |
| C-L039-01 | 3. | E01 O04 | NOT RUN |
| C-L039-02 | Keep at most `floor(pixelCount / 4)` pixels with positive scores, ranked by descending score, then ascending row-major pixel index. | E01 O04 | NOT RUN |
| C-L039-03 | This retains the highest-detail quarter at most | E01 O04 | NOT RUN |
| C-L039-04 | all-flat images supply no eligible pixels. | E01 O04 | NOT RUN |
| C-L039-05 | The 25% choice is an engineering policy, not a measured safe-hiding threshold. | E01 O04 | NOT RUN |
| C-L039-06 | Use the bounded score histogram and row-major tie resolution rather than a full-image comparison sort. | E01 O04 | NOT RUN |
| C-L040-01 | 4. | E01 O04 | NOT RUN |
| C-L040-02 | Define the eligible scalar domain in row-major pixel/RGB order over retained pixels, excluding every reserved public-salt position. | E01 O04 | NOT RUN |
| C-L040-03 | The eligible map is public, not an additional secret. | E01 O04 | NOT RUN |
| C-L040-04 | Use the accepted full-strength keyed sampler over this domain, with one continuous stream for header then body, distinct positions and the existing bounded-work rules. | E01 O04 | NOT RUN |
| C-L040-05 | Do not sort by detail for message order or mix in another weak seed. | E01 O04 | NOT RUN |
| C-L041-01 | 5. | E01 O04 | NOT RUN |
| C-L041-02 | Group the keyed header positions and then keyed body positions separately into groups of seven. | E01 O04 | NOT RUN |
| C-L041-03 | Number each group's columns 1–7. | E01 O04 | NOT RUN |
| C-L041-04 | The XOR of columns whose current LSB is 1 is the three-bit symbol. | E01 O04 | NOT RUN |
| C-L041-05 | To encode a target symbol, XOR it with the current symbol and flip the one indicated LSB if that difference is nonzero. | E01 O04 | NOT RUN |
| C-L041-06 | Use ordinary LSB replacement so upper bits cannot change. | E01 O04 | NOT RUN |
| C-L041-07 | Extract the three-bit symbols from the encoded groups, never from sender-only information. | E01 O04 | NOT RUN |
| C-L042-01 | 6. | E01 O04 | NOT RUN |
| C-L042-02 | Pack each symbol most-significant-bit first. | E01 O04 | NOT RUN |
| C-L042-03 | Zero-pad only the final incomplete symbol of each header/body bitstream to three bits | E01 O04 | NOT RUN |
| C-L042-04 | charge that padding to capacity and require canonical padding when extracting. | E01 O04 | NOT RUN |
| C-L042-05 | Exact authenticated byte lengths come from the bounded framing rules. | E01 O04 | NOT RUN |
| C-L042-06 | These keyed final-group bits are not full-image filler. | E01 O04 | NOT RUN |
| C-L042-07 | The public salt stays raw, outside the matrix encoder. | E01 O04 | NOT RUN |
| C-L048-01 | Adopt the integer scoring and stable ranking above. | E01 O04 | NOT RUN |
| C-L048-02 | This gives a concrete adaptive rule without a learned classifier, floating-point drift or STC solver. | E01 O04 | NOT RUN |
| C-L048-03 | It spends an image scan and restricts available positions. | E01 O04 | NOT RUN |
| C-L048-04 | The receiver reproduces it from the upper seven bits | E01 O04 | NOT RUN |
| C-L048-05 | it does not need the original image. | E01 O04 | NOT RUN |
| C-L048-06 | Local variation is a heuristic, not proof that an image is a suitable photograph or that a message is concealed. | E01 O04 | NOT RUN |
| C-L052-01 | Keep at most 512 stored message bytes after optional size-reducing compression, at most 1 MiB original/decompressed UTF-8 text, opaque noninterlaced RGB/RGBA8 PNG input, at most 1,024 pixels per side/1,048,576 pixels total and 16 MiB source bytes. | O03 O05 E01 E06 | NOT RUN |
| C-L052-02 | Keep the existing cryptographic/parser/worker bounds. | O03 O05 E01 E06 | NOT RUN |
| C-L052-03 | Remove the Stenoxide-specific WASM allocation/build requirements rather than recreate them. | O03 O05 E01 E06 | NOT RUN |
| C-L052-04 | These retained bounds are policy limits, not measured performance or concealment guarantees for our own implementation. | O03 O05 E01 E06 | NOT RUN |
| C-L054-01 | Let `E` be the eligible scalar count after salt exclusions, and `B = min(E, 262144)`. | O03 O05 E01 E06 | NOT RUN |
| C-L054-02 | Retain the conservative stored-bit rate ceiling as an exact integer rule: at most `floor(B / 50)` keyed coded bits. | O03 O05 E01 E06 | NOT RUN |
| C-L054-03 | Do not present that inherited 0.02 ceiling as a validated rate for this new method. | O03 O05 E01 E06 | NOT RUN |
| C-L056-01 | Let `H` and `T` be the complete fixed protected-header and body bit lengths **after** authentication/framing and their respective Reed–Solomon repair, with nonce/profile fields counted once. | O03 O05 E01 E06 | NOT RUN |
| C-L056-02 | Set `G = ceil(H/3) + ceil(T/3)`. | O03 O05 E01 E06 | NOT RUN |
| C-L056-03 | Require both `3*G <= floor(B/50)` and `7*G <= B`. | O03 O05 E01 E06 | NOT RUN |
| C-L056-04 | The reserved raw-salt pool is excluded before calculating `E` | O03 O05 E01 E06 | NOT RUN |
| C-L056-05 | it consumes its own image positions and does not become free capacity. | O03 O05 E01 E06 | NOT RUN |
| C-L056-06 | Separate header/body final-symbol padding and all final shortened-RS blocks count. | O03 O05 E01 E06 | NOT RUN |
| C-L056-07 | Extract only the needed keyed prefix, within the accepted sampler bounds | O03 O05 E01 E06 | NOT RUN |
| C-L056-08 | do not generate or alter unused samples. | O03 O05 E01 E06 | NOT RUN |
| C-L058-01 | Show the actual net capacity and reject insufficient input before output. | O03 O05 E01 E06 | NOT RUN |
| C-L058-02 | No truncation, higher rate, weaker repair or automatic resizing. | O03 O05 E01 E06 | NOT RUN |
| C-L058-03 | The old 655-byte STC ceiling is no longer a codec API limit | O03 O05 E01 E06 | NOT RUN |
| C-L058-04 | any similar arithmetic ceiling comes only from the retained rate/sample policy. | O03 O05 E01 E06 | NOT RUN |
| C-L058-05 | Do not claim that every eligible image admits 512 bytes. | O03 O05 E01 E06 | NOT RUN |
| C-L062-01 | Retain shortened Reed–Solomon with 16 parity bytes per body block, separate 16-byte header parity and whole-byte round-robin across at most four body codewords. | R02 R04 R06 | NOT RUN |
| C-L062-02 | Retain its licensed existing implementation and final-block rules | R02 R04 R06 | NOT RUN |
| C-L062-03 | matrix coding follows repair and is removed before attempting repair on extraction. | R02 R04 R06 | NOT RUN |
| C-L062-04 | Authenticate before decompression or output. | R02 R04 R06 | NOT RUN |
| C-L062-05 | No decoder retries or alternate modes. | R02 R04 R06 | NOT RUN |
| C-L064-01 | If upper RGB bits or geometry change, the eligible map can change and desynchronize placement. | R02 R04 R06 | NOT RUN |
| C-L064-02 | Salt damage can independently prevent key derivation. | R02 R04 R06 | NOT RUN |
| C-L064-03 | The old STC mild-damage benefit is not evidence of that same benefit here. | R02 R04 R06 | NOT RUN |
| C-L064-04 | Only unchanged encoded files and sample-preserving PNG rewrites within supported parsing limits are promised | R02 R04 R06 | NOT RUN |
| C-L064-05 | other changes get authenticated output if recoverable or the agreed failure, never partial text. | R02 R04 R06 | NOT RUN |
| C-L066-01 | This retains limited repair capability at an overhead cost without promising that repair fixes a changed map. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L066-02 | Keeping only direct unprotected transport would be smaller, but would discard the already selected outer repair behavior. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| C-L070-01 | The existing format/app work incorporates bounded PNG-envelope handling, no identifying public marker/text, safe rendering-metadata handling and removal of personal metadata with explicit limits. | E08 P04 | NOT RUN |
| C-L070-02 | Do not blindly copy ICC/unknown chunks or imply that stripping metadata is invisible. | E08 P04 | NOT RUN |
| C-L070-03 | No full compressor-fingerprint imitation project or imported JPEG-history detector is added. | E08 P04 | NOT RUN |
| C-L070-04 | The existing format/app decisions own the precise metadata policy. | E08 P04 | NOT RUN |
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
| F-L033-01 | Let `P = width * height`, and index RGB scalars as `q = 3 * (y * width + x) + c`, with `c = 0,1,2` for R,G,B. | E01 O04 | NOT RUN |
| F-L033-02 | Alpha is never a carrier. | E01 O04 | NOT RUN |
| F-L033-03 | Require `3P >= 128`, in addition to the full capacity check. | E01 O04 | NOT RUN |
| F-L035-01 | For salt bit `i = 0..127`, reserve scalar `q_i = floor(i * 3P / 128)`. | E01 O04 | NOT RUN |
| F-L035-02 | Put bit `7 - (i mod 8)` of salt byte `floor(i/8)` in that scalar's LSB. | E01 O04 | NOT RUN |
| F-L035-03 | These 128 positions are distinct. | E01 O04 | NOT RUN |
| F-L035-04 | Reserve only those positions, whether or not their pixels qualify for the detail region. | E01 O04 | NOT RUN |
| F-L035-05 | There is no larger unused bootstrap pool, salt checksum, repetition, repair, magic or scan. | E01 O04 | NOT RUN |
| F-L035-06 | Read exactly one 16-byte salt at exactly this layout. | E01 O04 | NOT RUN |
| F-L037-01 | The decoder is configured for this single format generation and Argon2id profile `0x01` before reading any hidden bytes. | R08 R03 | NOT RUN |
| F-L037-02 | All profile parameters come from code, never from an untrusted image field. | R08 R03 | NOT RUN |
| F-L037-03 | Check that the implementation supports this fixed configuration before starting. | R08 R03 | NOT RUN |
| F-L037-04 | An image carries its profile identifier only inside the fixed keyed header. | R08 R03 | NOT RUN |
| F-L037-05 | Check it after derivation | R08 R03 | NOT RUN |
| F-L037-06 | it cannot select another KDF or trigger a retry. | R08 R03 | NOT RUN |
| F-L039-01 | This explicitly narrows the earlier requirement to reject image-supplied profile IDs before the KDF. | R08 R03 | NOT RUN |
| F-L039-02 | No such public field exists here. | R08 R03 | NOT RUN |
| F-L039-03 | A future format, old image or plain image may consume one current-profile derivation and then return the common failure. | R08 R03 | NOT RUN |
| F-L039-04 | This effort adds no automatic format negotiation. | R08 R03 | NOT RUN |
| F-L039-05 | A later format change needs its own explicit routing decision. | R08 R03 | NOT RUN |
| F-L043-01 | Use the accepted detail score and ranking exactly: compute from `RGB & 254` | E01 O04 | NOT RUN |
| F-L043-02 | retain at most `floor(P/4)` positive-score pixels, with descending score and row-major ties. | E01 O04 | NOT RUN |
| F-L043-03 | Enumerate their RGB scalars in row-major/RGB order and remove the 128 salt positions where present. | E01 O04 | NOT RUN |
| F-L043-04 | This gives `E` eligible scalars. | E01 O04 | NOT RUN |
| F-L043-05 | Do not truncate that domain to the position budget | E01 O04 | NOT RUN |
| F-L043-06 | the sampler draws across all `E`. | E01 O04 | NOT RUN |
| F-L043-07 | Set `B = min(E,262144)` only for budget calculations. | E01 O04 | NOT RUN |
| F-L045-01 | Run the accepted full-key sampler once. | E01 O04 | NOT RUN |
| F-L045-02 | The first **896 positions** form 128 seven-sample groups and carry the fixed **48-byte repaired header**. | E01 O04 | NOT RUN |
| F-L045-03 | The body starts at the next sampler position, with no restart, duplicate, sorting or gap. | E01 O04 | NOT RUN |
| F-L045-04 | Its groups are separate from the header groups. | E01 O04 | NOT RUN |
| F-L045-05 | A byte's bits and each three-bit symbol are most-significant-bit first. | E01 O04 | NOT RUN |
| F-L045-06 | Zero-pad the last body symbol if needed and reject nonzero extracted padding | E01 O04 | NOT RUN |
| F-L045-07 | no padding is needed for the 48-byte header. | E01 O04 | NOT RUN |
| F-L045-08 | Padding damage can therefore cause failure even if byte repair could otherwise succeed | E01 O04 | NOT RUN |
| F-L045-09 | this follows the accepted canonical-padding rule. | E01 O04 | NOT RUN |
| F-L047-01 | The fixed header is not separately encrypted. | R08 R03 | NOT RUN |
| F-L047-02 | It is stored at secret keyed positions, repaired, and later authenticated as GCM additional data. | R08 R03 | NOT RUN |
| F-L047-03 | It has no integrity status merely because repair or field checks passed. | R08 R03 | NOT RUN |
| F-L047-04 | Its length fields can authorize only the bounded read described below, never decompression or output. | R08 R03 | NOT RUN |
| F-L051-01 | All multibyte integers in this header and in GCM additional data are unsigned **big-endian**. | R02 R03 E01 | NOT RUN |
| F-L051-02 | Header offsets are zero-based. | R02 R03 E01 | NOT RUN |
| F-L051-03 | There are exactly 32 header data bytes: | R02 R03 E01 | NOT RUN |
| F-L053-01 | &#124; Offset &#124; Bytes &#124; Meaning and accepted value &#124; | R02 R03 E01 | NOT RUN |
| F-L055-01 | &#124; 0–11 &#124; 12 &#124; Fresh CSPRNG AES-GCM nonce &#124; | R02 R03 E01 | NOT RUN |
| F-L056-01 | &#124; 12–15 &#124; 4 &#124; Stored message length `S`, 0–512 bytes &#124; | R02 R03 E01 | NOT RUN |
| F-L057-01 | &#124; 16–19 &#124; 4 &#124; Original UTF-8 length `L`, 0–1,048,576 bytes &#124; | R02 R03 E01 | NOT RUN |
| F-L058-01 | &#124; 20 &#124; 1 &#124; Body parity bytes: `0x10` &#124; | R02 R03 E01 | NOT RUN |
| F-L059-01 | &#124; 21 &#124; 1 &#124; Whole-byte round-robin interleave: `0x01` &#124; | R02 R03 E01 | NOT RUN |
| F-L060-01 | &#124; 22 &#124; 1 &#124; Compression: `0x00` raw UTF-8; `0x01` gzip &#124; | R02 R03 E01 | NOT RUN |
| F-L061-01 | &#124; 23 &#124; 1 &#124; New binary format version: `0x01` &#124; | R02 R03 E01 | NOT RUN |
| F-L062-01 | &#124; 24 &#124; 1 &#124; Argon2id profile: `0x01` &#124; | R02 R03 E01 | NOT RUN |
| F-L063-01 | &#124; 25 &#124; 1 &#124; Credential mode: `0x01`, one password &#124; | R02 R03 E01 | NOT RUN |
| F-L064-01 | &#124; 26 &#124; 1 &#124; Accepted adaptive matrix carrier: `0x01` &#124; | R02 R03 E01 | NOT RUN |
| F-L065-01 | &#124; 27–31 &#124; 5 &#124; Reserved, all zero &#124; | R02 R03 E01 | NOT RUN |
| F-L067-01 | For raw text require `L = S`. | R02 R03 E01 | NOT RUN |
| F-L067-02 | For gzip require `0 < S < L`. | R02 R03 E01 | NOT RUN |
| F-L067-03 | Empty text has only the raw representation | R02 R03 E01 | NOT RUN |
| F-L067-04 | accepting an empty wire message does not require the app forms to offer empty-message creation. | R02 R03 E01 | NOT RUN |
| F-L067-05 | Reject every unsupported value, nonzero reserved byte or inconsistent length, without another mode or interpretation. | R02 R03 E01 | NOT RUN |
| F-L069-01 | Keep the accepted exact password bytes, Argon2id tuple and HKDF labels unchanged. | K04 E05 E01 | NOT RUN |
| F-L069-02 | Encrypt the `S` stored bytes once with the accepted encryption child key and the header nonce, using AES-256-GCM with **exactly 16 tag bytes**. | K04 E05 E01 | NOT RUN |
| F-L069-03 | The AEAD body before repair is `ciphertext[S] &#124;&#124; tag[16]`. | K04 E05 E01 | NOT RUN |
| F-L069-04 | The nonce occurs only in the header. | K04 E05 E01 | NOT RUN |
| F-L069-05 | Fresh encoding attempts get both a fresh 16-byte salt and a fresh 12-byte nonce | K04 E05 E01 | NOT RUN |
| F-L069-06 | controlled vectors are the only exception. | K04 E05 E01 | NOT RUN |
| F-L071-01 | The exact 56-byte GCM additional data is: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L073-01 | `rawSalt[16] &#124;&#124; headerData[32] &#124;&#124; width_u32be[4] &#124;&#124; height_u32be[4]`. | K04 E05 E01 | NOT RUN |
| F-L075-01 | This authenticates the salt, nonce, both lengths, all settings, version, reserved bytes and geometry. | K04 E05 E01 | NOT RUN |
| F-L075-02 | Header/body partition, salt coordinates, scoring, sampler, matrix rule and RS parameters are fixed by this format/profile, not independently selectable fields. | K04 E05 E01 | NOT RUN |
| F-L075-03 | Do not store root or child keys. | K04 E05 E01 | NOT RUN |
| F-L075-04 | No second encryption or nonce domain is needed. | K04 E05 E01 | NOT RUN |
| F-L077-01 | PNG file bytes, unrelated RGB values, color type, alpha representation and rendering metadata are not GCM additional data. | R06 | NOT RUN |
| F-L077-02 | The guarantee authenticates the recovered message and decoding settings, not the entire cover image or its appearance. | R06 | NOT RUN |
| F-L077-03 | RGB and opaque RGBA encodings of the same samples can interoperate. | R06 | NOT RUN |
| F-L077-04 | PNG rewrites that preserve RGB samples and geometry remain readable if they pass the supported envelope policy. | R06 | NOT RUN |
| F-L081-01 | Retain the pinned licensed ZXing-derived implementation and notices. | R02 R04 E01 O05 | NOT RUN |
| F-L081-02 | The wire code is systematic shortened RS over `GF(256)`, primitive polynomial `0x11d`, primitive element `0x02`, generator base zero, 16 parity bytes. | R02 R04 E01 O05 | NOT RUN |
| F-L081-03 | Equivalently, the generator has roots `alpha^0` through `alpha^15` | R02 R04 E01 O05 | NOT RUN |
| F-L081-04 | data is highest-coefficient first and parity follows data. | R02 R04 E01 O05 | NOT RUN |
| F-L081-05 | Shorten by omitting leading zero data symbols | R02 R04 E01 O05 | NOT RUN |
| F-L081-06 | transmit no zero fill. | R02 R04 E01 O05 | NOT RUN |
| F-L083-01 | Encode the 32 header bytes as one 48-byte codeword. | R02 R04 E01 O05 | NOT RUN |
| F-L083-02 | For the body, split `S+16` bytes into consecutive data blocks of at most **239** bytes. | R02 R04 E01 O05 | NOT RUN |
| F-L083-03 | Append 16 parity bytes to every block, including the last short block. | R02 R04 E01 O05 | NOT RUN |
| F-L083-04 | Do not append an empty block when the length is an exact multiple of 239. | R02 R04 E01 O05 | NOT RUN |
| F-L083-05 | Under the current limit there are one to three body codewords, within the accepted maximum of four. | R02 R04 E01 O05 | NOT RUN |
| F-L085-01 | Interleave body codewords by column: output byte 0 of each codeword in order, then byte 1 of each, continuing through column 254 and skipping a codeword once it is exhausted. | R02 R04 E01 O05 | NOT RUN |
| F-L085-02 | Do not pad a short codeword. | R02 R04 E01 O05 | NOT RUN |
| F-L085-03 | Do not interleave the separate header with the body. | R02 R04 E01 O05 | NOT RUN |
| F-L085-04 | The decoder calculates these exact block lengths, reverses interleaving, and attempts each codeword once. | R02 R04 E01 O05 | NOT RUN |
| F-L085-05 | Use bounded unknown-error correction, no erasure search or retries | R02 R04 E01 O05 | NOT RUN |
| F-L085-06 | reject a reported correction count above eight or a nonzero residual syndrome. | R02 R04 E01 O05 | NOT RUN |
| F-L085-07 | A codeword can miscorrect beyond its radius, so only GCM establishes acceptance. | R02 R04 E01 O05 | NOT RUN |
| F-L087-01 | Let `C = S + 16`, `r = ceil(C/239)`, `D = C + 16r` repaired body bytes, and `G = 128 + ceil(8D/3)` matrix groups. | R02 R04 E01 O05 | NOT RUN |
| F-L087-02 | Require both accepted inequalities: | R02 R04 E01 O05 | NOT RUN |
| F-L089-01 | - `3G <= floor(B/50)`; | R02 R04 E01 O05 | NOT RUN |
| F-L090-01 | - `7G <= B`. | R02 R04 E01 O05 | NOT RUN |
| F-L092-01 | The 128 raw salt samples are excluded before `E` and are accounted for separately. | R02 R04 E01 O05 | NOT RUN |
| F-L092-02 | The 48-byte header includes its nonce and 16 parity bytes. | R02 R04 E01 O05 | NOT RUN |
| F-L092-03 | Body sizes include the full GCM tag and every parity byte. | R02 R04 E01 O05 | NOT RUN |
| F-L092-04 | Matrix symbol padding also counts. | R02 R04 E01 O05 | NOT RUN |
| F-L092-05 | Compute net capacity as the largest `S` in 0–512 satisfying both inequalities | R02 R04 E01 O05 | NOT RUN |
| F-L092-06 | distinguish no frame capacity from an empty-message-only capacity. | R02 R04 E01 O05 | NOT RUN |
| F-L092-07 | Reject before modifying/exporting the output if the selected stored message does not fit. | R02 R04 E01 O05 | NOT RUN |
| F-L094-01 | &#124; Stored bytes &#124; Body codeword sizes &#124; Keyed coded bits, including symbol padding &#124; Keyed positions &#124; Minimum `B` &#124; | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L096-01 | &#124; 0 &#124; 32 &#124; 642 &#124; 1,498 &#124; 32,100 &#124; | R02 R04 E01 O05 | NOT RUN |
| F-L097-01 | &#124; 223 &#124; 255 &#124; 2,424 &#124; 5,656 &#124; 121,200 &#124; | R02 R04 E01 O05 | NOT RUN |
| F-L098-01 | &#124; 224 &#124; 255, 17 &#124; 2,562 &#124; 5,978 &#124; 128,100 &#124; | R02 R04 E01 O05 | NOT RUN |
| F-L099-01 | &#124; 462 &#124; 255, 255 &#124; 4,464 &#124; 10,416 &#124; 223,200 &#124; | R02 R04 E01 O05 | NOT RUN |
| F-L100-01 | &#124; 463 &#124; 255, 255, 17 &#124; 4,602 &#124; 10,738 &#124; 230,100 &#124; | R02 R04 E01 O05 | NOT RUN |
| F-L101-01 | &#124; 512 &#124; 255, 255, 66 &#124; 4,992 &#124; 11,648 &#124; 249,600 &#124; | R02 R04 E01 O05 | NOT RUN |
| F-L103-01 | At maximum payload there are 624 keyed coded bytes before matrix packing, plus the separate 16-byte raw salt. | R02 R04 E01 O05 | NOT RUN |
| F-L103-02 | The retained rate ceiling permits 512 stored bytes only when the actual eligible domain is large enough. | R02 R04 E01 O05 | NOT RUN |
| F-L103-03 | It does not promise that every admitted-size PNG has that capacity or that this rate is concealed. | R02 R04 E01 O05 | NOT RUN |
| F-L107-01 | The sender rejects unpaired UTF-16 surrogates rather than substituting replacement characters, encodes exact UTF-8 without normalization, and bounds the original bytes by 1 MiB. | R01 O03 | NOT RUN |
| F-L107-02 | The receiver uses fatal UTF-8 validation and preserves a leading UTF-8 BOM as U+FEFF rather than silently removing it. | R01 O03 | NOT RUN |
| F-L107-03 | No line-ending or text normalization is permitted. | R01 O03 | NOT RUN |
| F-L109-01 | Retain gzip, already used by both apps. | O06 O07 | NOT RUN |
| F-L109-02 | Use it only when requested and strictly smaller than the raw UTF-8 bytes | O06 O07 | NOT RUN |
| F-L109-03 | otherwise store raw bytes if those fit. | O06 O07 | NOT RUN |
| F-L109-04 | An unavailable/failed compressor is an explicit operation error, not that size comparison. | O06 O07 | NOT RUN |
| F-L109-05 | Reject when neither permitted representation fits. | O06 O07 | NOT RUN |
| F-L109-06 | Bound compression output while producing it | O06 O07 | NOT RUN |
| F-L109-07 | a size-bound abort may select raw only when raw fits. | O06 O07 | NOT RUN |
| F-L109-08 | Never encode a partial compressed stream. | O06 O07 | NOT RUN |
| F-L111-01 | For interoperability, use one gzip member with fixed header bytes `1f8b08000000000000ff`: DEFLATE, no flags or optional fields, zero time, XFL zero, OS unspecified. | R05 R07 | NOT RUN |
| F-L111-02 | Its trailer uses standard gzip CRC32 and original-length fields, **little-endian as required by gzip**. | R05 R07 | NOT RUN |
| F-L111-03 | Compressor DEFLATE choices may differ | R05 R07 | NOT RUN |
| F-L111-04 | compressed bytes need not be identical across implementations. | R05 R07 | NOT RUN |
| F-L111-05 | The decoder requires that exact header, a valid CRC/length trailer, one completed member and no trailing bytes or second member. | R05 R07 | NOT RUN |
| F-L111-06 | It must use a bounded decoder that reports complete input consumption. | R05 R07 | NOT RUN |
| F-L111-07 | After GCM succeeds, bound expansion by authenticated `L` and 1 MiB, then require exactly `L` bytes and valid UTF-8. | R05 R07 | NOT RUN |
| F-L111-08 | A final length comparison after unbounded expansion is not sufficient. | R05 R07 | NOT RUN |
| F-L113-01 | Operational ceilings are policy, not measured device support: | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L115-01 | - Source and exported PNG: at most 16 MiB each. | O03 P03 | NOT RUN |
| F-L115-02 | Width and height: 1–1,024 each | O03 P03 | NOT RUN |
| F-L115-03 | pixels at most 1,048,576. | O03 P03 | NOT RUN |
| F-L116-01 | - At most two application-owned full RGBA8 buffers, together at most 8,388,608 bytes. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L116-02 | No duplicate canvas raster for codec input. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L116-03 | Preview decoding is separate from raw-sample processing. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L117-01 | - PNG filtered-raster inflation must produce exactly `(width * channels + 1) * height` bytes, at most 4,195,328 | P02 | NOT RUN |
| F-L117-02 | check the ceiling while inflating. | P02 | NOT RUN |
| F-L117-03 | At most one such filtered-raster buffer, or bounded row buffers instead. | P02 | NOT RUN |
| F-L117-04 | Reject extra compressed streams, trailing compressed bytes, an early end or excess output. | P02 | NOT RUN |
| F-L118-01 | - Score storage at most one `Uint16` value per pixel (2 MiB), histogram 3,049 counters, eligible indices at most 786,432 `Uint32` values (3 MiB). | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L118-02 | A lower-allocation equivalent is allowed. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L118-03 | This is an eligible-domain representation, not a full shuffled permutation. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L118-04 | Keep the accepted sparse sampler, at most `k` swap entries, 4,096-byte stream chunks and at most 8,192 paired stream-buffer bytes. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L119-01 | - Header extraction is fixed at 896 positions. | K10 R09 | NOT RUN |
| F-L119-02 | Before accepting header lengths, enforce the prefix draw ceiling `2*896+1024 = 2816`. | K10 R09 | NOT RUN |
| F-L119-03 | After bounded header parsing, enforce `2*k+1024` cumulatively for the exact total requested `k` | K10 R09 | NOT RUN |
| F-L119-04 | no reset of the draw counter. | K10 R09 | NOT RUN |
| F-L119-05 | This frame needs at most 11,648 positions and 24,320 draws. | K10 R09 | NOT RUN |
| F-L119-06 | The earlier absolute ceilings remain, but cannot authorize a larger frame. | K10 R09 | NOT RUN |
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
| F-L139-01 | 1. | E06 | NOT RUN |
| F-L139-02 | Validate password input and the bounded PNG envelope | E06 | NOT RUN |
| F-L139-03 | obtain the raw raster. | E06 | NOT RUN |
| F-L139-04 | Reproduce eligibility and reject an image too small even for the minimum frame. | E06 | NOT RUN |
| F-L140-01 | 2. | R02 R03 R09 | NOT RUN |
| F-L140-02 | Read the raw salt once | R02 R03 R09 | NOT RUN |
| F-L140-03 | derive the fixed Argon2id root and accepted encryption/placement keys once. | R02 R03 R09 | NOT RUN |
| F-L141-01 | 3. | R02 R03 R09 | NOT RUN |
| F-L141-02 | Generate the fixed header prefix, matrix-extract 48 bytes, repair once, and check fixed fields and bounded lengths. | R02 R03 R09 | NOT RUN |
| F-L141-03 | These are still untrusted values. | R02 R03 R09 | NOT RUN |
| F-L141-04 | An unsupported field is a rejection, never a routing instruction. | R02 R03 R09 | NOT RUN |
| F-L142-01 | 4. | R02 R03 R09 | NOT RUN |
| F-L142-02 | Compute exact body/repair/group sizes and enforce both capacity inequalities before further reads or allocations. | R02 R03 R09 | NOT RUN |
| F-L142-03 | Continue the same sampler and enforce cumulative budgets. | R02 R03 R09 | NOT RUN |
| F-L143-01 | 5. | R02 R03 R09 | NOT RUN |
| F-L143-02 | Matrix-extract exactly the body bytes and canonical final padding | R02 R03 R09 | NOT RUN |
| F-L143-03 | reverse interleaving and repair each body codeword once. | R02 R03 R09 | NOT RUN |
| F-L143-04 | Require exactly `S+16` bytes, split exactly 16 bytes as the tag, and verify GCM with the exact AAD. | R02 R03 R09 | NOT RUN |
| F-L144-01 | 6. | R01 R05 R07 | NOT RUN |
| F-L144-02 | Only after authentication, decompress if indicated, require the exact original byte length and fatal UTF-8 decoding, then release text. | R01 R05 R07 | NOT RUN |
| F-L144-03 | Native decrypt-update output stays private until final authentication | R01 R05 R07 | NOT RUN |
| F-L144-04 | no preview, log or partial save sees it. | R01 R05 R07 | NOT RUN |
| F-L146-01 | Public PNG/geometry/capacity checks and the raw salt reveal no test of the supplied password. | R08 | NOT RUN |
| F-L146-02 | The salt has no recognition or repair redundancy. | R08 | NOT RUN |
| F-L146-03 | Header RS syndromes, fixed fields, lengths, matrix padding, body RS and the GCM tag can reject a password guess, but each requires positions derived from the expensive Argon2id root. | R08 | NOT RUN |
| F-L146-04 | An attacker can stop at the earliest such rejection | R08 | NOT RUN |
| F-L146-05 | do not charge each guess the full legitimate decode cost. | R08 | NOT RUN |
| F-L146-06 | Direct searches over the placement/encryption keys remain full-width key attacks, not reduced-seed paths. | R08 | NOT RUN |
| F-L146-07 | Extraction of the entire frame does not remove password-based confidentiality. | R08 | NOT RUN |
| F-L146-08 | Weak or reused passwords remain weak | R08 | NOT RUN |
| F-L146-09 | no claim of 256 bits of password entropy follows. | R08 | NOT RUN |
| F-L148-01 | No public format marker is introduced, but fixed salt writes, adaptive selection, repair relationships, metadata changes and PNG encoding can still contribute to detection. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L148-02 | This is an argument about routing and recognizers, not proof of concealment or an independent security review. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L150-01 | Before hidden decoding, missing/invalid password input, unsupported PNGs, resource failures and explicit cancellation can have specific guidance. | R03 | NOT RUN |
| F-L150-02 | After hidden decoding starts, salt/keyed-header/repair/padding/tag failures use the accepted common meaning: | R03 | NOT RUN |
| F-L152-01 | > Could not recover an authenticated message. | R03 | NOT RUN |
| F-L152-02 | The password may be wrong, or the image may be damaged or changed. | R03 | NOT RUN |
| F-L154-01 | Do not identify an unknown hidden profile or plain/legacy image from unauthenticated header bytes. | R03 | NOT RUN |
| F-L154-02 | Authenticated but invalid text/compression also produces no text. | R03 | NOT RUN |
| F-L154-03 | Do not expose internal recognizer-stage diagnostics to users or log secrets. | R03 | NOT RUN |
| F-L154-04 | There is no compatibility fallback, second password, alternate carrier, repair downgrade, retry or recovery promise for changed salt, geometry or upper bits. | R03 | NOT RUN |
| F-L158-01 | The following is a **framing-only test vector**, not an Argon2id vector. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L158-02 | Supply the stated encryption key directly. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L158-03 | Fixed salt/nonce/key values are forbidden in real encoding. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L161-01 | UTF-8 message: Hi | K04 | NOT RUN |
| F-L162-01 | width = height = 1024 | K04 | NOT RUN |
| F-L163-01 | key = 000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f | K04 | NOT RUN |
| F-L164-01 | salt = 000102030405060708090a0b0c0d0e0f | K04 | NOT RUN |
| F-L165-01 | header = a0a1a2a3a4a5a6a7a8a9aaab0000000200000002100100010101010000000000 | K04 | NOT RUN |
| F-L166-01 | AAD = 000102030405060708090a0b0c0d0e0fa0a1a2a3a4a5a6a7a8a9aaab00000002000000021001000101010100000000000000040000000400 | K04 | NOT RUN |
| F-L167-01 | plaintext = 4869 | K04 | NOT RUN |
| F-L168-01 | ciphertext &#124;&#124; tag = ae718862b4a46f027f90688844858e705203 | K04 | NOT RUN |
| F-L171-01 | The header becomes one 48-byte RS codeword. | E01 | NOT RUN |
| F-L171-02 | The 18-byte AEAD body becomes one 34-byte codeword. | E01 | NOT RUN |
| F-L171-03 | Its 272 bits need 91 body groups and one zero padding bit | E01 | NOT RUN |
| F-L171-04 | with 128 header groups this is 219 groups, 657 charged bits and 1,533 keyed positions. | E01 | NOT RUN |
| F-L171-05 | Salt positions are separately reserved | E01 | NOT RUN |
| F-L171-06 | no complete PNG fixture is claimed by this vector. | E01 | NOT RUN |
| F-L173-01 | The later specification must retain the accepted independent root/key/stream/position vectors and add complete-format fixtures with salt exclusions, eligibility ties, final-symbol padding, all shortened-block transitions and exact PNG/sample handling. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L173-02 | Required integrated checks still include both real browser/CLI exchange directions, Unicode/BOM, compression limits and malformed streams, altered authenticated fields, full-tag enforcement, plain/old/wrong-password images, resource/cancellation behavior, existing bounded detection and damage checks, named physical devices, dependency/license review and independent review of the finished format and implementation. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L173-03 | This agreement supplies the design | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L173-04 | none of those release checks is marked passed by this framing exercise. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L173-05 | No new corpus, detector training or confirmation study is required. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| F-L179-01 | Use 128 fixed, spread-out raw salt positions and put profile IDs in the keyed header. | R08 | NOT RUN |
| F-L179-02 | This avoids a public profile marker and any salt search. | R08 | NOT RUN |
| F-L179-03 | The price is one derivation even for many plain, old or unsupported hidden images, and unrecoverable salt damage. | R08 | NOT RUN |
| F-L179-04 | Explicitly narrow the earlier pre-KDF image-profile check as stated in the contract. | R08 | NOT RUN |
| F-L179-05 | A public selector would allow earlier dispatch but add recognizable structure. | R08 | NOT RUN |
| F-L183-01 | Reuse the pilot's clear 32-byte header at keyed positions and one GCM tag, with the exact fields and AAD above. | R03 K04 | NOT RUN |
| F-L183-02 | This avoids another encryption/key/nonce scheme and keeps the frame small. | R03 K04 | NOT RUN |
| F-L183-03 | The price is that header lengths remain untrusted until final authentication | R03 K04 | NOT RUN |
| F-L183-04 | they may authorize only tightly bounded extraction. | R03 K04 | NOT RUN |
| F-L183-05 | Separate header authentication would reject bad metadata earlier but consume additional bytes and protocol machinery. | R03 K04 | NOT RUN |
| F-L187-01 | The contract fixes shortened blocks, interleaving and matrix boundaries without changing the carrier. | E01 O05 | NOT RUN |
| F-L187-02 | The largest stored message uses 11,648 keyed positions and needs at least 249,600 eligible-budget samples. | E01 O05 | NOT RUN |
| F-L187-03 | Its price is limited net capacity and no repair guarantee when salt or placement changes | E01 O05 | NOT RUN |
| F-L187-04 | raising the rate or weakening repair is not an automatic option. | E01 O05 | NOT RUN |
| F-L191-01 | Keep the existing compression family, authenticate before expansion, preserve the exact text and reject extra members, trailing data and excess output. | R05 R07 | NOT RUN |
| F-L191-02 | This needs a bounded shared parsing contract rather than each platform's permissive defaults. | R05 R07 | NOT RUN |
| F-L191-03 | Raw-only text would be simpler but would discard the accepted optional-compression route. | R05 R07 | NOT RUN |
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
| A-L040-01 | &#124; `prepareEncode({ pngBytes, message, compress }, control)` &#124; Validates bounded PNG/text inputs and prepares the selected raw/gzip bytes. Returns an opaque preparation handle and `{ originalBytes, storedBytes, compressionUsed, maxStoredBytes, hasFrameCapacity, fits, metadataNotice }`. Runs no KDF and consumes no salt or nonce. &#124; | O01 O03 O05 | NOT RUN |
| A-L041-01 | &#124; `encode({ preparation, password }, control)` &#124; Consumes the current preparation, validates the password, performs one fresh encode and returns complete PNG bytes plus its capacity summary. Does not write a file or download anything. &#124; | E04 E05 | NOT RUN |
| A-L042-01 | &#124; `decode({ pngBytes, password }, control)` &#124; Applies the complete accepted decode contract and returns exact authenticated text, or a safe typed failure. Never returns intermediate plaintext or a partially recovered result. &#124; | R01 R03 | NOT RUN |
| A-L043-01 | &#124; `discard(preparation)` &#124; Releases an unused preparation when its inputs change, the user clears the form or the worker closes. &#124; | O02 E04 | NOT RUN |
| A-L045-01 | `control` carries cancellation and safe progress events, not algorithm/profile overrides. | O02 E04 | NOT RUN |
| A-L045-02 | A preparation is worker-owned, single-use, tied to exact input bytes/text/compression, and limited to one per app instance. | O02 E04 | NOT RUN |
| A-L045-03 | Replacing it releases the old one. | O02 E04 | NOT RUN |
| A-L045-04 | Transfer owned buffers where possible | O02 E04 | NOT RUN |
| A-L045-05 | do not retain another raster or recompress the same prepared text at encode time. | O02 E04 | NOT RUN |
| A-L045-06 | Public file-size limits are checked before reading the entire source into memory, and the shared module enforces its own bounds too. | O02 E04 | NOT RUN |
| A-L045-07 | Preparing and encoding do not overlap. | O02 E04 | NOT RUN |
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
| A-L079-01 | Both apps show `storedBytes / maxStoredBytes`, original UTF-8 bytes, and whether compression was actually used. | U01 O05 O07 | NOT RUN |
| A-L079-02 | Capacity includes every accepted header, tag, repair and symbol-padding cost | U01 O05 O07 | NOT RUN |
| A-L079-03 | use the format's exact calculation, not RGB bit count or a dummy encryption. | U01 O05 O07 | NOT RUN |
| A-L079-04 | Distinguish an image with no complete-frame capacity from one that admits only an empty wire message. | U01 O05 O07 | NOT RUN |
| A-L079-05 | The creation form admits neither case for a nonempty message. | U01 O05 O07 | NOT RUN |
| A-L081-01 | Compression stays opt-in. | U01 O05 O07 | NOT RUN |
| A-L081-02 | Use the prepared representation only when the accepted rules permit it and it is smaller. | U01 O05 O07 | NOT RUN |
| A-L081-03 | Show raw fallback when compression does not save space | U01 O05 O07 | NOT RUN |
| A-L081-04 | compressor errors remain errors. | U01 O05 O07 | NOT RUN |
| A-L081-05 | Do not promise “50–90% reduction.” Cap stored text at 512 bytes, original text at 1 MiB, PNG source/output at 16 MiB, and dimensions at 1,024 per side, subject to all stricter format checks. | U01 O05 O07 | NOT RUN |
| A-L081-06 | A detailed image can still have insufficient net capacity. | U01 O05 O07 | NOT RUN |
| A-L081-07 | If it does not fit, suggest a shorter message, optional compression, or a different supported detailed PNG—not an automatic resize, higher rate or weaker repair. | U01 O05 O07 | NOT RUN |
| A-L083-01 | Before encoding, disclose: only the accepted opaque, noninterlaced RGB/RGBA8 PNG profile is supported | U01 E08 | NOT RUN |
| A-L083-02 | personal metadata is removed | U01 E08 | NOT RUN |
| A-L083-03 | only approved rendering metadata is preserved | U01 E08 | NOT RUN |
| A-L083-04 | some otherwise valid PNGs will be rejected. | U01 E08 | NOT RUN |
| A-L083-05 | Report preparation errors instead of leaving a capacity spinner running. | U01 E08 | NOT RUN |
| A-L083-06 | Invalidate stale preparation/results when an input changes. | U01 E08 | NOT RUN |
| A-L085-01 | Use common typed outcomes for invalid input, unsupported PNG, input/resource limit, insufficient capacity, unavailable runtime, cancellation, I/O and failed recovery. | R03 | NOT RUN |
| A-L085-02 | Input/public-envelope problems and local runtime failures can give specific, safe guidance. | R03 | NOT RUN |
| A-L085-03 | Hidden profile/header/repair/padding/tag failures and invalid recovered text/compression all return no text and the settled message: | R03 | NOT RUN |
| A-L087-01 | > Could not recover an authenticated message. | R03 | NOT RUN |
| A-L087-02 | The password may be wrong, or the image may be damaged or changed. | R03 | NOT RUN |
| A-L089-01 | Do not label unauthenticated hidden bytes “unsupported format,” identify an old/plain image, or expose which recognizer failed. | R03 | NOT RUN |
| A-L089-02 | General help explains that old images and plain images can produce the same failure. | R03 | NOT RUN |
| A-L089-03 | State prominently that the new format cannot read old images, with no legacy option, migration tool or old-release recovery journey. | R03 | NOT RUN |
| A-L089-04 | These restrictions reduce diagnostic detail but preserve the agreed failure meaning and clean format break. | R03 | NOT RUN |
| A-L093-01 | Use shared progress phases: checking inputs, preparing text/capacity, deriving keys, encoding or recovering, and preparing the result. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L093-02 | Recovery uses one broad stage rather than exposing header/repair/tag success. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L093-03 | Show a spinner and phase, not invented percentages, crack times or a promised completion time. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L093-04 | CLI hides the spinner outside a TTY. | No exact check established; see gaps and Human/release gates | UNMET — review/observation absent |
| A-L095-01 | All expensive preparation and encode/decode work runs in a Web Worker or Node worker thread, with one active operation per app instance and all accepted allocation/work bounds. | O08 O10 U02 | NOT RUN |
| A-L095-02 | Browser Cancel and CLI Ctrl-C terminate the operation, discard partial results and suppress late worker responses | O08 O10 U02 | NOT RUN |
| A-L095-03 | cancellation is not an authentication failure. | O08 O10 U02 | NOT RUN |
| A-L095-04 | The next action starts with a fresh worker state. | O08 O10 U02 | NOT RUN |
| A-L095-05 | A changed input cancels obsolete capacity work | O08 O10 U02 | NOT RUN |
| A-L095-06 | it must not silently cancel or restart an encode using a different password. | O08 O10 U02 | NOT RUN |
| A-L097-01 | If required crypto, secure randomness, workers, WASM, CSP permissions or allocation are unavailable, explain that this runtime cannot complete the operation and suggest a release-supported browser or local CLI. | O09 | NOT RUN |
| A-L097-02 | Do not switch KDFs, reduce costs, retry profiles or run an uncancellable main-thread fallback. | O09 | NOT RUN |
| A-L097-03 | Do not add an arbitrary wall-clock timeout: retain user cancellation and the accepted work ceilings. | O09 | NOT RUN |
| A-L097-04 | The three-second key-ready target remains a release measurement, not a timer that changes security settings. | O09 | NOT RUN |
| A-L097-05 | This costs worker lifecycle work | O09 | NOT RUN |
| A-L097-06 | named-device support and complete-process memory remain unproved until the existing release checks pass. | O09 | NOT RUN |
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
| S-L031-01 | - Preserve the agreed async interfaces: prepareEncode({pngBytes,message,compress}, control), encode({preparation,password}, control), decode({pngBytes,password}, control), and discard(preparation). | O01 O02 E04 | NOT RUN |
| S-L031-02 | Control carries cancellation and safe progress, not profile overrides. | O01 O02 E04 | NOT RUN |
| S-L032-01 | - prepareEncode returns an opaque preparation and originalBytes, storedBytes, compressionUsed, maxStoredBytes, hasFrameCapacity, fits and metadataNotice. | O01 O02 E04 | NOT RUN |
| S-L032-02 | It runs no KDF and consumes no salt/nonce randomness. | O01 O02 E04 | NOT RUN |
| S-L032-03 | It validates/prepares exact bytes once | O01 O02 E04 | NOT RUN |
| S-L032-04 | encode consumes that current handle without recompressing. | O01 O02 E04 | NOT RUN |
| S-L032-05 | No KDF runs when preparation cannot fit. | O01 O02 E04 | NOT RUN |
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
| S-L044-01 | - Passwords are exact nonempty UTF-8, at most 1,024 bytes. | K05 | NOT RUN |
| S-L044-02 | Reject unpaired surrogates | K05 | NOT RUN |
| S-L044-03 | perform no trimming, normalization or newline removal. | K05 | NOT RUN |
| S-L044-04 | Use one password, never separate-stage passwords. | K05 | NOT RUN |
| S-L045-01 | - Fix Argon2id v19 to memory 65,536 KiB (67,108,864 bytes), t=3, p=1, salt 16 bytes, root 32 bytes and empty secret/associated data. | K01 | NOT RUN |
| S-L045-02 | Profile identifier is 0x01. | K01 | NOT RUN |
| S-L045-03 | Pin libsodium-wrappers-sumo and libsodium-sumo to 0.8.4. | K01 | NOT RUN |
| S-L045-04 | Use raw crypto_pwhash with opslimit 3, memlimit 67,108,864 and ARGON2ID13, not a library default or a password-hash string. | K01 | NOT RUN |
| S-L046-01 | - Generate a fresh CSPRNG salt of 16 bytes and GCM nonce of 12 bytes on every encode attempt. | K01 E05 | NOT RUN |
| S-L046-02 | HKDF-SHA256 uses root as IKM and 32 zero bytes as salt. | K01 E05 | NOT RUN |
| S-L046-03 | Its exact UTF-8 info strings, without a terminator, are obscr/keys/1/encryption and obscr/keys/1/placement | K01 E05 | NOT RUN |
| S-L046-04 | each output is 32 bytes. | K01 E05 | NOT RUN |
| S-L046-05 | Keep salt/public fields separate from secret keys. | K01 E05 | NOT RUN |
| S-L046-06 | Retain no derived-key cache. | K01 E05 | NOT RUN |
| S-L047-01 | - Placement consumes native AES-256-CTR encryption of zero bytes with the entire placement key and initial zero 16-byte counter. | K02 K03 K09 | NOT RUN |
| S-L047-02 | Increment the full 128-bit counter big-endian, continuously across chunks, preserve unused bytes and forbid wrap. | K02 K03 K09 | NOT RUN |
| S-L048-01 | - Draw little-endian uint32 values. | K06 K08 K09 K10 | NOT RUN |
| S-L048-02 | Sample without replacement over the full eligible domain by swapping a selected live entry with the last live entry, represented sparsely. | K06 K08 K09 K10 | NOT RUN |
| S-L048-03 | For live size b reject x >= floor(2^32/b)*b before x modulo b. | K06 K08 K09 K10 | NOT RUN |
| S-L048-04 | No modulo-only shortcut, full-image permutation or retry fallback. | K06 K08 K09 K10 | NOT RUN |
| S-L048-05 | Keep stream chunks at most 4,096 bytes and their paired input/output buffers at most 8,192 bytes | K06 K08 K09 K10 | NOT RUN |
| S-L048-06 | the complete-format limits below are tighter than the general sampler ceiling. | K06 K08 K09 K10 | NOT RUN |
| S-L050-01 | - For pixel P=width*height, scalar q=3*(y*width+x)+channel in row-major RGB order. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L050-02 | Write salt bit i=0..127 at floor(i*3P/128), MSB-first from the 16 salt bytes. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L050-03 | Require 3P>=128 and real frame capacity. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L050-04 | These raw bits have no repair, magic, checksum, alternate location or search. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L050-05 | Read this salt once before the one KDF. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L051-01 | - Rank pixels from upper RGB bits U=sample & 254. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L051-02 | Score is the sum over RGB of abs(d*U - sum(valid four-neighbor U)), with d the number of valid up/down/left/right neighbors. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L051-03 | Scores range 0..3,048. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L051-04 | Admit at most floor(P/4) positive-score pixels, highest score first and row-major order at ties. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L051-05 | Use a 3,049-entry histogram, not a full pixel sort. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L051-06 | Flat images have no capacity. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L052-01 | - Eligible scalars are RGB channels of selected pixels in row-major/RGB order, excluding salt positions. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L052-02 | E is the full eligible count | E01 R02 R03 O04 O05 | NOT RUN |
| S-L052-03 | B=min(E,262,144) is a budget, not a truncation of the sampled domain. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L053-01 | - Key-order groups of seven eligible positions. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L053-02 | XOR the column numbers 1..7 whose sample LSB is one | E01 R02 R03 O04 O05 | NOT RUN |
| S-L053-03 | the resulting three-bit symbol is changed to the target by flipping at most the indicated single bit. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L053-04 | Pack symbols MSB-first with canonical zero final padding. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L053-05 | Header and body use separate seven-position groups. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L053-06 | Alpha stays unchanged. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L053-07 | There is no random filler, STC or Stenoxide dependency. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L055-01 | - The first 896 sampled positions (128 groups) carry the 48-byte repaired header. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L055-02 | Continue the same sampler stream for the body, without resetting, sorting or gaps. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L055-03 | Profile discovery is implicit and fixed | E01 R02 R03 O04 O05 | NOT RUN |
| S-L055-04 | all hidden recognition follows the expensive root. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-01 | - The 32-byte header is: nonce at bytes 0–11 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-02 | S stored length as uint32 big-endian at 12–15 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-03 | L original length likewise at 16–19 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-04 | parity=0x10 at 20 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-05 | interleave=0x01 at 21 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-06 | compression 0x00 raw or 0x01 gzip at 22 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-07 | format=0x01 at 23 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-08 | Argon profile=0x01 at 24 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-09 | credential=0x01 at 25 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-10 | matrix carrier=0x01 at 26 | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-11 | zero bytes at 27–31. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-12 | S is 0–512 and L is 0–1,048,576. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-13 | Raw requires L=S | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-14 | gzip requires 0<S<L. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-15 | Empty wire text is valid raw text | E01 R02 R03 O04 O05 | NOT RUN |
| S-L056-16 | creation UI refuses an empty message, not whitespace-only text. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L057-01 | - AES-256-GCM encrypts the S stored bytes once with a full 16-byte tag. | K04 E01 | NOT RUN |
| S-L057-02 | Body is ciphertext followed by tag. | K04 E01 | NOT RUN |
| S-L057-03 | The exact 56-byte AAD is salt[16] &#124;&#124; header[32] &#124;&#124; width_u32be &#124;&#124; height_u32be. | K04 E01 | NOT RUN |
| S-L057-04 | This authenticates decoding settings and message, not every cover sample, PNG encoding or rendering chunk. | K04 E01 | NOT RUN |
| S-L058-01 | - Use a pinned, licensed ZXing-derived systematic shortened Reed–Solomon implementation: GF(256), primitive polynomial 0x11d, primitive element 0x02, generator base 0, roots alpha^0 through alpha^15, highest coefficient first and omitted leading zero shortening. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L058-02 | Header is 32 data + 16 parity bytes. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L058-03 | Body C=S+16 is split into at most 239 data bytes per block with 16 parity each, one to three blocks and no empty block at an exact multiple. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L058-04 | Interleave whole body bytes column-wise across blocks, skipping exhausted blocks | E01 R02 R03 O04 O05 | NOT RUN |
| S-L058-05 | do not interleave the header. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L059-01 | - Permit one repair attempt per block, at most eight corrected symbols and zero residual syndromes. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L059-02 | No erasure search or alternative repairs. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L059-03 | Out-of-radius miscorrection cannot yield accepted plaintext without GCM authentication. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L060-01 | - Let r=ceil(C/239), D=C+16r and G=128+ceil(8D/3). | E01 R02 R03 O04 O05 | NOT RUN |
| S-L060-02 | Require both 3G<=floor(B/50) and 7G<=B. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L060-03 | Return the largest S in 0..512 satisfying both, distinguishing no frame from empty-only capacity. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L060-04 | Test block transitions at S=223/224 and 462/463. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L060-05 | S=512 needs B>=249,600, uses 11,648 positions and at most 24,320 draws | E01 R02 R03 O04 O05 | NOT RUN |
| S-L060-06 | an empty frame needs B>=32,100. | E01 R02 R03 O04 O05 | NOT RUN |
| S-L062-01 | - Validate text for unpaired surrogates before encoding. | R01 O03 | NOT RUN |
| S-L062-02 | Preserve BOM, line endings and whitespace | R01 O03 | NOT RUN |
| S-L062-03 | decode with fatal UTF-8 while preserving BOM. | R01 O03 | NOT RUN |
| S-L062-04 | Original text is at most 1 MiB. | R01 O03 | NOT RUN |
| S-L062-05 | P3 owns guidance | R01 O03 | NOT RUN |
| S-L062-06 | P4 owns exact file/stdin byte routes. | R01 O03 | NOT RUN |
| S-L063-01 | - Gzip is opt-in and used only when smaller. | O06 O07 R05 | NOT RUN |
| S-L063-02 | Its exact ten-byte header is 1f8b08000000000000ff, with one member, valid CRC32 and little-endian ISIZE. | O06 O07 R05 | NOT RUN |
| S-L063-03 | Reject trailing data and extra members. | O06 O07 R05 | NOT RUN |
| S-L063-04 | Bound compression output | O06 O07 R05 | NOT RUN |
| S-L063-05 | if it is larger or hits its size bound, use raw only if raw fits. | O06 O07 R05 | NOT RUN |
| S-L063-06 | A failed/unavailable compressor is an explicit error, not a falsely marked stream. | O06 O07 R05 | NOT RUN |
| S-L064-01 | - Authenticate before bounded decompression. | R05 R07 | NOT RUN |
| S-L064-02 | Require exactly authenticated L bytes, at most 1 MiB, full compressed-input consumption, valid gzip structure and fatal UTF-8. | R05 R07 | NOT RUN |
| S-L064-03 | No partial text is returned on any failure. | R05 R07 | NOT RUN |
| S-L065-01 | - Keep P1's PNG limits. | K10 R09 | NOT RUN |
| S-L065-02 | Additional ceilings: one Uint16 score per pixel (at most 2 MiB), histogram 3,049 entries, at most 786,432 eligible uint32 indices (3 MiB), sparse sampled state, RS arrays at most 255 entries, AEAD body at most 528 bytes, repaired body 576 and complete frame 624. | K10 R09 | NOT RUN |
| S-L066-01 | - Decode performs one salt read, one KDF, one continuous stream, one header repair, at most three body repairs and one GCM check. | K10 R09 | NOT RUN |
| S-L066-02 | Before parsing the repaired bounded header allow at most 2,816 draws | K10 R09 | NOT RUN |
| S-L066-03 | then enforce cumulative 2*k+1,024, with k and maxima above. | K10 R09 | NOT RUN |
| S-L066-04 | No format/profile/key retries or legacy fallbacks. | K10 R09 | NOT RUN |
| S-L068-01 | - Public input/PNG/resource/cancellation failures can be specific. | R03 | NOT RUN |
| S-L068-02 | Hidden profile, repair, padding, tag, authenticated-text and compression failures return no text and the common message: Could not recover an authenticated message. | R03 | NOT RUN |
| S-L068-03 | The password may be wrong, or the image may be damaged or changed. | R03 | NOT RUN |
| S-L069-01 | - A worker owns the active operation, input revision and secrets. | O08 O09 O10 | NOT RUN |
| S-L069-02 | Cancellation terminates it, releases partial output and suppresses late replies. | O08 O09 O10 | NOT RUN |
| S-L069-03 | Missing worker, WASM, CSP permission, RNG or allocation support fails explicitly | O08 O09 O10 | NOT RUN |
| S-L069-04 | never move expensive work onto the main thread or select a weaker algorithm. | O08 O09 O10 | NOT RUN |
| S-L069-05 | Do not add an arbitrary timeout. | O08 O09 O10 | NOT RUN |
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
| S-L078-01 | - Keyboard reaches every action. | U03 U04 | NOT RUN |
| S-L078-02 | Dialog close restores focus to its trigger | U03 U04 | NOT RUN |
| S-L078-03 | a completed result has an accessible heading. | U03 U04 | NOT RUN |
| S-L078-04 | Reveal is keyboard-operable, not pointer-only. | U03 U04 | NOT RUN |
| S-L078-05 | Disabled actions show their reason. | U03 U04 | NOT RUN |
| S-L079-01 | - The active tab identifies the task. | U01 U02 | NOT RUN |
| S-L079-02 | Clear and an idle tab change that discard entered text, a phrase or an unsaved result require buttons named Stay and Switch and clear, or equivalent explicit outcome names. | U01 U02 | NOT RUN |
| S-L079-03 | Confirming clears the old form. | U01 U02 | NOT RUN |
| S-L079-04 | No browser persistence is added. | U01 U02 | NOT RUN |
| S-L080-01 | - During encode/decode, keep Cancel available and prevent edits/navigation until completion or cancellation. | U01 U02 | NOT RUN |
| S-L080-02 | Edits during capacity preparation cancel obsolete work. | U01 U02 | NOT RUN |
| S-L080-03 | Cancel suppresses late replies and clears passwords, not editable message/image inputs. | U01 U02 | NOT RUN |
| S-L080-04 | Empty-after-clear explains the next action. | U01 U02 | NOT RUN |
| S-L081-01 | - Use the agreed safe progress stages without percentages or hidden recognition details | U01 U02 | NOT RUN |
| S-L081-02 | avoid flashing a spinner for work completed in about a second. | U01 U02 | NOT RUN |
| S-L081-03 | For a long wait show a spinner and Cancel. | U01 U02 | NOT RUN |
| S-L081-04 | Keep failure messages beside the affected input and preserve non-password inputs. | U01 U02 | NOT RUN |
| S-L081-05 | Successful results remain until edited, cleared or left. | U01 U02 | NOT RUN |
| S-L082-01 | - First use has no admitted image or capacity claim. | U01 U02 | NOT RUN |
| S-L082-02 | Compression defaults off. | U01 U02 | NOT RUN |
| S-L082-03 | Preparation displays original/stored bytes and maximum stored capacity, with all framing overhead included. | U01 U02 | NOT RUN |
| S-L082-04 | No frame, empty-only capacity and oversize message have distinct public refusal reasons. | U01 U02 | NOT RUN |
| S-L082-05 | A fit enables encoding | U01 U02 | NOT RUN |
| S-L082-06 | success exposes only a complete result. | U01 U02 | NOT RUN |
| S-L083-01 | - A failed or obsolete estimate removes its prior capacity, never retaining an old fits indicator. | U01 U02 | NOT RUN |
| S-L083-02 | Cancellation produces no downloadable output. | U01 U02 | NOT RUN |
| S-L083-03 | A metadata notice does not imply concealment. | U01 U02 | NOT RUN |
| S-L085-01 | - The empty form asks for image and one password. | R01 U02 | NOT RUN |
| S-L085-02 | Recovery waits with safe stages and Cancel. | R01 U02 | NOT RUN |
| S-L085-03 | Failure uses the common authenticated-message text for hidden failures and keeps public PNG/resource failures separate. | R01 U02 | NOT RUN |
| S-L085-04 | A valid empty message displays explicit authenticated success rather than disappearing through a truthiness check. | R01 U02 | NOT RUN |
| S-L086-01 | - A result belongs to its exact inputs | R01 U02 | NOT RUN |
| S-L086-02 | changes, clear or another operation remove it. | R01 U02 | NOT RUN |
| S-L086-03 | Exact text is rendered as text, not HTML. | R01 U02 | NOT RUN |
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
| S-L112-01 | - During joint caller migration, retain P1's PNG export and Diff acceptance coverage. | E08 P01 P05 | NOT RUN |
| S-L112-02 | Its existing 64×64 journey covers have at most 3,072 eligible scalars before salt exclusions, below the 32,100 needed for an empty frame. | E08 P01 P05 | NOT RUN |
| S-L112-03 | Replace unsuitable covers with sufficiently detailed supported fixtures while preserving the PNG-policy assertions | E08 P01 P05 | NOT RUN |
| S-L112-04 | do not delete those journeys to accommodate the new format. | E08 P01 P05 | NOT RUN |
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
| S-L126-01 | 1. | Human 1; real-program record required | UNMET |
| S-L126-02 | In the browser, select a supported detailed PNG, enter public text and a custom password, and inspect original/stored/max bytes. | Human 1; real-program record required | UNMET |
| S-L126-03 | Toggle compression and change the image/message. | Human 1; real-program record required | UNMET |
| S-L126-04 | Only the current preparation's capacity may remain. | Human 1; real-program record required | UNMET |
| S-L126-05 | Change only the password | Human 1; real-program record required | UNMET |
| S-L126-06 | the valid image/text preparation remains usable and any old result disappears. | Human 1; real-program record required | UNMET |
| S-L126-07 | Try no-frame, empty-only and oversize fixtures | Human 1; real-program record required | UNMET |
| S-L126-08 | each refuses creation for its stated reason before derivation. | Human 1; real-program record required | UNMET |
| S-L127-01 | 2. | Human 2; real-program record required | UNMET |
| S-L127-02 | Encode raw and compressed public text through the guided CLI, using its current external editor, then recover it in the actual browser. | Human 2; real-program record required | UNMET |
| S-L127-03 | Reverse the direction. | Human 2; real-program record required | UNMET |
| S-L127-04 | Use the same custom test password | Human 2; real-program record required | UNMET |
| S-L127-05 | if generated phrases are offered, choose the custom-password option. | Human 2; real-program record required | UNMET |
| S-L127-06 | Use known Unicode, BOM/line-ending and whitespace fixtures through the operation interface where current interactive controls cannot preserve their bytes | Human 2; real-program record required | UNMET |
| S-L127-07 | do not claim that a textarea/editor proves P4's future exact file-input route. | Human 2; real-program record required | UNMET |
| S-L127-08 | Compare exact recovered fixture text, not only a success label. | Human 2; real-program record required | UNMET |
| S-L128-01 | 3. | Human 3; real-program record required | UNMET |
| S-L128-02 | Try wrong passwords, plain/old images, modified authenticated fields and defined damage fixtures. | Human 3; real-program record required | UNMET |
| S-L128-03 | Observe complete authenticated text or the common hidden-failure message, never partial text. | Human 3; real-program record required | UNMET |
| S-L128-04 | Keep public PNG/resource errors distinct. | Human 3; real-program record required | UNMET |
| S-L128-05 | Decode a valid empty wire message and observe explicit success. | Human 3; real-program record required | UNMET |
| S-L129-01 | 4. | Human 4; real-program record required | UNMET |
| S-L129-02 | Cancel real preparation, derivation and recovery work, then start a new operation. | Human 4; real-program record required | UNMET |
| S-L129-03 | No cancelled reply may display or save a result. | Human 4; real-program record required | UNMET |
| S-L129-04 | Password state clears | Human 4; real-program record required | UNMET |
| S-L129-05 | editable image/message inputs remain | Human 4; real-program record required | UNMET |
| S-L129-06 | the next operation succeeds. | Human 4; real-program record required | UNMET |
| S-L130-01 | 5. | Human 5; real-program record required | UNMET |
| S-L130-02 | Edit, clear and leave completed forms. | Human 5; real-program record required | UNMET |
| S-L130-03 | Confirm discard where required | Human 5; real-program record required | UNMET |
| S-L130-04 | check that stale results/downloads disappear and focus returns correctly. | Human 5; real-program record required | UNMET |
| S-L130-05 | During encode/decode, Cancel remains available and edits/navigation cannot change the active request. | Human 5; real-program record required | UNMET |
| S-L130-06 | Check the required browser widths/text size, keyboard/reveal actions, terminal sizes, long text/paths and NO_COLOR. | Human 5; real-program record required | UNMET |
| S-L130-07 | Non-terminal commands refuse missing secret-input routes rather than prompt. | Human 5; real-program record required | UNMET |
| S-L131-01 | 6. | Human 6; real-program record required | UNMET |
| S-L131-02 | Retain the existing PNG export and Diff journeys after updating only the covers that cannot carry the new frame. | Human 6; real-program record required | UNMET |
| S-L131-03 | Inspect supported rendering data, removed personal metadata and the visual-comparison label | Human 6; real-program record required | UNMET |
| S-L131-04 | preserve existing files on failure and cancellation. | Human 6; real-program record required | UNMET |
| S-L132-01 | 7. | Human 7; real-program record required; user-owned visual judgment | UNMET |
| S-L132-02 | Compare every changed screen and command output with its named existing source. | Human 7; real-program record required; user-owned visual judgment | UNMET |
| S-L132-03 | Judge contrast, focus outlines and the tone of the words. (yours) | Human 7; real-program record required; user-owned visual judgment | UNMET |

