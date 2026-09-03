import { describe, expect, it } from 'vitest'
import { parseTreeWritePayload, SLUG_PATTERN, WRITABLE_TREE_COLUMNS } from '~/server/utils/tree-payload'

/** A body shaped exactly like the one pages/admin/listings/create.vue posts. */
function createBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Windswept Juniper',
    slug: 'windswept-juniper',
    species: 'Juniperus procumbens',
    description: 'A mature specimen with dramatic deadwood.',
    short_description: 'Dramatic deadwood.',
    tree_type: 'juniper',
    care_level: 'advanced',
    size: 'medium',
    age: 20,
    height: '14"',
    pot_type: 'Unglazed Tokoname',
    price: 850,
    thumbnail: 'https://example.test/thumb.jpg',
    images: ['https://example.test/a.jpg'],
    model_3d_url: null,
    features: ['deadwood'],
    in_stock: true,
    featured: false,
    ...overrides,
  }
}

function expectOk(result: ReturnType<typeof parseTreeWritePayload>) {
  if (!result.ok)
    throw new Error(`expected payload to be valid, got field=${result.field} error=${result.error}`)
  return result.row
}

describe('parseTreeWritePayload — create', () => {
  it('accepts the body the create form actually posts', () => {
    const row = expectOk(parseTreeWritePayload(createBody(), 'create'))

    expect(row.name).toBe('Windswept Juniper')
    expect(row.slug).toBe('windswept-juniper')
    expect(row.price).toBe(850)
    expect(row.in_stock).toBe(true)
  })

  // The whole point of the allowlist: an authenticated admin must not be able
  // to overwrite identity or audit columns by adding them to the JSON body.
  it('drops id, created_at and updated_at', () => {
    const row = expectOk(parseTreeWritePayload(createBody({
      id: 'attacker-chosen-id',
      created_at: '1999-01-01T00:00:00.000Z',
      updated_at: '1999-01-01T00:00:00.000Z',
    }), 'create'))

    expect(row).not.toHaveProperty('id')
    expect(row).not.toHaveProperty('created_at')
    expect(row).not.toHaveProperty('updated_at')
  })

  it('drops any column outside the allowlist', () => {
    const row = expectOk(parseTreeWritePayload(createBody({
      is_admin: true,
      arbitrary_column: 'nope',
    }), 'create'))

    expect(Object.keys(row).every(key => (WRITABLE_TREE_COLUMNS as readonly string[]).includes(key))).toBe(true)
  })

  it('rejects a missing required field', () => {
    for (const field of ['name', 'species', 'description', 'short_description', 'slug']) {
      const body = createBody()
      delete (body as Record<string, unknown>)[field]

      const result = parseTreeWritePayload(body, 'create')
      expect(result.ok, field).toBe(false)
      expect(result.ok ? null : result.field, field).toBe(field)
    }
  })

  it('rejects an empty or whitespace-only name', () => {
    expect(parseTreeWritePayload(createBody({ name: '   ' }), 'create').ok).toBe(false)
  })

  it('trims free text', () => {
    const row = expectOk(parseTreeWritePayload(createBody({ name: '  Pine  ' }), 'create'))
    expect(row.name).toBe('Pine')
  })

  it('rejects a malformed slug', () => {
    for (const slug of ['Windswept Juniper', 'trailing-', '-leading', 'UPPER', 'has_underscore', ''])
      expect(parseTreeWritePayload(createBody({ slug }), 'create').ok, slug).toBe(false)
  })

  it('accepts a well-formed slug', () => {
    expect(SLUG_PATTERN.test('windswept-juniper-7')).toBe(true)
    expect(parseTreeWritePayload(createBody({ slug: 'windswept-juniper-7' }), 'create').ok).toBe(true)
  })

  it('rejects an enum value outside the union', () => {
    expect(parseTreeWritePayload(createBody({ tree_type: 'oak' }), 'create').ok).toBe(false)
    expect(parseTreeWritePayload(createBody({ care_level: 'novice' }), 'create').ok).toBe(false)
    expect(parseTreeWritePayload(createBody({ size: 'gigantic' }), 'create').ok).toBe(false)
  })

  it('rejects a negative or non-numeric price', () => {
    expect(parseTreeWritePayload(createBody({ price: -1 }), 'create').ok).toBe(false)
    expect(parseTreeWritePayload(createBody({ price: 'free' }), 'create').ok).toBe(false)
    expect(parseTreeWritePayload(createBody({ price: Number.NaN }), 'create').ok).toBe(false)
  })

  it('accepts a zero price', () => {
    expect(expectOk(parseTreeWritePayload(createBody({ price: 0 }), 'create')).price).toBe(0)
  })

  it('rejects a fractional or negative age', () => {
    expect(parseTreeWritePayload(createBody({ age: 2.5 }), 'create').ok).toBe(false)
    expect(parseTreeWritePayload(createBody({ age: -1 }), 'create').ok).toBe(false)
  })

  it('rejects a non-boolean in_stock', () => {
    expect(parseTreeWritePayload(createBody({ in_stock: 'true' }), 'create').ok).toBe(false)
    expect(parseTreeWritePayload(createBody({ featured: 1 }), 'create').ok).toBe(false)
  })

  it('rejects a non-array images value', () => {
    expect(parseTreeWritePayload(createBody({ images: 'a.jpg' }), 'create').ok).toBe(false)
  })

  it('rejects an array containing a non-string', () => {
    expect(parseTreeWritePayload(createBody({ features: ['ok', 5] }), 'create').ok).toBe(false)
  })

  it('drops empty strings from lists, matching what the form filters', () => {
    const row = expectOk(parseTreeWritePayload(createBody({ features: ['jin', '', '  '] }), 'create'))
    expect(row.features).toEqual(['jin'])
  })

  it('normalises an absent list to an empty array', () => {
    const body = createBody()
    delete (body as Record<string, unknown>).images

    expect(expectOk(parseTreeWritePayload(body, 'create')).images).toEqual([])
  })

  it('accepts blank optional text, which the form allows', () => {
    const row = expectOk(parseTreeWritePayload(createBody({ height: '', pot_type: '' }), 'create'))
    expect(row.height).toBe('')
    expect(row.pot_type).toBe('')
  })

  it('keeps a null model_3d_url', () => {
    expect(expectOk(parseTreeWritePayload(createBody(), 'create')).model_3d_url).toBeNull()
  })

  it('keeps a supplied model_3d_url', () => {
    const row = expectOk(parseTreeWritePayload(
      createBody({ model_3d_url: 'https://example.test/model.glb' }),
      'create',
    ))
    expect(row.model_3d_url).toBe('https://example.test/model.glb')
  })

  it('rejects a non-object body', () => {
    for (const body of [null, undefined, 'string', 42, []])
      expect(parseTreeWritePayload(body, 'create').ok).toBe(false)
  })

  it('rejects over-long text rather than truncating it', () => {
    expect(parseTreeWritePayload(createBody({ name: 'a'.repeat(201) }), 'create').ok).toBe(false)
  })
})

