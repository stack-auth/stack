/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
module.exports = {
  plugins: ["prettier-plugin-tailwindcss", "prettier-plugin-classnames", "@trivago/prettier-plugin-sort-imports", "prettier-plugin-merge"],

  // https://prettier.io/docs/en/options
  printWidth: 140,

  // https://github.com/ony3000/prettier-plugin-classnames?tab=readme-ov-file#configuration
  endingPosition: "absolute-with-indent",

  // https://github.com/tailwindlabs/prettier-plugin-tailwindcss?tab=readme-ov-file#options
  tailwindAttributes: ["theme"],
  tailwindFunctions: ["twMerge", "clsx"],
  customFunctions: ["twMerge", "clsx"],
  tailwindPreserveWhitespace: true,

  // https://github.com/trivago/prettier-plugin-sort-imports?tab=readme-ov-file#prettier-plugin-sort-imports
  importOrder: ["<THIRD_PARTY_MODULES>", "^@stackframe/(.*)$", "^@/(.*)$", "^[./]"],
  importOrderSortSpecifiers: true,
};
