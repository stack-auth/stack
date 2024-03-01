const magnitudes = [
  [1_000_000_000_000_000, "trln"],
  [1_000_000_000_000, "bln"],
  [1_000_000_000, "bn"],
  [1_000_000, "M"],
  [1_000, "k"],
] as const;

export function prettyPrintWithMagnitudes(num: number): string {
  if (typeof num !== "number") throw new Error("Expected a number");
  if (Number.isNaN(num)) return "NaN";
  if (num < 0) return "-" + prettyPrintWithMagnitudes(-num);
  if (!Number.isFinite(num)) return "∞";

  for (const [magnitude, suffix] of magnitudes) {
    if (num >= magnitude) {
      return toFixedMax(num / magnitude, 1) + suffix;
    }
  }
  return toFixedMax(num, 1); // Handle numbers less than 1,000 without suffix.
}

export function toFixedMax(num: number, maxDecimals: number): string {
  return num.toFixed(maxDecimals).replace(/\.?0+$/, "");
}
