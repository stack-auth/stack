/** @type {import('eslint').Linter.BaseConfig} **/

module.exports = {
  extends: ["@stackframe/eslint-config/base", "@stackframe/eslint-config/next"],
  parserOptions: {
    projectService: true,
  },
  ignorePatterns: ["/*", "!/src"],
  rules: {
    "import/order": [
      1,
      {
        groups: [
          "external",
          "builtin",
          "internal",
          "sibling",
          "parent",
          "index",
        ],
      },
    ],
  },
};
