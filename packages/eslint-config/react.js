/** @type {import('eslint').Linter.BaseConfig} **/

module.exports = {
  extends: [
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  plugins: ["react", "react-hooks"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  // React specific overrides go here
  rules: {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
};
