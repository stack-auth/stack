// tsup.config.ts
import { defineConfig } from "tsup";

// package.json
var package_default = {
  name: "@stackframe/stack",
  version: "2.4.23",
  sideEffects: false,
  exports: {
    ".": {
      types: "./dist/index.d.ts",
      import: {
        default: "./dist/esm/index.js"
      },
      require: {
        default: "./dist/index.js"
      }
    },
    "./joy": {
      types: "./dist/joy.d.ts",
      import: {
        default: "./dist/esm/joy.js"
      },
      require: {
        default: "./dist/joy.js"
      }
    }
  },
  homepage: "https://stack-auth.com",
  scripts: {
    typecheck: "tsc --noEmit",
    build: "rimraf dist && tsup-node",
    clean: "rimraf dist && rimraf node_modules",
    dev: "rimraf dist && tsup-node --watch",
    lint: "eslint --ext .tsx,.ts ."
  },
  files: [
    "README.md",
    "dist",
    "CHANGELOG.md",
    "LICENSE"
  ],
  dependencies: {
    rimraf: "^5.0.5",
    "@hookform/resolvers": "^3.3.4",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@stackframe/stack-sc": "workspace:*",
    "@stackframe/stack-shared": "workspace:*",
    color: "^4.2.3",
    cookie: "^0.6.0",
    "js-cookie": "^3.0.5",
    "lucide-react": "^0.378.0",
    oauth4webapi: "^2.10.3",
    "react-hook-form": "^7.51.4",
    "server-only": "^0.0.1",
    "styled-components": "^6.1.8",
    yup: "^1.4.0"
  },
  peerDependencies: {
    "@mui/joy": "^5.0.0-beta.30",
    next: ">=14.1",
    react: "^18.2"
  },
  peerDependenciesMeta: {
    "@mui/joy": {
      optional: true
    }
  },
  devDependencies: {
    "@types/color": "^3.0.6",
    "@types/cookie": "^0.6.0",
    "@types/js-cookie": "^3.0.6",
    "@types/react": "^18.2.66",
    esbuild: "^0.20.2",
    tsup: "^8.0.2"
  }
};

