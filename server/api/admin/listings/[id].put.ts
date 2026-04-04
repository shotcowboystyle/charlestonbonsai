import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Listing ID is required',
    })
  }

  const config = useRuntimeConfig()
  const body = await readBody(event)

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  const { data, error } = await supabase
    .from('trees')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating listing:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update listing',
    })
  }

  return { success: true, listing: data }
})
