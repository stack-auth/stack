import { StackAssertionError } from "./errors";

const crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const crockfordReplacements = new Map([
  ["o", "0"],
  ["i", "1"],
  ["l", "1"],
]);

export function encodeBase32(input: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < input.length; i++) {
    value = (value << 8) | input[i];
    bits += 8;
    while (bits >= 5) {
      output += crockfordAlphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += crockfordAlphabet[(value << (5 - bits)) & 31];
  }

  // sanity check
  if (!isBase32(output)) {
    throw new StackAssertionError("Invalid base32 output; this should never happen");
  }

  return output;
}

export function decodeBase32(input: string): Uint8Array {
  if (!isBase32(input)) {
    throw new StackAssertionError("Invalid base32 string");
  }

  const output = new Uint8Array(((input.length * 5) / 8) | 0);
  let bits = 0;
  let value = 0;
  let outputIndex = 0;
  for (let i = 0; i < input.length; i++) {
    let char = input[i].toLowerCase();
    if (char === " ") continue;
    if (crockfordReplacements.has(char)) {
      char = crockfordReplacements.get(char)!;
    }
    const index = crockfordAlphabet.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid character: ${char}`);
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output[outputIndex++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output;
}

export function encodeBase64(input: Uint8Array): string {
  const res = btoa(String.fromCharCode(...input));

  // sanity check
  if (!isBase64(res)) {
    throw new StackAssertionError("Invalid base64 output; this should never happen");
  }

  return res;
}

export function decodeBase64(input: string): Uint8Array {
  if (!isBase64(input)) {
    throw new StackAssertionError("Invalid base64 string");
  }

  return new Uint8Array(
    atob(input)
      .split("")
      .map((char) => char.charCodeAt(0)),
  );
}

export function isBase32(input: string): boolean {
  for (const char of input) {
    if (char === " ") continue;
    if (!crockfordAlphabet.includes(char)) {
      return false;
    }
  }
  return true;
}

export function isBase64(input: string): boolean {
  const regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  return regex.test(input);
}
