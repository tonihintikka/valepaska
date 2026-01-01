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
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ValepaskaBots',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@valepaska/core'],
    },
  },
  resolve: {
    alias: {
      '@valepaska/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});




