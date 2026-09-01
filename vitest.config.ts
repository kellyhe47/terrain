import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'eval/run/**/*.test.ts'],
    exclude: ['**/*.live.test.ts', 'node_modules/**'],
    environment: 'node',
    testTimeout: 20000,
  },
});
