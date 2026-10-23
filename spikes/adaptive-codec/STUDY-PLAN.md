# Proposed confirmation study: complete adaptive messages

**Status: confirmation-study proposal only; not approved, acquired, trained, or executed.** Source research date: 2026-10-23. This note supplies the future-study proposal required by [Prove adaptive message coding and salt discovery across browser and CLI][ticket]. Actual development-pilot measurements and the selected experimental repair comparison are recorded separately in [FINDINGS.md](FINDINGS.md).

The [accepted D1–D5 decision][decision] authorizes a disposable feasibility pilot, not this confirmation study. A rights, correctness, or resource failure stops that pilot. Do not download a corpus to work around a failed codec. A failed codec can produce a complete negative finding while this proposal remains unexecuted. Human acceptance returns to [Choose hiding and recovery behavior](https://github.com/jdragulanescu/obscr/issues/17); production bytes and routing remain in [Define the complete protected image format](https://github.com/jdragulanescu/obscr/issues/19).

## 1. Question and fixed boundaries

After actual authenticated CLI-to-browser and browser-to-CLI transport works, does an adaptive **complete file** reduce detection relative to the retained controls? Does an experimentally selected repair setting improve exact authenticated recovery enough to justify its extra footprint? Which photographs, if any, support a useful cover-selection rule?

Retain one original-file mode, one password, no full-image filler in candidates, concealment before extra recovery, no salt guessing, no cheap password path, and no JPEG/resize product promise. The [password decision][keys] remains binding. This proposal does not enlarge its resource bounds.

The adaptive candidate remains the narrow Stenoxide 3.24.3 Rust core, commit `91a7322e83310a1a9577353f14cf7ad7f884e3c8`, shared as identical WASM in Node and browser. Retain `h=10`, rate `0.02`, and at most 262,144 keyed **scalar samples** across header and message. Count the disjoint public bootstrap pool separately. Freeze its public matrix/seed, RGB handling, sign rule, HILL-like experimental costs, bit order, carrier order, and ABI before any run. Do not call these costs standard HILL or S-UNIWARD. Extraction receives neither cover nor costs. No extra secret or reuse of the keyed placement stream is allowed. These boundaries come from the [accepted findings][research] and decision, not from a new implementation choice here.

## 2. Fresh development photographs that can be obtained now

### Four specific CC0 leads

The following uploader-owned records each explicitly state **CC0 1.0**. Their original-file links, dates, dimensions, and listed camera metadata were read from the linked primary records. Image binaries were **not downloaded or decoded** for this research. Their visual strata below are suggested by the records, not measured image properties. File availability and hashes still need checking at acquisition.

| ID and suggested development coverage | Attribution and capture record | Original and rights evidence |
| --- | --- | --- |
| `vandusen-2015`: foliage and garden detail | Daderot; 2015-06-20 13:54:33; Sony DSC-RX100M3; 5472×3648 JPEG | [Original JPEG][photo1-file]; [uploader's CC0 record, revision 1270649170][photo1] |
| `saigon-2014`: built objects and garden scene | Daderot; 2014-07-28 03:42:41; Sony DSC-RX100M3; 5472×3648 JPEG | [Original JPEG][photo2-file]; [uploader's CC0 record, revision 1123288394][photo2] |
| `minnesota-2019`: garden scene, processed capture | Thomson200; 2019-09-07 10:05:03; camera model absent from the inspected metadata; HDR processing is listed; 4032×3024 JPEG | [Original JPEG][photo3-file]; [uploader's CC0 record, revision 1250341214][photo3] |
| `lake-clouds-2019`: water, sky, grass, sunset | Mshuang2; 2019-07-23 20:14:45; OnePlus A6003; 4608×3456 JPEG | [Original JPEG][photo4-file]; [uploader's CC0 record, revision 1038991344][photo4] |

These are four photographs from three credited photographers, **not four independent cameras or four independent acquisition sources**. Both Daderot photographs remain in the same photographer/camera cluster despite their different dates. Keep all four in development. Do not manufacture a train/validation/test result by dividing this tiny convenience set. It is not adequate training data for a rich or learned detector, and it does not establish low-light or camera-population coverage.

These names, source records, and photographers differ from the prior ten-photo corpus: brick, camera, chelsea, china, clock, grass, rocket, gravel, retina, and flower. That prior corpus is recorded in the [immutable unprotected-salt provenance][old-corpus]; it reused the earlier filler-free-repair photographs. Exclude those photographs and all their derivatives from fresh development and confirmation. The new leads are fresh **to this experiment**, not newly captured or necessarily absent from all public model training sets. Before accepting downloaded files, compare hashes and near-duplicate content against the old corpus; the record-level comparison here is not a decoded-pixel deduplication result.

Three listed originals exceed the accepted geometry limits. Do not feed them to the bounded codec and enlarge its limits. The primary pages also expose these explicit 1280-wide derivatives, if a bounded, already-resampled pilot input is preferable:

- [VanDusen, 1280×853][photo1-small]
- [Saigon, 1280×853][photo2-small]
- [Minnesota, 1280×960][photo3-small]
- [Lake and clouds, 1280×960][photo4-small]

Record a derivative as a Wikimedia-resampled JPEG, not a camera-native original. Its upstream resampling implementation is not established here. For a future pilot, freeze one acquisition form and one RGB8 conversion before encoding; hash and retain the exact decoded PNG used. A declared 512×512 center crop made **before embedding**, without upsampling, can supply a bounded common development input. This preprocessing does not mean that resizing an encoded file is supported. Reject source-file or decode limits before the corresponding allocations. Metadata-only source research is not permission to bypass those bounds.

### Rights and manifest requirements

CC0 permits copying, modification, and distribution without a copyright permission request, but does not clear other people's privacy, publicity, or trademark rights and gives no warranty. Do not imply endorsement. [CC0 terms][cc0] The stated grants support these development leads; they are not legal certification of every depicted object. Inspect the acquired photographs for people, sensitive content, and third-party works before publishing representative files. There is no identified copyright-license blocker for the four uploader-owned CC0 leads; binary/content review remains unperformed.

For every acquired source, retain:

- Stable ID; direct original URL; source-record URL and revision; retrieval date; creator and credit text; exact license version and license URL; a retained grant/permission record.
- Source-file SHA-256, byte count, MIME type, dimensions, and decoded-pixel/PNG SHA-256. Record original and downloaded derivative separately.
- Acquisition institution or contributor; photographer; camera make/model and physical-camera identifier when known; session/date/location group; editing/development software; JPEG history, HDR, ICC/color handling, orientation, and bit depth. Use `unknown`, never an invented camera or session.
- Every crop, resize, conversion, embedding, damage operation, seed, and derivative's parent ID. Record exact preprocessing software/version/options. Keep alpha unchanged; opaque true-color photographs define the primary scope.
- Split and all grouping keys; deduplication outcome; reason for exclusion or rejection; source-specific rights limits on redistribution and model/checkpoint release.

For later CC-BY additions, preserve creator/source credit, a link to the exact license version, and an indication of modifications. Do not assume a repository's software license covers its photographs. [CC BY 4.0 terms][ccby] Source photos and encoded derivatives retain their own rights; the project's code license does not replace them. Store temporary downloads and caches under this spike's `.scratch`, and remove only temporary files created for this work after preserving the agreed evidence. No temporary download was created by this note.

## 3. Obtainable confirmation-data paths and their limits

| Path | Verified availability and terms | Proposed use and remaining gate |
| --- | --- | --- |
| Additional uploader-owned Commons CC0/CC-BY color photographs | The four records above establish concrete public download paths and per-file grants. They do **not** establish that thousands of suitably grouped records have been found. | Expand only through a per-file rights/metadata audit. Recruit disjoint contributor/camera portfolios for each split. A shared website is not an independent photographic source. Unknown physical-camera/session identity prevents a claim of verified camera/session separation. |
| RAISE, University of Trento MMLab | The [owner's overview][raise] describes 8,156 camera-native RAW images from four photographers, three cameras, and more than 80 places. The [download page][raise-download] offers 1k/2k/4k/6k subsets and an approximately 350-GB full set. It explicitly restricts use to **non-commercial research and educational purposes**, with citation. | A concrete research-only external-source comparison, subject to confirmation that this use qualifies. Not CC0; no unrestricted redistribution grant was established. Do not bundle originals, derivatives, or assume checkpoint-release permission. Request written clarification through the [owner's contact page][raise-contact] if needed. Its three cameras/four photographers cannot supply thousands of independent camera/source clusters. Use it as an external-source stratum, not as evidence of broad source independence. |
| New contributor capture under an explicit CC0 or CC-BY grant | A proposed acquisition route, **not an existing dataset or obtained permission**. Use the actual license instruments linked above and a contributor-signed source/camera/session manifest. | Acquire independent photographer/device/session portfolios not used in development. Include phone computational pipelines and conventional cameras. Budget capture and rights review before approving sample size. If this cannot be funded or acquired, report that confirmation is not ready; do not replace it with repeated crops of a few sources. |

A public download link is not unrestricted permission. RAISE's descriptive phrase about avoiding copyright issues does not override its download terms. No binary download, account registration, permission request, or camera-identity audit was done here. Thus **a sufficiently large, source-separated, licensed confirmation corpus has not been acquired**. This is an acquisition/independence prerequisite, not evidence against adaptive coding.

### Split construction

Proposal: build a manifest before inspecting candidate detection scores. Assign whole connected groups of shared source photograph, near-duplicate scene/burst, session, photographer, and physical camera to one split. Reposts across websites remain one group. If camera identity is unknown, group conservatively by contributor and known camera model; exclude unresolved identities from claims of verified physical-camera separation. Never use unknown metadata to assert independence.

- **Development:** the four leads above and newly acquired, rights-cleared development portfolios. Fit costs only if a later decision permits changes; choose finite repair settings, cover-rule features, detector training, and training budgets here. Any source inspected while making those choices is permanently development data.
- **Validation:** newly acquired contributor/session/device portfolios absent from development. Choose detector hyperparameters, fixed score combination, and 1%/5% false-positive thresholds here. Freeze the cover-rule threshold here only if this use was declared in advance; otherwise keep its fit entirely within development.
- **Test:** untouched contributor/session/device portfolios and at least one separately acquired collection absent from both earlier splits. No threshold, feature, model-seed, or repair selection may use these scores. A named custodian can retain split labels and release the test only after the frozen package is recorded.

Balance the intended smooth/texture, low-light, saturated, indoor/outdoor, phone/camera, and JPEG-developed/RAW-developed strata at **acquisition**, without removing hard cases after encoding. Where available, leave camera-model/pipeline families out for an additional source-mismatch report. Publish per-source and per-stratum results, not only a pooled average. An external RAISE stratum cannot repair missing contributor diversity in the primary set.

All cover/stego pairs, loads, salts, repeated messages, crops, damage seeds, and rewrites stay in the same source group. None supplies a new independent observation. Flat fields, gradients, screenshots, illustrations, transparent images, and malformed PNGs form separate stress/boundary sets. They must not inflate photographic training or test counts.

## 4. Sample size and uncertainty: an approval proposal

The research's 25,000-group sketch is **not a requirement**. Start acquisition planning with **2,000 development, 2,000 validation, and 4,000 test independent session/scene groups**, each with one prespecified primary photograph. These are planning targets, not obtained counts or a guarantee that 2,000 groups train WISERNet adequately. Use development learning curves and positive controls to decide whether detector training is sufficient before any confirmation approval.

The targets concern session/scene groups within recorded source clusters. They do not create 4,000 independent cameras. Cluster dependence can greatly reduce the effective sample count. If the achievable source portfolios cannot support the desired inference, enlarge the number of independent sources before test release or narrow the claim explicitly. Repeated photos from a few cameras do not solve that problem.

For orientation only, under independent representative negative observations at true FPR 1%, the normal approximation `1.96 * sqrt(0.01 * 0.99 / N)` gives a 95% half-width of about **0.44 percentage points at N=2,000**, and **0.31 points at N=4,000**. At N=4,000 there are only about 40 expected false positives at 1%; at 0.1% there are about four. Do not make a precise 0.1% claim. With zero observed failures, the one-sided exact 95% bound is `1 - 0.05^(1/N)`, about **0.075% at N=4,000**. These are analytical planning illustrations, not measured rates; they assume independence and do not incorporate clustering or selection. Use Wilson or exact intervals for independent binomial summaries, as described by [NIST][nist], and cluster-aware intervals for the actual paired source structure.

For comparative power, propose a smallest worthwhile paired AUC reduction of **0.02** and 80% power, subject to human approval. Estimate paired variance and source-cluster effects using development data only. Before test release, determine the final source-group count for the declared detector/load/comparator family and its multiplicity correction. The simple FPR calculation above is not an AUC power calculation. If the acquired data cannot support that target, state underpowering before scoring; do not keep adding test images until significance appears.

Use a frozen hierarchical paired bootstrap that samples independent source portfolios, then session groups within them, retaining all methods/loads/classes together. Give the number of portfolios and groups, not just PNG count. Predeclare simultaneous 95% intervals across primary comparisons, for example a bootstrap maximum-statistic procedure with 10,000 replicates and fixed seed. If too few independent portfolios make this unstable, do not print precise population intervals; report a finite-source exploratory result. Test resampling conditions on fitted models and thresholds. Report training-seed variation separately; do not pretend it is covered by the test bootstrap.

## 5. Complete files, useful loads, and rejections

Retain four historical controls unchanged: raw-salt RGB `no-repair`, raw-salt RGB `grouped-p32`, production filler-off, and production filler-on. Filler-on is a positive/control condition only. Add adaptive no-repair with raw salt, adaptive no-repair with the fixed public full-row-rank salt matrix, and only the finite repaired variants justified by development errors. Salt-route comparisons must otherwise match the message codec and envelope. Include plain covers as negatives.

Attempt **64, 512, and 2,048 useful UTF-8 bytes** on every proposed cover/method. Freeze exact message fixtures and a separate compressed/uncompressed/Unicode-boundary matrix. Report useful bytes before compression and stored bytes after compression separately. Do not choose highly compressible text merely to force the 2,048-byte point to fit.

For each attempt record:

`useful bytes; compressed bytes; salt bytes; header/framing bytes; nonce bytes; full tag bytes; header repair bytes; payload repair bytes; shortening/padding bytes; extracted syndrome bits; keyed scalar samples; public bootstrap samples; changed samples; output PNG bytes`.

Do not double-count fields already inside a frame; publish the actual frame arithmetic and pool allocation. In the retained historical byte-group controls, additionally report group count and its expanded scalar-sample footprint. An adaptive scalar sample is not an eight-sample byte group.

At rate 0.02, 262,144 samples provide at most `floor(262144 * 0.02 / 8) = 655` whole encoded bytes before complete header/message overhead, and separate-block rounding may reduce this. The useful 512-byte arm can therefore reject once framing and repair are included. The uncompressed 2,048-byte arm necessarily rejects under these bounds. Keep those rows. Do not raise rate or position limits, remove the full tag, shrink useful messages, or silently disable repair. This is an API-capacity observation from the contract, not a safe production cap or a negative finding about all adaptive coding.

Use two separate comparisons:

1. **Matched useful load:** same cover and useful bytes, including all format overhead. This is the primary sender-facing comparison.
2. **Matched carrier budget:** a separately frozen diagnostic grid within the same bounds, with useful bytes reported. Do not call it a matched-useful-load win when a method carries less text.

Maintain a complete attempt ledger: source/rights exclusion, cover-rule rejection, capacity rejection, codec infeasibility, resource/cancellation failure, malformed input, salt change, header failure, payload repair failure, authentication failure, exact recovery, and any incorrect/unauthenticated output. Diagnostics can overlap; provide one prespecified terminal outcome plus the independent diagnostic flags.

Report admission and exact authenticated delivery per **all attempted eligible cover/load cases**. Salt failures stay in end-to-end denominators. Also report conditional admitted-file detection and recovery, clearly named. Rejected encodes have no stego score: do not assign them a cover-like score or count them as successful concealment. For paired detection report the all-arm-admitted subset and every omitted source/reason alongside unconditional rejection rates. If an arm has no admitted 2,048-byte files, its detection comparison at that load is **not estimable**, not AUC 0.5 and not a pass. No across-all-three-load improvement claim is then available under this contract.

## 6. Finite repair comparison, conditional on extracted errors

No adaptive repair profile is selected here. In particular, **do not carry `grouped-p32` into the adaptive method by default**. That historical arm remains a control. The [pinned repair subset][repair] supplies unknown-byte-error Reed–Solomon decoding over GF(256), with parity 16, 32, or 64 and correction radii 8, 16, or 32 erroneous bytes per codeword. Its Apache-2.0/jai-imageio notices remain required.

Before selecting arms, collect actual extracted errors on fresh development photographs, separately for salt, header, and payload:

- Bit-error locations and counts; erroneous-byte locations/counts; contiguous bit and byte runs; per-codeword error counts; cross-block correlations; burst-length distributions; and header/length loss.
- Unique damaged pixels, changed channels, actual parity flips, and errors after syndrome extraction. A changed carrier pixel is not one recovered-message error.
- Same-grid random one-channel ±1 changes and random RGB replacements; localized patches and stripes; directed bootstrap/header damage; and codeword-boundary cases. Freeze finite rates, patch/stripe dimensions, clipping, seeds, and count limits before running. Keep the historical 1% damage cases as observations, not guaranteed pass targets.

**Proposed maximum search space:** no-repair plus at most nine repair profiles. Cross parity `{16,32,64}` with these three possible public, deterministic layouts: identity byte order; round-robin **whole-byte** distribution across the frame's codewords; and round-robin **bit** distribution. Every layout has a fully specified inverse, shortened-final-block rule, and bounded workspace. It consumes no keyed placement-stream bytes and adds no new secret. Use the same parity choice for the fixed-size header and payload in this finite comparison; count the header codeword separately. If the frozen header does not fit the subset's data limit, that profile is infeasible, not permission to change the header silently. No salt repair is included.

Admit the bit layout only if observed bit/byte grouping gives a concrete reason to test it: it can disperse a burst but can also turn one damaged byte into many erroneous RS symbols. Admit whole-byte interleaving only if measured codeword concentration/bursts make it relevant. If neither condition is observed, use identity layout alone. Publish the selection rationale and excluded arms **before** repair comparison scoring. This bounds selection to ten arms total; it is not an instruction to run all ten without evidence.

Actually encode each admitted arm and damage its PNG; do not substitute an error-vector replay for end-to-end evidence, because overhead changes the carrier pool and extraction channel. Record every capacity rejection. Compare with matched no-repair on the same original sources, useful loads, and damage seeds. Use diagnostic salt-conditioned recovery only to explain outcomes, never as the headline rate. Miscorrection must still end in authentication failure with no plaintext output.

Select at most one repair/layout finalist per salt route for the later frozen study, using development evidence only. Prefer lower overhead when recovery is not distinguishable. A proposed repair benefit needs positive paired end-to-end exact-recovery evidence on the declared damage family and a complete-file concealment comparison. If all arms exceed capacity or produce no supported benefit, propose **no supported repair setting**, not a larger budget or weaker fallback. The parent findings may replace this conditional menu with a measured recommendation; this note itself provides no measurement.

## 7. Cover-rule development and evaluation

No cover rule is approved. Proposal: fit a small, auditable rule on development only, using pre-embedding measurements such as RGB residual-energy quantiles, proportion of low-detail blocks, saturated-sample proportion, channel correlations, image dimensions, and requested all-overhead rate. Freeze exact filters, numeric precision, thresholds, and missing-value behavior. Do not define eligibility from actual test detector scores or post-encoding success.

The rule may reject a sender's cover; it must not make the receiver rediscover a cost-ranked carrier domain. The receiver still uses the agreed public bootstrap and keyed sampler without the original cover or costs.

Evaluate the frozen rule on **all** validation/test sources, including the rejected ones. Report source/stratum acceptance rates, capacity/resource rejections, complete-file detection and exact recovery among accepted covers, and forgone usable covers. Where technically feasible, encode rejected covers offline for a separate rule diagnostic; do not deliver them as accepted files. Keep an unfiltered baseline so a claimed hiding improvement cannot be produced solely by discarding difficult photographs. A rule that accepts almost nothing is not useful merely because admitted cases look favorable. Human approval must state the minimum useful admission rate before scoring; no numeric threshold is justified by this proposal's unmeasured convenience data.

## 8. Detectors, source/permission paths, and attack scope

Train and score on complete RGB files, not payload-only crops. Give each candidate the same declared training/tuning budget. Freeze a salt-only score, a message/whole-image score, and their validation-selected combination. Fresh salts are random, not known labels for a public membership test.

| Detector family | Proposed role | Source and permission status |
| --- | --- | --- |
| Public-layout salt tests | Test raw bootstrap positions and the known adaptive bootstrap pool: parity balance, nearby residual changes, adjacent/inter-channel correlations, syndrome-bit distribution/correlation, and bootstrap-vs-matched-neighborhood features. Fit a finite feature list on development and freeze it. | Implement these named statistics in the spike/study under the repository's code terms. No detector has been implemented or evaluated by this note. A full-row-rank 128-bit random-salt syndrome has no known invalid-syndrome membership test; test its induced image statistics, not imaginary public parity. |
| Historical public RS-salt detector | Retain its old positive image and plain negatives. Confirm that the historical detector can still detect its intended old signature. | Reuse the [prior spike's recorded detector][old-detectors] and cleared repair subset with their provenance. Failure of this detector to flag a new file proves only absence of that old signature. |
| RGB rich model | SCRMQ1/CRMQ1 plus a random-subspace ensemble; include spatial and inter-channel residual features. A separate CFA-aware model is an optional prespecified sensitivity check, not an assumed substitute. | The [DDE index][features] lists SCRMQ1/CRMQ1 and a direct [extractor archive][scrm-download]. It permits research/non-profit use and retains DDE copyright. Inspect actual archive headers before use; do not redistribute or port it under MIT by assumption. The [ensemble page][ensemble] links version 2.0 and says public use with citation, but that is not a complete redistribution audit. Seek written clarification from the listed DDE contacts for distribution/commercial uses, or use a reviewed independent paper-based implementation. |
| Color-aware learned model | WISERNet, retrained for the study's RGB pipelines, complete envelopes, and actual useful loads. Use development learning curves and positive controls to check sensitivity. | The [author paper][wiser] is explicitly color-aware. The [pinned author repository][wiser-code] at `4e3b110d580ea1ed278181257b7c0ec410f89fc5` has no root license file. The [README][wiser-readme] supplies code/checkpoint instructions, not a reuse grant. Its supplied checkpoint was trained on 0.4-bpc HILL_CMD_C/BOSSBase PPG_LAN2, not this complete Obscr format. Obtain an explicit code/checkpoint grant from the authors, or independently implement the published architecture with an audited framework and retrain. Public visibility does not resolve rights. |

No detector archives or model weights were downloaded here. There is **no permission-cleared, trained WISERNet artifact supplied by this proposal**. Its missing grant is a real prerequisite for copying the repository/checkpoint, not proof that independent implementation of the published method is unavailable. The DDE research grant is narrower than unrestricted redistribution. Do not publish third-party detector code or checkpoints while these conditions are unresolved. If the primary color-aware detector cannot lawfully be obtained/implemented and trained, report confirmation as blocked or inconclusive; do not silently replace it with a few LSB statistics and claim the planned comparison passed.

For 512×512 learned inputs, establish that image size **before embedding**. For larger images freeze an image-level tile scheme and aggregation during development that includes the bootstrap area and covers the full image; report tile count and image-level scores. Do not resize stego images to fit the network, and do not count tiles as independent photos. Keep canonical RGB and PNG handling the same for cover and stego inputs so preprocessing does not become a label leak.

Require development positive-control sensitivity for each primary detector before test scoring. Filler-on and deliberately strong known-position changes are controls, not product options. Weak sensitivity makes a low candidate score inconclusive. The 2018/2019 WISERNet baseline is a concrete color-aware comparison, not a claim to be the strongest detector available today.

Separate threat conditions:

- **Primary:** public format/matrix/geometry known, password and original cover unknown; sender costs unavailable. Train matched complete-format detectors.
- **Targeted public bootstrap:** same knowledge, with features restricted to the known raw/adaptive salt area. Include plain-cover syndrome distributions and fixed-layout correlations.
- **Oracle diagnostics:** true change-map or original-cover differencing. Label them separately; they are not the primary attacker's inputs.
- **Repeated-cover/source mismatch:** prespecified external-source and multiple-encoding conditions. They do not inherit the single-file result.

No marker, salt checksum, public salt ECC, salt retries, or guessed replacement salts may be added for any detector experiment.

## 9. Freeze before held-out scoring

A later approved study must publish a dated, hashed protocol package before test release. It must contain:

1. Exact candidate/control code and WASM hashes; dependency notices; salt matrix/rank evidence; framing, bounds, cancellation points, RGB/cost/sign rules, and all rejection behavior.
2. Source/license manifest; excluded old corpus; group/split assignments; preprocessing and duplicate rules; data custodian and test-release procedure.
3. Useful loads and message/compression fixtures; ordinary CSPRNG handling; paired non-secret fixture policy; damage cases/seeds; complete overhead accounting. Never reuse a GCM key/nonce pair for different secret plaintexts.
4. Finite repair finalists and reasons; cover-rule fit and minimum useful admission criterion; rights-cleared detector versions; architecture/features, seeds, tuning budget, training stop rules, and tile aggregation.
5. Primary estimands and comparator family; sample-size/power calculation; source-cluster resampling; simultaneous interval method; handling of rejections/missing pairs; source-stratum reports.
6. Validation-only threshold rule at nominal 1% and 5% FPR, including ties; fixed score direction and combination. Publish achieved test FPR and TPR with uncertainty. Never invert an AUC after viewing test scores.
7. Stop rules and decision wording. Preserve a failed or invalidated run. A discovered bug requires a documented new freeze and fresh untouched test data where the old scores could affect the correction; it is not permission to tune and reuse the same test as unseen evidence.

**Proposed interpretation, not an approved release gate:** correctness is mandatory for every admitted unchanged file and sample-preserving rewrite. Any wrong authenticated output, unauthenticated plaintext release, cheap password path, or bounds violation stops the candidate. Wrong passwords, tampered/short tags, invalid lengths, malformed inputs, and repair miscorrections must release no plaintext.

For concealment, propose simultaneous paired intervals for `AUC(control) - AUC(candidate)` on the rich, learned, and combined complete-file detectors. A supported relative-improvement claim requires the declared lower bounds above zero on each feasible primary useful load and comparator, with no worsening under the prespecified achieved TPR/FPR comparison and no new deterministic public signature. Treat the stricter across-load/comparator gate from the earlier research as a proposal for human review, not a silently accepted requirement. The exact family, practical effect size, admission-rate requirement, and operating-point margins must be approved and frozen before scoring. A capacity-rejected load is unavailable, never a passed statistical gate.

For recovery, require positive paired end-to-end exact-recovery evidence for any claimed repair gain on the declared damage family, retaining salt failures and all overhead. Report concealment cost separately. No aggregate score may trade confidentiality failure for recovery. Interval overlap, weak detectors, poor source coverage, an unavailable comparison, or a nonsignificant difference means **inconclusive or unsupported**, not equivalence or invisibility.

Even a successful confirmation supports only the evaluated detectors, sources, loads, and attack conditions. It does not select production bytes, approve JPEG/resize delivery, establish an image-wide damage-survival percentage, or set a safe capacity cap. Production approval still needs the accepted independent review and physical-device/release gates.

## 10. Sourced blockers and hand-back

- **Fresh pilot photos:** four directly obtainable CC0 leads are identified, with credits and rights records. No copyright-license blocker was found in those records. Acquisition, decoded-pixel deduplication, content review, and preprocessing remain future work.
- **Confirmation data:** no large independent source/camera/session-separated corpus is acquired. Commons metadata can be incomplete; RAISE has only three cameras/four photographers and non-commercial research terms. Do not claim the proposed counts exist.
- **Rich detector:** DDE supplies a research/non-profit permission path; archive-specific notices and redistribution rights remain to be resolved before copying/publishing an implementation.
- **Learned detector:** the pinned WISERNet repository/checkpoint has no established grant. Obtain rights or fund a reviewed independent architecture implementation and retraining. No trained detector or passing detector test is claimed.
- **Repair:** no adaptive error measurements were made for this note; selection is conditional on the integration owner's actual extraction evidence. There is no supported repair recommendation here yet.

No builds, tests, training, image downloads, or confirmation measurements were performed for this document. Only source records and project evidence were read. No global environment was changed.

## Sources

[ticket]: https://github.com/jdragulanescu/obscr/issues/35
[decision]: https://github.com/jdragulanescu/obscr/issues/17#issuecomment-6375291529
[keys]: https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6374176664
[research]: ../../docs/research/obscr-adaptive-codec-and-discovery.md
[old-corpus]: https://github.com/jdragulanescu/obscr/blob/e0e7ed81c2790f608029cad76289f79935904f29/spikes/unprotected-salt/CORPUS.md
[old-detectors]: https://github.com/jdragulanescu/obscr/blob/e0e7ed81c2790f608029cad76289f79935904f29/spikes/unprotected-salt/DETECTORS.md
[repair]: https://github.com/jdragulanescu/obscr/blob/e0e7ed81c2790f608029cad76289f79935904f29/spikes/unprotected-salt/REPAIR.md
[cc0]: https://creativecommons.org/publicdomain/zero/1.0/
[ccby]: https://creativecommons.org/licenses/by/4.0/
[photo1]: https://commons.wikimedia.org/w/index.php?title=File:General_view_-_VanDusen_Botanical_Garden_-_Vancouver,_BC_-_DSC06806.jpg&oldid=1270649170
[photo1-file]: https://upload.wikimedia.org/wikipedia/commons/b/b8/General_view_-_VanDusen_Botanical_Garden_-_Vancouver%2C_BC_-_DSC06806.jpg
[photo1-small]: https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/General_view_-_VanDusen_Botanical_Garden_-_Vancouver%2C_BC_-_DSC06806.jpg/1280px-General_view_-_VanDusen_Botanical_Garden_-_Vancouver%2C_BC_-_DSC06806.jpg
[photo2]: https://commons.wikimedia.org/w/index.php?title=File:Children%27s_ride_-_Saigon_Zoo_and_Botanical_Gardens_-_Ho_Chi_Minh_City,_Vietnam_-_DSC01363.JPG&oldid=1123288394
[photo2-file]: https://upload.wikimedia.org/wikipedia/commons/9/97/Children%27s_ride_-_Saigon_Zoo_and_Botanical_Gardens_-_Ho_Chi_Minh_City%2C_Vietnam_-_DSC01363.JPG
[photo2-small]: https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Children%27s_ride_-_Saigon_Zoo_and_Botanical_Gardens_-_Ho_Chi_Minh_City%2C_Vietnam_-_DSC01363.JPG/1280px-Children%27s_ride_-_Saigon_Zoo_and_Botanical_Gardens_-_Ho_Chi_Minh_City%2C_Vietnam_-_DSC01363.JPG
[photo3]: https://commons.wikimedia.org/w/index.php?title=File:Minnesota_Landscape_Arboretum_Sept_2019_11.jpg&oldid=1250341214
[photo3-file]: https://upload.wikimedia.org/wikipedia/commons/a/a7/Minnesota_Landscape_Arboretum_Sept_2019_11.jpg
[photo3-small]: https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Minnesota_Landscape_Arboretum_Sept_2019_11.jpg/1280px-Minnesota_Landscape_Arboretum_Sept_2019_11.jpg
[photo4]: https://commons.wikimedia.org/w/index.php?title=File:Landscape_of_lake_and_clouds.jpg&oldid=1038991344
[photo4-file]: https://upload.wikimedia.org/wikipedia/commons/b/bf/Landscape_of_lake_and_clouds.jpg
[photo4-small]: https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Landscape_of_lake_and_clouds.jpg/1280px-Landscape_of_lake_and_clouds.jpg
[raise]: https://loki.disi.unitn.it/RAISE/index.php
[raise-download]: https://loki.disi.unitn.it/RAISE/download.html
[raise-contact]: https://loki.disi.unitn.it/RAISE/contact.html
[nist]: https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm
[features]: https://dde.binghamton.edu/download/feature_extractors/
[scrm-download]: https://dde.binghamton.edu/download/feature_extractors/download/SCRMQ1.zip
[ensemble]: https://dde.binghamton.edu/download/ensemble/
[wiser]: https://arxiv.org/abs/1803.04805
[wiser-code]: https://github.com/tansq/WISERNet/tree/4e3b110d580ea1ed278181257b7c0ec410f89fc5
[wiser-readme]: https://raw.githubusercontent.com/tansq/WISERNet/4e3b110d580ea1ed278181257b7c0ec410f89fc5/README.md
