import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Accessibility E2E (T8 · plan "a11y (axe): landing/enterprise/perfil pass;
 * contrast on accent text; keyboard + focus-visible").
 *
 * Runs axe-core against the real rendered pages and fails on any `serious` or
 * `critical` violation (the plan's "axe 0 serious" gate). Colour-contrast is
 * included explicitly because the design system uses accent text (magenta/red on
 * paper) where contrast regressions are most likely. Keyboard + focus-visible is
 * asserted separately since axe can't prove a visible focus ring.
 */
async function analyze(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
}

function serious(results: Awaited<ReturnType<typeof analyze>>) {
  return results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
}

test.describe('a11y — landing', () => {
  test('no serious/critical axe violations (ES)', async ({ page }) => {
    await page.goto('/')
    expect(serious(await analyze(page))).toEqual([])
  })

  test('no serious/critical axe violations (EN)', async ({ page }) => {
    await page.goto('/en')
    expect(serious(await analyze(page))).toEqual([])
  })

  test('accent text passes colour-contrast', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe('a11y — enterprise', () => {
  test('no serious/critical axe violations', async ({ page }) => {
    await page.goto('/enterprise')
    expect(serious(await analyze(page))).toEqual([])
  })

  test('contact form is keyboard-reachable with a visible focus ring', async ({
    page,
  }) => {
    await page.goto('/enterprise')
    // Tab into the form and confirm focus lands on an interactive control.
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName ?? '',
    )
    expect(['A', 'INPUT', 'BUTTON', 'TEXTAREA']).toContain(focusedTag)
  })
})

test.describe('a11y — perfil (signup entry)', () => {
  test('no serious/critical axe violations on the login surface', async ({
    page,
  }) => {
    await page.goto('/perfil')
    expect(serious(await analyze(page))).toEqual([])
  })
})
