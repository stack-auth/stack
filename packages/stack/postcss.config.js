import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
    {
      postcssPlugin: "remove-root-plugin",
      Rule(rule) {
        if (
          rule.selector.includes(":root") ||
          rule.selector.includes("[data-theme]")
        ) {
          rule.remove();
        }
      },
    },
  ],
};
