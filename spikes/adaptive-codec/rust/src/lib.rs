// Throwaway real STC transport for https://github.com/jdragulanescu/obscr/issues/35.
// Controls: fixed public zero seed, h=10, upstream 0.02 rate, bounded raw WASM ABI.
// The JavaScript host must serialize calls and stop on any error or WASM trap.
mod native;

use std::cell::RefCell;
use native::{StcConfig, StcError};
use zeroize::Zeroizing;

const MAX_SAMPLES: usize = 262_144;
const MAX_PAYLOAD: usize = 655;
const MAX_SEGMENT: usize = 66_816;
const ERR_BOUNDS: i32 = -1;
const ERR_CAPACITY: i32 = -2;
const ERR_COST: i32 = -3;
const ERR_SEGMENT: i32 = -4;
const ERR_CODEC: i32 = -5;

struct Buffers {
    carrier: Vec<u8>,
    costs: Vec<f32>,
    payload: Vec<u8>,
    columns: Vec<u32>,
}

impl Buffers {
    fn new() -> Self {
        Self {
            carrier: vec![0; MAX_SAMPLES],
            costs: vec![0.0; MAX_SAMPLES],
            payload: vec![0; MAX_PAYLOAD],
            columns: vec![0; MAX_SAMPLES],
        }
    }
}

thread_local! {
    static BUFFERS: RefCell<Option<Buffers>> = const { RefCell::new(None) };
}

fn with_buffers<R>(operation: impl FnOnce(&mut Buffers) -> R) -> R {
    BUFFERS.with(|slot| {
        let mut slot = slot.borrow_mut();
        operation(slot.get_or_insert_with(Buffers::new))
    })
}

// All regions are allocated once and never resized. No imported host callbacks,
// shared memory, threads, malloc/free ABI, or borrowed input pointers are used.
#[no_mangle]
pub extern "C" fn init() -> i32 {
    with_buffers(|_| 0)
}

#[no_mangle]
pub extern "C" fn carrier_ptr() -> *mut u8 {
    with_buffers(|buffers| buffers.carrier.as_mut_ptr())
}

#[no_mangle]
pub extern "C" fn costs_ptr() -> *mut f32 {
    with_buffers(|buffers| buffers.costs.as_mut_ptr())
}

#[no_mangle]
pub extern "C" fn payload_ptr() -> *mut u8 {
    with_buffers(|buffers| buffers.payload.as_mut_ptr())
}

#[no_mangle]
pub extern "C" fn columns_ptr() -> *const u32 {
    with_buffers(|buffers| buffers.columns.as_ptr())
}

fn validate_bits(n: usize, message_bits: usize) -> Result<usize, i32> {
    if n > MAX_SAMPLES || message_bits > MAX_PAYLOAD * 8 {
        return Err(ERR_BOUNDS);
    }
    if message_bits > StcConfig::new([0; 32]).capacity_bits(n) {
        return Err(ERR_CAPACITY);
    }
    let width = native::bounded_segment_width(n, message_bits).ok_or(ERR_SEGMENT)?;
    if width > MAX_SEGMENT {
        return Err(ERR_SEGMENT);
    }
    Ok(width)
}

fn validate_bytes(n: usize, byte_length: usize) -> Result<usize, i32> {
    if byte_length > MAX_PAYLOAD {
        return Err(ERR_BOUNDS);
    }
    validate_bits(n, byte_length * 8)
}

fn status(error: StcError) -> i32 {
    match error {
        StcError::PayloadExceedsCapacity { .. } => ERR_CAPACITY,
        StcError::InvalidCostMap => ERR_COST,
        StcError::LengthMismatch { .. } => ERR_BOUNDS,
        StcError::EncodingError(_) | StcError::DecodingError(_) => ERR_CODEC,
    }
}

#[no_mangle]
pub extern "C" fn max_segment_columns(n: usize, byte_length: usize) -> i32 {
    match validate_bytes(n, byte_length) {
        Ok(width) => width as i32,
        Err(error) => error,
    }
}

#[no_mangle]
pub extern "C" fn encode(n: usize, byte_length: usize) -> i32 {
    if let Err(error) = validate_bytes(n, byte_length) {
        return error;
    }
    with_buffers(|buffers| {
        match native::stc_encode_safe(
            &mut buffers.carrier[..n],
            &buffers.costs[..n],
            &buffers.payload[..byte_length],
            &StcConfig::new([0; 32]),
        ) {
            Ok(changed) => changed as i32,
            Err(error) => status(error),
        }
    })
}

#[no_mangle]
pub extern "C" fn decode(n: usize, byte_length: usize) -> i32 {
    if let Err(error) = validate_bytes(n, byte_length) {
        return error;
    }
    with_buffers(|buffers| {
        match native::stc_decode_safe(
            &buffers.carrier[..n],
            byte_length * 8,
            &StcConfig::new([0; 32]),
        ) {
            Ok(bytes) => {
                let bytes = Zeroizing::new(bytes);
                buffers.payload[..byte_length].copy_from_slice(&bytes);
                0
            }
            Err(error) => status(error),
        }
    })
}

// Exact public columns for an independent host-side rank check. Column j starts
// at message row b when block_start(b) <= j < block_start(b+1). Bit t contributes
// to row b+t only before the next segment boundary and before message_bits.
// Layout: u=min(n,64*m); start(b)=floor(b*u/m); segmentBlocks=floor(65536/floor(u/m)).
#[no_mangle]
pub extern "C" fn matrix_prepare(n: usize, message_bits: usize) -> i32 {
    if let Err(error) = validate_bits(n, message_bits) {
        return error;
    }
    with_buffers(|buffers| {
        let columns = native::public_columns(n, message_bits);
        buffers.columns[..columns.len()].copy_from_slice(&columns);
        columns.len() as i32
    })
}
