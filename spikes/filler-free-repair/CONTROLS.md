# Controls

The runner imports the unchanged `lib/crypto.js`, `lib/steg-core.js`, `lib/utils.js` and `lib/mersenne-twister.js` from this branch. It does not equate earlier experiment counts with this run.

- **legacy-filler-on:** production encryption (PBKDF2-SHA512, 65,535 rounds, 32-byte random salt, AES-256-GCM, 12-byte nonce, full tag, base64 colon-separated record), `str_to_bits(...,1)`, password-derived production placement and `write_lsb(..., obfuscate=true)`. The existing filler RNG is temporarily replaced only during its synchronous write with seeded LCG bytes so the filler can be reproduced. Encryption salt/nonce remain platform random; saved encoded assets are the exact observed run.
- **legacy-filler-off:** exactly the same path with `obfuscate=false`.
- **legacy-five-copy:** the same encrypted record with `str_to_bits(...,5)`, the same production placement and no filler. Decode uses `bits_to_str(...,5)` before production authenticated decryption. This is a new precisely defined five-copy control, not the earlier image-survival codec and not a proposed product format. It retains the old weak placement on purpose as a control.

Useful message bytes, not encrypted-record bytes, match the candidate. This preserves base64 and repetition overhead rather than adjusting them away. The production app does not read the experimental candidate. CLI/browser exchange in this spike proves only the experimental adapters agree.

`controls.mjs` defines the damage PRNG exactly: unsigned 32-bit LCG, multiplier 1664525, increment 1013904223; range selection by scaled float. This test-fixture PRNG is not used for candidate cryptography or placement. Pixel selection is unique swap-last sampling, each case resets the declared seed. One-channel damage chooses channel then sign and clips to 0..255; RGB replacement generates three independent bytes. Patch and stripe use the declared geometry and this same replacement generator.

Visual metrics count changed RGB samples and squared sample differences. They are not concealment measurements. Raw detection features and labels are retained independently from those metrics.
