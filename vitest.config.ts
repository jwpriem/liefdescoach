import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts', 'plugins/**/*.test.ts', 'stores/**/*.test.ts'],
    setupFiles: ['server/test-setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
