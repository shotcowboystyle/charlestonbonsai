import type { Tree } from '~/types'

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
      .eq('in_stock', true)
      .limit(5)

    if (error)
      throw error

    // Transform snake_case to camelCase
    const trees: Tree[] = (data || []).map(item => ({
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

    return trees
  }
  catch (error) {
    console.error('Error fetching featured trees:', error)
    return []
  }
})
