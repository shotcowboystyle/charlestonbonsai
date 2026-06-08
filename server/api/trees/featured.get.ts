import type { PublicTree } from '~/types'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )

  try {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .eq('featured', true)
      .limit(5)

    if (error)
      throw error

    // Transform snake_case to camelCase. Price is intentionally not
    // returned to consumer surfaces — pricing is by inquiry only.
    const trees: PublicTree[] = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      species: item.species,
      treeType: item.tree_type,
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

    return trees
  }
  catch (error) {
    console.error('Error fetching featured trees:', error)
    return []
  }
})
