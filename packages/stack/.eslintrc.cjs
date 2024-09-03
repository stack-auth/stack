/** @type {import('eslint').Linter.BaseConfig} **/

module.exports = {
  extends: ["@stackframe/eslint-config"],
  parserOptions: {
    projectService: true,
  },
  ignorePatterns: ["/*", "!/src"]
};
