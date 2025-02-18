// Check out https://github.com/stack-auth/info/blob/main/eng-handbook/random-thoughts/config-json-format.md for more information on the config format

import * as yup from "yup";
import { yupNumber, yupObject, yupTuple } from "../schema-fields";
import { StackAssertionError } from "../utils/errors";
import { deleteKey, get, has, set } from "../utils/objects";


type ConfigValue = string | number | boolean | null | ConfigValue[] | Config;
export type Config = {
  [keyOrDotNotation: string]: ConfigValue,
};

type NormalizedConfigValue = string | number | boolean | NormalizedConfigValue[] | NormalizedConfig;
export type NormalizedConfig = {
  [key: string]: NormalizedConfigValue,
};


/**
 * Note that a config can both be valid and not normalizable.
 */
export function isValidConfig(c: unknown): c is Config {
  return getInvalidConfigReason(c) === undefined;
}

function getInvalidConfigReason(c: unknown, options: { configName?: string } = {}): string | undefined {
  const configName = options.configName ?? 'config';
  if (c === null || typeof c !== 'object') return `${configName} must be a non-null object`;
  for (const [key, value] of Object.entries(c)) {
    if (typeof key !== 'string') return `${configName} must have only string keys (found: ${typeof key})`;
    if (!key.match(/^[a-zA-Z_$][a-zA-Z_$0-9\-]*(?:\.[a-zA-Z0-9_$][a-zA-Z_$0-9\-]*)*$/)) return `All keys of ${configName} must consist of only alphanumeric characters, dots, underscores, dollar signs, or hyphens and start with a character other than a number or hyphen (found: ${key})`;

    const entryName = `${configName}.${key}`;
    const reason = getInvalidConfigValueReason(value, { valueName: entryName });
    if (reason) return reason;
  }
  return undefined;
}

function getInvalidConfigValueReason(value: unknown, options: { valueName?: string } = {}): string | undefined {
  const valueName = options.valueName ?? 'value';
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean': {
      break;
    }
    case 'object': {
      if (value === null) {
        break;
      } else if (Array.isArray(value)) {
        for (const [index, v] of value.entries()) {
          const reason = getInvalidConfigValueReason(v, { valueName: `${valueName}[${index}]` });
          if (reason) return reason;
        }
      } else {
        const reason = getInvalidConfigReason(value, { configName: valueName });
        if (reason) return reason;
      }
      break;
    }
    default: {
      return `${valueName} has an invalid value type ${typeof value} (value: ${value})`;
    }
  }
  return undefined;
}

export function assertValidConfig(c: unknown) {
  const reason = getInvalidConfigReason(c);
  if (reason) throw new StackAssertionError(`Invalid config: ${reason}`, { c });
}

export function override(c1: Config, ...configs: Config[]) {
  if (configs.length === 0) return c1;
  if (configs.length > 1) return override(override(c1, configs[0]), ...configs.slice(1));
  const c2 = configs[0];

  assertValidConfig(c1);
  assertValidConfig(c2);

  let result = c1;
  for (const key of Object.keys(c2)) {
    result = Object.fromEntries(
      Object.entries(result)
        .filter(([k]) => k !== key && !k.startsWith(key + '.'))
    );
  }

  return {
    ...result,
    ...c2,
  };
}

import.meta.vitest?.test("override(...)", ({ expect }) => {
  expect(
    override(
      {
        a: 1,
        b: 2,
        "c.d": 3,
        "c.e.f": 4,
        "c.g": 5,
        h: [6, { i: 7 }, 8],
      },
      {
        a: 9,
        "c.d": 10,
        "c.e": null,
        "h.0": 11,
        "h.1": {
          j: 12,
        },
      },
    )
  ).toEqual({
    a: 9,
    b: 2,
    "c.d": 10,
    "c.e": null,
    "c.g": 5,
    h: [6, { i: 7 }, 8],
    "h.0": 11,
    "h.1": {
      j: 12,
    },
  });
});

