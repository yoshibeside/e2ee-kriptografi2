import {
  splitBytesIntoBlock,
  bytesToBit,
  bitToBytes,
  splitIntoByte,
  shiftLeft128ByOne,
  shiftRight128ByOne,
  shiftLeft128ByTwo,
  shiftRight128ByTwo,
  expansionPermutation
} from "./helper";
import { xor } from "./blockmaniputils";

const straightPermutationLeft = (bit) => {
  const pbox = [
    [3, 29, 55, 32, 10, 63, 57, 8, 27, 46, 36, 61, 23, 42, 39, 49],
    [41, 38, 14, 7, 16, 44, 11, 6, 48, 19, 53, 60, 15, 56, 35, 54],
    [33, 20, 50, 31, 24, 52, 28, 58, 21, 59, 12, 30, 5, 17, 4, 62],
    [40, 47, 37, 34, 51, 2, 0, 9, 45, 22, 43, 26, 18, 1, 13, 25]
  ];

  let permutatedBit = "";

  for (let i = 0; i < pbox.length; i++) {
    for (let j = 0; j < pbox[0].length; j++) {
      permutatedBit += bit[pbox[i][j]];
    }
  }

  return permutatedBit;
};

const straightPermutationRight = (bit) => {
  const pbox = [
    [50, 3, 18, 15, 45, 38, 62, 30, 37, 31, 34, 21, 29, 58, 27, 44],
    [25, 42, 9, 13, 61, 32, 47, 26, 56, 54, 59, 55, 35, 20, 8, 22],
    [43, 53, 16, 10, 4, 24, 63, 36, 19, 0, 28, 33, 1, 14, 2, 60],
    [49, 46, 52, 48, 5, 23, 7, 17, 41, 6, 11, 51, 40, 39, 57, 12]
  ];

  let permutatedBit = "";

  for (let i = 0; i < pbox.length; i++) {
    for (let j = 0; j < pbox[0].length; j++) {
      permutatedBit += bit[pbox[i][j]];
    }
  }

  return permutatedBit;
};

const generateRoundKey = (
  bitLeft,
  bitRight,
  rounds
) => {
  const permutatedBitLeft = straightPermutationLeft(bitLeft);
  const permutatedBitRight = straightPermutationRight(bitRight);

  let byteArrayLeft = bitToBytes(splitIntoByte(permutatedBitLeft));
  let byteArrayRight = bitToBytes(splitIntoByte(permutatedBitRight));

  if (rounds % 2 === 1) {
    byteArrayLeft = shiftLeft128ByOne(byteArrayLeft);
    byteArrayRight = shiftRight128ByOne(byteArrayRight);
  } else {
    byteArrayLeft = shiftLeft128ByTwo(byteArrayLeft);
    byteArrayRight = shiftRight128ByTwo(byteArrayRight);
  }

  const xorKey = xor(byteArrayLeft, byteArrayRight);

  return [
    bytesToBit(byteArrayLeft),
    bytesToBit(byteArrayRight),
    new Uint8Array(xorKey)
  ];
};



const substitution1 = (bit) => {
  const sbox = [
    [13, 10, 9, 8, 3, 6, 12, 14, 7, 2, 5, 4, 11, 1, 15, 0],
    [14, 15, 7, 4, 0, 6, 11, 8, 10, 13, 1, 2, 12, 3, 9, 5],
    [4, 12, 13, 14, 15, 3, 5, 8, 9, 7, 11, 2, 6, 10, 1, 0],
    [15, 3, 13, 1, 7, 6, 12, 9, 4, 2, 5, 14, 8, 0, 10, 11],
    [14, 10, 8, 4, 15, 3, 0, 6, 1, 2, 13, 9, 11, 7, 5, 12],
    [6, 12, 15, 3, 10, 14, 9, 7, 4, 2, 8, 13, 5, 11, 0, 1],
    [15, 5, 10, 14, 1, 11, 4, 3, 8, 12, 0, 2, 6, 13, 7, 9],
    [8, 5, 11, 6, 7, 10, 3, 13, 14, 1, 12, 4, 15, 0, 9, 2],
    [13, 5, 1, 11, 14, 7, 15, 6, 10, 2, 3, 0, 12, 8, 9, 4],
    [10, 11, 13, 9, 15, 4, 1, 6, 5, 12, 8, 0, 14, 2, 7, 3],
    [7, 3, 12, 14, 0, 9, 10, 11, 4, 6, 15, 1, 13, 2, 5, 8],
    [11, 9, 10, 8, 4, 3, 13, 0, 15, 1, 2, 7, 5, 14, 12, 6],
    [12, 3, 0, 2, 8, 7, 1, 6, 9, 10, 5, 14, 13, 4, 15, 11],
    [13, 10, 3, 11, 12, 8, 4, 6, 7, 0, 15, 14, 2, 1, 5, 9],
    [15, 1, 11, 12, 4, 2, 8, 6, 5, 10, 0, 13, 7, 3, 9, 14],
    [2, 12, 13, 9, 5, 0, 7, 6, 15, 14, 1, 3, 10, 8, 11, 4]
  ];

  const row = parseInt(
    bit.slice(0, 2) + bit.slice(bit.length - 2, bit.length),
    2
  );
  const col = parseInt(bit.slice(2, bit.length - 2), 2);

  const substitutedResult = sbox[row][col];

  return substitutedResult.toString(2).padStart(4, "0");
};

