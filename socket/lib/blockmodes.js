import * as utils from "./blockmaniputils.js";
import { encrypt, decrypt } from "./block-cipher.js";

function ecb(
  uint8bytes,
  key_bytes,
  isDecrypt = false,
){
  const blockSize = 16;
  const blocks = new Uint8Array(
    Math.ceil(uint8bytes.length / blockSize) * blockSize
  );

  const totalBlocks = Math.ceil(uint8bytes.length / blockSize);
  let blockIndex = 0;

  for (let i = 0; i < uint8bytes.length; i += blockSize) {
    const block = uint8bytes.slice(i, i + blockSize);
    const encryptedBlock = isDecrypt
      ? decrypt(block, key_bytes, 16)
      : encrypt(block, key_bytes, 16);
    blocks.set(encryptedBlock, i);
    blockIndex++;
  }
  return blocks;
}

function cbc(
  uint8bytes,
  key_bytes,
  isDecrypt = false,
) {
  const random = "THISISASECRETOKA";
  const blockSize = 16; // Assuming each block is 128 bits (16 bytes)
  const blocks = new Uint8Array(
    Math.ceil(uint8bytes.length / blockSize) * blockSize
  );
  const iv = utils.stringTo128BitUint8Array(
    utils.checkAndModifyPlaintext(random)
  );

  const totalBlocks = Math.ceil(uint8bytes.length / blockSize);
  let blockIndex = 0;

  // the algorithm
  for (let i = 0; i < uint8bytes.length; i += blockSize) {
    const block = uint8bytes.slice(i, i + blockSize);
    if (!isDecrypt) {
      const result = utils.xor(block, iv);
      const encrypted_block = encrypt(result, key_bytes, 16);
      iv.set(encrypted_block);
      blocks.set(encrypted_block, i);
      blockIndex++;

    } else {
      const decrypted_block = decrypt(block, key_bytes, 16);
      const result = utils.xor(decrypted_block, iv);
      iv.set(block, 0);
      blocks.set(result, i);
      blockIndex++;
    }
  }
  return blocks;
}

function cfb(
  uint8bytes,
  key_bytes,
  isDecrypt = false,
) {
  const random = "THISISASECRETOKA";
  const blockSize = 16; // Assuming each block is 128 bits (16 bytes)
  const blocks = new Uint8Array(
    Math.ceil(uint8bytes.length / blockSize) * blockSize
  );
  const iv = utils.stringTo128BitUint8Array(
    utils.checkAndModifyPlaintext(random)
  );
  const n = iv.length;

  // the algorithm (setiap 8 bits)
  for (let i = 0; i < uint8bytes.length; i++) {
    const encrypted_block = encrypt(iv, key_bytes, 16);
    const ci = uint8bytes[i] ^ encrypted_block[0];
    iv.set(iv.slice(1, n), 0);
    if (!isDecrypt) {
      iv[n - 1] = ci;
    } else {
      iv[n - 1] = uint8bytes[i];
    }
    blocks[i] = ci;
  }

  return blocks;
}

function ofb(
  uint8bytes,
  key_bytes,
) {
  const random = "THISISASECRETOKA";
  const blockSize = 16; // Assuming each block is 128 bits (16 bytes)
  const blocks = new Uint8Array(
    Math.ceil(uint8bytes.length / blockSize) * blockSize
  );
  const iv = utils.stringTo128BitUint8Array(
    utils.checkAndModifyPlaintext(random)
  );
  const n = iv.length;

  // the algorithm (setiap 8 bits)
  for (let i = 0; i < uint8bytes.length; i++) {
    const encrypted_block = encrypt(iv, key_bytes, 16);
    const ci = uint8bytes[i] ^ encrypted_block[0];
    iv.set(iv.slice(1, n), 0);
    iv[n - 1] = encrypted_block[0];
    blocks[i] = ci;

  }
  return blocks;
}

function counter(
  uint8bytes,
  key_bytes,
) {
  const blockSize = 16; // Assuming each block is 128 bits (16 bytes)
  const blocks = new Uint8Array(
    Math.ceil(uint8bytes.length / blockSize) * blockSize
  );
  const counter = utils.stringTo128BitUint8Array("AAAAAAAAAAAAAAAA");

  const totalBlocks = Math.ceil(uint8bytes.length / blockSize);
  let blockIndex = 0;

  for (let i = 0; i < uint8bytes.length; i += blockSize) {
    const block = uint8bytes.slice(i, i + blockSize);
    const encrypted = encrypt(counter, key_bytes, 16);
    const cipher = utils.xor(block, encrypted);
    blocks.set(cipher, i);
    utils.incrementCounter(counter);
    blockIndex++;
  }

  return blocks;
}

export function executeMode(
  mode,
  text,
  key,
  fromBinary = false,
  toBinary = false,
  isDecrypt = false,
) {
  let text_bytes;
  let result_bytes;
  if (fromBinary) {
    text_bytes = utils.binaryStringToUint8Array(text);
  } else {
    const padded_text = utils.checkAndModifyPlaintext(text);
    text_bytes = utils.stringTo128BitUint8Array(padded_text);
  }
  const key_bytes = utils.stringTo128BitUint8Array(
    utils.checkAndModifyKey(key)
  );

  switch (mode) {
    case "ecb":
      result_bytes = ecb(text_bytes, key_bytes, isDecrypt);
      break;
    case "cbc":
      result_bytes = cbc(text_bytes, key_bytes, isDecrypt);
      break;
    case "cfb":
      result_bytes = cfb(text_bytes, key_bytes, isDecrypt);
      break;
    case "ofb":
      result_bytes = ofb(text_bytes, key_bytes);
      break;
    case "ctr":
      result_bytes = counter(text_bytes, key_bytes);
      break;
    default:
      return "Invalid mode";
  }
  if (toBinary) {
    return utils.uint8ArrayToBinaryOrString(result_bytes, true);
  } else {
    return utils.uint8ArrayToBinaryOrString(result_bytes, false);
  }
}