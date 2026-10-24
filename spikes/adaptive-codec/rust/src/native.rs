// Modified for Obscr issue #35: upstream test-only module omitted; bounded ABI helpers appended.
// Original algorithm and column/sign generators are unchanged. Apache-2.0; see PROVENANCE.md.
//! Syndrome-Trellis Codes, implemented in safe Rust.
//!
//! This module replaces the former FFI wrapper around libsdc++. It solves the
//! same problem the foreign library did, with the same public surface, and
//! without a single `unsafe` block or a C++ toolchain.
//!
//! # The problem being solved
//!
//! Given a cover vector `x`, a per-position cost vector `rho` and a message `m`,
//! find the stego vector `y` that minimises `sum(rho_i * |y_i - x_i|)` subject to
//! `H * y = m (mod 2)`, where `H` is the parity-check matrix of a convolutional
//! code. Minimising a sum of costs under a linear constraint is what makes the
//! embedder *adaptive*: the changes land where the image can hide them, not
//! wherever the payload happened to fall.
//!
//! The reference is Filler, Judas and Fridrich, "Minimizing Additive Distortion
//! in Steganography using Syndrome-Trellis Codes", IEEE TIFS 2011.
//!
//! # How the matrix is represented
//!
//! `H` is never materialised. It is defined implicitly by a running `h`-bit
//! register — the trellis state — and one `h`-bit column per cover position:
//!
//! ```text
//! register = 0
//! for each block of positions:
//!     for each position j in the block:
//!         if y_j == 1 { register ^= column_j }
//!     message_bit = register & 1
//!     register >>= 1
//! ```
//!
//! That loop *is* the syndrome computation, and it is literally what
//! [`stc_decode_safe`] runs. Encoding is the same loop read backwards: find the
//! cheapest assignment of `y` that makes the register produce the message.
//!
//! The columns are drawn from a ChaCha20 keystream keyed by `stc_seed`, so
//! sender and receiver build the same matrix from the same secret without any of
//! it travelling in the container. Two bits of every column are forced on:
//!
//! * **Bit 0.** A block whose columns were all even could not change the parity
//!   the register is about to emit, and the trellis would have no path at all for
//!   one of the two message bits. Forcing the low bit makes every block solvable
//!   by construction rather than with overwhelming probability.
//! * **Bit `h - 1`.** Without it a change would not reach the top of the register
//!   and the effective constraint height would be shorter than the one asked for.
//!
//! Both are properties of the hand-optimised submatrices published with the
//! reference implementation, arrived at there for the same reasons.
//!
//! # Two bounds that are not in the paper
//!
//! The published algorithm is `O(n * 2^h)` in time and stores one survivor bit
//! per position and state, i.e. `n * 2^h` bits. On the four-megapixel containers
//! this crate insists on, at `h = 10`, that is half a gigabyte of survivor
//! decisions. Two limits keep the coder inside a working set that a desktop
//! actually has:
//!
//! * `MAX_BLOCK_WIDTH` caps how many cover positions one message bit may be
//!   spread over. A payload at the [`MAX_BPP`] ceiling needs about fifty-nine
//!   positions per bit, so the cap never binds there and the whole container is
//!   used exactly as the design intends; it binds only for payloads well under
//!   the ceiling, where the surplus positions buy a coding gain far below one
//!   change per container. The positions that go unused are simply left alone,
//!   and both sides compute the same count from the cover length and the message
//!   length, so nothing has to be transmitted.
//! * `MAX_SEGMENT_COLUMNS` caps how much of the trellis one forward pass keeps
//!   survivors for. Longer runs are cut into segments, each solved as its own
//!   trellis with the register reset to zero at the boundary. The decoder resets
//!   at the same places, so the two agree; the only price is the `h` bits of
//!   memory the register would otherwise have carried across, once every
//!   sixty-five thousand positions.
//!
//! # What a cover position holds
//!
//! One image sample per position — the carrier byte of a pixel, not a bit. The
//! coder reads its least significant bit as the cover symbol and, when the
//! trellis asks for a change, writes back `value ± 1` rather than overwriting the
//! bit. The two are indistinguishable in the payload they carry and very
//! different in what they leave behind: LSB overwriting pairs each even value
//! with the odd one above it and never the other way round, which is the
//! asymmetry RS Analysis and Sample Pair Analysis are built to measure. Adding or
//! subtracting one, with the direction drawn from the keystream, leaves the
//! histogram symmetric and those detectors with nothing to read.

