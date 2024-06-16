export function typedToLowercase<S extends string>(s: S): Lowercase<S> {
  return s.toLowerCase() as Lowercase<S>;
}

export function typedToUppercase<S extends string>(s: S): Uppercase<S> {
  return s.toUpperCase() as Uppercase<S>;
}

export function typedCapitalize<S extends string>(s: S): Capitalize<S> {
  return s.charAt(0).toUpperCase() + s.slice(1) as Capitalize<S>;
}

/**
 * Returns all whitespace character at the start of the string.
 * 
 * Uses the same definition for whitespace as `String.prototype.trim()`.
 */
export function getWhitespacePrefix(s: string): string {
  return s.substring(0, s.length - s.trimStart().length);
}

/**
 * Returns all whitespace character at the end of the string.
 * 
 * Uses the same definition for whitespace as `String.prototype.trim()`.
 */
export function getWhitespaceSuffix(s: string): string {
  return s.substring(s.trimEnd().length);
}

/**
 * Returns a string with all empty or whitespace-only lines at the start removed.
 * 
 * Uses the same definition for whitespace as `String.prototype.trim()`.
 */
export function trimEmptyLinesStart(s: string): string {
  const lines = s.split("\n");
  const firstNonEmptyLineIndex = lines.findIndex((line) => line.trim() !== "");
  return lines.slice(firstNonEmptyLineIndex).join("\n");
}

/**
 * Returns a string with all empty or whitespace-only lines at the end removed.
 * 
 * Uses the same definition for whitespace as `String.prototype.trim()`.
 */
export function trimEmptyLinesEnd(s: string): string {
  const lines = s.split("\n");
  const lastNonEmptyLineIndex = lines.findLastIndex((line) => line.trim() !== "");
  return lines.slice(0, lastNonEmptyLineIndex + 1).join("\n");
}

/**
 * Returns a string with all empty or whitespace-only lines trimmed at the start and end.
 * 
 * Uses the same definition for whitespace as `String.prototype.trim()`.
 */
export function trimLines(s: string): string {
  return trimEmptyLinesEnd(trimEmptyLinesStart(s));
}

/**
 * A template literal tag that returns the same string as the template literal without a tag.
 * 
 * Useful for implementing your own template literal tags.
 */
export function templateIdentity(strings: TemplateStringsArray | readonly string[], ...values: any[]): string {
  if (strings.length === 0) return "";
  if (values.length !== strings.length - 1) throw new Error("Invalid number of values; must be one less than strings");

  return strings.slice(1).reduce((result, string, i) => `${result}${values[i] ?? "n/a"}${string}`, strings[0]);
}


export function deindent(code: string): string;
export function deindent(strings: TemplateStringsArray | readonly string[], ...values: any[]): string;
export function deindent(strings: string | readonly string[], ...values: any[]): string {
  if (typeof strings === "string") return deindent([strings]);
  if (strings.length === 0) return "";
  if (values.length !== strings.length - 1) throw new Error("Invalid number of values; must be one less than strings");

  const trimmedStrings = [...strings];
  trimmedStrings[0] = trimEmptyLinesStart(trimmedStrings[0]);
  trimmedStrings[trimmedStrings.length - 1] = trimEmptyLinesEnd(trimmedStrings[trimmedStrings.length - 1]);

  const indentation = trimmedStrings
    .join("${SOME_VALUE}")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => getWhitespacePrefix(line).length)
    .reduce((min, current) => Math.min(min, current), Infinity);

  const deindentedStrings = trimmedStrings
    .map((string, stringIndex) => {
      return string
        .split("\n")
        .map((line, lineIndex) => stringIndex !== 0 && lineIndex === 0 ? line : line.substring(indentation))
        .join("\n");
    });

  const indentedValues = values.map((value, i) => {
    const firstLineIndentation = getWhitespacePrefix(deindentedStrings[i].split("\n").at(-1)!);
    return `${value}`.replaceAll("\n", `\n${firstLineIndentation}`);
  });

  return templateIdentity(deindentedStrings, ...indentedValues);
}

export function extractScopes(scope: string, removeDuplicates=true): string[] {
  const trimmedString = scope.trim();
  const scopesArray = trimmedString.split(/\s+/);
  const filtered = scopesArray.filter(scope => scope.length > 0);
  return removeDuplicates ? [...new Set(filtered)] : filtered;
}

export function mergeScopeStrings(...scopes: string[]): string {
  const allScope = scopes.map((s) => extractScopes(s)).flat().join(" ");
  return extractScopes(allScope).join(" ");
}

export function nicify(value: unknown, { depth = 5 } = {}): string {
  switch (typeof value) {
    case "string": case "boolean": case "number": {
      return JSON.stringify(value);
    }
    case "undefined": {
      return "undefined";
    }
    case "symbol": {
      return value.toString();
    }
    case "bigint": {
      return `${value}n`;
    }
    case "function": {
      if (value.name) return `function ${value.name}(...) { ... }`;
      return `(...) => { ... }`;
    }
    case "object": {
      if (value === null) return "null";
      if (Array.isArray(value)) {
        if (depth <= 0 && value.length !== 0) return "[...]";
        return `[${value.map((v) => nicify(v, { depth: depth - 1 })).join(", ")}]`;
      }

      const entries = Object.entries(value);
      if (entries.length === 0) return "{}";
      if (depth <= 0) return "{...}";
      return `{ ${Object.entries(value).map(([k, v]) => {
        if (typeof v === "function" && v.name === k) return `${k}(...): { ... }`;
        else return `${k}: ${nicify(v, { depth: depth - 1 })}`;
      }).join(", ")} }`;
    }
    default: {
      return `${typeof value}<${value}>`;
    }
  }
}
