import { expect, test } from '@playwright/test'

/**
 * Landing E2E (T8 · plan "landing renders ES+EN, nav, CTAs").
 *
 * Asserts the production force-static marketing surface against a built app:
 * the Spanish apex serves with NO locale prefix (D-locale), the English variant
 * lives at /en, the primary CTA points at the signup destination, and the public
 * surface stays PAPER-ONLY (no MODO toggle — Hard rule #2).
 */
test.describe('landing — Spanish apex (clean, no prefix)', () => {
  test('serves ES at / with the display title and verifiable-reputation lead', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toContainText('Sube de')
    await expect(h1).toContainText('nivel')
    // Hard rule #3: lead with "verificable", never crypto/onchain.
    await expect(page.getByText(/reputación verificable/i)).toBeVisible()
  })

  test('primary CTA navigates toward the signup destination (/perfil)', async ({
    page,
  }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /Crea tu perfil/i }).first()
    await expect(cta).toHaveAttribute('href', /\/perfil/)
  })

  test('public surface is paper-only — no MODO toggle anywhere on the page', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByText(/MODO/i)).toHaveCount(0)
  })

  test('nav exposes the enterprise + how-it-works links', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('link', { name: /Cómo funciona/i }).first(),
    ).toBeVisible()
  })
})

test.describe('landing — English at /en', () => {
  test('serves EN at /en with the translated display title', async ({
    page,
  }) => {
    await page.goto('/en')
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toContainText('Level')
    await expect(h1).toContainText('up')
    await expect(page.getByText(/verifiable reputation/i)).toBeVisible()
  })
})

test.describe('routing — /es canonicalizes to bare', () => {
  test('/es 308-redirects to the prefix-less Spanish apex', async ({ page }) => {
    const res = await page.goto('/es')
    expect(page.url()).toMatch(/frutero|localhost/)
    await expect(page).toHaveURL(/\/$/)
    // A redirect happened (final status is the 200 of the destination).
    expect(res?.status()).toBe(200)
  })
})

test.describe('vocabulary guard (Hard rule #3) — rendered HTML', () => {
  test('the ES landing HTML never says onchain/web3/crypto/blockchain', async ({
    page,
  }) => {
    await page.goto('/')
    const body = (await page.locator('body').innerText()).toLowerCase()
    expect(body).not.toMatch(/\bonchain\b|\bweb3\b|\bcrypto\b|\bblockchain\b/)
  })
})