use std::fmt;

use chacha20::cipher::{KeyIvInit, StreamCipher};
use chacha20::ChaCha20;
use zeroize::{ZeroizeOnDrop, Zeroizing};

/// Bits per pixel the embedder may never exceed.
///
/// A hard limit of the design, not a tunable: detection accuracy against the
/// modern rich-model detectors climbs steeply with payload rate, and everything
/// this crate does — the HILL costs, the trellis, the permutation — buys
/// invisibility only in the low-rate regime. Exposing this as a runtime
/// parameter would let a caller trade away, in one argument, the property the
/// whole system exists to provide.
pub const MAX_BPP: f32 = 0.02;

/// Constraint height of the trellis used unless a caller overrides it.
///
/// Embedding efficiency grows with the height and so does the cost of the
/// Viterbi pass, which is `O(2^h)` per position; ten is the value the published
/// measurements use to sit near the rate-distortion bound without becoming
/// impractical.
pub const DEFAULT_TRELLIS_HEIGHT: u32 = 10;

/// Shortest constraint height the coder will run.
///
/// At `h = 1` the register has no memory beyond the block it is in and the code
/// degenerates into plain parity embedding, which is not what any caller asking
/// for a trellis wants.
const MIN_TRELLIS_HEIGHT: u32 = 2;

/// Tallest constraint height the coder will run.
///
/// The state space doubles with every unit, so twenty already means a million
/// states per position. The limit is what keeps a mis-set height a clean error
/// instead of an allocation nobody can serve.
const MAX_TRELLIS_HEIGHT: u32 = 20;

/// Nonce of the keystream that generates the parity-check columns.
///
/// Distinct from the zero nonce [`crate::stego::permute`] uses. Both keystreams
/// run under the same seed, and drawing the matrix from the same stream as the
/// permutation would tie the two together for anyone who recovered either.
const H_MATRIX_NONCE: [u8; 12] = [1u8; 12];

/// Nonce of the keystream that chooses the direction of each change.
///
/// A third stream, for the same reason the second one exists.
const SIGN_NONCE: [u8; 12] = [2u8; 12];

/// Cover positions the trellis will spend on one message bit, at most.
///
/// See the module documentation: the cap is above the width a full-capacity
/// payload asks for, so it costs nothing at the rate the system is designed
/// around and bounds the work for everything below it.
const MAX_BLOCK_WIDTH: usize = 64;

/// Cover positions one forward pass keeps survivor decisions for, at most.
///
/// At `h = 10` this is eight mebibytes of survivors per segment, which is the
/// figure the segmentation exists to hold down.
const MAX_SEGMENT_COLUMNS: usize = 1 << 16;

/// Bytes of ChaCha20 keystream produced per refill.
const KEYSTREAM_BUFFER_BYTES: usize = 512;

/// Bits in a byte, named where the conversion happens.
const BITS_PER_BYTE: usize = 8;

/// Every way the Syndrome-Trellis Codes layer can refuse to run.
#[derive(Debug)]
pub enum StcError {
    /// The cover vector and the cost vector describe different position counts.
    LengthMismatch {
        /// Number of cover positions supplied.
        pixels: usize,
        /// Number of costs supplied.
        costs: usize,
    },
    /// The payload asks for more bits than `max_bpp` allows over this cover.
    PayloadExceedsCapacity {
        /// Bits the payload needs.
        payload_bits: usize,
        /// Bits the cover may carry under the `max_bpp` hard limit.
        capacity_bits: usize,
    },
    /// A cost was negative, infinite or not a number.
    InvalidCostMap,
    /// The trellis could not be built or could not be solved.
    EncodingError(String),
    /// The syndrome could not be computed for the parameters given.
    DecodingError(String),
}

