const fs = require("fs");
const { loadImage, createCanvas } = require("canvas");
const { get_hashed_order, str_to_bits, bits_to_str } = require("./utils");

const prepare_write_data = (data_bits, enc_key, encode_len) => {
  const data_bits_len = data_bits.length;
  if (data_bits.length > encode_len) throw "Can not hold this much data!";
  const result = Array(encode_len);
  for (let i = 0; i < encode_len; i++) {
    result[i] = Math.floor(Math.random() * 2); //obfuscation
  }

  const order = get_hashed_order(enc_key, encode_len);
  for (let i = 0; i < data_bits_len; i++) result[order[i]] = data_bits[i];

  return result;
};

const prepare_read_data = (data_bits, enc_key) => {
  const data_bits_len = data_bits.length;
  const result = Array(data_bits_len);
  const order = get_hashed_order(enc_key, data_bits_len);

  for (let i = 0; i < data_bits_len; i++) result[i] = data_bits[order[i]];

  return result;
};

const get_bits_lsb = (imgData) => {
  const result = Array();
  for (let i = 0; i < imgData.data.length; i += 4) {
    result.push(imgData.data[i] % 2 == 1 ? 1 : 0);
    result.push(imgData.data[i + 1] % 2 == 1 ? 1 : 0);
    result.push(imgData.data[i + 2] % 2 == 1 ? 1 : 0);
  }
  return result;
};

const write_lsb = (imgData, setdata) => {
  function unsetbit(k) {
    return k % 2 == 1 ? k - 1 : k;
  }

  function setbit(k) {
    return k % 2 == 1 ? k : k + 1;
  }
  let j = 0;
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = setdata[j]
      ? setbit(imgData.data[i])
      : unsetbit(imgData.data[i]);
    imgData.data[i + 1] = setdata[j + 1]
      ? setbit(imgData.data[i + 1])
      : unsetbit(imgData.data[i + 1]);
    imgData.data[i + 2] = setdata[j + 2]
      ? setbit(imgData.data[i + 2])
      : unsetbit(imgData.data[i + 2]);
    imgData.data[i + 3] = 255;
    j += 3;
  }
  return imgData;
};

exports.extractMessageFromImage = async (imagepath, encKey) => {
  let c, ctx, imgData;

  try {
    const img = await loadImage(imagepath);
    c = createCanvas(img.width, img.height);
    ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    imgData = ctx.getImageData(0, 0, c.width, c.height);
  } catch (err) {
    return [false, err];
  }

  try {
    const bitsStream = get_bits_lsb(imgData);
    const decryptedBitsStream = prepare_read_data(bitsStream, encKey);
    const msg = bits_to_str(decryptedBitsStream, 1);
    if (msg == null)
      return [
        false,
        "Message does not decrypt. Maybe due to (1) wrong password / enc method. (2) corrupted file",
      ];
    return [true, msg];
  } catch (err) {
    return [
      false,
      "Message does not decrypt. Maybe due to (1) wrong password / enc method. (2) corrupted file",
    ];
  }
};

exports.encodeMessageToImage = async (imagepath, msg, encKey) => {
  try {
    // const imageBuffer = fs.readFileSync(imagepath);

    const img = await loadImage(imagepath);
    const c = createCanvas(img.width, img.height);
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    // console.log(c.toDataURL);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const encode_len = Math.floor(imgData.data.length / 4) * 3;

    // prepare data
    const bitStream = str_to_bits(msg, 1);
    const encryptedBitStream = prepare_write_data(
      bitStream,
      encKey,
      encode_len
    );

    const encryptedImgData = write_lsb(imgData, encryptedBitStream);
    ctx.putImageData(encryptedImgData, 0, 0);
    const encodedImageBuffer = c.toBuffer("image/png");
    fs.writeFileSync("encoded.png", encodedImageBuffer);

    return true;
  } catch (err) {
    throw err;
  }
};
