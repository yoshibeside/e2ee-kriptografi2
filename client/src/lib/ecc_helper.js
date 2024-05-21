import ecc from "./ecc";

// Encrypt function using ECC private key
export function encryptMessage(privateKey, message, receiverPublicKey) {
  const asciiArray = Array.from(message).map((char) => char.charCodeAt(0));
  const groupSize = Math.ceil(Math.log2(Number(ecc.p)) / 8);
  const chunks = [];
  for (let i = 0; i < asciiArray.length; i += groupSize) {
    const chunk = asciiArray.slice(i, i + groupSize);
    const bigIntMessage = asciiToBigInt(chunk);

    const k = ecc.generatePrivate();
    const kG = ecc.scalarMult(k, ecc.G);
    const kPb = ecc.scalarMult(k, receiverPublicKey);
    const PmPluskPb = ecc.pointAdd([bigIntMessage, bigIntMessage], kPb);

    chunks.push({ kG, PmPluskPb });
  }
  return chunks;
}

// Decrypt function using ECC public key
export function decryptMessage(privateKey, encryptedChunks) {
  const groupSize = Math.ceil(Math.log2(Number(ecc.p)) / 8);
  let asciiArray = [];

  encryptedChunks.forEach(({ kG, PmPluskPb }) => {
    const nBkG = ecc.scalarMult(privateKey, kG);
    const Pm = ecc.pointAdd(PmPluskPb, [nBkG[0], ecc.p - nBkG[1]]);
    const chunk = bigIntToAscii(Pm[0], groupSize);
    asciiArray = asciiArray.concat(chunk);
  });

  return String.fromCharCode(...asciiArray).replace(/\0/g, "");
}

export function asciiToBigInt(asciiArray) {
  return asciiArray.reduce((acc, val) => (acc << 8n) + BigInt(val), 0n);
}

export function bigIntToAscii(bigInt, groupSize) {
  const asciiArray = [];
  while (bigInt > 0n) {
    asciiArray.unshift(Number(bigInt & 255n));
    bigInt >>= 8n;
  }
  // Pad the array to the required group size
  while (asciiArray.length < groupSize) {
    asciiArray.unshift(0);
  }
  return asciiArray;
}