impl fmt::Display for StcError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StcError::LengthMismatch { pixels, costs } => write!(
                f,
                "cover and cost vectors disagree: {pixels} positions against {costs} costs"
            ),
            StcError::PayloadExceedsCapacity {
                payload_bits,
                capacity_bits,
            } => write!(
                f,
                "payload of {payload_bits} bits exceeds the {capacity_bits} bits this cover may \
                 carry"
            ),
            StcError::InvalidCostMap => write!(
                f,
                "the cost map contains a negative or non-finite value and cannot be used"
            ),
            StcError::EncodingError(message) => write!(f, "the stc coder failed: {message}"),
            StcError::DecodingError(message) => write!(f, "the stc decoder failed: {message}"),
        }
    }
}

impl std::error::Error for StcError {}

/// Parameters of one Syndrome-Trellis Codes operation.
///
/// Holds key material — the permutation seed — and is therefore wiped on drop.
/// Encode and decode must be given identical configurations: the trellis height
/// is part of the code definition, so a decode at a different height reads a
/// different syndrome and recovers nothing.
#[derive(ZeroizeOnDrop)]
pub struct StcConfig {
    /// Seed of the embedding permutation, derived by HKDF from the master key.
    pub(crate) stc_seed: [u8; 32],
    /// Constraint height of the trellis.
    pub(crate) trellis_height: u32,
    /// Bits per pixel ceiling. Always [`MAX_BPP`]; see the constant.
    pub(crate) max_bpp: f32,
}

impl StcConfig {
    /// Builds a configuration around `stc_seed`, with the defaults of this
    /// crate.
    ///
    /// There is no constructor that takes a `max_bpp`. The field exists so the
    /// limit can be read, not chosen.
    pub fn new(stc_seed: [u8; 32]) -> Self {
        Self {
            stc_seed,
            trellis_height: DEFAULT_TRELLIS_HEIGHT,
            max_bpp: MAX_BPP,
        }
    }

    /// Borrows the permutation seed.
    pub fn stc_seed(&self) -> &[u8; 32] {
        &self.stc_seed
    }

    /// Constraint height of the trellis.
    pub fn trellis_height(&self) -> u32 {
        self.trellis_height
    }

    /// The bits-per-pixel ceiling in force. Always [`MAX_BPP`].
    pub fn max_bpp(&self) -> f32 {
        self.max_bpp
    }

    /// Bits `positions` cover elements may carry under the ceiling.
    ///
    /// Truncating towards zero, so the limit is never rounded up into a payload
    /// that the ceiling does not actually allow. The arithmetic is done in
    /// `f32` deliberately: [`crate::stego::sizer`] advertises capacity with the
    /// same expression, and a wider intermediate type here would let a payload
    /// pass the sizer and then fail this check.
    pub fn capacity_bits(&self, positions: usize) -> usize {
        (positions as f32 * self.max_bpp) as usize
    }
}

impl fmt::Debug for StcConfig {
    /// Prints the parameters of the configuration, never the seed.
    ///
    /// Written by hand rather than derived: a derived implementation would put
    /// key material into every log line and error report that formats a config.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("StcConfig")
            .field("stc_seed", &"[redacted]")
            .field("trellis_height", &self.trellis_height)
            .field("max_bpp", &self.max_bpp)
            .finish()
    }
}

