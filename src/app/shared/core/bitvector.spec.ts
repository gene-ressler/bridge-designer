import { BitVector } from './bitvector';

describe('BitVector', () => {
  it('should initialize with the correct width', () => {
    const bv = new BitVector(32);
    expect(bv.width).toBe(32);
  });

  it('should set the correct bit', () => {
    const bv = new BitVector(32);
    bv.setBit(5);
    expect(bv.getBit(5)).toBe(true);
  });

  it('should clear the correct bit', () => {
    const bv = new BitVector(32);
    bv.setBit(5);
    bv.clearBit(5);
    expect(bv.getBit(5)).toBe(false);
  });

  it('should set the correct bit value', () => {
    const bv = new BitVector(32);
    bv.setBitValue(5, true);
    expect(bv.getBit(5)).toBe(true);
    bv.setBitValue(5, false);
    expect(bv.getBit(5)).toBe(false);
  });

  it('should return the correct bit value', () => {
    const bv = new BitVector(32);
    bv.setBit(5);
    expect(bv.getBit(5)).toBe(true);
    expect(bv.getBit(6)).toBe(false);
  });

  it('should set, clear, and get correctly for multi-word vectors', () => {
    const length = 253;
    const bv = new BitVector(length);
    for (let i = 0; i < length; ++i) {
      expect(bv.getBit(i)).withContext(`at index ${i}`).toBe(false);
    }
    for (let i = 1; i < length; i += 3) {
      bv.setBit(i);
    }
    for (let i = 0; i < length; ++i) {
      expect(bv.getBit(i))
        .withContext(`at index ${i}`)
        .toBe(i % 3 === 1);
    }
    for (let i = 1; i < length; i += 3) {
      bv.clearBit(i);
    }
    for (let i = 0; i < length; ++i) {
      expect(bv.getBit(i)).withContext(`at index ${i}`).toBe(false);
    }
  });
  
  it('should set value and get correctly for multi-word vectors', () => {
    const length = 253;
    const bv = new BitVector(length);
    for (let i = 1; i < length; i += 3) {
      bv.setBitValue(i, true);
    }
    for (let i = 0; i < length; ++i) {
      expect(bv.getBit(i))
        .withContext(`at index ${i}`)
        .toBe(i % 3 === 1);
    }
    for (let i = 1; i < length; i += 3) {
      bv.setBitValue(i, false);
    }
    for (let i = 0; i < length; ++i) {
      expect(bv.getBit(i)).withContext(`at index ${i}`).toBe(false);
    }
  });

  it('should throw an error for out-of-bounds index', () => {
    const bv = new BitVector(1);
    expect(() => bv.setBit(32)).toThrowError('BitVector index oob: 32');
    expect(() => bv.clearBit(32)).toThrowError('BitVector index oob: 32');
    expect(() => bv.getBit(32)).toThrowError('BitVector index oob: 32');
    expect(() => bv.setBit(-1)).toThrowError('BitVector index oob: -1');
    expect(() => bv.clearBit(-1)).toThrowError('BitVector index oob: -1');
    expect(() => bv.getBit(-1)).toThrowError('BitVector index oob: -1');
  });
});
