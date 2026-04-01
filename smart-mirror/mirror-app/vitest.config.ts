import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/main/**/*.test.ts']
  },
  resolve: {
    alias: {
      'electron-store': resolve(__dirname, 'src/__mocks__/electron-store.ts'),
      'electron-updater': resolve(__dirname, 'src/__mocks__/electron-updater.ts'),
      electron: resolve(__dirname, 'src/__mocks__/electron.ts')
    }
  }
})
