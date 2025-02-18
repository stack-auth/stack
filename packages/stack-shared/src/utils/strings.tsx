import { findLastIndex, unique } from "./arrays";
import { StackAssertionError } from "./errors";
import { filterUndefined } from "./objects";

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
 * Compares two strings in a way that is not dependent on the current locale.
 */
export function stringCompare(a: string, b: string): number {
  const cmp = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  return cmp(a.toUpperCase(), b.toUpperCase()) || cmp(b, a);
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
  const lastNonEmptyLineIndex = findLastIndex(lines, (line) => line.trim() !== "");
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
import.meta.vitest?.test("trimLines", ({ expect }) => {
  expect(trimLines("")).toBe("");
  expect(trimLines(" ")).toBe("");
  expect(trimLines(" \n ")).toBe("");
  expect(trimLines(" abc ")).toBe(" abc ");
  expect(trimLines("\n  \nLine1\nLine2\n \n")).toBe("Line1\nLine2");
  expect(trimLines("Line1\n   \nLine2")).toBe("Line1\n   \nLine2");
  expect(trimLines(" \n    \n\t")).toBe("");
  expect(trimLines("   Hello World")).toBe("   Hello World");
  expect(trimLines("\n")).toBe("");
  expect(trimLines("\t \n\t\tLine1 \n \nLine2\t\t\n\t  ")).toBe("\t\tLine1 \n \nLine2\t\t");
});


/**
 * A template literal tag that returns the same string as the template literal without a tag.
 *
 * Useful for implementing your own template literal tags.
 */
export function templateIdentity(strings: TemplateStringsArray | readonly string[], ...values: string[]): string {
  if (values.length !== strings.length - 1) throw new StackAssertionError("Invalid number of values; must be one less than strings", { strings, values });

  return strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '');
}
import.meta.vitest?.test("templateIdentity", ({ expect }) => {
  expect(templateIdentity`Hello World`).toBe("Hello World");
  expect(templateIdentity`${"Hello"}`).toBe("Hello");
  const greeting = "Hello";
  const subject = "World";
  expect(templateIdentity`${greeting}, ${subject}!`).toBe("Hello, World!");
  expect(templateIdentity`${"A"}${"B"}${"C"}`).toBe("ABC");
  expect(templateIdentity`Start${""}Middle${""}End`).toBe("StartMiddleEnd");
  expect(templateIdentity``).toBe("");
  expect(templateIdentity`Line1
Line2`).toBe("Line1\nLine2");
  expect(templateIdentity(["a ", " scientific ", "gun"], "certain", "rail")).toBe("a certain scientific railgun");
  expect(templateIdentity(["only one part"])).toBe("only one part");
  expect(() => templateIdentity(["a ", "b", "c"], "only one")).toThrow("Invalid number of values");
  expect(() => templateIdentity(["a", "b"], "x", "y")).toThrow("Invalid number of values");
});


export function deindent(code: string): string;
export function deindent(strings: TemplateStringsArray | readonly string[], ...values: any[]): string;
export function deindent(strings: string | readonly string[], ...values: any[]): string {
  if (typeof strings === "string") return deindent([strings]);
  if (strings.length === 0) return "";
  if (values.length !== strings.length - 1) throw new StackAssertionError("Invalid number of values; must be one less than strings", { strings, values });

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
  // TODO what is this for? can we move this into the OAuth code in the backend?
  const trimmedString = scope.trim();
  const scopesArray = trimmedString.split(/\s+/);
  const filtered = scopesArray.filter(scope => scope.length > 0);
  return removeDuplicates ? [...new Set(filtered)] : filtered;
}

export function mergeScopeStrings(...scopes: string[]): string {
  // TODO what is this for? can we move this into the OAuth code in the backend?
  const allScope = scopes.map((s) => extractScopes(s)).flat().join(" ");
  return extractScopes(allScope).join(" ");
}

export function escapeTemplateLiteral(s: string): string {
  return s.replaceAll("`", "\\`").replaceAll("\\", "\\\\").replaceAll("$", "\\$");
}

/**
 * Some classes have different constructor names in different environments (eg. `Headers` is sometimes called `_Headers`,
 * so we create an object of overrides to handle these cases.
 */
