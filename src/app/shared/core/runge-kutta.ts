/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

/**
 * Performs one step of Runge-Kutta fourth order integration taking state vector `x` to `xNew`.
 * Tailored for applications that don't furnish `t` to the derivative function.
 * Since typed array allocation is a known bottleneck, and many iterations would otherwise
 * cause GC pressure, allocating the temp arrays in the caller is recommended.
 *
 * @param xNew Output array: the new state after the integration step.
 * @param x Input array: the current state vector.
 * @param h Step size (time increment).
 * @param f Function that computes the derivative x' = y = F(x).
 * @param n Number of state vector elements. Defaults to length of x.
 * @param yTmp Temporary array for intermediate derivative calculations (optional).
 * @param xTmp Temporary array for intermediate state calculations (optional).
 */
export function step(
  xNew: Float64Array,
  x: Float64Array,
  h: number,
  f: (y: Float64Array, x: Float64Array) => void,
  n: number = x.length,
  yTmp: Float64Array = new Float64Array(n),
  xTmp: Float64Array = new Float64Array(n),
) {
  const half = 0.5;
  const third = 0.33333333333333333333;
  const sixth = 0.16666666666666666666;
  // k1 = h * f(t, x)
  f(yTmp, x);
  for (let i = 0; i < n; i++) {
    const k1 = h * yTmp[i];
    xTmp[i] = x[i] + half * k1;
    xNew[i] = x[i] + sixth * k1;
  }
  // k2 = h * f(t + h/2, x + 1/2 k1);
  f(yTmp, xTmp);
  for (let i = 0; i < n; i++) {
    const k2 = h * yTmp[i];
    xTmp[i] = x[i] + half * k2;
    xNew[i] += third * k2;
  }
  // k3 = h * f(t + h/2, x + 1/2 k2);
  f(yTmp, xTmp);
  for (let i = 0; i < n; i++) {
    const k3 = h * yTmp[i];
    xTmp[i] = x[i] + k3;
    xNew[i] += third * k3;
  }
  //  k4 = h * f(t + h, x + k3);
  f(yTmp, xTmp);
  for (let i = 0; i < n; i++) {
    const k4 = h * yTmp[i];
    xNew[i] += sixth * k4;
  }
}
