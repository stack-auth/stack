// Check out https://github.com/stack-auth/info/blob/main/eng-handbook/random-thoughts/config-json-format.md for more information on the config format

import * as yup from "yup";
import { yupBoolean, yupNumber, yupObject, yupRecord, yupString, yupTuple } from "../schema-fields";
import { deepPlainClone } from "../utils/objects";

const configRecord = (schema: yup.AnySchema) => yupRecord(schema, (key) => key.match(/^[a-zA-Z0-9_]+$/) !== null);

const configSchema = yupObject({
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

export function mergeConfigs(configs: any[]) {
  let mergedConfig: {} | yup.InferType<typeof configSchema> = {};

  for (const config of configs) {
    mergedConfig = mergeConfig(mergedConfig, config);
  }

  return mergedConfig;
}

export function mergeConfig(
  defaultConfig: any,
  overrideConfig: any
): yup.InferType<typeof configSchema> {
  const newConfig = deepPlainClone(defaultConfig) as any;

  Object.keys(overrideConfig).forEach((key) => {
    const overrideValue = overrideConfig[key];
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

  return configSchema.validateSync(newConfig);
}

// Example usage of mergeConfig
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

// This would result in:
// - signUpEnabled being set to false
// - teamCreateDefaultSystemPermissions.manage_users being set to true
// - permissionDefinitions.manage_team being removed
const mergedConfig = mergeConfig(defaultConfigExample, overrideConfigExample);

console.log(mergedConfig);
