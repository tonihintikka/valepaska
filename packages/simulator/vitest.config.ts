import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@valepaska/core': resolve(__dirname, '../core/src/index.ts'),
      '@valepaska/bots': resolve(__dirname, '../bots/src/index.ts'),
    },
  },
});

