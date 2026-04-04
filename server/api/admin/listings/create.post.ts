import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const config = useRuntimeConfig()
  const body = await readBody(event)

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  const { data, error } = await supabase
    .from('trees')
    .insert(body)
    .select()
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create listing',
    })
  }

  return { success: true, listing: data }
})
