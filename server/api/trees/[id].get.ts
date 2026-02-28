import type { Tree } from '~/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )

  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing tree slug',
    })
  }

  try {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Tree not found',
        })
      }
      throw error
    }

    // Transform snake_case to camelCase
    const tree: Tree = {
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

    return tree
  }
  catch (error) {
    console.error('Error fetching tree:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tree',
    })
  }
})
