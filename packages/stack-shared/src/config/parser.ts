// Check out https://github.com/stack-auth/info/blob/main/eng-handbook/random-thoughts/config-json-format.md for more information on the config format

import * as yup from "yup";
import { yupBoolean, yupNumber, yupObject, yupRecord, yupString, yupTuple } from "../schema-fields";
import { deepPlainClone } from "../utils/objects";

const configRecord = (schema: yup.AnySchema) => yupRecord(schema, (key) => key.match(/^[a-zA-Z0-9_]+$/) !== null);

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

const exampleConfigSchema = yupObject({
  a: yupObject({
    b: yupObject({
      c: yupString().defined(),
    }).defined(),
  }).defined(),
  d: yupTuple([yupString(), yupString()]).defined(),
  e: yupBoolean().defined(),
  f: yupNumber(),
  g: configRecord(yupString()),
});

const defaultConfigExample = {
  a: {
    b: {
      c: "default"
    }
  },
  d: ["default1", "default2"],
  e: true,
  f: 123,
  g: {},
};

const overrideConfigExample = {
  f: null,
  'a.b.c': "override",
  'd.1': "override1",
  'e': false,
  'g.h': "override2"
};

const mergedConfig = mergeConfig({
  configSchema: exampleConfigSchema,
  defaultConfig: defaultConfigExample,
  overrideConfig: overrideConfigExample,
});

console.log(mergedConfig);
