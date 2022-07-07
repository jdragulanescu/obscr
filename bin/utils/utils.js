const { MersenneTwister } = require("./mersenne-twister");
const SHA512 = require("crypto-js/sha512");

const get_hashed_order = (password, arr_len) => {
  // O(arr_len) algorithm
  const orders = Array.from(Array(arr_len).keys());
  const result = [];
  let loc;
  const seed = SHA512(password).words.reduce(function (total, num) {
    return total + Math.abs(num);
  }, 0);
  const rnd = new MersenneTwister(seed);
  for (let i = arr_len; i > 0; i--) {
    loc = rnd.genrand_int32() % i;
    result.push(orders[loc]);
    orders[loc] = orders[i - 1];
  }
  return result;
};

const utf8Decode = (bytes) => {
  var chars = [],
    offset = 0,
    length = bytes.length,
    c,
    c2,
    c3;

  while (offset < length) {
    c = bytes[offset];
    c2 = bytes[offset + 1];
    c3 = bytes[offset + 2];

    if (128 > c) {
      chars.push(String.fromCharCode(c));
      offset += 1;
    } else if (191 < c && c < 224) {
      chars.push(String.fromCharCode(((c & 31) << 6) | (c2 & 63)));
      offset += 2;
    } else {
      chars.push(
        String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
      );
      offset += 3;
    }
  }

  return chars.join("");
};

const utf8Encode = (str) => {
  var bytes = [],
    offset = 0,
    length,
    char;

  str = encodeURI(str);
  length = str.length;

  while (offset < length) {
    char = str[offset];
    offset += 1;

    if ("%" !== char) {
      bytes.push(char.charCodeAt(0));
    } else {
      char = str[offset] + str[offset + 1];
      bytes.push(parseInt(char, 16));
      offset += 2;
    }
  }

  return bytes;
};

const bits_to_str = (bitarray, num_copy) => {
  function merge_bits(bits) {
    var bits_len = bits.length;
    var bits_sum = 0;
    for (var i = 0; i < bits_len; i++) bits_sum += bits[i];
    return Math.round(bits_sum / bits_len);
  }

  var msg_array = Array();
  var data, tmp;

  var msg_array_len = Math.floor(Math.floor(bitarray.length / num_copy) / 8);
  for (var i = 0; i < msg_array_len; i++) {
    data = 0;
    tmp = 128;
    for (var j = 0; j < 8; j++) {
      data +=
        merge_bits(
          bitarray.slice((i * 8 + j) * num_copy, (i * 8 + j + 1) * num_copy)
        ) * tmp;
      tmp = Math.floor(tmp / 2);
    }
    if (data == 255) break; //END NOTATION
    msg_array.push(data);
  }

  return utf8Decode(msg_array);
};

const str_to_bits = (str, num_copy) => {
  const utf8array = utf8Encode(str);
  const result = Array();
  const utf8strlen = utf8array.length;
  for (let i = 0; i < utf8strlen; i++) {
    for (let j = 128; j > 0; j = Math.floor(j / 2)) {
      if (Math.floor(utf8array[i] / j)) {
        for (let cp = 0; cp < num_copy; cp++) result.push(1);
        utf8array[i] -= j;
      } else for (let cp = 0; cp < num_copy; cp++) result.push(0);
    }
  }
  for (let j = 0; j < 24; j++)
    for (let i = 0; i < num_copy; i++) {
      result.push(1);
    }
  return result;
};

module.exports = { get_hashed_order, str_to_bits, bits_to_str };
