import { defineConfig, devices } from '@playwright/test';

// The PoC runs in the three engines REQ-617 names; the pixel gate stays on Chromium alone.
export default defineConfig({
  testDir: './test',
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4317', deviceScaleFactor: 1 },
  webServer: { command: 'pnpm exec vite preview --port 4317 --strictPort', port: 4317, reuseExistingServer: false },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], deviceScaleFactor: 1 } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], deviceScaleFactor: 1 } },
  ],
});
