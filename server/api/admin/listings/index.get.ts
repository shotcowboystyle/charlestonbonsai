import type { Tree } from '~/types'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event): Promise<Tree[]> => {
  requireAdmin(event)

  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin listings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch listings',
    })
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    species: item.species,
    treeType: item.tree_type,
    price: item.price,
    description: item.description,
    shortDescription: item.short_description,
    careLevel: item.care_level,
    size: item.size,
    age: item.age,
    height: item.height,
    potType: item.pot_type,
    images: item.images,
    thumbnail: item.thumbnail,
    model3dUrl: item.model_3d_url,
    features: item.features,
    inStock: item.in_stock,
    featured: item.featured,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
})
