/** @type {import('eslint').Linter.BaseConfig} **/

module.exports = {
  extends: ["@stackframe/eslint-config"],
  parserOptions: {
    projectService: true,
  },
  ignorePatterns: ["/*", "!/tests"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["vitest"],
            importNames: ["test", "it"],
            message: "Use test or it from helpers instead."
          }
        ]
      }
    ]
  }
};
