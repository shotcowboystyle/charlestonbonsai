import type { Page } from '@playwright/test'

/**
 * Public tree payloads as /api/trees/* returns them: camelCase, never priced.
 */
export const e2eTrees = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Windswept Juniper',
    slug: 'windswept-juniper',
    species: 'Juniperus procumbens',
    treeType: 'juniper',
    description: 'A mature specimen with dramatic deadwood.',
    shortDescription: 'Dramatic deadwood, 20 years in training.',
    careLevel: 'advanced',
    size: 'medium',
    age: 20,
    height: '14"',
    potType: 'Unglazed Tokoname',
    images: ['/images/trees/placeholder-thumb.svg'],
    thumbnail: '/images/trees/placeholder-thumb.svg',
    features: ['deadwood', 'jin'],
    inStock: true,
    featured: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-01T12:30:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Trident Maple Forest',
    slug: 'trident-maple-forest',
    species: 'Acer buergerianum',
    treeType: 'maple',
    description: 'A seven-tree forest planting.',
    shortDescription: 'Seven-tree forest planting.',
    careLevel: 'intermediate',
    size: 'large',
    age: 12,
    height: '20"',
    potType: 'Slate slab',
    images: ['/images/trees/placeholder-thumb.svg'],
    thumbnail: '/images/trees/placeholder-thumb.svg',
    features: ['forest'],
    inStock: true,
    featured: false,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-20T12:30:00.000Z',
  },
]

/**
 * Serve the tree list from a fixture.
 *
 * The E2E build points Supabase at a dead port, so without this the gallery
 * would render its error state. Install it before `page.goto`.
 */
export async function stubTreeList(page: Page, trees = e2eTrees) {
  await page.route('**/api/trees/list*', async (route) => {
    await route.fulfill({
      json: {
        trees,
        total: trees.length,
        page: 1,
        pageSize: 12,
        hasMore: false,
      },
    })
  })
}