const substitution2 = (bit) => {
  const sbox = [
    [7, 13, 5, 6, 2, 11, 10, 12, 1, 14, 9, 15, 8, 0, 4, 3],
    [7, 0, 8, 12, 1, 6, 10, 5, 14, 4, 3, 15, 2, 9, 11, 13],
    [10, 9, 11, 2, 7, 5, 15, 1, 4, 3, 12, 13, 6, 0, 8, 14],
    [10, 9, 14, 7, 2, 1, 12, 5, 4, 13, 0, 3, 8, 11, 6, 15],
    [13, 7, 3, 14, 5, 2, 0, 11, 10, 1, 6, 9, 4, 12, 8, 15],
    [8, 5, 3, 12, 1, 13, 6, 14, 10, 15, 9, 2, 7, 4, 0, 11],
    [15, 4, 9, 1, 7, 6, 13, 14, 0, 5, 8, 12, 2, 10, 3, 11],
    [6, 1, 8, 5, 7, 12, 3, 4, 14, 9, 2, 10, 11, 13, 15, 0],
    [3, 0, 12, 8, 11, 5, 6, 15, 14, 1, 2, 13, 4, 7, 10, 9],
    [0, 12, 7, 9, 5, 6, 8, 14, 2, 4, 15, 1, 11, 3, 10, 13],
    [4, 12, 15, 10, 13, 5, 9, 6, 1, 14, 3, 7, 0, 11, 2, 8],
    [9, 13, 0, 1, 2, 7, 10, 12, 8, 14, 4, 3, 15, 6, 5, 11],
    [2, 9, 6, 10, 5, 7, 12, 13, 11, 3, 15, 8, 0, 14, 4, 1],
    [4, 14, 2, 8, 3, 11, 5, 1, 9, 0, 6, 12, 13, 15, 10, 7],
    [5, 8, 14, 11, 6, 10, 2, 0, 4, 1, 3, 7, 9, 15, 12, 13],
    [8, 1, 13, 15, 4, 5, 3, 14, 0, 9, 6, 7, 12, 11, 2, 10]
  ];

  const row = parseInt(
    bit.slice(0, 2) + bit.slice(bit.length - 2, bit.length),
    2
  );
  const col = parseInt(bit.slice(2, bit.length - 2), 2);

  const substitutedResult = sbox[row][col];

  return substitutedResult.toString(2).padStart(4, "0");
};

