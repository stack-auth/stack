const { scopedPreflightStyles } = require("tailwindcss-scoped-preflight");

module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  prefix: "wl_",
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
    require("daisyui"),
    scopedPreflightStyles({
      cssSelector: ".stack-scope",
      mode: "matched only",
    }),
  ],
};
