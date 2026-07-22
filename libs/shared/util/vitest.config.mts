import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/shared/util',
  test: {
    name: 'util',
    watch: false,
    globals: true,
    environment: 'node',
    // Ainda não há lógica não trivial nesta lib (só um InjectionToken) — ver CLAUDE.md secao 10.
    passWithNoTests: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
