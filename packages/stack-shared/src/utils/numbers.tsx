const magnitudes = [
  [1_000, ""],
  [1_000_000, "k"],
  [1_000_000_000, "mm"],
  [1_000_000_000_000, "bln"],
  [1_000_000_000_000_000, "trln"],
] as const;

export function prettyPrintWithMagnitudes(num: number): string {
  if (typeof num !== "number") throw new Error("Expected a number");
  if (Number.isNaN(num)) return "NaN";
  if (num < 0) return "-" + prettyPrintWithMagnitudes(-num);
  if (!Number.isFinite(num)) return "∞";

  for (const [magnitude, suffix] of magnitudes) {
    if (num < magnitude) {
      return toFixedMax(num / magnitude, 1) + suffix;
    }
  }
  return num.toExponential(1);
}

export function toFixedMax(num: number, maxDecimals: number): string {
  return num.toFixed(maxDecimals).replace(/\.?0+$/, "");
}
