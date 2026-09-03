import { asString } from '~/server/utils/validators'
import { isCareLevel, isTreeSize, isTreeType } from '~/types'

/**
 * Validation and field allowlisting for admin listing writes.
 *
 * The create and update handlers previously passed `readBody()` straight to
 * Supabase, which let any authenticated admin write arbitrary columns —
 * including `id`, `created_at` and `updated_at` — and store malformed enum
 * values that the public type guards would later reject at render time.
 *
 * Everything here works on the snake_case column names the admin forms post.
 */

/** Every column an admin is allowed to write. Nothing else reaches the table. */
export const WRITABLE_TREE_COLUMNS = [
  'name',
  'slug',
  'species',
  'description',
  'short_description',
  'tree_type',
  'care_level',
  'size',
  'age',
  'height',
  'pot_type',
  'price',
  'thumbnail',
  'images',
  'model_3d_url',
  'features',
  'in_stock',
  'featured',
] as const

export type WritableTreeColumn = typeof WRITABLE_TREE_COLUMNS[number]

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const MAX_NAME = 200
const MAX_SPECIES = 200
const MAX_SLUG = 200
const MAX_SHORT_DESCRIPTION = 500
const MAX_DESCRIPTION = 20_000
const MAX_SHORT_TEXT = 120
const MAX_URL = 2048
const MAX_AGE = 1000
const MAX_PRICE = 1_000_000
const MAX_LIST_ITEMS = 50

export type TreePayloadResult
  = | { ok: true, row: Record<string, unknown> }
    | { ok: false, field: WritableTreeColumn, error: string }

function invalid(field: WritableTreeColumn, error = 'invalid'): TreePayloadResult {
  return { ok: false, field, error }
}

/** An optional free-text column: absent or empty both mean "leave it blank". */
function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null)
    return undefined
  if (typeof value !== 'string')
    return null
  const trimmed = value.trim()
  return trimmed.length > max ? null : trimmed
}

function asStringArray(value: unknown, max: number): string[] | null {
  if (!Array.isArray(value))
    return null
  if (value.length > MAX_LIST_ITEMS)
    return null
  const items: string[] = []
  for (const item of value) {
    if (typeof item !== 'string')
      return null
    const trimmed = item.trim()
    if (trimmed.length === 0)
      continue
    if (trimmed.length > max)
      return null
    items.push(trimmed)
  }
  return items
}

function asFiniteNumber(value: unknown, min: number, max: number): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < min || n > max)
    return null
  return n
}

/**
 * Build a validated, allowlisted row from an admin request body.
 *
 * In `create` mode the columns the forms treat as required must be present. In
 * `update` mode every column is optional, and a column that is absent — or that
 * arrives as `null` because `Number.parseFloat('')` produced NaN in the form —
 * is simply left untouched rather than written as null over a NOT NULL column.
 * `model_3d_url` is the exception: an explicit null clears the model.
 */
export function parseTreeWritePayload(
  body: unknown,
  mode: 'create' | 'update',
): TreePayloadResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    return invalid('name', 'invalid_body')

  const input = body as Record<string, unknown>
  const row: Record<string, unknown> = {}
  const isCreate = mode === 'create'
  const has = (key: WritableTreeColumn) =>
    input[key] !== undefined && input[key] !== null

  // ---- required-on-create text ------------------------------------
  if (isCreate || has('name')) {
    const name = asString(input.name, MAX_NAME)
    if (!name)
      return invalid('name')
    row.name = name
  }

  if (isCreate || has('species')) {
    const species = asString(input.species, MAX_SPECIES)
    if (!species)
      return invalid('species')
    row.species = species
  }

  if (isCreate || has('description')) {
    const description = asString(input.description, MAX_DESCRIPTION)
    if (!description)
      return invalid('description')
    row.description = description
  }

  if (isCreate || has('short_description')) {
    const shortDescription = asString(input.short_description, MAX_SHORT_DESCRIPTION)
    if (!shortDescription)
      return invalid('short_description')
    row.short_description = shortDescription
  }

  // ---- slug ---------------------------------------------------------
  // Required on create; on update it is optional, because the edit form
  // deliberately keeps the original URL when a specimen is renamed.
  if (isCreate || has('slug')) {
    const slug = asString(input.slug, MAX_SLUG)
    if (!slug || !SLUG_PATTERN.test(slug))
      return invalid('slug')
    row.slug = slug
  }

  // ---- enums --------------------------------------------------------
  if (isCreate || has('tree_type')) {
    const treeType = asString(input.tree_type, 40)
    if (!treeType || !isTreeType(treeType))
      return invalid('tree_type')
    row.tree_type = treeType
  }

  if (isCreate || has('care_level')) {
    const careLevel = asString(input.care_level, 40)
    if (!careLevel || !isCareLevel(careLevel))
      return invalid('care_level')
    row.care_level = careLevel
  }

  if (isCreate || has('size')) {
    const size = asString(input.size, 40)
    if (!size || !isTreeSize(size))
      return invalid('size')
    row.size = size
  }

  // ---- numbers ------------------------------------------------------
  if (isCreate || has('age')) {
    const age = asFiniteNumber(input.age, 0, MAX_AGE)
    if (age === null || !Number.isInteger(age))
      return invalid('age')
    row.age = age
  }

  if (isCreate || has('price')) {
    const price = asFiniteNumber(input.price, 0, MAX_PRICE)
    if (price === null)
      return invalid('price')
    row.price = price
  }

  // ---- optional text ------------------------------------------------
  for (const [key, max] of [
    ['height', MAX_SHORT_TEXT],
    ['pot_type', MAX_SHORT_TEXT],
    ['thumbnail', MAX_URL],
  ] as [WritableTreeColumn, number][]) {
    if (!isCreate && input[key] === undefined)
      continue
    const value = optionalText(input[key], max)
    if (value === null)
      return invalid(key)
    row[key] = value ?? ''
  }

  // A null model_3d_url is meaningful: it clears the 3D viewer.
  if (isCreate || input.model_3d_url !== undefined) {
    const raw = input.model_3d_url
    if (raw === null || raw === '') {
      row.model_3d_url = null
    }
    else {
      const url = asString(raw, MAX_URL)
      if (!url)
        return invalid('model_3d_url')
      row.model_3d_url = url
    }
  }

  // ---- lists --------------------------------------------------------
  for (const key of ['images', 'features'] as WritableTreeColumn[]) {
    if (!isCreate && input[key] === undefined)
      continue
    const list = asStringArray(input[key] ?? [], MAX_URL)
    if (list === null)
      return invalid(key)
    row[key] = list
  }

  // ---- booleans -----------------------------------------------------
  for (const key of ['in_stock', 'featured'] as WritableTreeColumn[]) {
    if (!isCreate && input[key] === undefined)
      continue
    const value = input[key]
    if (typeof value !== 'boolean')
      return invalid(key)
    row[key] = value
  }

  if (!isCreate && Object.keys(row).length === 0)
    return invalid('name', 'empty_update')

  return { ok: true, row }
}
