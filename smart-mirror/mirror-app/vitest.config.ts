import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__mocks__/test-setup.ts'],
    include: ['src/main/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/main/services/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/__mocks__/**']
    }
  },
  resolve: {
    alias: {
      'electron-store': resolve(__dirname, 'src/__mocks__/electron-store.ts'),
      'electron-updater': resolve(__dirname, 'src/__mocks__/electron-updater.ts'),
      electron: resolve(__dirname, 'src/__mocks__/electron.ts')
    }
  }
})
