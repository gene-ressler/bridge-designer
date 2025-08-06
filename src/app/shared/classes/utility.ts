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

export const FIXED_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  maximumFractionDigits: 2,
  useGrouping: true,
});

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Generic static utility functions. */
export class Utility {
  public static sqr(x: number): number {
    return x * x;
  }

  public static p4(x: number): number {
    return Utility.sqr(Utility.sqr(x));
  }

  /**
   * Returns whether a given number lies in a given closed range [a,b] or [b,a].
   * I.e., the order of bounds doesn't matter.
   */
  public static inRange(x: number, a: number, b: number): boolean {
    return a <= b ? a <= x && x <= b : b <= x && x <= a;
  }

  /** Returns whether two numbers are nearly equal within a given tolerance. */
  public static areNearlyEqual(x: number, y: number, tolerance: number = 0.01): boolean {
    return Math.abs(x - y) <= tolerance;
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

  /** Normalizes the given angle to the range [-pi..pi). */
  public static normalizeAngle(theta: number): number {
    return theta - 2 * Math.PI * Math.round(theta * /* 1 / (2 pi) */ 0.15915494309);
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

  public static assertNever(value: never): never {
    throw new Error(`Value isn't never: ${value}`);
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

  public static setDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
    const diff = new Set<T>();
    a.forEach(item => {
      if (!b.has(item)) {
        diff.add(item);
      }
    });
    return diff;
  }

  /**
   * Returns the intersection of sets, honoring the iteration order of the first.
   * The run time will be proportional to O(|a| log |b|). If you care about run
   * time but not ordering, pass the smallest set as the first argument.
   */
  public static setIntersection<T>(a: Set<T>, b: Set<T>): Set<T> {
    const intersection = new Set<T>();
    a.forEach(item => {
      if (b.has(item)) {
        intersection.add(item);
      }
    });
    return intersection;
  }

  /** Returns an array of Float64Arrays. */
  public static create2dFloat64Array(arrayCount: number, arrayLength: number) {
    return Array.from({ length: arrayCount }, () => new Float64Array(arrayLength));
  }

  /** Returns an array of BitVectors. */
  public static create2dBitArray(vectorCount: number, vectorLength: number) {
    return Array.from({ length: vectorCount }, () => new BitVector(vectorLength));
  }

  public static replaceElements<T>(tgt: T[], src: T[]): T[] {
    tgt.length = 0;
    src.forEach(item => tgt.push(item));
    return tgt;
  }

  /** Creates an array of given size of elements from given element creation function. */
  public static createArray<T>(createElement: () => T, size: number): Array<T> {
    const a = new Array<T>(size);
    for (let i = 0; i < size; ++i) {
      a[i] = createElement();
    }
    return a;
  }

  public static getStandardDate(date: Date = new Date(Date.now())): string {
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  }

  /** Returns the number of one bits in the integer n. */
  public static countOnes(n: number) {
    let count: number = 0;
    while (n !== 0) {
      ++count;
      n &= (n - 1);
    }
    return count;
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
