import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@taleorience/domain': path.resolve(dirname, '../domain/src'),
      '@taleorience/application': path.resolve(dirname, '../application/src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});