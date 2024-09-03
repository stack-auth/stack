/** @type {import('eslint').Linter.BaseConfig} **/

const defaults = require("@stackframe/eslint-config");

module.exports = {
  extends: ["@stackframe/eslint-config/base", "@stackframe/eslint-config/next"],
  parserOptions: {
    projectService: true,
  },
  ignorePatterns: ["/*", "!/src", "!/scripts", "!/prisma"],
  rules: {
    "no-restricted-syntax": [
      ...defaults.rules["no-restricted-syntax"],
      {
        selector:
          "MemberExpression[type=MemberExpression][object.type=MemberExpression][object.object.type=Identifier][object.object.name=process][object.property.type=Identifier][object.property.name=env]",
        message:
          "Don't use process.env directly in Stack's backend. Use getEnvVariable(...) or getNodeEnvironment() instead.",
      },
    ],
  },
};
