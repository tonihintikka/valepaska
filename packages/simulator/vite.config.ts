import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@valepaska/core', '@valepaska/bots', 'commander'],
      output: {
        banner: (chunk) => {
          if (chunk.name === 'cli') {
            return '#!/usr/bin/env node';
          }
          return '';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@valepaska/core': resolve(__dirname, '../core/src/index.ts'),
      '@valepaska/bots': resolve(__dirname, '../bots/src/index.ts'),
    },
  },
});



