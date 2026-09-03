import { createServiceClient } from '~/server/utils/supabase'
import { parseTreeWritePayload } from '~/server/utils/tree-payload'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody(event).catch(() => null)

  // Validate and allowlist before the row reaches the table: the raw body must
  // never be able to set id/created_at/updated_at or store a malformed enum.
  const parsed = parseTreeWritePayload(body, 'create')
  if (!parsed.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid listing field: ${parsed.field}`,
      data: { field: parsed.field, error: parsed.error },
    })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('trees')
    .insert(parsed.row)
    .select()
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    // A duplicate slug is the caller's problem, not a server fault.
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'A listing with that slug already exists',
        data: { field: 'slug', error: 'duplicate' },
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create listing',
    })
  }

  return { success: true, listing: data }
})
