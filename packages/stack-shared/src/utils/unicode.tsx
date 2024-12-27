import { StackAssertionError } from "./errors";

export function getFlagEmoji(twoLetterCountryCode: string) {
  if (!/^[a-zA-Z][a-zA-Z]$/.test(twoLetterCountryCode)) throw new StackAssertionError("Country code must be two alphabetical letters");
  const codePoints = twoLetterCountryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
