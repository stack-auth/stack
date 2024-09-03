import { Options, defineConfig } from "tsup";
import packageJson from "./package.json";

const customNoExternal = new Set(["oauth4webapi"]);

const config: Options = {
  entryPoints: ["src/**/*.(ts|tsx|js|jsx)"],
  sourcemap: true,
  clean: false,
  noExternal: [...customNoExternal],
  dts: true,
  outDir: "dist",
  format: ["esm", "cjs"],
  legacyOutput: true,
  env: {
    STACK_COMPILE_TIME_CLIENT_PACKAGE_VERSION: `js ${packageJson.name}@${packageJson.version}`,
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
              file.contents = new TextEncoder().encode(`"use client";\n${file.text}`);
            }
          }
        });

        build.onResolve({ filter: /^.*$/m }, async (args) => {
          if (args.kind === "entry-point" || customNoExternal.has(args.path)) {
            return undefined;
          }
          return {
            external: true,
          };
        });
      },
    },
  ],
};

export default defineConfig(config);
