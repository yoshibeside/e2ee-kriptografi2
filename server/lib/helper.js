export const stringToByte = (str) => {
  const textEncoder = new TextEncoder();
  return textEncoder.encode(str);
};

export const byteToHex = (bytes) => {
  return Array.from(bytes).map((byte) => {
    // Convert byte to hexadecimal string with leading zero padding
    const hexString = byte.toString(16).padStart(2, "0");
    return `0x${hexString}`; // Prepend "0x" to each hexadecimal string (e.g 0x6c)
  });
};

export const hexToByte = (hexArray) => {
  return new Uint8Array(hexArray);
};

export const byteToString = (bytes) => {
  const textDecoder = new TextDecoder();
  return textDecoder.decode(bytes);
};

export const padBytes = (byteArray, blockSize) => {
  const paddingLength = blockSize - (byteArray.length % blockSize);
  const padding = new Uint8Array(paddingLength).fill(32); // pad with 0
  return new Uint8Array([...byteArray, ...padding]);
};

export const splitBytesIntoBlock = (
  byteArray,
  blockSize
) => {
  const blocks = [];
  for (let i = 0; i < byteArray.length; i += blockSize) {
    const block = byteArray.slice(i, Math.min(i + blockSize, byteArray.length));
    blocks.push(block);
  }
  return blocks;
};

export const bytesToBit = (bytes) => {
  let binaryString = "";
  for (const byte of bytes) {
    binaryString += byte.toString(2).padStart(8, "0") + " ";
  }
  binaryString = binaryString.trim();
  const binaryArray = binaryString.split(" ");
  return binaryArray;
};

export const bitToBytes = (bit) => {
  const bitString = bit.join("");
  const byteArr = [];
  for (let i = 0; i < bitString.length; i += 8) {
    const byteString = bitString.slice(i, i + 8);
    const byteValue = parseInt(byteString, 2);
    byteArr.push(byteValue);
  }
  return new Uint8Array(byteArr);
};

export const splitIntoByte = (bits) => {
  const bitArray = [];

  for (let i = 0; i < bits.length; i += 8) {
    bitArray.push(bits.slice(i, i + 8));
  }
  return bitArray;
};

export const shiftLeft128ByOne = (bits128) => {
  const carry = bits128[0] & 0x80 ? 1 : 0;
  for (let i = 0; i < bits128.length - 1; i++) {
    bits128[i] = (bits128[i] << 1) | (bits128[i + 1] & 0x80 ? 1 : 0);
  }
  bits128[bits128.length - 1] = (bits128[bits128.length - 1] << 1) | carry;

  return bits128;
};

export const shiftLeft128ByTwo = (bits128) => {
  for (let i = 0; i < 2; i++) {
    bits128 = shiftLeft128ByOne(bits128);
  }
  return bits128;
};

export const shiftRight128ByOne = (bits128) => {
  const n = bits128.length;
  const carry = bits128[n - 1] & 0x01;
  for (let i = n - 1; i > 0; i--) {
    bits128[i] = (bits128[i] >> 1) | ((bits128[i - 1] & 0x01) << 7);
  }
  bits128[0] = bits128[0] >> 1;
  bits128[0] |= carry << 7;

  return bits128;
};

export const shiftRight128ByTwo = (bits128) => {
  for (let i = 0; i < 2; i++) {
    bits128 = shiftRight128ByOne(bits128);
  }
  return bits128;
};

export const expansionPermutation = (bit) => {
  const pbox = [
    [19, 8, 9, 25, 0, 6, 5, 20, 24, 2, 13, 17, 15, 7, 23, 1],
    [21, 3, 12, 31, 10, 18, 30, 26, 4, 11, 29, 14, 27, 16, 28, 22],
    [16, 10, 13, 24, 1, 7, 26, 27, 6, 12, 22, 0, 23, 14, 30, 3],
    [17, 28, 8, 2, 5, 31, 29, 11, 25, 9, 4, 15, 21, 20, 19, 18]
  ];

  let permutatedBitFirst = "";
  let permutatedBitSecond = "";

  for (let i = 0; i < pbox.length; i++) {
    for (let j = 0; j < pbox[0].length; j++) {
      if (i < 2) {
        permutatedBitFirst += bit[pbox[i][j]];
      } else {
        permutatedBitSecond += bit[pbox[i][j]];
      }
    }
  }

  return permutatedBitFirst + permutatedBitSecond;
};

export const splitPlaintextTo128Bit = (plaintext) => {
  const splittedPlaintext = [];

  for (let i = 0; i < plaintext.length; i += 16) {
    splittedPlaintext.push(plaintext.slice(i, i + 16));
  }
  return splittedPlaintext;
};
