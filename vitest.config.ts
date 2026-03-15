import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts', 'plugins/**/*.test.ts', 'stores/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