describe('parseTreeWritePayload — update', () => {
  it('accepts a partial body and writes only what was supplied', () => {
    const row = expectOk(parseTreeWritePayload({ name: 'Renamed' }, 'update'))

    expect(row).toEqual({ name: 'Renamed' })
  })

  it('accepts the body the edit form posts', () => {
    const body = createBody()
    // The edit form deliberately does not resend the slug.
    delete (body as Record<string, unknown>).slug

    const row = expectOk(parseTreeWritePayload(body, 'update'))
    expect(row).not.toHaveProperty('slug')
    expect(row.name).toBe('Windswept Juniper')
  })

  // The edit form sends Number.parseFloat('') as NaN, which serialises to null.
  // Writing that null over a NOT NULL column used to fail at the database.
  it('omits a null price or age instead of writing null', () => {
    const row = expectOk(parseTreeWritePayload({ name: 'Kept', price: null, age: null }, 'update'))

    expect(row).not.toHaveProperty('price')
    expect(row).not.toHaveProperty('age')
    expect(row.name).toBe('Kept')
  })

  it('still validates any field that is supplied', () => {
    expect(parseTreeWritePayload({ tree_type: 'oak' }, 'update').ok).toBe(false)
    expect(parseTreeWritePayload({ price: -5 }, 'update').ok).toBe(false)
    expect(parseTreeWritePayload({ name: '' }, 'update').ok).toBe(false)
  })

  it('still drops non-allowlisted columns', () => {
    const row = expectOk(parseTreeWritePayload({ name: 'Kept', id: 'nope' }, 'update'))

    expect(row).toEqual({ name: 'Kept' })
  })

  it('allows an explicit null model_3d_url to clear the viewer', () => {
    const row = expectOk(parseTreeWritePayload({ model_3d_url: null }, 'update'))

    expect(row).toEqual({ model_3d_url: null })
  })

  it('rejects a body with nothing writable in it', () => {
    const result = parseTreeWritePayload({ id: 'nope', created_at: 'x' }, 'update')

    expect(result.ok).toBe(false)
    expect(result.ok ? null : result.error).toBe('empty_update')
  })

  it('accepts a slug when one is supplied', () => {
    expect(expectOk(parseTreeWritePayload({ slug: 'new-slug' }, 'update')).slug).toBe('new-slug')
  })

  it('rejects a malformed slug on update too', () => {
    expect(parseTreeWritePayload({ slug: 'Not A Slug' }, 'update').ok).toBe(false)
  })
})
