import { Deque } from './deque';

describe('Deque', () => {
  const deque = new Deque<number>();

  beforeEach(() => deque.clear());

  it('has zero length when empty', () => {
    expect(deque.length).toBe(0);
  });

  it('should act as a stack on the right side', () => {
    deque.pushRight(1);
    deque.pushRight(2);
    deque.pushRight(3);
    expect(deque.popRight()).toBe(3);
    expect(deque.popRight()).toBe(2);
    expect(deque.popRight()).toBe(1);
    expect(deque.popRight()).toBe(undefined);
  });

  it('acts as a stack on the left side', () => {
    deque.pushLeft(1);
    deque.pushLeft(2);
    deque.pushLeft(3);
    expect(deque.popLeft()).toBe(3);
    expect(deque.popLeft()).toBe(2);
    expect(deque.popLeft()).toBe(1);
    expect(deque.popLeft()).toBe(undefined);
  });

  it('acts as a queue on the right side', () => {
    deque.pushRight(1);
    deque.pushRight(2);
    deque.pushRight(3);
    deque.pushRight(4);
    expect(deque.popLeft()).toBe(1);
    expect(deque.popLeft()).toBe(2);
    expect(deque.popLeft()).toBe(3);
    expect(deque.popLeft()).toBe(4);
    expect(deque.popLeft()).toBe(undefined);
    expect(deque.fullness).toBe(1);
  });

  it('acts as a queue on the left side', () => {
    deque.pushLeft(1);
    deque.pushLeft(2);
    deque.pushLeft(3);
    deque.pushLeft(4);
    expect(deque.popRight()).toBe(1);
    expect(deque.popRight()).toBe(2);
    expect(deque.popRight()).toBe(3);
    expect(deque.popRight()).toBe(4);
    expect(deque.popRight()).toBe(undefined);
    expect(deque.fullness).toBe(1);
  });

  it('does a rotary from left to right', () => {
    for (let i = 50; i >= 1; --i) deque.pushLeft(i);
    for (let i = 51; i <= 100; ++i) deque.pushRight(i);
    expect(deque.length).toBe(100);
    expect(deque.fullness).toBe(1);
    let expected = 1;
    for (let i = 0; i < 300; ++i) {
      const value = deque.popLeft();
      expect(value).toBe(expected);
      if (++expected > 100) expected = 1;
      deque.pushRight(value!);
      expect(deque.fullness).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('does a rotary from right to left', () => {
    for (let i = 50; i >= 1; --i) deque.pushLeft(i);
    for (let i = 51; i <= 100; ++i) deque.pushRight(i);
    expect(deque.length).toBe(100);
    let expected = 100;
    for (let i = 0; i < 300; ++i) {
      const value = deque.popRight();
      expect(value).toBe(expected);
      if (--expected < 1) expected = 100;
      deque.pushLeft(value!);
      expect(deque.fullness).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('returns an empty copy if empty', () => {
    const copy = deque.copyTo([]);
    expect(copy).toHaveSize(0);
  });

  it('returns a correct left side copy', () => {
    deque.pushLeft(1);
    deque.pushLeft(2);
    deque.pushLeft(3);
    deque.popRight();
    const copy = deque.copyTo([]);
    expect(copy).toEqual([3, 2]);
  });

  it('returns a correct right side copy', () => {
    deque.pushRight(1);
    deque.pushRight(2);
    deque.pushRight(3);
    deque.popLeft();
    const copy = deque.copyTo([]);
    expect(copy).toEqual([2, 3]);
  });

  it('returns a correct complex copy', () => {
    deque.pushLeft(3);
    deque.pushLeft(2);
    deque.pushLeft(1);
    deque.popRight();
    deque.pushRight(4);
    deque.pushRight(5);
    deque.pushRight(6);
    deque.popLeft();
    const copy = deque.copyTo([]);
    expect(copy).toEqual([2, 4, 5, 6]);
  });

  it('iterates on empty', () => {
    expect(Array.from(deque)).toHaveSize(0);
  });

  it('iterates on the left', () => {
    deque.pushLeft(1);
    deque.pushLeft(2);
    deque.pushLeft(3);
    deque.popRight();
    expect(Array.from(deque)).toEqual([3, 2]);
  });

  it('iterates on the right', () => {
    deque.pushRight(1);
    deque.pushRight(2);
    deque.pushRight(3);
    deque.popLeft();
    expect(Array.from(deque)).toEqual([2, 3]);
  });

  it('iterates over a complex case', () => {
    deque.pushLeft(3);
    deque.pushLeft(2);
    deque.pushLeft(1);
    deque.popRight();
    deque.pushRight(4);
    deque.pushRight(5);
    deque.pushRight(6);
    deque.popLeft();
    expect(Array.from(deque)).toEqual([2, 4, 5, 6]);
  });

  it('peeks undefined on empty deque', ()=> {
    expect(deque.peekLeft()).toBe(undefined);
    expect(deque.peekRight()).toBe(undefined);
  });

  it('peeks correctly after push left only', () => {
    deque.pushLeft(2);
    deque.pushLeft(1);
    expect(deque.peekLeft()).toBe(1);
    expect(deque.peekRight()).toBe(2);
  });

  it('peeks correctly after push right only', () => {
    deque.pushRight(2);
    deque.pushRight(1);
    expect(deque.peekRight()).toBe(1);
    expect(deque.peekLeft()).toBe(2);
  });
});
