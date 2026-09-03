import { expect, test } from '@playwright/test'

/** Keep the page's own mount-time auth probe from redirecting the test away. */
async function stubUnauthenticated(page: import('@playwright/test').Page) {
  await page.route('**/api/admin/auth/verify', route =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }))
}

test.describe('admin login', () => {
  test.beforeEach(async ({ page }) => {
    await stubUnauthenticated(page)
  })

  test('renders the sign-in form', async ({ page }) => {
    await page.goto('/admin/login')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  // Both fields are marked `required`, so the browser blocks submission before
  // any JavaScript runs. The point of this test is that empty credentials never
  // reach the API, whichever layer stops them.
  test('does not call the API when the form is empty', async ({ page }) => {
    let loginCalled = false
    await page.route('**/api/admin/auth/login', (route) => {
      loginCalled = true
      return route.fulfill({ status: 401, json: { message: 'Invalid credentials' } })
    })

    await page.goto('/admin/login')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('input[type="email"]:invalid')).toHaveCount(1)
    expect(loginCalled).toBe(false)
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('does not call the API when only the email is filled', async ({ page }) => {
    let loginCalled = false
    await page.route('**/api/admin/auth/login', (route) => {
      loginCalled = true
      return route.fulfill({ status: 401, json: {} })
    })

    await page.goto('/admin/login')
    await page.locator('input[type="email"]').fill('admin@example.test')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('input[type="password"]:invalid')).toHaveCount(1)
    expect(loginCalled).toBe(false)
  })

  test('surfaces an error for rejected credentials and stays on the page', async ({ page }) => {
    await page.route('**/api/admin/auth/login', route =>
      route.fulfill({ status: 401, json: { statusMessage: 'Invalid credentials' } }))

    await page.goto('/admin/login')
    await page.locator('input[type="email"]').fill('admin@example.test')
    await page.locator('input[type="password"]').fill('wrong-password')
    await page.locator('button[type="submit"]').click()

    // The store collapses every failure to a generic message; assert the banner
    // appears with some text rather than pinning today's exact wording.
    const banner = page.locator('.text-red-600').first()
    await expect(banner).toBeVisible()
    await expect(banner).not.toBeEmpty()
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('does not leak the password into the rendered page on failure', async ({ page }) => {
    await page.route('**/api/admin/auth/login', route =>
      route.fulfill({ status: 401, json: { statusMessage: 'Invalid credentials' } }))

    await page.goto('/admin/login')
    await page.locator('input[type="email"]').fill('admin@example.test')
    await page.locator('input[type="password"]').fill('hunter2')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('.text-red-600').first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText('hunter2')
  })

  test('redirects to the dashboard on success', async ({ page }) => {
    await page.route('**/api/admin/auth/login', route =>
      route.fulfill({
        json: {
          success: true,
          user: { id: 'admin-1', email: 'admin@example.test' },
          token: 'test-token',
        },
      }))
    await page.route('**/api/admin/listings**', route => route.fulfill({ json: [] }))

    await page.goto('/admin/login')
    await page.locator('input[type="email"]').fill('admin@example.test')
    await page.locator('input[type="password"]').fill('correct-password')
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/admin\/?$/)
  })

  // A password must never reach the URL bar, browser history, or a referrer.
  test('submits credentials in the request body, not the query string', async ({ page }) => {
    const request = page.waitForRequest('**/api/admin/auth/login')
    await page.route('**/api/admin/auth/login', route =>
      route.fulfill({ status: 401, json: { statusMessage: 'Invalid credentials' } }))

    await page.goto('/admin/login')
    await page.locator('input[type="email"]').fill('admin@example.test')
    await page.locator('input[type="password"]').fill('hunter2')
    await page.locator('button[type="submit"]').click()

    const login = await request
    expect(login.method()).toBe('POST')
    expect(login.url()).not.toContain('hunter2')
    expect(login.postDataJSON()).toMatchObject({ email: 'admin@example.test' })
  })
})
