/** @type {import('eslint').Linter.BaseConfig} **/

const defaults = require("@stackframe/eslint-config");

module.exports = {
  extends: ["@stackframe/eslint-config", "@stackframe/eslint-config/next"],
  parserOptions: {
    projectService: true,
  },
  ignorePatterns: ["/*", "!/src", "!/prisma"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["next/navigation", "next/router"],
            importNames: ["useRouter"],
            message: "Importing useRouter from next/navigation or next/router is not allowed. Use our custom useRouter instead.",
          },
        ],
        patterns: [
          {
            group: ["next/link"],
            message: "Importing Link from next/link is not allowed. use our custom Link instead.",
          },
        ],
      },
    ],
    "no-restricted-syntax": [
      ...defaults.rules["no-restricted-syntax"].filter((e) => typeof e !== "object" || !e.message.includes("yupXyz")),
    ],
  },
};
