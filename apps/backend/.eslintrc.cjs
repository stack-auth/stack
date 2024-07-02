module.exports = {
  extends: ["../../eslint-configs/defaults.js", "../../eslint-configs/next.js"],
  ignorePatterns: ["/*", "!/src", "!/prisma"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "MemberExpression[type=MemberExpression][object.type=MemberExpression][object.object.type=Identifier][object.object.name=process][object.property.type=Identifier][object.property.name=env]",
        message: "Don't use process.env directly in Stack's backend. Use getEnvVariable(...) or getNodeEnvironment() instead.",
      },
    ],
  },
};
