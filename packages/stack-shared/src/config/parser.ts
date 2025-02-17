// Check out https://github.com/stack-auth/info/blob/main/eng-handbook/random-thoughts/config-json-format.md for more information on the config format

import * as yup from "yup";
import { yupNumber, yupObject, yupTuple } from "../schema-fields";
import { deepPlainClone } from "../utils/objects";

export function mergeConfigs(options: {
  configs: any[],
  configSchema: yup.AnySchema,
}) {
  let mergedConfig: {} | yup.InferType<typeof options.configSchema> = {};

  for (const config of options.configs) {
    mergedConfig = mergeConfig({
      configSchema: options.configSchema,
      defaultConfig: mergedConfig,
      overrideConfig: config,
    });
  }

  return mergedConfig;
}

export function mergeConfig(options: {
  configSchema: yup.AnySchema,
  defaultConfig: any,
  overrideConfig: any,
}): yup.InferType<typeof options.configSchema> {
  const newConfig = deepPlainClone(options.defaultConfig) as any;

  Object.keys(options.overrideConfig).forEach((key) => {
    const overrideValue = options.overrideConfig[key];
    const pathParts = key.split('.');
    let target = newConfig;

    // Traverse down to the parent of the final key.
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      // Check if part is a valid array index
      const arrayIndex = parseInt(part);
      if (!isNaN(arrayIndex) && Array.isArray(target)) {
        // Handle array index
        if (!target[arrayIndex]) {
          target[arrayIndex] = {};
        }
        target = target[arrayIndex];
      } else if (typeof target[part] !== 'object' || target[part] === null) {
        target[part] = {};
      } else {
        target = target[part];
      }
    }

    const finalKey = pathParts[pathParts.length - 1];
    if (overrideValue === null) {
      delete target[finalKey];
    } else {
      target[finalKey] = overrideValue;
    }
  });

  return options.configSchema.validateSync(newConfig);
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