const substitution3 = (bit) => {
  const sbox = [
    [10, 14, 13, 1, 5, 7, 4, 15, 3, 0, 9, 8, 2, 11, 6, 12],
    [8, 12, 5, 15, 10, 2, 3, 0, 7, 11, 4, 14, 13, 9, 1, 6],
    [3, 0, 10, 15, 8, 2, 1, 6, 12, 11, 5, 7, 14, 13, 4, 9],
    [4, 15, 10, 1, 2, 7, 5, 3, 13, 8, 12, 0, 9, 6, 11, 14],
    [9, 5, 7, 0, 11, 6, 15, 2, 13, 14, 4, 1, 12, 8, 10, 3],
    [15, 10, 11, 3, 4, 6, 13, 0, 7, 9, 5, 12, 1, 8, 14, 2],
    [6, 9, 13, 8, 15, 4, 12, 10, 11, 7, 5, 3, 1, 14, 2, 0],
    [15, 0, 8, 11, 5, 2, 12, 7, 14, 13, 9, 1, 6, 4, 3, 10],
    [4, 15, 2, 9, 3, 12, 11, 10, 6, 0, 14, 5, 1, 8, 13, 7],
    [10, 3, 7, 11, 4, 0, 12, 5, 15, 9, 13, 1, 2, 6, 8, 14],
    [0, 3, 4, 1, 2, 5, 11, 8, 9, 12, 6, 15, 13, 7, 10, 14],
    [11, 0, 15, 8, 14, 4, 3, 6, 12, 1, 5, 10, 7, 13, 9, 2],
    [5, 4, 6, 12, 13, 1, 14, 9, 2, 3, 10, 15, 8, 11, 0, 7],
    [4, 5, 9, 11, 6, 3, 15, 2, 7, 13, 14, 8, 0, 12, 10, 1],
    [4, 12, 7, 11, 13, 15, 6, 2, 8, 10, 14, 9, 1, 0, 3, 5],
    [6, 10, 9, 15, 13, 7, 3, 0, 11, 1, 8, 4, 2, 12, 14, 5]
  ];

  const row = parseInt(
    bit.slice(0, 2) + bit.slice(bit.length - 2, bit.length),
    2
  );
  const col = parseInt(bit.slice(2, bit.length - 2), 2);

  const substitutedResult = sbox[row][col];

  return substitutedResult.toString(2).padStart(4, "0");
};

const substitution4 = (bit) => {
  const sbox = [
    [8, 3, 9, 12, 6, 5, 7, 10, 11, 14, 0, 15, 4, 13, 1, 2],
    [13, 0, 5, 9, 7, 8, 15, 10, 11, 1, 14, 3, 2, 6, 12, 4],
    [2, 3, 4, 7, 5, 12, 8, 11, 13, 9, 10, 1, 15, 0, 14, 6],
    [10, 8, 13, 12, 3, 2, 15, 9, 14, 1, 11, 5, 6, 4, 7, 0],
    [4, 7, 11, 14, 2, 1, 15, 3, 13, 9, 8, 6, 0, 12, 10, 5],
    [4, 0, 15, 2, 3, 7, 13, 11, 1, 12, 5, 6, 8, 14, 9, 10],
    [10, 1, 0, 2, 5, 8, 7, 13, 9, 15, 11, 14, 6, 4, 12, 3],
    [3, 11, 7, 5, 1, 6, 15, 9, 8, 12, 2, 14, 4, 10, 13, 0],
    [10, 4, 14, 11, 6, 15, 3, 7, 8, 5, 9, 2, 13, 12, 0, 1],
    [7, 15, 3, 13, 10, 8, 1, 6, 2, 12, 11, 9, 5, 14, 0, 4],
    [6, 14, 12, 7, 8, 15, 11, 10, 1, 4, 0, 5, 9, 3, 2, 13],
    [9, 2, 10, 6, 4, 3, 15, 13, 0, 14, 11, 8, 12, 1, 5, 7],
    [1, 9, 8, 5, 6, 14, 0, 11, 4, 2, 12, 10, 13, 15, 7, 3],
    [10, 1, 7, 6, 11, 8, 12, 15, 13, 14, 4, 2, 3, 5, 0, 9],
    [13, 9, 2, 3, 11, 4, 14, 15, 8, 7, 1, 12, 0, 10, 5, 6],
    [1, 11, 8, 6, 5, 14, 0, 9, 4, 10, 7, 2, 15, 13, 12, 3]
  ];

  const row = parseInt(
    bit.slice(0, 2) + bit.slice(bit.length - 2, bit.length),
    2
  );
  const col = parseInt(bit.slice(2, bit.length - 2), 2);

  const substitutedResult = sbox[row][col];

  return substitutedResult.toString(2).padStart(4, "0");
};

