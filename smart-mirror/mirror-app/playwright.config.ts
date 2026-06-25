import { defineConfig } from '@playwright/test'

// Les specs e2e pilotent une instance Electron deja lancee via CDP (REMOTE_DEBUG=1, port 9222)
// ou la VM Debian. Cette config rend `npx playwright test` executable et versionnable (gap comble).
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  }
})
