import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
  external: ['zod'],
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  esbuildOptions: (options) => {
    options.banner = {
      js: `/**
 * mastra-af-letta
 * Letta .af (Agent File) format support for Mastra
 * @license MIT
 */`,
    };
  },
});