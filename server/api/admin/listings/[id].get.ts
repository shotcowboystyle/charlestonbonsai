import type { Tree } from '~/types'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event): Promise<Tree> => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing tree id',
    })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tree not found',
      })
    }
    console.error('Error fetching admin listing:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch listing',
    })
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    species: data.species,
    treeType: data.tree_type,
    price: data.price,
    description: data.description,
    shortDescription: data.short_description,
    careLevel: data.care_level,
    size: data.size,
    age: data.age,
    height: data.height,
    potType: data.pot_type,
    images: data.images,
    thumbnail: data.thumbnail,
    model3dUrl: data.model_3d_url,
    features: data.features,
    inStock: data.in_stock,
    featured: data.featured,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
})
