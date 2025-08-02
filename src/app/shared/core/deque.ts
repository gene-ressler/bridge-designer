/**
 * Simple deque.
 *
 * Maintains two buffers with index structure for the deque's data like this:
 *
 *               left                 |                 right
 * [left.length-1 ... left.base ... 0][0 ... right.base ... right.length-1]
 * |========= used ===========|--- unused ---|============ used ==========|
 *
 * Either both buffers are fully used (base === 0), or one is empty
 * (length === 0) and the other is at least half used.
 */
export class Deque<T> {
  private readonly right: Side<T> = new Side();
  private readonly left: Side<T> = new Side();

  /** Pushes a given item onto the right side of the deque. */
  public pushRight(item: T): void {
    this.right.push(item, this.left);
  }

  /** Pushes a given item onto the left side of the deque. */
  public pushLeft(item: T): void {
    this.left.push(item, this.right);
  }

  /** Pops an item from the right side of the deque. */
  public popRight(): T | undefined {
    return this.right.pop(this.left);
  }

  /** Pops an item from the left side of the deque. */
  public popLeft(): T | undefined {
    return this.left.pop(this.right);
  }

  /** Peeks at the rightmost item in the deque. */
  public peekRight(): T | undefined {
    return this.right.peekLast(this.left);
  }

  /** Peeks at the leftmost item in the deque. */
  public peekLeft(): T | undefined {
    return this.left.peekLast(this.right);
  }

  /** Clears the deque. */
  public clear(): void {
    this.left.data.length = this.right.data.length = this.left.base = this.right.base = 0;
  }

  /** Returns the current length of the deque. */
  public get length(): number {
    return this.left.length + this.right.length;
  }

  /** Returns the fraction of space used by the deque that contains live data. */
  public get fullness(): number {
    const den = this.left.data.length + this.right.data.length;
    return den > 0 ? (this.left.length + this.right.length) / den : 1;
  }

  /** Copies the current deque contents to an array with optional limit on number of elements copied. */
  public copyTo(list: T[], limit: number = this.length): T[] {
    list.length = 0;
    for (const item of this) {
      if (limit-- === 0) {
        break;
      }
      list.push(item);
    }
    return list;
  }
 
  /** Iterates over current deque contents. Not safe for mutations during iteration. */
  [Symbol.iterator](): Iterator<T> {
    const left = this.left;
    const right = this.right;
    // Negative i points to left[-1-i]. Non-negative points to right[i]; 
    let i: number = this.left.data.length > this.left.base ? -this.left.data.length : this.right.base;
    return {
      next(): { value: T, done: boolean } {
        if (i < 0) {
          const value = left.data[-1 - i];
          i = -1 - i === left.base ? right.base : i + 1;
          return { value, done: false };
        }
        if (i < right.data.length) {
          const value = right.data[i++];
          return { value, done: false };
        }
        return { value: undefined as T, done: true };
      },
    };
  }

  public map<U>(f: (item: T) => U): U[] {
    const result: U[] = [];
    for (const item of this) {
      result.push(f(item));
    }
    return result;
  }
}

class Side<T> {
  constructor(
    public base: number = 0,
    public data: T[] = [],
  ) {}

  get length(): number {
    return this.data.length - this.base;
  }

  push(item: T, otherSide: Side<T>): void {
    if (otherSide.base > 0) {
      otherSide.data[--otherSide.base] = item;
    } else {
      this.data.push(item);
    }
  }

  pop(otherSide: Side<T>): T | undefined {
    if (this.length > 0) {
      return this.data.pop();
    }
    if (otherSide.length > 0) {
      return otherSide.popBase();
    }
    return undefined;
  }

  peekLast(otherSide: Side<T>): T | undefined {
    return this.data.length > 0 ? this.data[this.data.length - 1] : otherSide.data[otherSide.base];
  }

  private popBase(): T {
    const popped = this.data[this.base++];
    if (this.base > this.data.length / 2) {
      this.data.copyWithin(0, this.base, this.data.length);
      this.data.length -= this.base;
      this.base = 0;
    }
    return popped;
  }
}
