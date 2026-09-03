import { describe, expect, it } from 'vitest'
import {
  mapAdminTreeRow,
  mapAdminTreeRows,
  mapPublicTreeRow,
  mapPublicTreeRows,
} from '~/server/utils/mappers'
import { makeTreeRow, treeRow } from '../fixtures/trees'
import { expectDefined } from '../utils/expect-defined'

describe('mapPublicTreeRow', () => {
  it('converts every snake_case column to its camelCase field', () => {
    expect(mapPublicTreeRow(treeRow)).toEqual({
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
    })
  })

  // The load-bearing invariant of the whole public API surface. `PublicTree =
  // Omit<Tree, 'price'>` compiles away, so this mapper is the only runtime
  // guarantee that pricing never reaches a consumer surface.
  it('never emits price, even though the row carries it', () => {
    const mapped = mapPublicTreeRow(treeRow)

    expect(mapped).not.toHaveProperty('price')
    expect(Object.keys(mapped)).not.toContain('price')
    expect(JSON.stringify(mapped)).not.toContain('850')
  })

  it('leaks no other snake_case key', () => {
    const keys = Object.keys(mapPublicTreeRow(treeRow))
    expect(keys.filter(key => key.includes('_'))).toEqual([])
  })

  it('normalises a null model_3d_url to undefined so the key drops from JSON', () => {
    const mapped = mapPublicTreeRow(makeTreeRow({ model_3d_url: null }))

    expect(mapped.model3dUrl).toBeUndefined()
    expect(JSON.parse(JSON.stringify(mapped))).not.toHaveProperty('model3dUrl')
  })

  it('preserves a present model_3d_url', () => {
    expect(mapPublicTreeRow(treeRow).model3dUrl).toBe('https://example.test/model.glb')
  })

  it('does not alias array fields to the source row', () => {
    const row = makeTreeRow()
    const mapped = mapPublicTreeRow(row)
    // Documents current behaviour: arrays are passed by reference, so callers
    // must not mutate `images`/`features` in place.
    expect(mapped.images).toBe(row.images)
  })
})

describe('mapAdminTreeRow', () => {
  it('includes price alongside every public field', () => {
    const admin = mapAdminTreeRow(treeRow)

    expect(admin.price).toBe(850)
    expect(admin).toMatchObject(mapPublicTreeRow(treeRow))
  })

  it('differs from the public shape by exactly one key', () => {
    const adminKeys = Object.keys(mapAdminTreeRow(treeRow)).sort()
    const publicKeys = Object.keys(mapPublicTreeRow(treeRow)).sort()

    expect(adminKeys.filter(key => !publicKeys.includes(key))).toEqual(['price'])
    expect(publicKeys.filter(key => !adminKeys.includes(key))).toEqual([])
  })

  it('maps a zero price rather than treating it as absent', () => {
    expect(mapAdminTreeRow(makeTreeRow({ price: 0 })).price).toBe(0)
  })
})

describe('row collection mappers', () => {
  it('returns an empty array for null, which is what Supabase sends on no rows', () => {
    expect(mapPublicTreeRows(null)).toEqual([])
    expect(mapAdminTreeRows(null)).toEqual([])
  })

  it('returns an empty array for an empty result set', () => {
    expect(mapPublicTreeRows([])).toEqual([])
  })

  it('maps each row and preserves order', () => {
    const rows = [
      makeTreeRow({ id: 'a', name: 'First' }),
      makeTreeRow({ id: 'b', name: 'Second' }),
    ]
    const mapped = mapPublicTreeRows(rows)

    expect(mapped).toHaveLength(2)
    expect(expectDefined(mapped[0], 'first tree').name).toBe('First')
    expect(expectDefined(mapped[1], 'second tree').name).toBe('Second')
  })

  it('strips price from every row in a collection', () => {
    const mapped = mapPublicTreeRows([makeTreeRow(), makeTreeRow({ id: 'b' })])
    expect(mapped.every(tree => !('price' in tree))).toBe(true)
  })
})
