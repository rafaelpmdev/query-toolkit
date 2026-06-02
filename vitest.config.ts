import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/*.config.*',
        '**/index.ts',           // Ignora todos os index.ts
        '**/index.js',           // Ignora todos os index.js
        '**/*.test.ts',          // Ignora arquivos de teste
        '**/*.spec.ts',          // Ignora arquivos de spec
        '**/*.d.ts',             // Ignora arquivos de declaração
      ],
    },
  },
});
