class ECC {
  constructor() {
    this.p = BigInt(
      "0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff"
    );
    this.a = BigInt(
      "0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc"
    );
    this.b = BigInt(
      "0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b"
    );
    this.G = [
      BigInt(
        "0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"
      ),
      BigInt(
        "0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"
      ),
    ];
    this.n = BigInt(
      "0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"
    );
  }

  mod(n, m) {
    return ((n % m) + m) % m;
  }

  modInv(a, m) {
    const m0 = m;
    let [x0, x1] = [0n, 1n];
    if (m === 1n) return 0;
  
    // Handle negative a
    a = a % m;
    if (a < 0n) {
      a += m;
    }
  
    while (a > 1n) {
      const q = a / m;
      [a, m] = [m, a % m];
      [x0, x1] = [x1 - q * x0, x0];
    }
    return x1 < 0n ? x1 + m0 : x1;
  }

  isOnCurve(point) {
    if (!point) return true;
    const [x, y] = point;
    return this.mod(y ** 2n - (x ** 3n + this.a * x + this.b), this.p) === 0;
  }

  pointAdd(point1, point2) {
    if (!point1) return point2;
    if (!point2) return point1;

    const [x1, y1] = point1;
    const [x2, y2] = point2;

    if (x1 === x2 && y1 !== y2) return null;

    let m;
    if (x1 === x2) {
      m = this.mod(
        (3n * x1 ** 2n + this.a) * this.modInv(2n * y1, this.p),
        this.p
      );
    } else {
      m = this.mod((y2 - y1) * this.modInv(x2 - x1, this.p), this.p);
    }

    const x3 = this.mod(m ** 2n - x1 - x2, this.p);
    const y3 = this.mod(m * (x1 - x3) - y1, this.p);
    return [x3, y3];
  }

  scalarMult(k, point) {
    let result = null;
    let addend = point;

    while (k > 0n) {
      if (k & 1n) {
        result = this.pointAdd(result, addend);
      }

      addend = this.pointAdd(addend, addend);
      k >>= 1n;
    }

    return result;
  }

  generatePrivate() {
    let privateKey;
    do {
      privateKey = BigInt('0x' + crypto.getRandomValues(new Uint8Array(32)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), ''));
    } while (privateKey >= this.n || privateKey === 0n);
    return privateKey;
  }

  generatePublic(privateKey) {
    return this.scalarMult(privateKey, this.G);
  }

  generateSharedKey(privateKey, publicKey) {
    return this.scalarMult(privateKey, publicKey);
  }

  generateKeys() {
    const privateKey =
      BigInt(
        `0x${crypto
          .getRandomValues(new Uint8Array(32))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")}`
      ) % this.n;
    const publicKey = this.scalarMult(privateKey, this.G);
    return { privateKey, publicKey };
  }
}

export default new ECC();