const substitution5 = (bit) => {
  const sbox = [
    [11, 5, 3, 10, 8, 0, 14, 4, 1, 7, 9, 2, 6, 15, 13, 12],
    [14, 12, 10, 7, 15, 3, 0, 13, 5, 11, 9, 6, 8, 2, 1, 4],
    [5, 6, 1, 9, 12, 15, 13, 0, 8, 10, 2, 3, 14, 4, 7, 11],
    [6, 3, 0, 7, 11, 13, 15, 1, 5, 14, 10, 12, 2, 9, 4, 8],
    [4, 8, 11, 7, 12, 2, 15, 14, 9, 3, 5, 0, 10, 6, 1, 13],
    [10, 1, 11, 2, 0, 7, 15, 3, 5, 6, 9, 8, 13, 12, 14, 4],
    [2, 7, 12, 4, 13, 9, 10, 11, 1, 3, 15, 8, 14, 6, 0, 5],
    [15, 7, 11, 9, 13, 4, 10, 8, 1, 2, 3, 12, 5, 14, 6, 0],
    [3, 12, 13, 6, 15, 0, 11, 9, 2, 4, 5, 10, 8, 7, 14, 1],
    [10, 2, 14, 15, 0, 9, 1, 8, 12, 7, 11, 13, 4, 6, 5, 3],
    [15, 11, 2, 13, 9, 8, 12, 1, 3, 6, 7, 5, 14, 0, 4, 10],
    [0, 6, 12, 15, 7, 2, 5, 13, 8, 11, 3, 4, 10, 9, 14, 1],
    [14, 10, 7, 0, 12, 4, 13, 1, 5, 6, 3, 15, 9, 2, 11, 8],
    [3, 9, 13, 14, 1, 0, 11, 5, 4, 15, 10, 12, 6, 8, 2, 7],
    [5, 6, 12, 9, 15, 8, 7, 3, 1, 10, 13, 11, 14, 4, 0, 2],
    [5, 1, 8, 0, 7, 11, 6, 2, 3, 13, 4, 12, 15, 14, 9, 10]
  ];

  const row = parseInt(
    bit.slice(0, 2) + bit.slice(bit.length - 2, bit.length),
    2
  );
  const col = parseInt(bit.slice(2, bit.length - 2), 2);

  const substitutedResult = sbox[row][col];

  return substitutedResult.toString(2).padStart(4, "0");
};

const substitution6 = (bit) => {
  const sbox = [
    [7, 1, 10, 4, 2, 8, 9, 13, 5, 6, 12, 0, 3, 15, 11, 14],
    [3, 2, 11, 12, 4, 1, 7, 8, 15, 10, 13, 14, 9, 5, 6, 0],
    [8, 6, 2, 9, 0, 10, 13, 12, 15, 11, 4, 3, 7, 5, 14, 1],
    [15, 6, 13, 11, 3, 4, 7, 5, 10, 1, 2, 9, 0, 12, 8, 14],
    [15, 10, 0, 12, 5, 13, 1, 6, 14, 3, 7, 9, 2, 8, 4, 11],
    [10, 14, 12, 5, 2, 9, 8, 4, 7, 11, 6, 0, 3, 15, 13, 1],
    [11, 7, 14, 3, 0, 10, 15, 6, 13, 9, 5, 4, 12, 1, 8, 2],
    [15, 10, 4, 3, 14, 2, 7, 5, 11, 6, 13, 0, 12, 9, 1, 8],
    [4, 1, 13, 9, 6, 2, 0, 8, 10, 7, 11, 15, 12, 3, 5, 14],
    [13, 7, 3, 14, 2, 0, 4, 8, 9, 5, 6, 11, 1, 12, 15, 10],
    [7, 10, 13, 5, 9, 1, 12, 0, 14, 3, 15, 8, 2, 11, 6, 4],
    [3, 15, 14, 5, 2, 1, 9, 12, 11, 8, 0, 7, 13, 10, 6, 4],
    [11, 3, 6, 15, 4, 0, 2, 13, 5, 12, 14, 10, 1, 7, 8, 9],
    [3, 10, 2, 14, 15, 6, 1, 11, 0, 12, 8, 9, 4, 13, 7, 5],
    [12, 9, 13, 3, 14, 10, 5, 4, 7, 6, 11, 8, 2, 1, 0, 15],
    [13, 0, 12, 2, 5, 3, 14, 4, 6, 11, 9, 15, 10, 8, 7, 1]
  ];

  const row = parseInt(
    bit.slice(0, 2) + bit.slice(bit.length - 2, bit.length),
    2
  );
  const col = parseInt(bit.slice(2, bit.length - 2), 2);

  const substitutedResult = sbox[row][col];

  return substitutedResult.toString(2).padStart(4, "0");
};

