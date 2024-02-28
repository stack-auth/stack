/**
 * Similar to the modulo operator, but always returns a positive number (even when the input is negative).
 */
export function remainder(n: number, d: number): number {
  return ((n % d) + Math.abs(d)) % d;
}
