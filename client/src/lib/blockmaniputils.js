import { stringToByte } from "./helper";

/* Convert String to Uint8Array*/
export function stringTo128BitUint8Array(str){
  str = checkAndModifyPlaintext(str);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  return bytes;
}

/* Convert Binary String to Uint8Array */
export function binaryStringToUint8Array(binaryString) {
  binaryString = checkAndModifyBinaryString(binaryString);
  const numElements = Math.ceil(binaryString.length / 8);
  const uint8Array = new Uint8Array(numElements);
  for (let i = 0; i < numElements; i++) {
    uint8Array[i] = parseInt(binaryString.slice(i * 8, (i + 1) * 8), 2);
  }
  return uint8Array;
}

/* Pads the plaintext to be a multiple of 16 bytes (128 bits each block) */
export function checkAndModifyPlaintext(plaintext) {
  let endPlaintext = plaintext;
  const bytePlainText = stringToByte(plaintext);
  if (bytePlainText.length % 16 != 0) {
    // pad the plaintext
    for (let i = bytePlainText.length; i % 16 != 0; i++) {
      endPlaintext += " ";
    }
  }
  return endPlaintext;
}

/* Pads the binary string to be a multiple of 16 bytes (128 bits each block) */
export function checkAndModifyBinaryString(binaryString) {
  let endBinaryString = binaryString;
  if (binaryString.length % 128 != 0) {
    // pad the binary string
    for (let i = binaryString.length; i % 128 != 0; i++) {
      endBinaryString += "0";
    }
  }
  return endBinaryString;
}

export function checkAndModifyBinary(binary) {
  let endBinary = binary;
  if (binary.length % 16 != 0) {
    // pad the binary
    endBinary = new Uint8Array(Math.ceil(binary.length / 16) * 16);
    endBinary.set(binary);
  }
  return endBinary;
}

/* Repeats or truncates the key to 16 bytes (128 bits each block) */
export function checkAndModifyKey(key) {
  let endKey = key;
  if (key.length < 16) {
    // repeat the key
    for (let i = key.length; i < 16; i++) {
      endKey += key[i % key.length];
    }
  } else if (key.length > 16) {
    // truncate the key
    endKey = key.slice(0, 16);
  }
  return endKey;
}

/* Shifts the bits of a 128-bit block to the left */
export function shiftLeft128(bits128) {
  const carry = bits128[0] & 0x80 ? 1 : 0; // Capture the carry bit from the leftmost byte
  for (let i = 0; i < bits128.length - 1; i++) {
    bits128[i] = (bits128[i] << 1) | (bits128[i + 1] & 0x80 ? 1 : 0); // Shift left and add the carry bit from the next byte
  }
  bits128[bits128.length - 1] = (bits128[bits128.length - 1] << 1) | carry; // Shift left and add the captured carry bit
}

/* Shifts the bits of a 128-bit block to the right*/
export function shiftRight128(bits128) {
  const n = bits128.length;
  const carry = bits128[n - 1] & 0x01; // Capture the carry bit from the rightmost bit of the last byte
  for (let i = n - 1; i > 0; i--) {
    bits128[i] = (bits128[i] >> 1) | ((bits128[i - 1] & 0x01) << 7); // Shift right and add the carry bit from the previous byte
  }
  bits128[0] = bits128[0] >> 1; // Shift right the leftmost byte
  bits128[0] |= carry << 7; // Add the captured carry bit to the rightmost bit of the leftmost byte
}

/* XOR Operation 128-bit block */
export function xor(block, element) {
  const block_temp = new Uint8Array(block.length);
  block_temp.set(block);
  for (let i = 0; i < block.length; i++) {
    block_temp[i] = block_temp[i] ^ element[i];
  }
  return block_temp;
}

/* Encrypts a 128-bit block using a 128-bit key */
export function tempEncryption(block, key){
  const block_temp = new Uint8Array(block.length);
  block_temp.set(block);
  for (let i = 0; i < block.length; i++) {
    block_temp[i] = block_temp[i] ^ key[i];
  }
  shiftLeft128(block_temp);
  return block_temp;
}

/* Decrypts a 128-bit block using a 128-bit key */
export function tempDecryption(block, key){
  const block_temp = new Uint8Array(block.length);
  block_temp.set(block);
  shiftRight128(block_temp);
  for (let i = 0; i < block.length; i++) {
    block_temp[i] = block_temp[i] ^ key[i];
  }
  return block_temp;
}

/* Converts a Uint8Array to a binary string or a regular string */
export function uint8ArrayToBinaryOrString(
  uint8Array,
  isBinaryString
) {
  if (isBinaryString) {
    return uint8Array.reduce(
      (acc, byte) => acc + byte.toString(2).padStart(8, "0"),
      ""
    );
  } else {
    return new TextDecoder("utf-8").decode(uint8Array);
  }
}

/* Increment the Counter */
export function incrementCounter(counter) {
  for (let i = counter.length - 1; i >= 0; i--) {
    if (counter[i] === 255) {
      // If maximum value
      counter[i] = 0; // Reset byte to 0
    } else {
      counter[i]++;
      break;
    }
  }
}