const substitution7 = (bit) => {
  const sbox = [
    [0, 10, 3, 12, 7, 9, 11, 2, 1, 13, 14, 8, 4, 15, 5, 6],
    [14, 12, 1, 2, 3, 0, 15, 5, 4, 7, 6, 9, 13, 11, 10, 8],
    [14, 4, 11, 6, 1, 9, 8, 10, 7, 12, 3, 13, 5, 0, 2, 15],
    [11, 6, 0, 10, 2, 7, 4, 15, 3, 8, 12, 1, 9, 14, 13, 5],
    [2, 14, 10, 15, 12, 9, 13, 8, 11, 5, 6, 1, 0, 7, 3, 4],
    [7, 15, 3, 12, 8, 9, 10, 0, 2, 13, 6, 14, 5, 1, 4, 11],
    [1, 7, 2, 9, 3, 8, 5, 12, 13, 6, 11, 0, 14, 10, 4, 15],
    [1, 7, 12, 3, 5, 2, 0, 8, 13, 11, 15, 9, 6, 10, 4, 14],
    [3, 6, 9, 12, 15, 4, 7, 1, 13, 2, 14, 5, 0, 10, 8, 11],
    [2, 14, 12, 9, 11, 0, 8, 6, 3, 13, 1, 4, 7, 5, 15, 10],
    [8, 5, 11, 6, 7, 2, 3, 0, 14, 13, 12, 10, 1, 4, 9, 15],
    [0, 5, 12, 3, 13, 2, 9, 14, 6, 8, 7, 4, 15, 10, 1, 11],
    [5, 7, 12, 2, 9, 15, 13, 0, 8, 11, 3, 10, 1, 6, 4, 14],
    [5, 9, 14, 15, 8, 11, 7, 12, 13, 4, 10, 1, 0, 3, 2, 6],
    [5, 9, 12, 3, 10, 0, 7, 11, 6, 13, 4, 15, 8, 1, 14, 2],
    [14, 3, 4, 0, 5, 1, 2, 15, 11, 13, 9, 12, 7, 8, 6, 10]
  ];

  const row = parseInt(
    bit.slice(0, 2) + bit.slice(bit.length - 2, bit.length),
    2
  );
  const col = parseInt(bit.slice(2, bit.length - 2), 2);

  const substitutedResult = sbox[row][col];

  return substitutedResult.toString(2).padStart(4, "0");
};

const substitution8 = (bit) => {
  const sbox = [
    [8, 7, 2, 5, 12, 0, 10, 1, 13, 6, 15, 9, 3, 14, 11, 4],
    [7, 8, 0, 3, 11, 1, 12, 5, 15, 4, 10, 9, 2, 14, 6, 13],
    [3, 1, 12, 13, 4, 2, 5, 7, 9, 0, 15, 11, 6, 10, 14, 8],
    [5, 13, 12, 10, 15, 2, 0, 7, 8, 4, 6, 14, 9, 3, 11, 1],
    [2, 8, 6, 11, 1, 5, 7, 12, 9, 13, 14, 3, 4, 15, 10, 0],
    [1, 12, 9, 2, 4, 3, 6, 7, 0, 15, 5, 8, 14, 10, 11, 13],
    [13, 0, 7, 4, 11, 15, 8, 6, 9, 3, 5, 14, 1, 10, 12, 2],
    [5, 1, 10, 2, 8, 7, 3, 11, 13, 0, 9, 14, 6, 15, 12, 4],
    [15, 3, 4, 11, 8, 10, 6, 12, 2, 13, 0, 9, 7, 14, 1, 5],
    [10, 5, 3, 0, 6, 1, 14, 13, 4, 12, 11, 7, 9, 8, 2, 15],
    [4, 5, 11, 7, 6, 2, 13, 8, 0, 9, 14, 12, 10, 15, 1, 3],
    [15, 7, 1, 4, 5, 14, 13, 3, 11, 2, 10, 6, 0, 9, 8, 12],
    [5, 10, 11, 6, 9, 8, 13, 0, 3, 12, 15, 14, 7, 4, 1, 2],
    [11, 3, 12, 6, 14, 7, 15, 5, 4, 9, 0, 8, 13, 2, 10, 1],
    [11, 6, 15, 4, 5, 7, 0, 12, 3, 8, 13, 2, 10, 9, 1, 14],
    [12, 11, 1, 13, 14, 9, 0, 5, 3, 15, 10, 7, 2, 6, 8, 4]
  ];

  const row = parseInt(
    bit.slice(0, 2) + bit.slice(bit.length - 2, bit.length),
    2
  );
  const col = parseInt(bit.slice(2, bit.length - 2), 2);

  const substitutedResult = sbox[row][col];

  return substitutedResult.toString(2).padStart(4, "0");
};

