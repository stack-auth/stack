/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[data-stack-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./node_modules/@stackframe/stack-ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
