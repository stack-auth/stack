/** @type {import('eslint').Linter.BaseConfig} **/

module.exports = {
  extends: ["@stackframe/eslint-config/base", "@stackframe/eslint-config/next"],
  parserOptions: {
    projectService: true,
  },
  ignorePatterns: ["/*", "!/src"],
  rules: {
    "@typescript-eslint/no-misused-promises": [0],
    "@typescript-eslint/no-floating-promises": [0],
  },
};
