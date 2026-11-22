import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // Server modules import 'server-only'; it throws outside Next.js, so tests use an empty stub
      'server-only': path.resolve(import.meta.dirname, 'src/test/server-only.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Integration tests start an in-memory MongoDB replica set (first run may download mongod)
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
