# Unprotected-salt codec: disposable byte contract

This spike answers [Measure hiding with an unprotected random salt](https://github.com/jdragulanescu/obscr/issues/31).
It is not production code, a format migration, or phone approval. The parent run
freezes this document and source before scoring. Prior repair vendor files,
`vendor/LICENSE`, and `vendor/provenance.json` stay unchanged.

## Entry points

`codec.mjs` exports `profiles`, `PASSWORD`, `encode`, `decode`, `capacity`, and
`readSaltCode`. The two profiles are exactly:

- `{ name: 'no-repair', parity: 0, mapping: 'grouped' }`
- `{ name: 'grouped-p32', parity: 32, mapping: 'grouped' }`

Pass the profile name or an object with all three matching fields. A profile is
required before derivation. There is no detection, fallback, or alternate KDF.

`encode(rgb, width, height, message, profile, options)` takes exact packed RGB
bytes and message bytes as `Uint8Array`. Options are `compressed` (default false),
`password` (default the exported synthetic experiment password), and optional
`seed`. Interactive callers must supply their user's password. Default salt and
nonce are fresh CSPRNG bytes; the synthetic default password is not a secret.

`decode(rgb, width, height, profile, password = PASSWORD)` returns
`{ outcome: 'exact-ready', message, profile, storedBytes, plainBytes, compressed,
placement }` only after authentication and, when selected, bounded decompression.
Every failure returns `outcome: 'safe-failure'` and the same reason string, with
no `message` field. This common result does not claim constant execution time.

Encode returns `rgb`, `profile`, `storedBytes`, `plainBytes`, `codedBytes`,
`totalCodedBytes`, `saltPositions`, `metadataPositions`, `initialPositions`,
`payloadPositions`, `saltCodeword`, `metadataCodeword`, `codewords`, `ciphertext`,
`compressed`, `overhead`, and `placement`. The historical `saltCodeword` name now
means exactly the raw 16-byte salt, not an error-correcting code. Positions are
arrays of eight RGB sample indices per byte. `initialPositions` joins salt and
header positions. Diagnostics contain counts, not a second decode route.

## Bytes and placement

Let `G = floor(width * height * 3 / 8)`. RGB samples are in the supplied packed
array order. Byte group `g` is samples `8*g` through `8*g+7`. The byte's most
significant bit goes in the first sample's least significant bit. Tail samples
outside complete groups are untouched. No high sample bits or unused groups are
filled or changed.

The public salt is 16 bytes. Salt byte `i` occupies group `floor(i*G/16)` for
`i = 0..15`. There is no salt parity, checksum, marker, repetition, or repair.
The same positions and seeded salt apply to both profiles.

All remaining groups form an ascending logical pool, excluding those 16 salt
groups. Keyed sampling takes header groups first, then payload groups from the
same stream and sampler. One draw selects one whole byte group. No group repeats.

### Key derivation

The password is UTF-8 with no trimming or Unicode normalization. Reject an empty
string, a non-string, any unpaired UTF-16 surrogate, or more than 1024 UTF-8 bytes.
The early code-unit check only rejects inputs that cannot meet this byte limit.

Use `libsodium-wrappers-sumo` and `libsodium-sumo`, both pinned to **0.8.4**:

- Argon2id version 19 (`crypto_pwhash_ALG_ARGON2ID13`)
- 65,536 KiB = 67,108,864 bytes memory
- three passes, one lane, output 32 bytes
- input salt is the raw 16-byte public salt

There is no root cache. Every valid decode attempt derives the password root
before extracting, repairing, or checking the keyed header. Structural profile,
image, minimum-capacity, and password-input checks can reject first.

HKDF-SHA256 derives two 32-byte children from the root. Its salt is 32 zero bytes;
its info is UTF-8 `obscr/keys/1/encryption` or `obscr/keys/1/placement`, with no
terminator. AES-GCM and AES-CTR import the complete respective 256-bit child.

### Bounded sparse sampler

AES-256-CTR encrypts zeros, starting with an all-zero 128-bit counter. Counter
increment is the standard big-endian 128-bit AES-CTR increment. Refills contain
4096 stream bytes (256 AES blocks); unused words are retained across header and
payload requests. Words are consecutive little-endian unsigned 32-bit values.

With `b` pool entries remaining, reject words `x >= floor(2^32/b)*b`. Otherwise
select rank `x % b`, return its current value, replace it with the last remaining
value, and reduce `b` by one. A sparse map holds only changed slots; removed last
slots and identity mappings are deleted. Convert the resulting non-salt rank to
a real group by skipping the 16 ascending reserved groups. The codec never
allocates a full-domain permutation or lookup table.

Limits:

- integer width and height from 1 through 4096
- at most 12,192,768 pixels; exact RGB byte length is required
- `G <= 4,572,288`; pool size is `G - 16`
- `k = header code bytes + payload code bytes <= 262,144`
- random words drawn `<= 2*k + 1024 <= 525,312`, including rejections
- sparse map size `<= k`

The header prefix is separately bounded by `2*headerBytes+1024` draws. After
header validation, the limit extends to the full requested `k`. A bound failure
is a safe failure, not a resampling attempt. Generated unused stream words do
not count as drawn words. Diagnostics include both draw count and generated
stream byte count.

## Header and authenticated encryption

The header data is exactly 36 bytes. All integers are unsigned big-endian.

| Offset | Length | Meaning |
| --- | ---: | --- |
| 0 | 12 | AES-GCM nonce |
| 12 | 4 | Stored plaintext byte length (after optional gzip) |
| 16 | 4 | Original plaintext byte length |
| 20 | 1 | Profile payload parity: 0 or 32 |
| 21 | 1 | Grouped mapping: zero |
| 22 | 1 | Compression: zero for raw, one for gzip |
| 23 | 13 | Reserved zeros |

Reject any nonzero reserved byte, different parity/mapping, invalid compression
value, out-of-capacity stored length, or original length above 1 MiB. Without
compression, both lengths must agree. No parser guess changes the profile.

AAD is the exact concatenation:

`raw salt[16] || header data[36] || width u32 BE || height u32 BE`

AES-256-GCM uses the header's 12-byte nonce and a full 16-byte tag. The payload
data is ciphertext followed by that tag, as returned by WebCrypto. No truncated
tag is accepted. Header and ciphertext repairs occur before GCM authentication;
repair success alone never releases plaintext. Only authenticated stored bytes
can enter the gzip decompressor. Decompression stops on an output bound violation
and must finish at exactly the authenticated original plaintext length.

## Repair and exact overhead

`no-repair` transmits 36 raw header bytes and the raw ciphertext plus tag.

`grouped-p32` transmits header data36 plus RS parity64 = 100 bytes. Payload blocks
contain at most 223 data bytes followed by 32 parity bytes. Full blocks are 255
bytes. A final short block is exactly `dataLength+32`, with no transmitted zero
padding. An exact multiple of 223 has no extra final block. Even an empty message
has 16 tag bytes, so at least one payload block exists.

The existing RS wrapper uses GF(256), primitive polynomial `0x11d`, generator
base zero, systematic encoding, and unknown-byte error correction. Header
correction radius is 32 bytes; payload radius is 16 bytes per block. Beyond the
radius, a decoder may reject or miscorrect. GCM still gates output. Salt has no
correction radius other than zero.

For stored message length `L`:

- no-repair total groups: `L + 68`
- repair payload groups: `L + 16 + 32*ceil((L+16)/223)`
- repair total groups: `L + 132 + 32*ceil((L+16)/223)`

`overhead` separately reports salt, header data/parity, tag, payload parity,
zero padding, stored bytes, total groups, non-payload groups, and keyed groups.
`codedBytes` counts only transmitted payload bytes; `totalCodedBytes` includes
salt and header. Compression savings are not counted as repair overhead.

`capacity` returns the largest stored byte length that fits both the image and
the operational position limit, or -1 if not even an empty envelope fits. Let
`A = min(G-16, 262144) - headerBytes`. For no repair, capacity is `A-16`.
For repair it is `floor(A/255)*223 + max(0, A%255-32) - 16`, provided the minimum
16-byte tagged payload fits. Thus the operational maxima are 262,092 stored
bytes without repair and 229,132 with repair. Plaintext remains limited to 1 MiB,
even when gzip fits in fewer stored bytes. Capacity is not a guarantee that a
particular compressed input fits.

## Fixture randomness: not for real data

Without a seed, separate `crypto.getRandomValues` calls produce salt16 and
nonce12. Supplying `seed` explicitly selects unsafe repeatable experiment data:

`SHA256(UTF8(JSON.stringify(['obscr-unprotected-salt-experiment', label, seed])))`

Take the first 16 bytes for label `salt` and first 12 for label `nonce`. The seed
is a string of at most 4096 JavaScript code units. Neither hash input contains
the profile. Matched fixtures therefore share salt and nonce across profiles.
This repeats a GCM key/nonce pair when the password also matches; it is strictly
for public synthetic experiment inputs. Do not use fixture mode to hide secrets.
Reserved header bytes are zero in both modes.

## Runnable observations and browser import

From this folder, install the pinned local package with `npm ci`. The parent
runs `agent-local node key-chain.mjs` and `agent-local node boundaries.mjs` after
integration. These are disposable observation scripts, not permanent tests.
They produce JSON with computed comparisons and a `passed` flag. A failing
comparison sets a nonzero process exit code.

`keyChainObservations()` uses the fixed a64t3 password and salt from the prior
password-device-cost spike's `results/node-vectors.json`. That result recorded
an independent Noble Argon2id reference, plus Node/Noble HKDF and Node CTR checks.
This helper compares the frozen root, both children, and stream prefix, then
compares HKDF with explicit HMAC extract/expand. A small observation-only dense
sampler independently checks the real sparse sampler, including a 4096-byte
stream refill and a split header/payload request. Dense allocation exists only
inside the observation function, never the codec path.

`runBoundaries()` computes Unicode round trips, failure cases, raw overhead,
capacity edges, full and shortened RS blocks, 16/17 payload and 32/33 header
error observations, salt damage, malformed geometry/password/header inputs,
and the compressed authentication boundary. It temporarily counts decompressor
construction and restores the original constructor. Forged observation records
use the synthetic password to produce valid tags or valid RS parity; they are
not part of the decode API. Boundary observations must not run concurrently with
other work that uses `DecompressionStream` in the same JavaScript realm.

The codec and key-chain module use WebCrypto, Blob streams, CompressionStream,
and DecompressionStream. They have no static Node imports. For browsers, bundle
the same `codec.mjs` with the local esbuild 0.25.12: `bundle:true`,
`platform:'browser'`, `format:'esm'`, `target:'es2022'`, and
`external:['node:*']`. Sodium's Node-only import is environment guarded. Serve
the bundle from a secure context, such as localhost. Include the Sodium licenses
in the parent browser notice artifact. This specifies import setup; it does not
claim that a browser or phone run has passed.