export function normalize(c: Config, options: { configName?: string } = {}): NormalizedConfig {
  assertValidConfig(c);

  const countDots = (s: string) => s.match(/\./g)?.length ?? 0;
  const result: NormalizedConfig = {};
  const keysByDepth = Object.keys(c)
    .sort((a, b) => countDots(a) - countDots(b));

  for (const key of keysByDepth) {
    if (key.includes('.')) {
      const [prefix, suffix] = key.split('.', 2);
      const oldValue = get(result, prefix);
      if (typeof oldValue !== 'object') throw new StackAssertionError("Tried to use dot notation on a non-object config value. Maybe this config is not normalizable?", { c, key, oldValue });
      set(oldValue, suffix as any, get(c, key));
      setNormalizedValue(result, prefix, oldValue);
    } else {
      setNormalizedValue(result, key, get(c, key));
    }
  }
  return result;
}

function normalizeValue(value: ConfigValue): NormalizedConfigValue {
  if (value === null) throw new StackAssertionError("Tried to normalize a null value");
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (typeof value === 'object') return normalize(value);
  return value;
}

function setNormalizedValue(result: NormalizedConfig, key: string, value: ConfigValue) {
  if (value === null) {
    if (has(result, key)) {
      deleteKey(result, key);
    }
  } else {
    set(result, key, normalizeValue(value));
  }
}

import.meta.vitest?.test("normalize(...)", ({ expect }) => {
  expect(normalize({
    a: 9,
    b: 2,
    c: {},
    "c.d": 10,
    "c.e": null,
    "c.g": 5,
    h: [6, { i: 7 }, 8],
    "h.0": 11,
    "h.1": {
      j: 12,
    },
  })).toEqual({
    a: 9,
    b: 2,
    c: {
      d: 10,
      g: 5,
    },
    h: [11, { j: 12 }, 8],
  });
});

/**
 * @deprecated just here for demonstration purposes — use override() and normalize() instead
 */
function mergeConfig({ configSchema, defaultConfig, overrideConfig }: { configSchema: yup.AnySchema, defaultConfig: Config, overrideConfig: Config }) {
  const result = normalize(override(defaultConfig, overrideConfig));
  return configSchema.validateSync(result);
}

import.meta.vitest?.test("add keys", ({ expect }) => {
  const config = {};

  const newConfig = mergeConfig({
    configSchema: yupObject({
      b: yupNumber().optional(),
    }),
    defaultConfig: config,
    overrideConfig: { b: 456 },
  });

  expect(newConfig).toEqual({ b: 456 });
});

import.meta.vitest?.test("replace keys", ({ expect }) => {
  const config = {
    a: 123,
  };

  const newConfig = mergeConfig({
    configSchema: yupObject({
      a: yupNumber().optional(),
    }),
    defaultConfig: config,
    overrideConfig: { a: 456 },
  });

  expect(newConfig).toEqual({ a: 456 });
});

import.meta.vitest?.test("remove keys", ({ expect }) => {
  const config = {
    a: 123,
  };

  const newConfig = mergeConfig({
    configSchema: yupObject({
      a: yupNumber().optional(),
    }),
    defaultConfig: config,
    overrideConfig: { a: null },
  });

  expect(newConfig).toEqual({});
});

import.meta.vitest?.test("add nested keys", ({ expect }) => {
  const config = {
    a: {},
  };

  const newConfig = mergeConfig({
    configSchema: yupObject({
      a: yupObject({
        b: yupNumber().optional(),
      }),
    }),
    defaultConfig: config,
    overrideConfig: { "a.b": 456 },
  });

  expect(newConfig).toEqual({ a: { b: 456 } });
});

import.meta.vitest?.test("replace nested keys", ({ expect }) => {
  const config = {
    a: {
      b: 123,
    },
  };

  const newConfig = mergeConfig({
    configSchema: yupObject({
      a: yupObject({
        b: yupNumber().defined(),
      }),
    }),
    defaultConfig: config,
    overrideConfig: { "a.b": 456 },
  });

  expect(newConfig).toEqual({ a: { b: 456 } });
});

import.meta.vitest?.test("replace nested tuple", ({ expect }) => {
  const config = {
    a: [123],
  };

  const newConfig = mergeConfig({
    configSchema: yupObject({
      a: yupTuple([yupNumber()]).defined(),
    }),
    defaultConfig: config,
    overrideConfig: { 'a.0': 456 },
  });

  expect(newConfig).toEqual({ a: [456] });
});
