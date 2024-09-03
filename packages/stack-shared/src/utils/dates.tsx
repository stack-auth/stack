import { remainder } from "./math";

const agoUnits = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [5, "week"],
] as const;

export function fromNow(date: Date): string {
  return fromNowDetailed(date).result;
}

export function fromNowDetailed(date: Date): {
  result: string;
  /**
   * May be Infinity if the result will never change.
   */
  secondsUntilChange: number;
} {
  if (!(date instanceof Date)) {
    throw new Error(`fromNow only accepts Date objects (received: ${date})`);
  }

  const now = new Date();
  const elapsed = now.getTime() - date.getTime();

  let remainingInUnit = Math.abs(elapsed) / 1000;
  if (remainingInUnit < 15) {
    return {
      result: "just now",
      secondsUntilChange: 15 - remainingInUnit,
    };
  }
  let unitInSeconds = 1;
  for (const [nextUnitSize, unitName] of agoUnits) {
    const rounded = Math.round(remainingInUnit);
    if (rounded < nextUnitSize) {
      if (elapsed < 0) {
        return {
          result: `in ${rounded} ${unitName}${rounded === 1 ? "" : "s"}`,
          secondsUntilChange: remainder((remainingInUnit - rounded + 0.5) * unitInSeconds, unitInSeconds),
        };
      } else {
        return {
          result: `${rounded} ${unitName}${rounded === 1 ? "" : "s"} ago`,
          secondsUntilChange: remainder((rounded - remainingInUnit - 0.5) * unitInSeconds, unitInSeconds),
        };
      }
    }
    unitInSeconds *= nextUnitSize;
    remainingInUnit /= nextUnitSize;
  }

  return {
    result: date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    secondsUntilChange: Infinity,
  };
}

/**
 * Returns a string representation of the given date in the format expected by the `datetime-local` input type.
 */
export function getInputDatetimeLocalString(date: Date): string {
  date = new Date(date);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 19);
}
