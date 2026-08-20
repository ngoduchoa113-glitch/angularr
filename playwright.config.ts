import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: __dirname,
    },
    {
      command: 'npm run start:dev',
      url: 'http://localhost:3000/recipes',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: path.resolve(__dirname, '../hoc_nestjs'),
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
