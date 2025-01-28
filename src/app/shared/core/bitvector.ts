export class BitVector {
  private readonly bits: Uint32Array;

  constructor(private readonly _width: number) {
    this.bits = new Uint32Array(Math.trunc((_width + 31) / 32));
  }

  public get width(): number {
    return this._width;
  }

  public setBit(i: number): BitVector {
    this.checkIndex(i);
    this.bits[Math.trunc(i / 32)] |= 1 << i % 32;
    return this;
  }

  public clearBit(i: number): BitVector {
    this.checkIndex(i);
    this.bits[Math.trunc(i / 32)] &= ~(1 << i % 32);
    return this;
  }

  public setBitValue(i: number, value: boolean): BitVector {
    this.checkIndex(i);
    if (value) {
      this.bits[Math.trunc(i / 32)] |= 1 << i % 32;
    } else {
      this.bits[Math.trunc(i / 32)] &= ~(1 << i % 32);
    }
    return this;
  }

  public getBit(i: number): boolean {
    this.checkIndex(i);
    return (this.bits[Math.trunc(i / 32)] & (1 << i % 32)) !== 0;
  }

  private checkIndex(i: number) {
    if (i < 0 || i >= this._width) {
      throw new Error(`BitVector index oob: ${i}`);
    }
  }
}