/// Embeds `payload` into the carrier bits of `pixels`, in place.
///
/// `pixels` holds one image sample per embedding position — the carrier byte of
/// each selected pixel — and `cost` holds the price of changing each of them, in
/// the same order. On success the samples the trellis chose have been moved by
/// exactly one level, up or down, so that their least significant bits spell the
/// stego vector; the return value is how many of them moved.
///
/// # Errors
///
/// Returns [`StcError::LengthMismatch`] when the two vectors disagree in length,
/// [`StcError::PayloadExceedsCapacity`] when the payload needs more bits than
/// [`MAX_BPP`] allows, [`StcError::InvalidCostMap`] when a cost is negative or
/// not finite, and [`StcError::EncodingError`] when the configured trellis height
/// is out of range or the cover is too short to carry the message. Every check
/// runs before a single sample is touched, so a rejected input leaves `pixels`
/// exactly as it was.
pub fn stc_encode_safe(
    pixels: &mut [u8],
    cost: &[f32],
    payload: &[u8],
    config: &StcConfig,
) -> Result<usize, StcError> {
    // Pre-condition (a) — the two vectors must describe the same positions.
    if pixels.len() != cost.len() {
        return Err(StcError::LengthMismatch {
            pixels: pixels.len(),
            costs: cost.len(),
        });
    }

    // Pre-condition (b) — the payload must fit under the bits-per-pixel ceiling.
    let payload_bits = payload.len().saturating_mul(BITS_PER_BYTE);
    let capacity_bits = config.capacity_bits(pixels.len());
    if payload_bits > capacity_bits {
        return Err(StcError::PayloadExceedsCapacity {
            payload_bits,
            capacity_bits,
        });
    }

    // Pre-condition (c) — a NaN would poison the path metric and make every
    // comparison in the Viterbi pass false, so the trellis would pick a path
    // arbitrarily rather than cheaply.
    if !cost.iter().all(|&value| value.is_finite() && value >= 0.0) {
        return Err(StcError::InvalidCostMap);
    }

    // Nothing to embed. Returned before the layout is planned so that the
    // division by the message length below never sees a zero.
    if payload_bits == 0 {
        return Ok(0);
    }

    let Some(height) = validated_height(config.trellis_height) else {
        return Err(StcError::EncodingError(format!(
            "a constraint height of {} is outside the supported range {MIN_TRELLIS_HEIGHT}..={MAX_TRELLIS_HEIGHT}",
            config.trellis_height
        )));
    };

    let Some(layout) = TrellisLayout::plan(pixels.len(), payload_bits) else {
        return Err(StcError::EncodingError(format!(
            "a cover of {} positions cannot carry {payload_bits} message bits",
            pixels.len()
        )));
    };

    // Wiped on drop: the unpacked message is the payload, one bit per byte.
    let message = unpack_bits(payload);
    let columns = parity_columns(&config.stc_seed, height, layout.used_positions);

    let stego_bits = solve_trellis(pixels, cost, &message, &columns, &layout, height)?;

    Ok(apply_changes(pixels, &stego_bits, &config.stc_seed))
}

/// Recovers `payload_len_bits` payload bits from the stego samples in `pixels`.
///
/// The extraction path needs no cost map: the syndrome is a function of the
/// stego vector alone, which is exactly what makes it recoverable by a receiver
/// who never saw the cover. Only the least significant bit of each sample is
/// read, so a container whose other bits were touched decodes just the same.
///
/// The returned vector is the repacked payload, `ceil(payload_len_bits / 8)`
/// bytes long, with any padding bits of the final byte left zero. It is
/// plaintext-adjacent material and **must** be wrapped in
/// [`zeroize::Zeroizing`] by the caller — this function cannot do it on the
/// caller's behalf without dictating the return type of the whole pipeline.
///
/// # Errors
///
/// Returns [`StcError::PayloadExceedsCapacity`] when more bits are requested
/// than [`MAX_BPP`] allows over this cover, and [`StcError::DecodingError`] when
/// the configured trellis height is out of range or the cover is too short for
/// the bit count requested.
pub fn stc_decode_safe(
    pixels: &[u8],
    payload_len_bits: usize,
    config: &StcConfig,
) -> Result<Vec<u8>, StcError> {
    let capacity_bits = config.capacity_bits(pixels.len());
    if payload_len_bits > capacity_bits {
        return Err(StcError::PayloadExceedsCapacity {
            payload_bits: payload_len_bits,
            capacity_bits,
        });
    }

    // No bits requested, nothing to read.
    if payload_len_bits == 0 {
        return Ok(Vec::new());
    }

    let Some(height) = validated_height(config.trellis_height) else {
        return Err(StcError::DecodingError(format!(
            "a constraint height of {} is outside the supported range {MIN_TRELLIS_HEIGHT}..={MAX_TRELLIS_HEIGHT}",
            config.trellis_height
        )));
    };

    let Some(layout) = TrellisLayout::plan(pixels.len(), payload_len_bits) else {
        return Err(StcError::DecodingError(format!(
            "a cover of {} positions cannot hold {payload_len_bits} message bits",
            pixels.len()
        )));
    };

    let columns = parity_columns(&config.stc_seed, height, layout.used_positions);

    // Wiped on drop: these are the payload bits themselves.
    let mut message = Zeroizing::new(vec![0u8; payload_len_bits]);

    let mut register = 0u32;
    let mut position = 0usize;

    for block in 0..layout.message_bits {
        // The same reset the encoder performs; see [`TrellisLayout`].
        if block % layout.blocks_per_segment == 0 {
            register = 0;
        }

        let block_end = layout.block_start(block + 1);
        while position < block_end {
            if pixels.get(position).is_some_and(|sample| sample & 1 == 1) {
                register ^= columns.get(position).copied().unwrap_or(0);
            }
            position += 1;
        }

        if let Some(slot) = message.get_mut(block) {
            *slot = (register & 1) as u8;
        }
        register >>= 1;
    }

    Ok(pack_bits(&message))
}

