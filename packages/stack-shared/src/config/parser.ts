// Check out https://github.com/stack-auth/info/blob/main/eng-handbook/random-thoughts/config-json-format.md for more information on the config format

import * as yup from "yup";
import * as schemaFields from "../schema-fields";
import { yupArray, yupBoolean, yupNumber, yupObject, yupRecord, yupString, yupTuple } from "../schema-fields";
import { deepPlainClone } from "../utils/objects";

type EnvMode = 'no-env' | 'optional-env' | 'required-env';

const configRecord = (schema: yup.AnySchema) => yupRecord(schema, (key) => key.match(/^[a-zA-Z0-9_]+$/) !== null);

const envSchema = <T extends yup.AnySchema>(mode: EnvMode, schema: T): T => {
  switch (mode) {
    case 'no-env': {
      return schema;
    }
    case 'optional-env': {
      return schema.nullable().optional();
    }
    case 'required-env': {
      return schema;
    }
  }
};

export const getConfigSchema = (mode: EnvMode) => yupObject({
  isProductionMode: yupBoolean().defined(),
  allowLocalhost: yupBoolean().defined(),
  signUpEnabled: yupBoolean().defined(),
  createTeamOnSignUp: yupBoolean().defined(),
  clientTeamCreationEnabled: yupBoolean().defined(),
  clientUserDeletionEnabled: yupBoolean().defined(),
  legacyGlobalJwtSigning: yupBoolean().defined(),

  // keys to the permissions/permission definitions are hex encoded ids.
  teamCreateDefaultSystemPermissions: configRecord(yupObject({
    id: yupString().defined(),
  })).defined(),
  teamMemberDefaultSystemPermissions: configRecord(yupObject({
    id: yupString().defined(),
  })).defined(),
  permissionDefinitions: configRecord(yupObject({
    id: yupString().defined(),
    description: yupString().defined(),
    containedPermissionIds: yupArray(yupString()).defined(),
  })).defined(),

  // keys to the oauth provider configs are the provider ids.
  oauthProviderConfigs: configRecord(yupObject({
    id: yupString().defined(),
    type: envSchema(mode, yupString().oneOf(['shared', 'standard']).defined()),
    clientId: envSchema(mode, schemaFields.yupDefinedAndNonEmptyWhen(schemaFields.oauthClientIdSchema, { type: 'standard', enabled: true })),
    clientSecret: envSchema(mode, schemaFields.yupDefinedAndNonEmptyWhen(schemaFields.oauthClientSecretSchema, { type: 'standard', enabled: true })),
    facebookConfigId: envSchema(mode, schemaFields.oauthFacebookConfigIdSchema.optional()),
    microsoftTenantId: envSchema(mode, schemaFields.oauthMicrosoftTenantIdSchema.optional()),
  })).defined(),

  emailConfig: envSchema(mode, yupObject({
    type: schemaFields.emailTypeSchema.defined(),
    host: schemaFields.yupDefinedAndNonEmptyWhen(schemaFields.emailHostSchema, {
      type: 'standard',
    }),
    port: schemaFields.yupDefinedWhen(schemaFields.emailPortSchema, {
      type: 'standard',
    }),
    username: schemaFields.yupDefinedAndNonEmptyWhen(schemaFields.emailUsernameSchema, {
      type: 'standard',
    }),
    password: schemaFields.yupDefinedAndNonEmptyWhen(schemaFields.emailPasswordSchema, {
      type: 'standard',
    }),
    sender_name: schemaFields.yupDefinedAndNonEmptyWhen(schemaFields.emailSenderNameSchema, {
      type: 'standard',
    }),
    sender_email: schemaFields.yupDefinedAndNonEmptyWhen(schemaFields.emailSenderEmailSchema, {
      type: 'standard',
    }),
  })),
});

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
