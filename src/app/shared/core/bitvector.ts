export class BitVector {
  private readonly bits: Uint32Array;

  constructor(public readonly width: number) {
    this.bits = new Uint32Array(Math.trunc((width + 31) / 32));
  }

  public clearAll(): void {
    this.bits.fill(0);
  }

  public setBit(i: number): BitVector {
    this.checkIndex(i);
    this.bits[i >>> 5] |= 1 << (i & 0x1f);
    return this;
  }

  public clearBit(i: number): BitVector {
    this.checkIndex(i);
    this.bits[i >>> 5] &= ~(1 << (i & 0x1f));
    return this;
  }

  public setBitValue(i: number, value: boolean): BitVector {
    this.checkIndex(i);
    if (value) {
      this.bits[i >>> 5] |= 1 << (i & 0x1f);
    } else {
      this.bits[i >>> 5] &= ~(1 << (i & 0x1f));
    }
    return this;
  }

  public getBit(i: number): boolean {
    this.checkIndex(i);
    return (this.bits[i >>> 5] & (1 << (i & 0x1f))) !== 0;
  }

  private checkIndex(i: number) {
    if (i < 0 || i >= this.width) {
      throw new Error(`BitVector index oob: ${i}`);
    }
  }
}