/// How one trellis run cuts the cover into blocks and segments.
///
/// Every field is a function of the cover length and the message length alone,
/// which is what lets the decoder rebuild the same layout without being told
/// anything.
#[derive(Debug, Clone, Copy)]
struct TrellisLayout {
    /// Bits of message, i.e. blocks in the trellis.
    message_bits: usize,
    /// Cover positions the trellis will actually visit, counted from the start.
    ///
    /// Positions beyond this are left untouched by the encoder and ignored by
    /// the decoder. See [`MAX_BLOCK_WIDTH`] for why there can be any.
    used_positions: usize,
    /// Blocks solved as one trellis before the register is reset to zero.
    blocks_per_segment: usize,
}

impl TrellisLayout {
    /// Plans a run of `message_bits` bits over `positions` cover elements.
    ///
    /// Returns `None` when there is no message to carry or the cover is shorter
    /// than the message, which are the two cases where no block layout exists.
    fn plan(positions: usize, message_bits: usize) -> Option<Self> {
        if message_bits == 0 {
            return None;
        }

        let used_positions = positions.min(message_bits.saturating_mul(MAX_BLOCK_WIDTH));
        if used_positions < message_bits {
            return None;
        }

        // At least one, by the check above. Every block is therefore at least one
        // position wide, which is what keeps the syndrome of each block settable.
        let average_width = (used_positions / message_bits).max(1);
        let blocks_per_segment = (MAX_SEGMENT_COLUMNS / average_width).max(1);

        Some(Self {
            message_bits,
            used_positions,
            blocks_per_segment,
        })
    }

    /// First cover position of block `index`, for `index` in `0..=message_bits`.
    ///
    /// Spreading the remainder of `used_positions / message_bits` across the
    /// blocks rather than dropping it means every position between zero and
    /// `used_positions` belongs to exactly one block, and the widths differ by at
    /// most one. Computed in `u128` so that the product cannot wrap on a cover
    /// large enough to matter.
    fn block_start(&self, index: usize) -> usize {
        let numerator = index as u128 * self.used_positions as u128;

        (numerator / self.message_bits as u128) as usize
    }
}

/// Narrows a configured height to one the coder will run.
fn validated_height(height: u32) -> Option<u32> {
    (MIN_TRELLIS_HEIGHT..=MAX_TRELLIS_HEIGHT)
        .contains(&height)
        .then_some(height)
}

/// Draws `count` parity-check columns from the keystream of `seed`.
///
/// Each column is `height` bits wide with bit 0 and bit `height - 1` forced on;
/// see the module documentation for what each of the two guarantees. A raw draw
/// of zero is discarded and redrawn, so the rejection the specification asks for
/// happens on the value the keystream actually produced rather than on the
/// value after the mask has already made it non-zero.
fn parity_columns(seed: &[u8; 32], height: u32, count: usize) -> Vec<u32> {
    let mask = (1u32 << height) - 1;
    let forced = 1u32 | (1u32 << (height - 1));

    let mut keystream = Keystream::new(seed, &H_MATRIX_NONCE);
    let mut columns = Vec::with_capacity(count);

    for _ in 0..count {
        let draw = loop {
            let value = keystream.next_u32() & mask;
            if value != 0 {
                break value;
            }
        };

        columns.push(draw | forced);
    }

    columns
}

