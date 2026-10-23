# Filler-free repair codec experiment

This is a throwaway candidate for [Measure filler-free hiding and bounded pixel repair](https://github.com/jdragulanescu/obscr/issues/28), not a production format. It asks how repair cost and damage change with grouped or scattered placement. It does **not** establish concealment. Its public salt code gives an observer a targeted presence test. This can be sufficient reason to reject the design, regardless of successful repair.

## API

`codec.mjs` imports only `rsEncode` and `rsDecode` from `rs.mjs`. It uses browser/Node globals: Web Crypto, Blob, CompressionStream and DecompressionStream. Use a Node version that provides those globals or a browser secure context. No production module is changed or imported.

- `profiles`: six objects `{name, parity, mapping}`. Names are `grouped-p16`, `scattered-p16`, `grouped-p32`, `scattered-p32`, `grouped-p64`, `scattered-p64`. Mapping is `grouped` or `scattered`. A profile argument can be one of these objects or its name.
- `PASSWORD`: a fixed synthetic experiment password, not a secret.
- `await encode(rgb, width, height, message, profile, {compressed=false, seed='repair-experiment'})`: returns a new RGB array and measurement data. It does not modify the input. Message and RGB must be Uint8Array. Invalid or oversized input throws.
- `await decode(rgb, width, height, profile, password=PASSWORD)`: returns `{outcome:'exact-ready', message, profile, storedBytes, plainBytes, compressed}` only after authentication and any bounded decompression. Otherwise returns `{outcome:'safe-failure', reason}` without plaintext. An omitted profile tries the fixed six profiles, with one salted password derivation. No weaker repair fallback is used. The browser should require a selected profile.
- `capacity(width, height, profile)`: exact maximum stored bytes, before the 16-byte authentication tag. Returns `-1` when even an empty uncompressed envelope does not fit. Invalid dimensions/profile throw.
- `readSaltCode(rgb, width, height)`: returns the public 80-byte received salt codeword without repair or a password. This is deliberately available to the presence detector. Invalid input throws.

Encode returns `storedBytes`, `plainBytes`, `codedBytes` (payload only), `totalCodedBytes` (payload plus 180 fixed bytes), `profile`, `compressed`, and:

- `saltPositions`: 80 entries; `metadataPositions`: 100 entries; `initialPositions`: these 180 entries in that order.
- `payloadPositions`: one entry per encoded payload byte, in payload codeword order.
- Each position entry is a Uint32Array view of eight raw RGB indices, most-significant bit first. Views share backing buffers. They are not RGBA offsets or pixel numbers.
- `saltCodeword`, `metadataCodeword`: original protected records, for direct byte-error measurement.
- `codewords`: payload Uint8Array codewords, in order. Full codewords have 255 bytes; the last can be shorter. The matching payload position slice starts at the sum of all earlier codeword lengths.
- `ciphertext`: stored bytes encrypted with the appended full GCM tag, before RS coding.

`exact-ready` means authenticated and structurally valid, not that this module compared the result to the harness's original. The harness must compare bytes to report exact recovery.

## RGB convention and placement

Packed RGB order is R, G, B for each pixel, with one slot per channel. Each written bit replaces only the channel's low bit: `(value & 254) | bit`. This is the same replacement convention as `lib/steg-core.js` (`clearLSB`/`setLSB`), without its optional filler. Unused channels remain unchanged. There is no alpha channel in this API.

Let `G = floor(3 * width * height / 8)`. The image is divided into G complete groups of eight slots; its last zero to seven slots are never used. The salt record uses group `floor(i * G / 80)`, for `i=0..79`, in that order. All eight slots in each of these public groups are reserved. The groups are unique when G is at least 80. Salt byte bits use slot order, most-significant first. This gives 640 fixed, public, evenly distributed slots without depending on damaged metadata.

For grouped placement, the initial pool is the ascending list of all remaining group IDs. For scattered placement, it is the ascending list of all eight individual slots in those remaining groups. This reserves exactly the same space and gives equal byte capacity for both mappings. Secret metadata consumes the first 100 selected bytes; payload consumes the next bytes. Grouped placement samples one group per byte. Scattered placement samples eight separate slots per byte. No slot is reused.

The placement stream is native AES-256-CTR encryption of zeros, using the placement key, a zero initial 128-bit big-endian counter and a full 128-bit counter length. It is generated in 65,536-byte batches, with the counter advanced by 4,096 blocks per batch. Read each consecutive four stream bytes as an unsigned little-endian integer. For a pool with n entries remaining, reject values at least `floor(2^32/n)*n`; use the accepted value modulo n. Return that pool entry and replace it with the last remaining entry, then shorten the pool. This is unique selection with no modulo bias. Stream draws are capped at `2 * initialPoolLength + 4096`; exceeding this limit fails rather than changing the mapping. Profile names and mapping IDs are not added to the CTR stream.

## Keys and synthetic material

One 256-bit root comes from PBKDF2-HMAC-SHA256, 100,000 iterations, the UTF-8 password, and the repaired 16-byte salt. This is an **experimental** KDF cost, not an approved production setting. There is no fast password-to-position map.

Passwords use exact UTF-8 bytes, without trimming or normalization. Empty input, unpaired UTF-16 surrogates and passwords above 1,024 UTF-8 bytes are rejected before derivation.

Import the root into HKDF-SHA256, with 32 zero salt bytes. Derive separate 256-bit keys with UTF-8 info labels `obscr/keys/1/encryption` and `obscr/keys/1/placement`. Use these for AES-GCM and AES-CTR respectively.

Material is deterministic for reproducible synthetic runs: SHA-256 of the UTF-8 JSON encoding of `['obscr-repair-experiment', label, seed]`. Labels are `salt`, `nonce`, and `reserved`; take the first 16, 12, and 13 bytes respectively. Seeds are limited to 4,096 JavaScript string code units. **This is not product randomness. Reusing a seed repeats both encryption key and GCM nonce. Never use this experiment to protect real messages.** Encode uses PASSWORD; decode accepts a password to measure failure with a wrong password.

## Exact byte layout

The public bootstrap has 16 salt data bytes and 64 RS parity bytes, for 80 bytes. It has no signature or original fixed magic. Its RS relation is nevertheless public and recognizable. Do not describe its appearance as unrecognizable merely because there is no literal signature.

The secret metadata has 36 data bytes and 64 independent RS parity bytes, for 100 bytes. Its data layout is:

| Offset | Length | Meaning |
| --- | --- | --- |
| 0 | 12 | GCM nonce |
| 12 | 4 | Stored byte length, unsigned big-endian |
| 16 | 4 | Plain byte length, unsigned big-endian |
| 20 | 1 | Payload parity: 16, 32, or 64 |
| 21 | 1 | Mapping: 0 grouped, 1 scattered |
| 22 | 1 | Compression: 0 none, 1 gzip |
| 23 | 13 | Synthetic reserved bytes, authenticated without a fixed expected value |

AES-256-GCM encrypts the stored message and appends the full 16-byte tag. Its additional authenticated data is the concatenation of the 16 salt bytes, all 36 metadata bytes, and width then height as two unsigned 32-bit big-endian integers. Thus salt, nonce, both lengths, profile, compression flag, reserved bytes and dimensions are authenticated. No plaintext is returned until authentication succeeds. Metadata is repaired and bounded before it is used to allocate payload work; authentication remains necessary even if RS reports successful repair.

For payload parity p, k is `255-p`. Split ciphertext plus tag into k-byte data chunks. Encode each chunk independently with p parity bytes. The last chunk is shortened; conceptual leading zero data padding is not transmitted. Ciphertext always includes a tag, so there is at least one payload block. Salt and metadata use shortened codes with 64 parity bytes, independently of p. Their nominal correction bound is 32 byte errors per record. Payload bounds are 8, 16 or 32 byte errors per codeword. Beyond these bounds, RS can fail or miscorrect; GCM must still authenticate before any result is accepted.

Fixed transmitted cost is 180 bytes: salt 16 + salt parity 64 + metadata 36 + metadata parity 64. With s stored bytes, payload cost is

`C(s,p) = s + 16 + p * ceil((s + 16) / (255-p))`.

Total occupied slots are `8 * (180 + C(s,p))`. There is no filler, alignment padding inside shortened codewords, hidden checksum, truncated tag, or uncounted magic.

For exact inversion, let `B = G - 180`. If B is less than `16+p`, even the empty envelope cannot fit. Otherwise the maximum stored size is

`floor(B/255)*(255-p) + max(0, (B % 255)-p) - 16`.

This accounts for unusable remainders too short to hold parity and one data byte. Capacity refers to stored bytes; plaintext capacity with gzip depends on the input.

## Compression and bounds

With compression disabled, stored bytes equal plaintext exactly. With compression enabled, the entire plaintext is gzip-compressed before encryption. Compression is never chosen automatically and never silently disabled if gzip expands the input. The encoder rejects gzip output above exact stored capacity. CompressionStream can have runtime-specific gzip output; the experiment does not promise identical compressed bytes across engines.

Decode authenticates before starting gzip decompression. It reads decompression output incrementally, cancels the reader as soon as accumulated output exceeds authenticated plainLength, and requires the final size to match. Both compressed and uncompressed paths enforce a maximum plaintext of 1,048,576 bytes. Truncated or malformed gzip produces safe failure.

Dimensions are integers from 1 to 1,024 each. Thus RGB has at most 3,145,728 bytes, G at most 393,216, and the secret placement pool has at most 393,136 groups or 3,145,088 slots. Its Uint32Array takes at most 12,580,352 bytes in scattered mode. The position backing buffers take four bytes per occupied RGB slot (at most 12,582,912 bytes in total). Position views number at most 393,216; JavaScript engine overhead for these objects is additional and implementation-dependent. `initialPositions` reuses existing views.

Other explicit work includes one RGB output copy; codeword, combined payload, and ciphertext buffers each bounded by image byte capacity; the 65,536-byte CTR input and output batches; and bounded compression/decompression chunks plus their final joined output (at most 1 MiB each on decompression). Native crypto/compression buffers and garbage collector timing are runtime-dependent. This is a bounded experiment, not a measured memory guarantee. Decode tries at most six profiles and derives the salted root only once per call. No workload beyond these bounds is supported.

## Evidence boundary

The public bootstrap allows an observer to extract the salt codeword without a password and check its RS relationship. Damaged codewords can also be tested for proximity to a valid codeword. Neither a secret payload mapping nor a full GCM tag removes that presence signal. The harness must report this detector separately from generic image statistics and compare grouped/scattered mappings across all parity profiles. Repair success alone cannot pass a concealment requirement.

Recorded observations live in `evidence/`; the findings distinguish actual runs from bounds derived from this implementation.
