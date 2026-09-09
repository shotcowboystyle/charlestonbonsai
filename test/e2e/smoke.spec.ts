import { expect, test } from '@playwright/test'

/**
 * Route-level smoke coverage.
 *
 * These pages are prerendered or render without catalogue data, so they assert
 * only on chrome and shell — not on specimen content, which the E2E build
 * cannot reach (Supabase points at a dead port).
 */
const PUBLIC_ROUTES = ['/', '/visit', '/events', '/retreats', '/privacy-policy', '/terms-of-service']

test.describe('public routes', () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} renders without a server or client error`, async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error')
          consoleErrors.push(message.text())
      })
      const pageErrors: string[] = []
      page.on('pageerror', error => pageErrors.push(error.message))

      const response = await page.goto(path)

      expect(response?.status(), `${path} status`).toBeLessThan(400)
      await expect(page).toHaveTitle(/\S/)
      await expect(page.locator('body')).toBeVisible()
      expect(pageErrors, `${path} uncaught errors`).toEqual([])
      expect(consoleErrors, `${path} console errors`).toEqual([])
    })
  }
})

// Landmarks, not markup. The home page carries its own chrome rather than the
// shared layout — its banner is the specimen index and its contentinfo is the
// inquiry plate — so asserting a specific nav's aria-label would pin this test
// to one page's implementation. What has to hold on every public page is that
// a screen-reader user can reach the banner, the main region and the footer.
test('the home page exposes its landmarks', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible()
})

// A page with no route out of it is a dead end. Which element carries the link
// is a design decision; that one exists is not.
test('the home page offers a route to the catalog', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('a[href="/gallery"]').first()).toBeVisible()
})

// Regression guard: an HTML 404 used to render as a 500 because serialising the
// error page's SSR payload threw. A soft-404 is invisible to users but poisons
// search indexing, so assert the status code, not just the page content.
test('an unknown route returns a 404, not a 500', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist')

  expect(response?.status()).toBe(404)
})

test('the catalog link navigates to the gallery', async ({ page }) => {
  await page.goto('/')

  await page.locator('a[href="/gallery"]').first().click()

  await expect(page).toHaveURL(/\/gallery/)
})

// The theme is bootstrapped by a synchronous inline script in nuxt.config.ts.
// If that script ever throws, the page renders unthemed — which is invisible to
// unit tests but obvious here.
test('the theme bootstrap sets a theme on the document', async ({ page }) => {
  await page.goto('/')

  const theme = await page.locator('html').getAttribute('data-theme')
  expect(theme).toMatch(/^(?:light|dark)$/)
})
