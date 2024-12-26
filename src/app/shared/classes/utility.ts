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

  /**
   * Returns whether a given number lies in a given closed range [a,b] or [b,a].
   * I.e., the order of bounds doesn't matter.
   */
  public static inRange(x: number, a: number, b: number): boolean {
    return a <= b ? a <= x && x <= b : b <= x && x <= a;
  }

  /** Returns [0, 1, ... n-1]. */
  public static indices(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  public static setContainsExactly<T>(set: Set<T>, items: T[]) {
    return set.size === items.length && items.every(item => set.has(item));
  }

  // TODO: Not currently used. Remove?
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
  }

  // TODO: Not currently used. Remove?
  public static arraysEqual<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((aElement, index) => aElement === b[index]);
  }
}
