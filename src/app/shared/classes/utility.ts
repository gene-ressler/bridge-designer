import { BitVector } from '../core/bitvector';

export const DOLLARS_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});
export const COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** Generic static utility functions. */
export class Utility {
  public static sqr(x: number): number {
    return x * x;
  }

  public static p4(x: number): number {
    return Utility.sqr(Utility.sqr(x));
  }

  /** Like Math.hypot(), but doesn't cover edge cases and runs much faster on some browsers.  */
  public static hypot(x: number, y: number): number {
    return Math.sqrt(x * x + y * y);
  }

  /**
   * Returns whether a given number lies in a given closed range [a,b] or [b,a].
   * I.e., the order of bounds doesn't matter.
   */
  public static inRange(x: number, a: number, b: number): boolean {
    return a <= b ? a <= x && x <= b : b <= x && x <= a;
  }

  /** Returns the value x clamped to the range [a, b]. */
  public static clamp(x: number, a: number, b: number): number {
    if (x < a) {
      return a;
    }
    if (x > b) {
      return b;
    }
    return x;
  }

  /** Returns [0, 1, ... n-1]. */
  public static indices(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  public static setContainsExactly<T>(set: Set<T>, items: T[]) {
    return set.size === items.length && items.every(item => set.has(item));
  }

  public static assertNotUndefined<T>(value: T | undefined, what: string = 'value'): T {
    if (value === undefined) {
      throw new Error(`undefined ${what}`);
    }
    return value;
  }

  public static assertNotNull<T>(value: T | null, what: string = 'value'): T {
    if (value === null) {
      throw new Error(`null ${what}`);
    }
    return value;
  }

  /** Returns a function that collapses any number of calls to a single callback after given delay has passed. */
  public static throttle(f: () => any, delayMs: number = 100) {
    let timeout: any;
    return () => {
      if (timeout) {
        return; // Already scheduled. Ignore.
      }
      timeout = setTimeout(() => {
        timeout = undefined;
        f();
      }, delayMs);
    };
  }

  /** Applies a given function to the set difference a - b. */
  public static applyToSetDifference<T>(f: (item: T) => void, a: Set<T>, b: Set<T>): void {
    a.forEach(item => {
      if (!b.has(item)) {
        f(item);
      }
    });
  }

  /** Returns an array of Float64Arrays. */
  public static create2dFloat64Array(arrayCount: number, arrayLength: number) {
    return Array.from({ length: arrayCount }, () => new Float64Array(arrayLength));
  }

  /** Returns an array of BitVectors. */
  public static create2dBitArray(vectorCount: number, vectorLength: number) {
    return Array.from({ length: vectorCount }, () => new BitVector(vectorLength));
  }

  /* TODO: Not currently used. Remove?
  public static setsEqual<T>(a: Set<T>, b: Set<T>) {
    if (a.size !== b.size) {
      return false;
    }
    for (const element of a) {
      if (!b.has(element)) {
        return false;
      }
    }
    return true;
  }*/

  /* TODO: Not currently used. Remove?
  public static arraysEqual<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((aElement, index) => aElement === b[index]);
  }*/
}
