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
  return output;
}

export function decodeBase32(input: string): Uint8Array {
  const output = new Uint8Array((input.length * 5 / 8) | 0);
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
