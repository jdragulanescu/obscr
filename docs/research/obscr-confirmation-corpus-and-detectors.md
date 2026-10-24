# Confirmation corpus and detector feasibility

**Research date: 2026-10-24.** Findings for [Establish a usable confirmation corpus and detector route](https://github.com/jdragulanescu/obscr/issues/37), under [Harden Obscr security and preserve repeatable attack checks](https://github.com/jdragulanescu/obscr/issues/11). This is an access-and-resource investigation, not approval to acquire a corpus, train detectors, run confirmation scoring or select production settings.

## TL;DR

- **A confirmation-ready route is not established.** Obtainable photographs and a conditional research-use color-rich detector exist. Missing items are a verified source-separated corpus, an authorized or independently implemented learned detector, and measured training resources. A public archive's image count does not establish independent source groups.
- **Image routes are concrete but conditional.** Commons offers per-file CC0 photographs; an additional W.carter portfolio has usable camera-serial metadata. RAISE offers 8,156 RAW photographs from only four photographers and three cameras. FiveK offers 5,000 RAW photographs with explicit research-only modification/publication rights, but its capture-source identities are not established. Neither archive supplies a verified three-way source split here.
- **The DDE source headers resolve part of the permission question.** SCRMQ1 and both ensemble runtime files explicitly permit use, copying, modification and distribution for educational, research and non-profit purposes with notices. They are not unrestricted MIT code. WISERNet still has no established code or checkpoint grant; a new paper-based implementation and fresh training remain a concrete alternative, not an available artifact.
- **Resources remain a decision, not a quote.** Published archive sizes and calculated storage are reported below. No Obscr detector training duration, GPU-memory fit, adequate sample count or fixed budget is established. Return to [Choose hiding and recovery behavior](https://github.com/jdragulanescu/obscr/issues/17) after these findings are accepted.

## 1. Evidence boundary and unchanged comparison

The starting points were the [accepted study-feasibility direction][direction], [immutable study proposal][proposal] and [accepted pilot findings][pilot]. Primary image records, full linked licenses, detector source archives, author repositories and papers were inspected. **[INFERENCE]** marks deductions; **Proposal** marks a route for later agreement. This is license evidence, not a legal opinion, patent clearance or certification of third-party rights.

No image corpus, model weights or training environment was acquired. No third party was contacted, form submitted, charge incurred, detector trained or confirmation experiment run. Two small detector-source ZIPs were fetched into memory for header inspection; their bundled example feature data were not used. Local Node arithmetic commands checked the storage calculations below. No production code, application tests or device benchmarks changed or ran.

The accepted comparison remains:

- Four adaptive candidates: raw/adaptive salt, each without repair or with parity16/whole-byte round-robin. Retain the separately protected header and exact shortened-block rules. Raw salt remains the damage baseline; do not reopen the larger repair search.
- RGB no-repair/grouped-p32 and legacy filler-on/off controls. Filler-on is not a product option.
- Useful loads of 64, 512 and 2,048 bytes, complete overhead, fixed rate ceiling 0.02 and at most 262,144 keyed scalar samples, plus the separate bootstrap pool. Keep all accepted image, KDF and bounded-work limits. [Accepted resource ceilings][limits]
- Capacity refusals stay in the attempt ledger. They have no detection score and are not hiding successes. Do not shorten messages, select compression to force admission, increase limits or weaken authentication.
- Unchanged-file and sample-preserving rewrites, the existing damage cases and end-to-end salt failures remain visible. Repair needs measured benefit and a separate concealment-cost comparison. No survival percentage is approved.
- Original-file PNG delivery, no filler in candidates, one password, no salt guessing, concealment before additional recovery and authenticated output. No JPEG/resize product mode.

The proposal's 2,000/2,000/4,000 group counts and 0.02 AUC target are not approved requirements or power results. The accepted pilot transports messages but establishes no hiding advantage. Metadata research does not turn its four development crops into confirmation data.

## 2. Obtainable image sources and actual rights

Counts and sizes in this section are publisher statements, not downloaded inventories. An offered URL is not proof of a successful binary download or integrity check.

| Source | Offered files and access | Image and derivative rights | Source-separation limit |
| --- | --- | --- | --- |
| Existing Commons pilot | Four own-work CC0 records from Daderot, Thomson200 and Mshuang2; original links remain on the [proposal's pinned records][proposal]. | CC0 permits copying, modification and distribution, including commercial uses, within the rights held by the affirmer. Privacy/publicity, trademark and other third-party rights are not cleared. [CC0 deed and legal instrument][cc0] | Four photographs, three credited photographers; two Daderot images share model/creator. Physical-device identities were not established. All remain development material. |
| Additional Commons portfolio: W.carter | [Creator category][carter] reports 11,428 **media files**. Two concrete original JPEG records were inspected: [coiled rope][rope] and [oakmoss][oakmoss]. | Both inspected records state own work and CC0 1.0. Their grants do not license every category member. Retain each selected file's own grant and content review. | Both identify the same Panasonic DMC-FZ1000 serial `F961511170128`. This establishes a useful grouping key, not two independent camera sources. One new portfolio is identified; eligible photograph/session counts remain unknown. |
| RAISE, Trento MMLab | [Owner overview][raise] reports 8,156 RAW photographs, four photographers, three cameras, over 80 places, collected during 2011–2014. [Download page][raise-download] offers full set and 1k/2k/4k/6k subsets. [Confirmation form][raise-confirm] asks for name, affiliation, email, project description and license agreement. | [Full license][raise-license] permits use/copying for scientific, non-commercial purposes, including research, teaching and personal experimentation. Commercial use/distribution of data or derivatives needs written permission. Copies/derivatives must retain copyright, full license and original-site link. Research derivatives are contemplated; no blanket unrestricted sublicensing grant follows. | Aggregate camera count does not supply an image-to-physical-device map. Category-proportional subsets are not independent-source splits. This is a potential finite-source external stratum, not thousands of independent cameras. |
| MIT-Adobe FiveK | [Owner page][fivek] offers 5,000 DNG inputs, Lightroom catalog, semantic data, direct files, full archive and parts. Five TIFF16 editor renditions per input are separately offered. No account requirement is stated on that page. | [Adobe license][fivek-adobe] and [Adobe/MIT license][fivek-mit] explicitly permit use, copying, modification, publication, distribution and sublicensing, but only for the user's own research without intended commercial advantage or compensation. Preserve the correct per-image copyright/license; no endorsement. These are **not the permissive MIT software license**. | Photographer, physical-camera and independent session counts were not established. Five editors processed the same source photos; their outputs do not add capture independence. The [published random split][fivek-project] is not a verified source-separated split. |
| Dresden Image Database | Original HTTPS `ddimgdb` and HTTP `dresden_image_database` endpoints timed out. Original ACM/journal publication endpoints returned HTTP 403. [Attempted sources][dresden] [Paper][dresden-paper] | No current first-party image grant or derivative/publication terms were obtained. Mirror visibility and paper copyright do not establish image rights. | Do not count it as an available, cleared route in this report. Supply authoritative terms and an authorized working archive/manifest before reconsidering it. This is an access limit, not proof the dataset can never be used. |

### What the full licenses add

RAISE's linked license says: “Permission is granted to use and copy the provided data” for its stated scientific/non-commercial purposes. Clause 3 prohibits commercial use or distribution of data or derivative work without written permission. Clause 4 requires: “All copies or derivatives of the provided data must retain the above copyright notice, the license including all conditions and a link to the original website”. The short download notice was not the complete terms. Do not claim that all derivative publication is forbidden, or that unrestricted redistribution is granted. Resolve publication or checkpoint uses not clearly covered before release. [RAISE license][raise-license]

FiveK's two grants explicitly include “modify, merge, publish, distribute and/or sublicense”, subject to “solely for your own research purposes” and no intended “commercial advantage or monetary compensation”. Join every acquired image ID to the correct [Adobe-only list][fivek-adobe-ids] or [Adobe/MIT list][fivek-mit-ids]. The lists were inspected, but their complete union and match against acquired files were not audited. Neither these image grants nor software licenses automatically settle later model-weight publication.

A named project owner must establish that the intended research qualifies under RAISE/FiveK terms, or obtain a broader grant. Open-source project status alone is not proof of eligibility. A reproducible acquisition manifest instead of bundled images can reduce redistribution needs, but does not remove restrictions on the research use itself.

## 3. Source portfolios, metadata and split feasibility

The two new W.carter records give unusually concrete grouping evidence:

| Record | Capture/processing metadata | Offered original |
| --- | --- | --- |
| Coiled white mooring rope | 2019-06-16 14:49; Govik, Sweden; Panasonic DMC-FZ1000 serial `F961511170128`; Photoshop CC 2018; sRGB | 4,433×3,205 JPEG; 12,340,705 bytes |
| Oakmoss at Myrstigen | 2020-04-19 16:52; Myrstigen, Sweden; same model and serial; Photoshop 21.1; sRGB | 3,283×4,925 JPEG; page states 6.8 MB |

These are record assertions, not authenticated EXIF. Different dates and subjects do not undo the shared photographer/device. Category totals include material other than eligible photographs and are not counts of cleared independent scenes. Unknown serials elsewhere do not prove different cameras. [Rope][rope] [Oakmoss][oakmoss] [Category][carter]

The existing pilot's Daderot records name Sony DSC-RX100M3; Thomson200's record lacks a camera model and says HDR with no original saved; Mshuang2's record names OnePlus A6003. Those observations do not prove broad current-phone coverage. Several original files, including both new W.carter samples, exceed the accepted geometry. Any approved development/conversion into bounded study covers must occur **before embedding**, with its own safe acquisition/conversion limits. It is not permission to feed oversized originals into the codec or resize encoded PNGs. [Proposal records][proposal] [Limits][limits]

The [RAISE CSV guide][raise-guide] documents filename, file size, geometry/quality, device model, exposure metadata and NEF/TIFF URLs for the same image IDs. It does not establish a full photographer/serial/session/scene map in the inspected sample. NEF and TIFF forms remain one capture. Its examples include compressed/lossless-compressed RAW even though the overview calls RAWs uncompressed; do not assume a fixed raw-raster byte size. The page's static “12345” custom-download counter is not a verified inventory; use the owner's headline count only as a publisher statement.

FiveK provides lighting, time-of-day, subject and indoor/outdoor tags, EXIF summaries and camera models. Filename fragments such as `jmac`, `dgw` and `NKIM` are clues, not a documented photographer-ID map. Expert TIFFs are 16-bit/channel ProPhoto RGB, not ready RGB8 covers. RAW development, ICC/orientation handling and any pre-embedding crop must be pinned. Lightroom is not automatically required if using the DNG route, but the chosen converter and its dependencies need their own license review. [FiveK data][fivek] [Author description][fivek-project]

**Supported blocker:** no inspected source supplies a verified manifest that can now establish all three disjoint photographer/physical-camera/session portfolios. Adding headline archive counts or using different download sites does not repair that gap.

**Conditional acquisition route, not an approved split:**

1. Keep the four pilot photographs and their connected creator/device groups in development. FiveK could supply additional research-only development material, but reserve the whole collection there until its internal source identities are established rather than adopting its random split.
2. Audit additional own-work CC0/CC-BY contributor portfolios for validation and held-out coverage. W.carter is one concrete lead, not a sufficient independent-source population. Metadata-only inspection here did not tune a codec or detector; any later source that influences those choices becomes development data.
3. RAISE could be reserved as a separately acquired finite-source test stratum, conditional on qualification and manifest review. Its few sources cannot supply broad phone diversity or fix missing primary-set source coverage. If used for tuning, it cannot later be called untouched external test.
4. Where metadata cannot establish the required groups, obtain contributor-supplied capture/device/session manifests and new licensed portfolios. These are exact missing inputs, not permissions or data already obtained. Do not silently replace them with repeated crops.

At acquisition, construct connected groups from photographer, physical device, source capture, session/burst/scene, derivatives and reposts; assign each component wholly to one split. Report component sizes and actual portfolio counts after grouping. Unknown identities must remain unknown and cannot support verified physical-camera separation. All methods, loads, salts, cover/stego pairs and damage variants inherit the same parent group. A source-level split does not make scenes within one source statistically independent; later inference must account for clustering.

**Deduplication remains undone.** Exclude the older ten-photo corpus (brick, camera, chelsea, china, clock, grass, rocket, gravel, retina, flower) and its derivatives from fresh development/confirmation, as required by the [proposal][proposal]. The later four-photo pilot stays development-only. Compare source hashes, orientation-normalized pixel hashes and crop/resize/recompression-aware similarity candidates across all sources and both pilot lineages; review matches and bursts. Record parent links and unresolved cases. No decoded-pixel near-duplicate result or absence from public-model training sets is claimed here.

## 4. Detector permissions: source, runtime and weights are separate

### DDE color-rich features and ensemble

**A conditional research-use implementation exists.** Both first-party source ZIPs were inspected without execution:

| Artifact | Inspected identity | Permission-bearing files |
| --- | --- | --- |
| [SCRMQ1.zip][scrm-zip] | 14,235 bytes; SHA-256 `6fd2c5f0827ec2530c995ee513f11f01ea46a966ff6420881ed744142807f917` | `SCRMQ1.m` (95,064 bytes) |
| [ensemble_2.0.zip][ensemble-zip] | 13,484,667 bytes; SHA-256 `ace563558a25dc99fff2aa3ac34a6032170cf2809f2770f8a903c87e85f6422e` | `ensemble_training.m`, `ensemble_testing.m`; source version 2.0, June 2013 |

All three runtime headers state:

> Permission to use, copy, modify, and distribute this software for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that this copyright notice appears in all copies.

This resolves the proposal's uninspected-header question: redistribution **is explicitly granted within the stated purpose restriction**. Keep notices and disclaimers in copies/ports; do not relicense the code as unrestricted MIT or presume commercial/product permission. The tutorial header does not repeat this full grant, and bundled example data were not independently cleared. Use the explicitly granted runtime files with original study usage code instead of treating the entire archive as uniformly licensed. Broader uses need rights-holder clarification. Trained parameter publication also needs review of the intended use and training-image terms. [DDE index][dde-index] [Ensemble page][ensemble]

The selected model is **SCRMQ1: 18,157 features**, comprising 12,753 spatial SRMQ1 features and 5,404 inter-channel CRMQ1 features. Spatial features merge the per-RGB-channel models; color residual co-occurrences preserve inter-channel information, with default color truncation `Tc=3`, not grayscale conversion. The classifier is a random-subspace Fisher linear discriminant ensemble with bootstrap sampling and out-of-bag selection. A port needs review of residuals, quantization/rounding, borders, symmetries, feature order, RGB merging and paired sampling, with reference vectors. The extractor's inherited generic 34,671-feature comment is not the selected Q1 model's dimension. [Color-model paper §§II–III][color-paper] [DDE index][dde-index]

DDE supplies MATLAB source, not a MATLAB runtime entitlement. The ensemble FAQ says no additional libraries/toolboxes are needed; that is not a complete release-specific audit of every extractor or proof of Octave compatibility. Supply an appropriate MATLAB license and review the installed agreement before execution or runtime redistribution. No entitlement, purchase or installation was established. The [MathWorks licensing categories][matlab] do not make an independent research project automatically eligible for Academic/Home terms. The JPEG Toolbox mentioned elsewhere on DDE's index is not thereby required by this spatial RGB route.

### WISERNet learned RGB detector

The author repository remains at `4e3b110d580ea1ed278181257b7c0ec410f89fc5`. Its [complete tree][wiser-tree], [README][wiser-readme] and inspected model/solver/source headers establish **no explicit reuse grant for author code or weights**. Public visibility is not permission.

- **Author code and additions:** copying, modifying or redistributing model configuration, scripts and added initializer code needs an explicit grant. The README's instruction to replace Caffe's `filler.hpp` is not that grant.
- **Weights:** metadata identifies `wisernet.caffemodel`, 18,667,549 bytes, blob `b52b7fc050c862b07a1f8f591f9ff5b995721718`. Weights were not downloaded. README says the checkpoint was trained for 0.4-bpc HILL_CMD_C on BOSSBase PPG_LAN2, not complete Obscr envelopes. Its use/fine-tuning/redistribution rights are separate, and permission would not make it a matched detector.
- **Framework:** the README pins Caffe `f19f0f17e711045d25dacb20f9b5ef6d39eb8aad`; its [BSD-2-Clause license][caffe-license] permits source/binary modification and redistribution with notices. That grant does not license the separate WISERNet additions, demo data or checkpoint.
- **Dependencies:** the original path uses Caffe/CUDA, BLAS, Boost, protobuf, glog, gflags, HDF5 and its chosen LMDB/Python 2.7/NumPy/SciPy loader. [Caffe installation][caffe-install] [Loader][wiser-loader] This is not a modern tested lockfile or a completed binary/transitive-license audit.

**Concrete alternative:** implement the published RGB architecture in original code and train fresh weights, rather than copy unlicensed source or convert its checkpoint. The [paper's Table III and §II-C][wiser-paper] specify 30 learnable 5×5 SRM-initialized filters per RGB band (90 residual maps), then three cross-channel convolution blocks with 72/288/1,152 outputs at width factor nine, pooling, and dense layers 800→400→200→2. Review filter coefficients/normalization against the [published SRM method][srm-paper], RGB scale/order, padding, pooling rounding, batch normalization, initialization and paired data loading. Implement whole-image scoring, or a frozen full-coverage tile aggregation that includes bootstrap positions; never resize stego files to fit the network or count tiles as independent photos.

The specification needs an explicit choice before implementation: [pinned model source][wiser-model] uses TanH after the first reunion block's BN, while the paper says ReLU. Last-pooling strides also differ, though both yield 1×1 for the baseline input. The [solver][wiser-solver] validates every 2,000 iterations and snapshots every 1,000; the paper says validation/saving every 10,000. A new implementation cannot claim exact agreement with both. Record which specification it follows and review it before training.

A framework such as PyTorch offers an explicit [BSD-style permission path][torch-license], but its [NOTICE][torch-notice] points to separate third-party/submodule terms. This is not a selected version or a cleared wheel. Pin and audit the chosen framework, Python/numerical/image pipeline and any CUDA/cuDNN/driver stack before use or distribution. Independent implementation still requires authorship/provenance review; a paper citation alone is not universal intellectual-property clearance.

### Directly relevant alternative checked

[`sealwatch` at `90af7175a70f9c7cf48072b011334add499805db`][sealwatch] offers RGB CRM/SRM features and an FLD ensemble under [MPL-2.0][sealwatch-license]. It is not a weak-statistics substitute, but it is **not an established unrestricted escape from DDE terms**: the authors acknowledge derivation of feature extractors and detector from DDE MATLAB code. This pass did not establish an additional DDE grant for broader relicensing. That is an unresolved provenance question, not an infringement conclusion.

Its [CRM default][sealwatch-crm] uses `Tc=2`, not the intended `Tc=3`; CRM alone is not complete SCRMQ1. [Compatibility notes][sealwatch-compat] record rounding/RNG and ensemble-search differences. Its [manifest][sealwatch-manifest] brings a larger Python/image/ML dependency graph, not audited here. Directly granted original DDE runtime files therefore have the clearer conditional research-use rights chain. No ready-trained licensed color-aware learned alternative was established.

## 5. Resources: first-party facts versus calculations

### Published requirements and observations

| Source | What is actually stated | What it does not establish |
| --- | --- | --- |
| RAISE download page | Approximately 350 GB for the full set; a separate approximately 5-GB Nikon flat-field set. | No measured download, verified per-subset bytes or total derived-study storage. Flat fields are not independent natural photographs. |
| FiveK data page | Approximately 50-GB full archive for DNG inputs, catalog and semantic information. | Do not include all separately offered expert TIFF renditions in that size. No binary integrity check was made. |
| WISERNet paper | 10,000 source RAWs; 6,000 cover/stego pairs for training, with 1,000 of those reserved for validation; 4,000 test pairs; ten repeats; batch size 16; maximum 300,000 iterations. | These are historical experiment settings, not sufficient training data or approved sample sizes for Obscr's low useful loads and complete overhead. |
| WISERNet paper, footnote 6 | Deep models ran on a cluster with 80 Tesla P100 cards; rich models on a 200-core CPU cluster. | No per-run GPU allocation, training duration, minimum cluster size or peak memory is given. The repository launch script selects one GPU index. |
| WISERNet files | Checkpoint metadata is approximately 18.67 MB; LMDB creator sets `map_size=int(1e13)`. | Checkpoint bytes are not training memory. The map setting is not evidence of 10 TB of stored images. |
| Obscr accepted pilot | 64-MiB fixed codec linear-memory maximum; separate 64-MiB KDF; image-stage process peaks 398,508,032–446,791,680 bytes. | Harness-inclusive process peaks are not per-operation memory, whole-browser memory, phone support or detector-training requirements. |

Sources: [RAISE downloads][raise-download], [FiveK][fivek], [WISERNet §III-A][wiser-paper], [loader][wiser-loader], [launch script][wiser-launch], [accepted pilot][pilot]. No training wall-time or monetary estimate is supported. The pilot's stage timings use different case counts and diagnostic retention; do not multiply them into a detector-training quote.

### Storage arithmetic, not an approved allocation

**[INFERENCE]** Let `G` be photographs, `R` placements per method/load, and `q` admitted method/load outputs per photograph. Cover plus encoded RGB8 rasters require `G × (1 + qR) × W × H × 3` bytes. Eight arms and three loads give at most 24 outputs, but the four uncompressed adaptive 2,048-byte cases necessarily exceed `floor(262144 × 0.02 / 8) = 655` coded bytes even before complete framing. Thus that grid has at most 20 admitted outputs per photograph; further rejections reduce it. All 24 attempt records remain.

The following **illustration only** uses the proposal's unapproved `G=8,000`, one placement, `512×512` RGB8 and all other rows admitted. PNG compression, alpha, scanline/chunk overhead, originals, snapshots and backups are not included. A raster equivalent is not a measured PNG file size or a disk-allocation guarantee.

| Item | Calculated storage |
| --- | ---: |
| One RGB8 raster | 786,432 bytes (0.75 MiB) |
| Cover plus 24 nominal outputs per photograph | 200,000 rasters; 146.484375 GiB |
| Cover plus at most 20 outputs after the four known capacity rejections | 168,000 rasters; 123.046875 GiB |
| One damage variant per admitted encoded output, additional | 117.1875 GiB |
| Five damage operations × two seeds per encoded output, additional | 1,171.875 GiB |
| SCRMQ1 cache for those 168,000 rasters, 18,157 float32 features each | 11.363536 GiB |
| Same cache as float64 | 22.727072 GiB |
| One RGB8 raster at the accepted 12,192,768-pixel ceiling | 34.883789 MiB |

The damage row is a storage example, not a change to the pilot's per-arm seed schedule. Streaming damage cases can avoid retaining every raster, at the cost of replay and an agreed retention policy. Preserve reproducible source/code/seed/hash ledgers and required evidence. Do not discard failure rows. Feature-cache precision needs correctness review; MATLAB storage is not assumed to be float32.

### Compute and memory planning

**[INFERENCE]** For `Ndev` admitted cover/stego pairs and a batch of `B` total images, one epoch has `ceil(2 × Ndev / B)` batches. Total work also depends on detector families, per-arm/load versus mixed training, seeds, epochs, tuning trials, image tiles and measured time per step. These choices need approval. Repeated presentations and augmentation do not add independent sources.

At batch 16 and `512×512`, a float32 RGB input tensor alone is **48 MiB**; the paper's 90-channel first-stage output alone is **1.40625 GiB**. Neither is a VRAM-fit estimate: other activations, gradients, optimizer/checkpoint state, convolution workspace, framework, loading and validation add memory. No accelerator, VRAM minimum, training duration or price has been selected or measured. The accepted application's pixel-buffer/KDF limits remain separate from research-detector resource planning; research infrastructure does not authorize larger codec inputs or budgets.

Two local `agent-local node --input-type=module -e ...` calculations checked the table and tensor arithmetic. Reproduction expressions are `8000*(1+20)*512*512*3/2**30`, `8000*20*2*5*512*512*3/2**30`, `168000*18157*4/2**30`, and `16*512*512*90*4/2**30`. Results are arithmetic, not a smoke run of any detector.

After the relevant permissions and a bounded development benchmark are approved, measure feature extraction throughput, peak host/accelerator memory, step time, checkpoint/cache growth and learning/positive-control behavior on the exact pinned stack. That future measurement must precede a full training-budget commitment and leave held-out data untouched. Source curation, license review, original implementation and independent detector review require separate human allocation; no evidence supports a fixed person-day estimate.

## 6. Supported route, blockers and hand-back

**The route is conditional, not study-ready:** rights-audited contributor portfolios plus qualifying research collections; original DDE RGB features/ensemble under their restricted grant and an appropriate runtime; author permission for WISERNet or a reviewed original implementation of the published RGB method; fresh complete-format training and development sensitivity checks.

| Exact missing prerequisite | What must be supplied or decided | Boundary |
| --- | --- | --- |
| Rights-and-group manifest | Image-level grant/notices, photographer/device/session/scene keys, parent links, duplicate review, connected-group counts and source coverage. Supply additional licensed captures or identity records where absent. | No audited adequate corpus exists in this report. Thousands of files or repeated crops cannot replace independent portfolios. |
| Research-use qualification | Document intended use under RAISE/FiveK/DDE grants, or obtain the needed broader permissions. Resolve derivative/checkpoint release scope. | No third-party contact or grant request was made. |
| Rich-model runtime | Appropriate MATLAB access, or an authorized and reference-checked port with dependency notices. | No runtime entitlement or executable detector was demonstrated. |
| Learned detector | Separate author-code/weight grants, or original paper-based implementation, resolved paper/source differences, dependency review, new training and architecture review. | No permission-cleared trained Obscr learned model was supplied. |
| Resource commitment | Chosen machine/access, bounded development benchmark, storage/retention policy, measured training cost and a human-approved acquisition/training allocation. | No charges, training duration or fixed budget is authorized. |
| Confirmation rules | Source splits, detector checks, worthwhile detection gain, acceptable repair cost, minimum useful admission rate and cluster-aware sample-size calculation. | These are reserved for the hiding/recovery decision before held-out scoring. |

Keep salt-specific tests and whole-image color-rich/learned scores distinct. Train on complete files, including bootstrap and framing. Require development learning curves and positive controls for both primary detector families; easy filler-on detection alone does not demonstrate adequate sensitivity at the actual sparse candidate loads. A weak detector, missing source coverage or unavailable load makes the result inconclusive or blocked, not a pass. No known public membership test follows merely from a full-rank random-salt syndrome. [Study threat model][proposal]

This report identifies actionable supply routes and the exact missing inputs; it does not prove that no feasible study can ever exist. It also does not narrow the accepted question to a small convenience set or weaker detector. The source grant details refine the earlier proposal; they do not change any accepted product constraint.

**Next after human acceptance:** return to [Choose hiding and recovery behavior](https://github.com/jdragulanescu/obscr/issues/17) to agree the source/split route, permission or original-implementation route, resource commitments and statistical acceptance rules. [Define the complete protected image format](https://github.com/jdragulanescu/obscr/issues/19) retains exact production framing. Merging the findings pull request closes this research ticket, not either design decision or the map.

## Sources and access limits

Successful sources were inspected on 2026-10-24. DDE ZIP-member reads needed a browser fetch after the static reader could not address ZIP members; ZIP contents were decoded without execution. The old Binghamton paper hostname failed DNS; the first-party `ws2` copy below worked. The available WISERNet PDF identifies v2. The installed MATLAB agreement was not available; the [official agreement-location guidance][matlab-agreement] identifies where an entitled user must read it. Dresden access failures are recorded, not treated as license evidence. No binary image, model-weight integrity or complete transitive-dependency audit is claimed.

[direction]: https://github.com/jdragulanescu/obscr/issues/17#issuecomment-6376099077
[proposal]: https://github.com/jdragulanescu/obscr/blob/8fcb9d98753bb023230b263ae6c40340ea32c57d/spikes/adaptive-codec/STUDY-PLAN.md
[pilot]: https://github.com/jdragulanescu/obscr/blob/8fcb9d98753bb023230b263ae6c40340ea32c57d/spikes/adaptive-codec/FINDINGS.md
[limits]: https://github.com/jdragulanescu/obscr/issues/18#issuecomment-6374176664
[cc0]: https://creativecommons.org/publicdomain/zero/1.0/
[carter]: https://commons.wikimedia.org/wiki/Category:Images_by_W.carter
[rope]: https://commons.wikimedia.org/w/index.php?title=File:Coiled_white_mooring_rope.jpg&oldid=916796260
[oakmoss]: https://commons.wikimedia.org/wiki/File:Oakmoss_at_Myrstigen_3.jpg
[raise]: https://loki.disi.unitn.it/RAISE/index.php
[raise-download]: https://loki.disi.unitn.it/RAISE/download.html
[raise-confirm]: https://loki.disi.unitn.it/RAISE/confirm.php?package=all
[raise-license]: https://loki.disi.unitn.it/RAISE/data/RAISE_License.pdf
[raise-guide]: https://loki.disi.unitn.it/RAISE/guide.html
[fivek]: https://data.csail.mit.edu/graphics/fivek/
[fivek-adobe]: https://data.csail.mit.edu/graphics/fivek/legal/LicenseAdobe.txt
[fivek-mit]: https://data.csail.mit.edu/graphics/fivek/legal/LicenseAdobeMIT.txt
[fivek-adobe-ids]: https://data.csail.mit.edu/graphics/fivek/legal/filesAdobe.txt
[fivek-mit-ids]: https://data.csail.mit.edu/graphics/fivek/legal/filesAdobeMIT.txt
[fivek-project]: https://people.csail.mit.edu/vladb/photoadjust/
[dresden]: https://forensics.inf.tu-dresden.de/ddimgdb/
[dresden-paper]: https://dl.acm.org/doi/10.1145/1774088.1774427
[scrm-zip]: https://dde.binghamton.edu/download/feature_extractors/download/SCRMQ1.zip
[ensemble-zip]: https://dde.binghamton.edu/download/ensemble/ensemble_2.0.zip
[dde-index]: https://dde.binghamton.edu/download/feature_extractors/
[ensemble]: https://dde.binghamton.edu/download/ensemble/
[color-paper]: https://ws2.binghamton.edu/fridrich/Research/color-04.pdf
[srm-paper]: https://dde.binghamton.edu/kodovsky/pdf/TIFS2012-SRM.pdf
[matlab]: https://www.mathworks.com/pricing-licensing.html
[matlab-agreement]: https://www.mathworks.com/matlabcentral/answers/367289-where-do-i-find-the-mathworks-license-agreement
[wiser-tree]: https://api.github.com/repos/tansq/WISERNet/git/trees/4e3b110d580ea1ed278181257b7c0ec410f89fc5?recursive=1
[wiser-readme]: https://raw.githubusercontent.com/tansq/WISERNet/4e3b110d580ea1ed278181257b7c0ec410f89fc5/README.md
[wiser-paper]: https://arxiv.org/pdf/1803.04805v2
[wiser-model]: https://raw.githubusercontent.com/tansq/WISERNet/4e3b110d580ea1ed278181257b7c0ec410f89fc5/model/wisernet_model.prototxt
[wiser-solver]: https://raw.githubusercontent.com/tansq/WISERNet/4e3b110d580ea1ed278181257b7c0ec410f89fc5/solver/wisernet_solver.prototxt
[wiser-loader]: https://raw.githubusercontent.com/tansq/WISERNet/4e3b110d580ea1ed278181257b7c0ec410f89fc5/lmdb_create.py
[wiser-launch]: https://raw.githubusercontent.com/tansq/WISERNet/4e3b110d580ea1ed278181257b7c0ec410f89fc5/wisernet.sh
[caffe-license]: https://raw.githubusercontent.com/BVLC/caffe/f19f0f17e711045d25dacb20f9b5ef6d39eb8aad/LICENSE
[caffe-install]: https://caffe.berkeleyvision.org/installation.html
[torch-license]: https://github.com/pytorch/pytorch/blob/main/LICENSE
[torch-notice]: https://github.com/pytorch/pytorch/blob/main/NOTICE
[sealwatch]: https://github.com/uibk-uncover/sealwatch/tree/90af7175a70f9c7cf48072b011334add499805db
[sealwatch-license]: https://raw.githubusercontent.com/uibk-uncover/sealwatch/90af7175a70f9c7cf48072b011334add499805db/LICENSE
[sealwatch-crm]: https://raw.githubusercontent.com/uibk-uncover/sealwatch/90af7175a70f9c7cf48072b011334add499805db/sealwatch/srm/crm.py
[sealwatch-compat]: https://raw.githubusercontent.com/uibk-uncover/sealwatch/90af7175a70f9c7cf48072b011334add499805db/compatibility.md
[sealwatch-manifest]: https://raw.githubusercontent.com/uibk-uncover/sealwatch/90af7175a70f9c7cf48072b011334add499805db/pyproject.toml
