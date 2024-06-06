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
    indent: ["warn", 2, { SwitchCase: 1 }],
    semi: ["error", "always"],
    "no-fallthrough": "error",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/no-floating-promises": ["error", {
      ignoreVoid: false,
    }],
    "no-return-await": "off",
    "@typescript-eslint/return-await": ["error", "always"],
    "no-multiple-empty-lines": "warn",
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
    "@typescript-eslint/no-unnecessary-condition": ["error", { allowConstantLoopConditions: true }],
    "no-restricted-syntax": [
      "error",
      {
        selector: 'SwitchCase > *.consequent[type!="BlockStatement"]',
        message: "Switch cases without blocks are disallowed.",
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
