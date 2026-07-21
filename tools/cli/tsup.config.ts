import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Bundle the workspace packages whose entry points are TypeScript source.
  noExternal: [/@mobills\/convex/, /@mobills\/integration-splitwise/],
});
