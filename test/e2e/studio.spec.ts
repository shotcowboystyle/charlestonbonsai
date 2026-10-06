import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * Bonsai Studio end to end. The page is driven through its own automation
 * hooks (`window.__studio`), the same entry points the chrome uses.
 */

// One studio at a time: CI browsers rasterise WebGL in software.
test.describe.configure({ mode: 'default' })
test.setTimeout(120_000)

async function open(page: Page, query = ''): Promise<string[]> {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error')
      errors.push(m.text())
  })
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(`/studio${query}`)
  await page.waitForFunction(() => typeof window.__studio === 'object', null, { timeout: 90_000 })
  return errors
}

test('the studio loads a visible canvas with no console errors', async ({ page }) => {
  const errors = await open(page)
  const canvas = page.locator('canvas.st__canvas')
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  expect(box?.width).toBeGreaterThan(300)
  expect(box?.height).toBeGreaterThan(300)
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('every selector cycles through its control and mirrors its value', async ({ page }) => {
  // Each click rebuilds a tree or a landscape; software WebGL compiles every shader afresh.
  test.setTimeout(360_000)
  await open(page)
  for (const key of ['style', 'tree', 'size', 'scene', 'atmo']) {
    const button = page.locator(`.st-sel[data-key="${key}"] .st-sel__cycle`)
    const before = await button.getAttribute('aria-label')
    await button.click()
    await expect(button).not.toHaveAttribute('aria-label', before ?? '')
  }
  await expect(page).toHaveURL(/style=shakan/)
  await expect(page).toHaveURL(/atmo=yuki/)
})

test('a deep link selects the tree and setting', async ({ page }) => {
  await open(page, '?style=kengai&tree=juniper&size=chumono&scene=koi-pond&atmo=tsukiyo')
  await expect(page.locator('.st-sel[data-key="style"] .st-sel__cycle')).toHaveAttribute('aria-label', /Kengai/)
  await expect(page.locator('.st-sel[data-key="atmo"] .st-sel__cycle')).toHaveAttribute('aria-label', /Yellow moon/)
})

test('seeking through the hook updates the timeline readout', async ({ page }) => {
  await open(page)
  const slider = page.getByRole('slider', { name: 'Growth' })
  await page.evaluate(() => window.__studio?.seek(0.5))
  await expect(slider).toHaveAttribute('aria-valuenow', '50')
  await expect(page.locator('.st-tl__clock')).toContainText('0:04.00')
  await page.evaluate(() => window.__studio?.seek(1))
  await expect(slider).toHaveAttribute('aria-valuenow', '100')
  await expect(page.locator('.st-tl__clock')).toContainText('0:08.00')
})

test('the slider responds to the keyboard', async ({ page }) => {
  await open(page)
  const slider = page.getByRole('slider', { name: 'Growth' })
  await slider.focus()
  await page.keyboard.press('End')
  await expect(slider).toHaveAttribute('aria-valuenow', '100')
  await page.keyboard.press('Home')
  await expect(slider).toHaveAttribute('aria-valuenow', '0')
})

test('reduced motion starts at the completed tree, paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  const slider = page.getByRole('slider', { name: 'Growth' })
  await expect(slider).toHaveAttribute('aria-valuenow', '100')
  const state = await page.evaluate(() => window.__studio?.state())
  expect(state?.playing).toBe(false)
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
})

test('the phone layout shows the selector strip and keeps every control reachable', async ({ page }) => {
  test.setTimeout(360_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page)
  const strip = page.locator('.st-selectors')
  await expect(strip).toBeVisible()
  const stripBox = await strip.boundingBox()
  expect(stripBox!.y).toBeGreaterThan(844 / 2)
  for (const key of ['style', 'tree', 'size', 'scene', 'atmo']) {
    const button = page.locator(`.st-sel[data-key="${key}"] .st-sel__cycle`)
    await button.scrollIntoViewIfNeeded()
    const b = await button.boundingBox()
    expect(b!.height).toBeGreaterThanOrEqual(44)
    expect(b!.x).toBeGreaterThanOrEqual(0)
    // Sub-pixel layout: allow the last control to sit flush with the edge.
    expect(b!.x + b!.width).toBeLessThanOrEqual(391)
    await button.click()
  }
  for (const name of ['Pause', 'Grow again from soil']) {
    const b = await page.getByRole('button', { name }).or(page.getByRole('button', { name: 'Play' })).first().boundingBox()
    expect(b!.height).toBeGreaterThanOrEqual(44)
  }
})
