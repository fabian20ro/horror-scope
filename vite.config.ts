import { defineConfig } from 'vite';

export default defineConfig({
  base: '/horror-scope/',
  test: {
    include: ['src/**/*.test.ts'],
  },
});