/// Finds the cheapest stego vector whose syndrome is `message`.
///
/// Returns one stego bit per used cover position, in cover order. The vector is
/// wiped on drop: read against the cover it names exactly which positions the
/// trellis wants changed, which is the position list an attacker would otherwise
/// have to solve for.
///
/// # Errors
///
/// Returns [`StcError::EncodingError`] if a segment of the trellis admits no
/// path at all. Every column carries bit 0, so every block can flip the parity it
/// is about to emit and this cannot happen; the arm is what keeps a future change
/// to the column generator from silently producing garbage.
fn solve_trellis(
    pixels: &[u8],
    cost: &[f32],
    message: &[u8],
    columns: &[u32],
    layout: &TrellisLayout,
    height: u32,
) -> Result<Zeroizing<Vec<u8>>, StcError> {
    let states = 1usize << height;
    let half_states = states / 2;

    let mut stego_bits = Zeroizing::new(vec![0u8; layout.used_positions]);

    // The path metric, double-buffered: the transition at one position reads
    // every state of the previous column while writing every state of this one,
    // so the two cannot be the same allocation.
    let mut current = vec![f32::INFINITY; states];
    let mut next = vec![f32::INFINITY; states];

    let mut first_block = 0usize;
    while first_block < layout.message_bits {
        let last_block = (first_block + layout.blocks_per_segment).min(layout.message_bits);
        let segment_start = layout.block_start(first_block);
        let segment_end = layout.block_start(last_block);

        // One survivor bit per (position, state) of this segment: whether the
        // cheapest way to reach that state at that position arrived by setting
        // the stego bit. This is the only thing the backward pass needs, and the
        // reason the segmentation exists at all.
        let mut survivors = Zeroizing::new(vec![
            0u8;
            (segment_end - segment_start)
                .saturating_mul(states)
                .div_ceil(BITS_PER_BYTE)
        ]);

        // The register starts every segment at zero, which is where the decoder
        // will start reading it.
        current
            .iter_mut()
            .for_each(|weight| *weight = f32::INFINITY);
        if let Some(origin) = current.get_mut(0) {
            *origin = 0.0;
        }

        // Forward pass, left to right.
        let mut position = segment_start;
        for block in first_block..last_block {
            let block_end = layout.block_start(block + 1);

            while position < block_end {
                let column = columns.get(position).copied().unwrap_or(1) as usize;
                let cover_bit = pixels.get(position).copied().unwrap_or(0) & 1;
                let rho = cost.get(position).copied().unwrap_or(0.0);

                // What each choice of stego bit costs at this position: nothing
                // if it agrees with the cover, the price of the change if not.
                let keep = if cover_bit == 0 { 0.0 } else { rho };
                let flip = if cover_bit == 0 { rho } else { 0.0 };

                let base = (position - segment_start) * states;

                for (state, slot) in next.iter_mut().enumerate() {
                    // Reaching `state` with a stego bit of zero leaves the
                    // register alone; with a one it came from `state ^ column`.
                    let stay = current.get(state).copied().unwrap_or(f32::INFINITY) + keep;
                    let cross = current
                        .get(state ^ column)
                        .copied()
                        .unwrap_or(f32::INFINITY)
                        + flip;

                    if cross < stay {
                        set_survivor(&mut survivors, base + state);
                        *slot = cross;
                    } else {
                        *slot = stay;
                    }
                }

                std::mem::swap(&mut current, &mut next);
                position += 1;
            }

            // The block is closed: only the states whose low bit is the message
            // bit survive, and the register shifts that bit out. Ascending order
            // is safe because `folded` is never greater than `2 * folded + bit`.
            let bit = usize::from(message.get(block).copied().unwrap_or(0) & 1);
            for folded in 0..half_states {
                let survivor = current
                    .get(2 * folded + bit)
                    .copied()
                    .unwrap_or(f32::INFINITY);

                if let Some(slot) = current.get_mut(folded) {
                    *slot = survivor;
                }
            }
            for slot in current.iter_mut().skip(half_states) {
                *slot = f32::INFINITY;
            }
        }

        // The trellis is not terminated: the register is free to end anywhere,
        // because the decoder discards whatever is left in it. The cheapest end
        // state is therefore simply the cheapest path.
        let (mut state, best) = current.iter().enumerate().fold(
            (0usize, f32::INFINITY),
            |(best_state, best_cost), (state, &weight)| {
                if weight < best_cost {
                    (state, weight)
                } else {
                    (best_state, best_cost)
                }
            },
        );

        if !best.is_finite() {
            return Err(StcError::EncodingError(
                "the trellis admits no path that satisfies the requested syndrome".to_owned(),
            ));
        }

        // Backward pass, right to left, replaying the survivors.
        let mut position = segment_end;
        for block in (first_block..last_block).rev() {
            // Undo the shift the block's closure performed.
            let bit = usize::from(message.get(block).copied().unwrap_or(0) & 1);
            state = state * 2 + bit;

            let block_start = layout.block_start(block);
            while position > block_start {
                position -= 1;

                let column = columns.get(position).copied().unwrap_or(1) as usize;
                let base = (position - segment_start) * states;

                if survivor(&survivors, base + state) {
                    if let Some(slot) = stego_bits.get_mut(position) {
                        *slot = 1;
                    }
                    state ^= column;
                }
            }
        }

        first_block = last_block;
    }

    Ok(stego_bits)
}

