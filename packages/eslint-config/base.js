/** @type {import('eslint').Linter.BaseConfig} **/

module.exports = {
  extends: [],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  root: true,
  env: {
    browser: true,
    node: true
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off", // TODO: fix all the "any" instances
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/no-floating-promises": [
      "error",
      {
        ignoreVoid: false,
      },
    ],
    "@typescript-eslint/return-await": ["error", "always"],
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-unnecessary-condition": [
      "error",
      { allowConstantLoopConditions: true },
    ],
    "no-restricted-syntax": [
      "error",
      {
        selector: 'SwitchCase > *.consequent[type!="BlockStatement"]',
        message: "Switch cases without blocks are disallowed.",
      },
      {
        selector:
          "MemberExpression:has(Identifier[name='yup']) Identifier[name='url']",
        message:
          "Use urlSchema from schema-fields.tsx instead of yupString().url().",
      },
      {
        selector:
          "MemberExpression:has(Identifier[name='yup']):has(Identifier[name='string'], Identifier[name='number'], Identifier[name='boolean'], Identifier[name='array'], Identifier[name='object'], Identifier[name='date'], Identifier[name='mixed'])",
        message: "Use yupXyz() from schema-fields.tsx instead of yup.xyz().",
      },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksConditionals: true,
      },
    ],
  },
};
