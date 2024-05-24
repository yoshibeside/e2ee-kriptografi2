/* 
Referenced from
https://keccak.team/keccak_specs_summary.html 
*/

const rotate = (x, n, w) => {
  /*   
  x: value to be rotated
  n: number of position to be rotated
  w: width of the word in bit 
  */
  const bigX = BigInt(x);
  const bigN = BigInt(n);
  const bigW = BigInt(w);
  return ((bigX << bigN) | (bigX >> (bigW - bigN))) & ((1n << bigW) - 1n);
};

const keccak_f1600 = (state) => {
  const w = 64n;
  const rounds = 24;

  // Round Constants
  const RC = [
    0x0000000000000001n,
    0x0000000000008082n,
    0x800000000000808an,
    0x8000000080008000n,
    0x000000000000808bn,
    0x0000000080000001n,
    0x8000000080008081n,
    0x8000000000008009n,
    0x000000000000008an,
    0x0000000000000088n,
    0x0000000080008009n,
    0x000000008000000an,
    0x000000008000808bn,
    0x800000000000008bn,
    0x8000000000008089n,
    0x8000000000008003n,
    0x8000000000008002n,
    0x8000000000000080n,
    0x000000000000800an,
    0x800000008000000an,
    0x8000000080008081n,
    0x8000000000008080n,
    0x0000000080000001n,
    0x8000000080008008n,
  ];

  // Rotation offset
  const r = [
    [0, 36, 3, 41, 18],
    [1, 44, 10, 45, 2],
    [62, 6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39, 8, 14],
  ];

  const roundFunction = (A, RC) => {
    const C = new Array(5).fill(0n);
    const D = new Array(5).fill(0n);

    // θ step
    for (let x = 0; x < 5; x++) {
      C[x] = A[x][0] ^ A[x][1] ^ A[x][2] ^ A[x][3] ^ A[x][4];
    }
    for (let x = 0; x < 5; x++) {
      D[x] = C[(x + 4) % 5] ^ rotate(C[(x + 1) % 5], 1n, w);
    }
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        A[x][y] ^= D[x];
      }
    }

    // ρ and π steps
    const B = Array.from({ length: 5 }, () => new Array(5).fill(0n));
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        B[y][(2 * x + 3 * y) % 5] = rotate(A[x][y], BigInt(r[x][y]), w);
      }
    }

    // χ step
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        A[x][y] = B[x][y] ^ (~B[(x + 1) % 5][y] & B[(x + 2) % 5][y]);
      }
    }

    // ι step
    A[0][0] ^= RC;
    return A;
  };

  for (let i = 0; i < rounds; i++) {
    state = roundFunction(state, RC[i]);
  }

  return state;
};

export const keccak256 = (inputBytes) => {
  const r = 1088;
  const outputLength = 256;

  // Padding
  const pad = (M, r) => {
    const Mbits = M.length * 8;
    const d =
      2n ** BigInt(Mbits) +
      BigInt(
        "0b" +
          Array.from(M)
            .map((x) => x.toString(2).padStart(8, "0"))
            .join(""),
        2
      );
    let P = new Uint8Array([...M, 0x06]);
    const padLength = r / 8 - (P.length % (r / 8)) - 1;
    P = new Uint8Array([...P, ...new Uint8Array(padLength), 0x80]);
    return P;
  };

  const paddedInput = pad(inputBytes, r);

  // Initialize state
  let state = Array.from({ length: 5 }, () => new Array(5).fill(0n));

  // Absorbing phase
  for (let i = 0; i < paddedInput.length; i += r / 8) {
    const block = paddedInput.slice(i, i + r / 8);
    for (let j = 0; j < block.length / 8; j++) {
      const x = j % 5;
      const y = Math.floor(j / 5);
      let sliceValue = 0n;
      for (let k = 0; k < 8; k++) {
        sliceValue |= BigInt(block[j * 8 + k]) << (8n * BigInt(k));
      }
      state[x][y] ^= sliceValue;
    }
    state = keccak_f1600(state);
  }

  // Squeezing phase
  let Z = [];
  while (Z.length * 8 < outputLength) {
    for (let j = 0; j < r / 64; j++) {
      const x = j % 5;
      const y = Math.floor(j / 5);
      for (let k = 0; k < 8; k++) {
        Z.push(Number((state[x][y] >> (8n * BigInt(k))) & 0xffn));
      }
    }
    state = keccak_f1600(state);
  }

  const digestedByte = new Uint8Array(Z.slice(0, outputLength / 8));

  return Array.from(digestedByte)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
};

// Example usage
/* const message = new TextEncoder().encode("halo");
const digest = keccak256(message); */

/* 
Cryptographically Secure Pseudorandom Generator (CSPRNG)
with Blum Blum Shub 
*/

const gcd = (a, b) => {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
};

const isPrime = (num) => {
  if (num <= 1) return false;
  for (let i = 2, sqrt = Math.sqrt(num); i <= sqrt; i++) {
    if (num % i === 0) return false;
  }
  return true;
};

const isCongruent = (num) => {
  if (BigInt(num) % 4n === 3n) {
    return true;
  }

  return false;
};

const initializeSeed = (n) => {
  while (true) {
    const seed = BigInt(Math.floor(Math.random() * Number(n - 2n)) + 2);
    if (gcd(Number(seed), Number(n)) === 1) {
      return seed;
    }
  }
};

const bbs = (seed, n, iterations) => {
  let x = (seed * seed) % n; // x0 = s^2 mod n
  const result = [];
  for (let i = 0; i < iterations; i++) {
    x = (x * x) % n; // xi+1 = xi^2 mod n
    result.push(Number(x & 1n)); // Extract the least significant bit
  }
  return result;
};

export const pseudorandomGenerator = ({ p, q, seed }) => {
  if (!isPrime(p) || !isPrime(q)) {
    return false;
  }
  if (!isCongruent(p) || !isCongruent(q)) {
    return false;
  }

  const n = BigInt(p * q);

  // if seed is not supplied, generate random seed
  const seedValue = BigInt(seed || initializeSeed(n));
  const randomBits = bbs(seedValue, n, 256);

  // Convert bits to bytes
  const bytes = [];
  for (let i = 0; i < randomBits.length; i += 8) {
    const byte = parseInt(randomBits.slice(i, i + 8).join(""), 2);
    bytes.push(byte);
  }

  // Convert bytes to hex string and pad to 2 digits
  const hexString = bytes
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  // Return hex string of size 32 bytes
  return hexString.slice(0, 64);
};

// Example usage
/* const result = pseudorandomGenerator({
  p: 11,
  q: 23,
  seed: 3,
  iterations: 5,
});

console.log(result);
 */