const nicifiableClassNameOverrides = new Map(Object.entries({
  Headers,
} as Record<string, unknown>).map(([k, v]) => [v, k]));
export type Nicifiable = {
  getNicifiableKeys?(): PropertyKey[],
  getNicifiedObjectExtraLines?(): string[],
};
export type NicifyOptions = {
  maxDepth: number,
  currentIndent: string,
  lineIndent: string,
  multiline: boolean,
  refs: Map<unknown, string>,
  path: string,
  parent: null | {
    options: NicifyOptions,
    value: unknown,
  },
  keyInParent: PropertyKey | null,
  hideFields: PropertyKey[],
  overrides: (...args: Parameters<typeof nicify>) => string | null,
};
export function nicify(
  value: unknown,
  options: Partial<NicifyOptions> = {},
): string {
  const fullOptions: NicifyOptions = {
    maxDepth: 5,
    currentIndent: "",
    lineIndent: "  ",
    multiline: true,
    refs: new Map(),
    path: "value",
    parent: null,
    overrides: () => null,
    keyInParent: null,
    hideFields: [],
    ...filterUndefined(options),
  };
  const {
    maxDepth,
    currentIndent,
    lineIndent,
    multiline,
    refs,
    path,
    overrides,
    hideFields,
  } = fullOptions;
  const nl = `\n${currentIndent}`;

  const overrideResult = overrides(value, options);
  if (overrideResult !== null) return overrideResult;

  if (["function", "object", "symbol"].includes(typeof value) && value !== null) {
    if (refs.has(value)) {
      return `Ref<${refs.get(value)}>`;
    }
    refs.set(value, path);
  }

  const newOptions: NicifyOptions = {
    maxDepth: maxDepth - 1,
    currentIndent,
    lineIndent,
    multiline,
    refs,
    path: path + "->[unknown property]",
    overrides,
    parent: { value, options: fullOptions },
    keyInParent: null,
    hideFields: [],
  };
  const nestedNicify = (newValue: unknown, newPath: string, keyInParent: PropertyKey | null) => {
    return nicify(newValue, {
      ...newOptions,
      path: newPath,
      currentIndent: currentIndent + lineIndent,
      keyInParent,
    });
  };

  switch (typeof value) {
    case "boolean": case "number": {
      return JSON.stringify(value);
    }
    case "string": {
      const isDeindentable = (v: string) => deindent(v) === v && v.includes("\n");
      const wrapInDeindent = (v: string) => deindent`
        deindent\`
        ${currentIndent + lineIndent}${escapeTemplateLiteral(value).replaceAll("\n", nl + lineIndent)}
        ${currentIndent}\`
      `;
      if (isDeindentable(value)) {
        return wrapInDeindent(value);
      } else if (value.endsWith("\n") && isDeindentable(value.slice(0, -1))) {
        return wrapInDeindent(value.slice(0, -1)) + ' + "\\n"';
      } else {
        return JSON.stringify(value);
      }
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
        const extraLines = getNicifiedObjectExtraLines(value);
        const resValueLength = value.length + extraLines.length;
        if (maxDepth <= 0 && resValueLength === 0) return "[...]";
        const resValues = value.map((v, i) => nestedNicify(v, `${path}[${i}]`, i));
        resValues.push(...extraLines);
        if (resValues.length !== resValueLength) throw new StackAssertionError("nicify of object: resValues.length !== resValueLength", { value, resValues, resValueLength });
        const shouldIndent = resValues.length > 1 || resValues.some(x => x.includes("\n"));
        if (shouldIndent) {
          return `[${nl}${resValues.map(x => `${lineIndent}${x},${nl}`).join("")}]`;
        } else {
          return `[${resValues.join(", ")}]`;
        }
      }
      if (value instanceof URL) {
        return `URL(${nicify(value.toString())})`;
      }
      if (ArrayBuffer.isView(value)) {
        return `${value.constructor.name}([${value.toString()}])`;
      }

      const constructorName = [null, Object.prototype].includes(Object.getPrototypeOf(value)) ? null : (nicifiableClassNameOverrides.get(value.constructor) ?? value.constructor.name);
      const constructorString = constructorName ? `${nicifyPropertyString(constructorName)} ` : "";

      const entries = getNicifiableEntries(value).filter(([k]) => !hideFields.includes(k));
      const extraLines = [
        ...getNicifiedObjectExtraLines(value),
        ...hideFields.length > 0 ? [`<some fields may have been hidden>`] : [],
      ];
      const resValueLength = entries.length + extraLines.length;
      if (resValueLength === 0) return `${constructorString}{}`;
      if (maxDepth <= 0) return `${constructorString}{ ... }`;
      const resValues = entries.map(([k, v], keyIndex) => {
        const keyNicified = nestedNicify(k, `Object.keys(${path})[${keyIndex}]`, null);
        const keyInObjectLiteral = typeof k === "string" ? JSON.stringify(k) : `[${keyNicified}]`;
        if (typeof v === "function" && v.name === k) {
          return `${keyInObjectLiteral}(...): { ... }`;
        } else {
          return `${keyInObjectLiteral}: ${nestedNicify(v, `${path}[${keyNicified}]`, k)}`;
        }
      });
      resValues.push(...extraLines);
      if (resValues.length !== resValueLength) throw new StackAssertionError("nicify of object: resValues.length !== resValueLength", { value, resValues, resValueLength });
      const shouldIndent = resValues.length > 1 || resValues.some(x => x.includes("\n"));

      if (resValues.length === 0) return `${constructorString}{}`;
      if (shouldIndent) {
        return `${constructorString}{${nl}${resValues.map(x => `${lineIndent}${x},${nl}`).join("")}}`;
      } else {
        return `${constructorString}{ ${resValues.join(", ")} }`;
      }
    }
    default: {
      return `${typeof value}<${value}>`;
    }
  }
}

export function replaceAll(input: string, searchValue: string, replaceValue: string): string {
  return input.split(searchValue).join(replaceValue);
}

function nicifyPropertyString(str: string) {
  if (/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(str)) return str;
  return JSON.stringify(str);
}

function getNicifiableKeys(value: Nicifiable | object) {
  const overridden = ("getNicifiableKeys" in value ? value.getNicifiableKeys?.bind(value) : null)?.();
  if (overridden != null) return overridden;
  const keys = Object.keys(value).sort();
  if (value instanceof Error) {
    if (value.cause) keys.unshift("cause");
    keys.unshift("message", "stack");
  }
  return unique(keys);
}

function getNicifiableEntries(value: Nicifiable | object): [PropertyKey, unknown][] {
  const recordLikes = [Headers];
  function isRecordLike(value: unknown): value is InstanceType<typeof recordLikes[number]> {
    return recordLikes.some(x => value instanceof x);
  }

  if (isRecordLike(value)) {
    return [...value.entries()].sort(([a], [b]) => stringCompare(`${a}`, `${b}`));
  }
  const keys = getNicifiableKeys(value);
  return keys.map((k) => [k, value[k as never]] as [PropertyKey, unknown]);
}

function getNicifiedObjectExtraLines(value: Nicifiable | object) {
  return ("getNicifiedObjectExtraLines" in value ? value.getNicifiedObjectExtraLines : null)?.() ?? [];
}