const substitutionHashFunc = {
  substitution1: substitution1,
  substitution2: substitution2,
  substitution3: substitution3,
  substitution4: substitution4,
  substitution5: substitution5,
  substitution6: substitution6,
  substitution7: substitution7,
  substitution8: substitution8
};

const innerFeistelFunction = (
  splittedPlaintext,
  key
) => {
  const bit = bytesToBit(splittedPlaintext).join("");

  const expandedBit = expansionPermutation(bit);

  const expandedByte = bitToBytes(splitIntoByte(expandedBit));

  const xorProduct = xor(expandedByte, key);

  const xorBit = bytesToBit(xorProduct).join("");

  const splittedBits = splitIntoByte(xorBit);

  const substitutionResults = [];
  for (let i = 0; i < splittedBits.length; i++) {
    const functionKey = `substitution${i + 1}`; // Assuming function names start from 1
    if (
      Object.prototype.hasOwnProperty.call(substitutionHashFunc, functionKey)
    ) {
      substitutionResults.push(
        substitutionHashFunc[functionKey](splittedBits[i])
      );
    }
  }

  const concatSubstitutedResult = substitutionResults.join("");

  return concatSubstitutedResult;
};

const encryptFeistel = (
  plaintextA,
  plaintextB,
  plaintextC,
  plaintextD,
  key
) => {
  const innerFeistelResultD = innerFeistelFunction(plaintextD, key);
  const productOfXorDC = xor(
    bitToBytes(splitIntoByte(innerFeistelResultD)),
    plaintextC
  );

  const innerFeistelResultDC = innerFeistelFunction(productOfXorDC, key);
  const productOfXorDCB = xor(
    bitToBytes(splitIntoByte(innerFeistelResultDC)),
    plaintextB
  );

  const innerFeistelResultDCB = innerFeistelFunction(productOfXorDCB, key);
  const productOfXorDCBA = xor(
    bitToBytes(splitIntoByte(innerFeistelResultDCB)),
    plaintextA
  );

  return [
    new Uint8Array(productOfXorDCB),
    new Uint8Array(productOfXorDC),
    new Uint8Array(plaintextD),
    new Uint8Array(productOfXorDCBA)
  ];
};

const decryptFeistel = (
  cipherTextA,
  cipherTextB,
  cipherTextC,
  cipherTextD,
  key
) => {
  // Reverse the operations applied to plaintextA (which resulted in cipherTextD)
  const reverseInnerFeistelResultB = innerFeistelFunction(cipherTextA, key);
  const originalPlaintextA = xor(
    cipherTextD,
    bitToBytes(splitIntoByte(reverseInnerFeistelResultB))
  );

  // Reverse the operations applied to plaintextB (which resulted in cipherTextC)
  const reverseInnerFeistelResultC = innerFeistelFunction(cipherTextB, key);
  const originalPlaintextB = xor(
    cipherTextA,
    bitToBytes(splitIntoByte(reverseInnerFeistelResultC))
  );

  // Reverse the operations applied to plaintextC (which resulted in cipherTextB)
  const reverseInnerFeistelResultD = innerFeistelFunction(cipherTextC, key); // Using cipherTextD since it's originally plaintextA
  const originalPlaintextC = xor(
    cipherTextB,
    bitToBytes(splitIntoByte(reverseInnerFeistelResultD))
  );

  // plaintextD becomes cipherTextC during encryption, and cipherTextA is the result of the final Feistel operation
  const originalPlaintextD = cipherTextC;

  return [
    new Uint8Array(originalPlaintextA),
    new Uint8Array(originalPlaintextB),
    new Uint8Array(originalPlaintextC),
    new Uint8Array(originalPlaintextD)
  ];
};

