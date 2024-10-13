module.exports = {
  extends: [],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    // use the package folder as the root for the TS ESLint plugin
    project: "./tsconfig.json",
    tsconfigRootDir: process.cwd(),
  },
  rules: {
    "no-unused-expressions": ["error", { enforceForJSX: true }],
    "no-trailing-spaces": "warn",
    "eol-last": "error",
    "key-spacing": "error",
    indent: [
      "error",
      2,
      {
        SwitchCase: 1,
        ignoredNodes: [
          "TSIntersectionType",
          "TSTypeParameter",
          "TSTypeParameterDeclaration",
          "TSTypeParameterInstantiation",
          "TSUnionType",
          "ConditionalType",
          "TSConditionalType",
          "FunctionDeclaration",
          "CallExpression",
        ],
      },
    ],
    "keyword-spacing": "warn",
    "block-spacing": "warn",
    "max-statements-per-line": "warn",
    semi: ["error", "always"],
    "no-fallthrough": "error",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/no-floating-promises": [
      "error",
      {
        ignoreVoid: false,
      },
    ],
    "no-return-await": "off",
    "@typescript-eslint/return-await": ["error", "always"],
    "no-multiple-empty-lines": "warn",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        multiline: {
          delimiter: "comma",
        },
        singleline: {
          delimiter: "comma",
          requireLast: false,
        },
        multilineDetection: "brackets",
      },
    ],
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
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["react"],
            importNames: ["use"],
            message:
              'Directly importing "use" from react will cause next.js middlewares to break on compile time. do import React from "react" and use React.use instead.',
          },
        ],
      },
    ],
  },
};
