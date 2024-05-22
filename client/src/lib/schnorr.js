class SchnorrSignature {
  constructor() {
    this.p = 100003n;
    this.q = 2n;
    this.g = 2n;
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
    const hash = crypto.createHash("sha256");
    hash.update(input);
    return BigInt(`0x${hash.digest("hex")}`);
  }

  generateKeys() {
    const privateKey =
      BigInt(
        `0x${crypto
          .getRandomValues(new Uint8Array(32))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")}`
      ) % this.q;
    const publicKey = this.modPow(this.g, privateKey, this.p);
    return { privateKey, publicKey };
  }

  sign(privateKey, message) {
    const k =
      BigInt(
        `0x${crypto
          .getRandomValues(new Uint8Array(32))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")}`
      ) % this.q;
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

export default new SchnorrSignature();
