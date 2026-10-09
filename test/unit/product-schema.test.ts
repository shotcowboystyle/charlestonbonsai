import { describe, expect, it } from 'vitest'
import { buildProductSchema } from '~/composables/useSeo'
import { mapPublicTreeRow } from '~/server/utils/mappers'
import { makeTreeRow } from '../fixtures/trees'

describe('buildProductSchema', () => {
  const tree = mapPublicTreeRow(makeTreeRow({ slug: 'old-pine', name: 'Old Pine' }))
  const [product, breadcrumbs] = buildProductSchema(tree, 'https://charlestonbonsaico.com')

  it('emits a Product with absolute url and no offer or price', () => {
    expect(product).toMatchObject({ '@type': 'Product', 'name': 'Old Pine', 'url': 'https://charlestonbonsaico.com/gallery/old-pine' })
    expect(JSON.stringify(product)).not.toMatch(/offers|price/i)
  })

  it('makes site-relative images absolute', () => {
    const local = mapPublicTreeRow(makeTreeRow({ thumbnail: '/images/t.jpg', images: ['https://cdn.test/a.jpg'] }))
    expect(buildProductSchema(local, 'https://charlestonbonsaico.com')[0].image)
      .toEqual(['https://charlestonbonsaico.com/images/t.jpg', 'https://cdn.test/a.jpg'])
  })

  it('emits a Home > Catalog > tree breadcrumb', () => {
    expect(breadcrumbs.itemListElement.map(i => i.name)).toEqual(['Home', 'Catalog', 'Old Pine'])
  })
})