/// Moves every sample whose carrier bit disagrees with `stego_bits` by one
/// level, and reports how many moved.
///
/// The direction is the `±1` operator of the module documentation: forced
/// upwards at zero and downwards at the maximum, and otherwise drawn from the
/// keystream. Either direction flips the least significant bit, so the choice is
/// free to be made on grounds of detectability alone.
fn apply_changes(pixels: &mut [u8], stego_bits: &[u8], seed: &[u8; 32]) -> usize {
    let mut signs = Keystream::new(seed, &SIGN_NONCE);
    let mut changed = 0usize;

    for (position, &target) in stego_bits.iter().enumerate() {
        let Some(sample) = pixels.get_mut(position) else {
            break;
        };

        if *sample & 1 == target & 1 {
            continue;
        }

        // Saturating only in name: the two boundary values are handled by their
        // own arms, so neither operation below can reach the end of the range.
        *sample = match *sample {
            0 => 1,
            u8::MAX => u8::MAX - 1,
            value if signs.next_bit() == 1 => value.saturating_add(1),
            value => value.saturating_sub(1),
        };

        changed += 1;
    }

    changed
}

/// Records that the cheapest path into a state set the stego bit.
fn set_survivor(survivors: &mut [u8], index: usize) {
    if let Some(byte) = survivors.get_mut(index / BITS_PER_BYTE) {
        *byte |= 1 << (index % BITS_PER_BYTE);
    }
}

/// Reads back what [`set_survivor`] recorded.
fn survivor(survivors: &[u8], index: usize) -> bool {
    survivors
        .get(index / BITS_PER_BYTE)
        .is_some_and(|byte| byte & (1 << (index % BITS_PER_BYTE)) != 0)
}

/// Expands packed bytes into one binary symbol per byte, most significant bit
/// first.
///
/// Wiped on drop: the expansion is a copy of the payload.
fn unpack_bits(packed: &[u8]) -> Zeroizing<Vec<u8>> {
    let mut bits = Zeroizing::new(Vec::with_capacity(
        packed.len().saturating_mul(BITS_PER_BYTE),
    ));

    for byte in packed {
        for shift in (0..BITS_PER_BYTE).rev() {
            bits.push((byte >> shift) & 1);
        }
    }

    bits
}

/// Packs binary symbols back into bytes, most significant bit first.
///
/// The inverse of [`unpack_bits`] for whole bytes. A count that is not a
/// multiple of eight leaves the unused low bits of the final byte at zero,
/// which is why the bit count travels with the payload rather than being
/// inferred from its length.
fn pack_bits(bits: &[u8]) -> Vec<u8> {
    let mut packed = vec![0u8; bits.len().div_ceil(BITS_PER_BYTE)];

    for (index, bit) in bits.iter().enumerate() {
        if bit & 1 == 1 {
            if let Some(byte) = packed.get_mut(index / BITS_PER_BYTE) {
                *byte |= 1 << (BITS_PER_BYTE - 1 - index % BITS_PER_BYTE);
            }
        }
    }

    packed
}