// const encrypt = (plaintext, key, rounds: number) => {
export const encrypt = (
  plaintext,
  key,
  rounds = 16
) => {
  const splitBlocks = splitBytesIntoBlock(plaintext, 16);

  const splittedKey = splitBytesIntoBlock(key, key.length / 2);
  const roundKeys= [];

  let bitLeft = bytesToBit(splittedKey[0]).join("");
  let bitRight = bytesToBit(splittedKey[1]).join("");

  for (let i = 0; i < rounds; i++) {
    const roundKeyOutput = generateRoundKey(bitLeft, bitRight, i);
    bitLeft = roundKeyOutput[0].join("");
    bitRight = roundKeyOutput[1].join("");
    const roundByteKey = roundKeyOutput[2] ;
    roundKeys.push(roundByteKey);
  }

  const encryptedResults = [];

  // Iterate each 16 bytes of plaintext block
  for (const block of splitBlocks) {
    // Hard code each split to 4 bytes each (32-bit)
    const splittedPlaintext = splitBytesIntoBlock(block, 4);
    let plainTextA = splittedPlaintext[0];
    let plainTextB = splittedPlaintext[1];
    let plainTextC = splittedPlaintext[2];
    let plainTextD = splittedPlaintext[3];

    for (let i = 0; i < rounds; i++) {
      const feistelResult = encryptFeistel(
        plainTextA,
        plainTextB,
        plainTextC,
        plainTextD,
        roundKeys[i]
      );
      plainTextA = feistelResult[0];
      plainTextB = feistelResult[1];
      plainTextC = feistelResult[2];
      plainTextD = feistelResult[3];
    }

    const encryptionResult = new Uint8Array([
      ...plainTextA,
      ...plainTextB,
      ...plainTextC,
      ...plainTextD
    ]);

    encryptedResults.push(encryptionResult);
  }

  // Get the total length of all arrays.
  let length = 0;
  encryptedResults.forEach((item) => {
    length += item.length;
  });

  // Create a new array with total length and merge all source arrays.
  const mergedArray = new Uint8Array(length);
  let offset = 0;
  encryptedResults.forEach((item) => {
    mergedArray.set(item, offset);
    offset += item.length;
  });

  return mergedArray;
};

export const decrypt = (
  ciphertext,
  key,
  rounds = 16
) => {
  const roundKeys = []; // Store all round keys

  const splittedKey = splitBytesIntoBlock(key, key.length / 2);

  const splitBlocks = splitBytesIntoBlock(ciphertext, 16);

  let bitLeft = bytesToBit(splittedKey[0]).join("");
  let bitRight = bytesToBit(splittedKey[1]).join("");

  // Generate all round keys first
  for (let i = 0; i < rounds; i++) {
    const roundKeyOutput = generateRoundKey(bitLeft, bitRight, i);
    bitLeft = roundKeyOutput[0].join("");
    bitRight = roundKeyOutput[1].join("");
    const roundByteKey = roundKeyOutput[2] ;
    roundKeys.push(roundByteKey);
  }

  const decryptionResults = [];

  for (const block of splitBlocks) {
    const splittedCipherText = splitBytesIntoBlock(block, 4);
    let cipherTextA = splittedCipherText[0];
    let cipherTextB = splittedCipherText[1];
    let cipherTextC = splittedCipherText[2];
    let cipherTextD = splittedCipherText[3];

    // feistel
    for (let i = 0; i < rounds; i++) {
      // feistel
      const feistelResult = decryptFeistel(
        cipherTextA,
        cipherTextB,
        cipherTextC,
        cipherTextD,
        roundKeys[rounds - i - 1]
      );
      cipherTextA = feistelResult[0];
      cipherTextB = feistelResult[1];
      cipherTextC = feistelResult[2];
      cipherTextD = feistelResult[3];
    }

    const decryptionResult = new Uint8Array([
      ...cipherTextA,
      ...cipherTextB,
      ...cipherTextC,
      ...cipherTextD
    ]);

    decryptionResults.push(decryptionResult);
  }

  // Get the total length of all arrays.
  let length = 0;
  decryptionResults.forEach((item) => {
    length += item.length;
  });

  // Create a new array with total length and merge all source arrays.
  const mergedArray = new Uint8Array(length);
  let offset = 0;
  decryptionResults.forEach((item) => {
    mergedArray.set(item, offset);
    offset += item.length;
  });

  return mergedArray;
};
