import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config (T8).
 *
 * Scope (plan "E2E (Playwright)"): landing renders ES+EN, nav, CTAs, /enterprise,
 * the contact happy/error paths, and the signup entry point. a11y (axe) specs
 * live alongside under `tests/e2e/` and reuse this config.
 *
 * Running locally / in CI:
 *   bun run test:e2e
 * The `webServer` block below builds and starts the real app first, so the specs
 * exercise the production (force-static marketing + dynamic app) build — not dev
 * mode. The flows that touch Privy auth or the DB (full signup create, real lead
 * insert) need live credentials; those specs are tagged `@needs-creds` and are
 * skipped automatically when the env is absent (see tests/e2e/_env.ts), so the
 * server-rendered surface (landing/enterprise/i18n/a11y/contact-validation) stays
 * runnable without secrets.
 *
 * NOTE: this file is scaffolded by T8 but NOT executed here — per the build
 * protocol, later-wave agents do not start a dev/prod server. Run it in an env
 * that has a built app (+ creds for the tagged flows).
 */
const PORT = Number(process.env.E2E_PORT ?? 3100)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Build + serve the real app. Skipped if E2E_BASE_URL already points at a
  // running deployment (e.g. a Vercel preview), so CI can run against previews.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'bun run build && bun run start --port ' + PORT,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