// tsup.config.ts
var customNoExternal = /* @__PURE__ */ new Set([
  "oauth4webapi"
]);
var config = {
  entryPoints: ["src/**/*.(ts|tsx|js|jsx)"],
  sourcemap: true,
  clean: false,
  noExternal: [...customNoExternal],
  dts: true,
  outDir: "dist",
  format: ["esm", "cjs"],
  legacyOutput: true,
  env: {
    STACK_COMPILE_TIME_CLIENT_PACKAGE_VERSION: `js ${package_default.name}@${package_default.version}`
  },
  esbuildPlugins: [
    {
      name: "stackframe tsup plugin (private)",
      setup(build) {
        build.onEnd((result) => {
          const sourceFiles = result.outputFiles?.filter((file) => !file.path.endsWith(".map")) ?? [];
          for (const file of sourceFiles) {
            const matchUseClient = /[\s\n\r]*(^|\n|\r|;)\s*['"]use\s+client['"]\s*(\n|\r|;)/im;
            if (matchUseClient.test(file.text)) {
              file.contents = new TextEncoder().encode(`"use client";
${file.text}`);
            }
          }
        });
        build.onResolve({ filter: /^.*$/m }, async (args) => {
          if (args.kind === "entry-point" || customNoExternal.has(args.path)) {
            return void 0;
          }
          return {
            external: true
          };
        });
      }
    }
  ]
};
var tsup_config_default = defineConfig(config);
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX2luamVjdGVkX2ZpbGVuYW1lX18gPSBcIi9Vc2Vycy9rb25zdGFudGlud29obHdlbmQvRG9jdW1lbnRzL3N0YWNrL3BhY2thZ2VzL3N0YWNrL3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9Vc2Vycy9rb25zdGFudGlud29obHdlbmQvRG9jdW1lbnRzL3N0YWNrL3BhY2thZ2VzL3N0YWNrXCI7Y29uc3QgX19pbmplY3RlZF9pbXBvcnRfbWV0YV91cmxfXyA9IFwiZmlsZTovLy9Vc2Vycy9rb25zdGFudGlud29obHdlbmQvRG9jdW1lbnRzL3N0YWNrL3BhY2thZ2VzL3N0YWNrL3RzdXAuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBPcHRpb25zIH0gZnJvbSAndHN1cCc7XG5pbXBvcnQgcGFja2FnZUpzb24gZnJvbSAnLi9wYWNrYWdlLmpzb24nO1xuXG5jb25zdCBjdXN0b21Ob0V4dGVybmFsID0gbmV3IFNldChbXG4gIFwib2F1dGg0d2ViYXBpXCIsXG5dKTtcblxuY29uc3QgY29uZmlnOiBPcHRpb25zID0ge1xuICBlbnRyeVBvaW50czogWydzcmMvKiovKi4odHN8dHN4fGpzfGpzeCknXSxcbiAgc291cmNlbWFwOiB0cnVlLFxuICBjbGVhbjogZmFsc2UsXG4gIG5vRXh0ZXJuYWw6IFsuLi5jdXN0b21Ob0V4dGVybmFsXSxcbiAgZHRzOiB0cnVlLFxuICBvdXREaXI6ICdkaXN0JyxcbiAgZm9ybWF0OiBbJ2VzbScsICdjanMnXSxcbiAgbGVnYWN5T3V0cHV0OiB0cnVlLFxuICBlbnY6IHtcbiAgICBTVEFDS19DT01QSUxFX1RJTUVfQ0xJRU5UX1BBQ0tBR0VfVkVSU0lPTjogYGpzICR7cGFja2FnZUpzb24ubmFtZX1AJHtwYWNrYWdlSnNvbi52ZXJzaW9ufWAsXG4gIH0sXG4gIGVzYnVpbGRQbHVnaW5zOiBbXG4gICAge1xuICAgICAgbmFtZTogJ3N0YWNrZnJhbWUgdHN1cCBwbHVnaW4gKHByaXZhdGUpJyxcbiAgICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICAgIGJ1aWxkLm9uRW5kKHJlc3VsdCA9PiB7XG4gICAgICAgICAgY29uc3Qgc291cmNlRmlsZXMgPSByZXN1bHQub3V0cHV0RmlsZXM/LmZpbHRlcihmaWxlID0+ICFmaWxlLnBhdGguZW5kc1dpdGgoJy5tYXAnKSkgPz8gW107XG4gICAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIHNvdXJjZUZpbGVzKSB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaFVzZUNsaWVudCA9IC9bXFxzXFxuXFxyXSooXnxcXG58XFxyfDspXFxzKlsnXCJddXNlXFxzK2NsaWVudFsnXCJdXFxzKihcXG58XFxyfDspL2ltO1xuICAgICAgICAgICAgaWYgKG1hdGNoVXNlQ2xpZW50LnRlc3QoZmlsZS50ZXh0KSkge1xuICAgICAgICAgICAgICBmaWxlLmNvbnRlbnRzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGBcInVzZSBjbGllbnRcIjtcXG4ke2ZpbGUudGV4dH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogL14uKiQvbSB9LCBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICAgIGlmIChhcmdzLmtpbmQgPT09IFwiZW50cnktcG9pbnRcIiB8fCBjdXN0b21Ob0V4dGVybmFsLmhhcyhhcmdzLnBhdGgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXh0ZXJuYWw6IHRydWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoY29uZmlnKTtcbiIsICJ7XG4gIFwibmFtZVwiOiBcIkBzdGFja2ZyYW1lL3N0YWNrXCIsXG4gIFwidmVyc2lvblwiOiBcIjIuNC4yM1wiLFxuICBcInNpZGVFZmZlY3RzXCI6IGZhbHNlLFxuICBcImV4cG9ydHNcIjoge1xuICAgIFwiLlwiOiB7XG4gICAgICBcInR5cGVzXCI6IFwiLi9kaXN0L2luZGV4LmQudHNcIixcbiAgICAgIFwiaW1wb3J0XCI6IHtcbiAgICAgICAgXCJkZWZhdWx0XCI6IFwiLi9kaXN0L2VzbS9pbmRleC5qc1wiXG4gICAgICB9LFxuICAgICAgXCJyZXF1aXJlXCI6IHtcbiAgICAgICAgXCJkZWZhdWx0XCI6IFwiLi9kaXN0L2luZGV4LmpzXCJcbiAgICAgIH1cbiAgICB9LFxuICAgIFwiLi9qb3lcIjoge1xuICAgICAgXCJ0eXBlc1wiOiBcIi4vZGlzdC9qb3kuZC50c1wiLFxuICAgICAgXCJpbXBvcnRcIjoge1xuICAgICAgICBcImRlZmF1bHRcIjogXCIuL2Rpc3QvZXNtL2pveS5qc1wiXG4gICAgICB9LFxuICAgICAgXCJyZXF1aXJlXCI6IHtcbiAgICAgICAgXCJkZWZhdWx0XCI6IFwiLi9kaXN0L2pveS5qc1wiXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBcImhvbWVwYWdlXCI6IFwiaHR0cHM6Ly9zdGFjay1hdXRoLmNvbVwiLFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwidHlwZWNoZWNrXCI6IFwidHNjIC0tbm9FbWl0XCIsXG4gICAgXCJidWlsZFwiOiBcInJpbXJhZiBkaXN0ICYmIHRzdXAtbm9kZVwiLFxuICAgIFwiY2xlYW5cIjogXCJyaW1yYWYgZGlzdCAmJiByaW1yYWYgbm9kZV9tb2R1bGVzXCIsXG4gICAgXCJkZXZcIjogXCJyaW1yYWYgZGlzdCAmJiB0c3VwLW5vZGUgLS13YXRjaFwiLFxuICAgIFwibGludFwiOiBcImVzbGludCAtLWV4dCAudHN4LC50cyAuXCJcbiAgfSxcbiAgXCJmaWxlc1wiOiBbXG4gICAgXCJSRUFETUUubWRcIixcbiAgICBcImRpc3RcIixcbiAgICBcIkNIQU5HRUxPRy5tZFwiLFxuICAgIFwiTElDRU5TRVwiXG4gIF0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcInJpbXJhZlwiOiBcIl41LjAuNVwiLFxuICAgIFwiQGhvb2tmb3JtL3Jlc29sdmVyc1wiOiBcIl4zLjMuNFwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWF2YXRhclwiOiBcIl4xLjAuNFwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNvbGxhcHNpYmxlXCI6IFwiXjEuMC4zXCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudVwiOiBcIl4yLjAuNlwiLFxuICAgIFwiQHJhZGl4LXVpL3JlYWN0LWljb25zXCI6IFwiXjEuMy4wXCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtbGFiZWxcIjogXCJeMi4wLjJcIixcbiAgICBcIkByYWRpeC11aS9yZWFjdC1wb3BvdmVyXCI6IFwiXjEuMC43XCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VwYXJhdG9yXCI6IFwiXjEuMC4zXCIsXG4gICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiOiBcIl4xLjAuNFwiLFxuICAgIFwiQHN0YWNrZnJhbWUvc3RhY2stc2NcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuICAgIFwiQHN0YWNrZnJhbWUvc3RhY2stc2hhcmVkXCI6IFwid29ya3NwYWNlOipcIixcbiAgICBcImNvbG9yXCI6IFwiXjQuMi4zXCIsXG4gICAgXCJjb29raWVcIjogXCJeMC42LjBcIixcbiAgICBcImpzLWNvb2tpZVwiOiBcIl4zLjAuNVwiLFxuICAgIFwibHVjaWRlLXJlYWN0XCI6IFwiXjAuMzc4LjBcIixcbiAgICBcIm9hdXRoNHdlYmFwaVwiOiBcIl4yLjEwLjNcIixcbiAgICBcInJlYWN0LWhvb2stZm9ybVwiOiBcIl43LjUxLjRcIixcbiAgICBcInNlcnZlci1vbmx5XCI6IFwiXjAuMC4xXCIsXG4gICAgXCJzdHlsZWQtY29tcG9uZW50c1wiOiBcIl42LjEuOFwiLFxuICAgIFwieXVwXCI6IFwiXjEuNC4wXCJcbiAgfSxcbiAgXCJwZWVyRGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBtdWkvam95XCI6IFwiXjUuMC4wLWJldGEuMzBcIixcbiAgICBcIm5leHRcIjogXCI+PTE0LjFcIixcbiAgICBcInJlYWN0XCI6IFwiXjE4LjJcIlxuICB9LFxuICBcInBlZXJEZXBlbmRlbmNpZXNNZXRhXCI6IHtcbiAgICBcIkBtdWkvam95XCI6IHtcbiAgICAgIFwib3B0aW9uYWxcIjogdHJ1ZVxuICAgIH1cbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQHR5cGVzL2NvbG9yXCI6IFwiXjMuMC42XCIsXG4gICAgXCJAdHlwZXMvY29va2llXCI6IFwiXjAuNi4wXCIsXG4gICAgXCJAdHlwZXMvanMtY29va2llXCI6IFwiXjMuMC42XCIsXG4gICAgXCJAdHlwZXMvcmVhY3RcIjogXCJeMTguMi42NlwiLFxuICAgIFwiZXNidWlsZFwiOiBcIl4wLjIwLjJcIixcbiAgICBcInRzdXBcIjogXCJeOC4wLjJcIlxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNULFNBQVMsb0JBQTZCOzs7QUNBNVY7QUFBQSxFQUNFLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLGFBQWU7QUFBQSxFQUNmLFNBQVc7QUFBQSxJQUNULEtBQUs7QUFBQSxNQUNILE9BQVM7QUFBQSxNQUNULFFBQVU7QUFBQSxRQUNSLFNBQVc7QUFBQSxNQUNiO0FBQUEsTUFDQSxTQUFXO0FBQUEsUUFDVCxTQUFXO0FBQUEsTUFDYjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQVM7QUFBQSxNQUNULFFBQVU7QUFBQSxRQUNSLFNBQVc7QUFBQSxNQUNiO0FBQUEsTUFDQSxTQUFXO0FBQUEsUUFDVCxTQUFXO0FBQUEsTUFDYjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxVQUFZO0FBQUEsRUFDWixTQUFXO0FBQUEsSUFDVCxXQUFhO0FBQUEsSUFDYixPQUFT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