/// Buffered reader over the ChaCha20 keystream of one coder run.
///
/// Wiped on drop: the keystream is a direct function of the STC seed, so a copy
/// of it left in freed memory is as good as a copy of the seed for anyone who
/// wants to rebuild the parity-check matrix.
#[derive(ZeroizeOnDrop)]
struct Keystream {
    /// The cipher itself. Skipped by the derive because it does not implement
    /// `Zeroize`; the `zeroize` feature of the `chacha20` crate — enabled in the
    /// workspace manifest — already makes it wipe its own state on drop.
    #[zeroize(skip)]
    cipher: ChaCha20,
    /// Keystream bytes produced by the last refill.
    buffer: [u8; KEYSTREAM_BUFFER_BYTES],
    /// Offset of the next unread byte in [`Keystream::buffer`].
    cursor: usize,
    /// Byte currently being handed out one bit at a time.
    reservoir: u8,
    /// Bits already taken out of [`Keystream::reservoir`].
    taken: u8,
}

impl Keystream {
    /// Starts a keystream under `seed` and `nonce`.
    ///
    /// Both cursors start spent, so the first read of either kind refills rather
    /// than returning the zeros the reader was constructed with.
    fn new(seed: &[u8; 32], nonce: &[u8; 12]) -> Self {
        Self {
            cipher: ChaCha20::new(seed.into(), nonce.into()),
            buffer: [0u8; KEYSTREAM_BUFFER_BYTES],
            cursor: KEYSTREAM_BUFFER_BYTES,
            reservoir: 0,
            taken: u8::try_from(BITS_PER_BYTE).unwrap_or(8),
        }
    }

    /// The next keystream byte.
    fn next_byte(&mut self) -> u8 {
        if self.cursor >= self.buffer.len() {
            self.refill();
        }

        let byte = self.buffer.get(self.cursor).copied().unwrap_or(0);
        self.cursor += 1;

        byte
    }

    /// The next four keystream bytes, interpreted as a little-endian `u32`.
    fn next_u32(&mut self) -> u32 {
        u32::from_le_bytes([
            self.next_byte(),
            self.next_byte(),
            self.next_byte(),
            self.next_byte(),
        ])
    }

    /// The next keystream bit, least significant bit of each byte first.
    ///
    /// Kept on a separate reservoir from [`Keystream::next_byte`] so that a
    /// reader used for both would still consume whole bytes in order; no reader
    /// in this module mixes the two.
    fn next_bit(&mut self) -> u8 {
        if usize::from(self.taken) >= BITS_PER_BYTE {
            self.reservoir = self.next_byte();
            self.taken = 0;
        }

        let bit = (self.reservoir >> self.taken) & 1;
        self.taken += 1;

        bit
    }

    /// Advances the cipher by one buffer's worth of keystream.
    ///
    /// The buffer is cleared first because `apply_keystream` XORs into its
    /// argument: XOR against zero is the keystream itself, XOR against the
    /// previous contents would be noise.
    fn refill(&mut self) {
        self.buffer = [0u8; KEYSTREAM_BUFFER_BYTES];
        self.cipher.apply_keystream(&mut self.buffer);
        self.cursor = 0;
    }
}


// Bounded ABI accessors. These inspect the upstream planner and generator;
// they do not substitute another matrix or alter the solver.
pub(crate) fn bounded_segment_width(positions: usize, message_bits: usize) -> Option<usize> {
    if message_bits == 0 {
        return Some(0);
    }
    let layout = TrellisLayout::plan(positions, message_bits)?;
    let mut maximum = 0;
    let mut first = 0;
    while first < message_bits {
        let last = (first + layout.blocks_per_segment).min(message_bits);
        maximum = maximum.max(layout.block_start(last) - layout.block_start(first));
        first = last;
    }
    Some(maximum)
}

pub(crate) fn public_columns(positions: usize, message_bits: usize) -> Vec<u32> {
    let used = positions.min(message_bits * MAX_BLOCK_WIDTH);
    parity_columns(&[0; 32], DEFAULT_TRELLIS_HEIGHT, used)
}
