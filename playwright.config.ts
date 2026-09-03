import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './test/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    // `preview` serves .output/server — the same Nitro artifact Vercel runs, and
    // the only mode that exercises nitro.prerender. `nuxt dev` would skip both.
    command: 'pnpm build && pnpm preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      PORT: String(PORT),
      NITRO_PORT: String(PORT),
      // A dead port fails instantly with ECONNREFUSED. Every response the specs
      // assert on is supplied by page.route fixtures, so the suite is hermetic:
      // no live data, no network egress, no dependence on catalogue contents.
      SUPABASE_URL: 'http://127.0.0.1:1',
      SUPABASE_ANON_KEY: 'e2e-anon-key',
      SUPABASE_SERVICE_KEY: 'e2e-service-key',
      // NUXT_PUBLIC_* wins over the runtimeConfig defaults baked into
      // nuxt.config.ts, so a developer's local .env cannot leak real
      // credentials into an E2E run.
      NUXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:1',
      NUXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
      NUXT_PUBLIC_SITE_URL: baseURL,
      JWT_SECRET: 'e2e-jwt-secret',
    },
  },
})
