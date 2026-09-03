import { createServiceClient } from '~/server/utils/supabase'
import { parseTreeWritePayload } from '~/server/utils/tree-payload'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Listing ID is required',
    })
  }

  const body = await readBody(event).catch(() => null)

  // Partial update: only the columns actually supplied are written, and each
  // one must validate. The raw body never reaches the table.
  const parsed = parseTreeWritePayload(body, 'update')
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
    .update(parsed.row)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Listing not found',
      })
    }
    console.error('Error updating listing:', error)
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'A listing with that slug already exists',
        data: { field: 'slug', error: 'duplicate' },
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update listing',
    })
  }

  return { success: true, listing: data }
})
