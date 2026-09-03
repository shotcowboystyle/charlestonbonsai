import { expect, test } from '@playwright/test'
import { e2eTrees, stubTreeList } from './fixtures'

test.describe('gallery catalogue', () => {
  test.beforeEach(async ({ page }) => {
    await stubTreeList(page)
  })

  test('renders a card per specimen returned by the API', async ({ page }) => {
    await page.goto('/gallery')

    await expect(page.locator('.specimen')).toHaveCount(e2eTrees.length)
    await expect(page.getByText('Windswept Juniper')).toBeVisible()
    await expect(page.getByText('Trident Maple Forest')).toBeVisible()
  })

  // Pricing is by inquiry only. This is the end-to-end guard on the invariant
  // the mapper enforces server-side.
  test('never shows a price on a catalogue card', async ({ page }) => {
    await page.goto('/gallery')

    await expect(page.locator('.specimen').first()).toBeVisible()
    await expect(page.getByText('Price on inquiry').first()).toBeVisible()
    expect(await page.locator('.specimen').allInnerTexts()).not.toContain(
      expect.stringMatching(/\$\s*\d/),
    )
  })

  test('links each card to its detail page', async ({ page }) => {
    await page.goto('/gallery')

    const first = page.locator('.specimen').first()
    await expect(first).toHaveAttribute('href', '/gallery/windswept-juniper')
  })

  test('shows the empty state when the catalogue returns nothing', async ({ page }) => {
    await stubTreeList(page, [])

    await page.goto('/gallery')

    await expect(page.locator('.specimen')).toHaveCount(0)
    await expect(page.locator('body')).toContainText(/bench is between specimens|clear the filters/i)
  })

  test('requests the list endpoint on load', async ({ page }) => {
    const request = page.waitForRequest(/\/api\/trees\/list/)

    await page.goto('/gallery')

    expect((await request).url()).toContain('/api/trees/list')
  })
})
