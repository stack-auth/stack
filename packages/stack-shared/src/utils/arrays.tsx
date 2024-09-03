
export function typedIncludes<T extends readonly any[]>(arr: T, item: unknown): item is T[number] {
  return arr.includes(item);
}

export function enumerate<T extends readonly any[]>(arr: T): [number, T[number]][] {
  return arr.map((item, index) => [index, item]);
}

export function isShallowEqual(a: readonly any[], b: readonly any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Ponyfill for ES2023's findLastIndex.
 */
export function findLastIndex<T>(arr: readonly T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

export function groupBy<T, K>(
  arr: Iterable<T>,
  key: (item: T) => K,
): Map<K, T[]> {
  const result = new Map<K, T[]>;
  for (const item of arr) {
    const k = key(item);
    if (result.get(k) === undefined) result.set(k, []);
    result.get(k)!.push(item);
  }
  return result;
}


export function range(endExclusive: number): number[];
export function range(startInclusive: number, endExclusive: number): number[];
export function range(startInclusive: number, endExclusive: number, step: number): number[];
export function range(startInclusive: number, endExclusive?: number, step?: number): number[] {
  if (endExclusive === undefined) {
    endExclusive = startInclusive;
    startInclusive = 0;
  }
  if (step === undefined) step = 1;

  const result = [];
  for (let i = startInclusive; step > 0 ? (i < endExclusive) : (i > endExclusive); i += step) {
    result.push(i);
  }
  return result;
}


export function rotateLeft(arr: readonly any[], n: number): any[] {
  return [...arr.slice(n), arr.slice(0, n)];
}

export function rotateRight(arr: readonly any[], n: number): any[] {
  return rotateLeft(arr, -n);
}


export function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}


export function outerProduct<T, U>(arr1: readonly T[], arr2: readonly U[]): [T, U][] {
  return arr1.flatMap((item1) => arr2.map((item2) => [item1, item2] as [T, U]));
}

export function unique<T>(arr: readonly T[]): T[] {
  return [...new Set(arr)];
}
