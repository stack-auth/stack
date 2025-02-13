const defaults = require("../../eslint-configs/defaults.js");
const publicVars = require("../../eslint-configs/extra-rules.js");

module.exports = {
  "extends": [
    "../../eslint-configs/defaults.js",
  ],
  "ignorePatterns": ['/*', '!/src'],
  "rules": {
    "no-restricted-syntax": [
      ...defaults.rules["no-restricted-syntax"],
      publicVars['no-next-public-env']
    ],
  },
};
