import type { TreeRow } from '~/server/utils/mappers'

/**
 * A complete `trees` row, exactly as Supabase returns it.
 *
 * Every field is populated and distinguishable, so a mapper test can catch a
 * field being dropped, duplicated, or wired to the wrong source column.
 */
export const treeRow: TreeRow = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Windswept Juniper',
  slug: 'windswept-juniper',
  species: 'Juniperus procumbens',
  tree_type: 'juniper',
  price: 850,
  description: 'A mature specimen with dramatic deadwood.',
  short_description: 'Dramatic deadwood, 20 years in training.',
  care_level: 'advanced',
  size: 'medium',
  age: 20,
  height: '14"',
  pot_type: 'Unglazed Tokoname',
  images: ['https://example.test/a.jpg', 'https://example.test/b.jpg'],
  thumbnail: 'https://example.test/thumb.jpg',
  model_3d_url: 'https://example.test/model.glb',
  features: ['deadwood', 'jin', 'shari'],
  in_stock: true,
  featured: true,
  created_at: '2026-01-15T10:00:00.000Z',
  updated_at: '2026-02-01T12:30:00.000Z',
}

export function makeTreeRow(overrides: Partial<TreeRow> = {}): TreeRow {
  return { ...treeRow, ...overrides }
}

/** Camel-cased public shape, as the API returns it to the browser. */
export const publicTree = {
  id: treeRow.id,
  name: treeRow.name,
  slug: treeRow.slug,
  species: treeRow.species,
  treeType: 'juniper',
  description: treeRow.description,
  shortDescription: treeRow.short_description,
  careLevel: 'advanced',
  size: 'medium',
  age: treeRow.age,
  height: treeRow.height,
  potType: treeRow.pot_type,
  images: treeRow.images,
  thumbnail: treeRow.thumbnail,
  model3dUrl: treeRow.model_3d_url,
  features: treeRow.features,
  inStock: treeRow.in_stock,
  featured: treeRow.featured,
  createdAt: treeRow.created_at,
  updatedAt: treeRow.updated_at,
}
