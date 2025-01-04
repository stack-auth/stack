import { defineConfig, Options } from 'tsup';
import packageJson from './package.json';

const customNoExternal = new Set([
  "oauth4webapi",
]);

const config: Options = {
  entryPoints: ['src/**/*.(ts|tsx|js|jsx)'],
  sourcemap: true,
  clean: false,
  noExternal: [...customNoExternal],
  dts: true,
  outDir: 'dist',
  format: ['esm', 'cjs'],
  legacyOutput: true,
  env: {
    STACK_COMPILE_TIME_CLIENT_PACKAGE_VERSION: `js ${packageJson.name}@${packageJson.version}`,
  },
  esbuildPlugins: [
    {
      name: 'durables tsup plugin (private)',
      setup(build) {
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
