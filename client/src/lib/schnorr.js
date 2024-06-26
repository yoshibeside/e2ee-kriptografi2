import { keccak256, pseudorandomGenerator } from "./randomizer.js";

export default class SchnorrSignature {
  constructor(p, q, g) {
    this.p = p;
    this.q = q;
    this.g = g;
  }

  mod(n, m) {
    return ((n % m) + m) % m;
  }

  modPow(base, exp, mod) {
    if (mod === 1n) return 0n;
    let result = 1n;

    base = base % mod;
    while (exp > 0) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod;
      }

      exp = exp >> 1n;
      base = (base * base) % mod;
    }
    return result;
  }

  hash(input) {
    const message = new TextEncoder().encode(input);
    const digest = keccak256(message);
    return BigInt(`0x${digest}`);
  }

  generateKeys() {
    const privateKey = BigInt(`0x${pseudorandomGenerator()}`) % this.q;
    const publicKey = this.modPow(this.g, privateKey, this.p);
    return { privateKey, publicKey };
  }

  sign(privateKey, message) {
    const k = BigInt(`0x${pseudorandomGenerator()}`) % this.q;
    const r = this.modPow(this.g, k, this.p);
    const e = this.hash(`${r.toString(16)}${message}`);
    const s = this.mod(k - privateKey * e, this.q);
    return { r, s };
  }

  verify(publicKey, message, { r, s }) {
    const e = this.hash(`${r.toString(16)}${message}`);
    const v = this.mod(
      this.modPow(this.g, s, this.p) * this.modPow(publicKey, e, this.p),
      this.p
    );
    return v === r;
  }
}
