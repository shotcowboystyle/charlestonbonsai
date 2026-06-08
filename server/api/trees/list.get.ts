import type { PublicTree } from '~/types'
import { createClient } from '@supabase/supabase-js'

export interface PublicTreesResponse {
  trees: PublicTree[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

const ALLOWED_SORTS = ['newest', 'oldest', 'name'] as const
type SortOption = typeof ALLOWED_SORTS[number]

function toArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map(String)
  if (typeof value === 'string' && value.length > 0)
    return [value]
  return []
}

function toInt(value: unknown, fallback: number, max: number): number {
  const n = Number.parseInt(String(value), 10)
  if (Number.isNaN(n) || n < 1)
    return fallback
  return Math.min(n, max)
}

export default defineEventHandler(async (event): Promise<PublicTreesResponse> => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )

  const q = getQuery(event)

  const page = toInt(q.page, 1, 1000)
  const pageSize = toInt(q.pageSize, 12, 48)
  const inStockOnly = q.inStockOnly !== 'false'
  const sizes = toArray(q.sizes)
  const careLevels = toArray(q.careLevels)
  const treeTypes = toArray(q.treeTypes)
  const search = typeof q.search === 'string' ? q.search : ''
  const sortBy: SortOption = ALLOWED_SORTS.includes(q.sortBy as SortOption)
    ? (q.sortBy as SortOption)
    : 'newest'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('trees')
    .select('*', { count: 'exact' })
    .range(from, to)

  if (inStockOnly)
    query = query.eq('in_stock', true)
  if (sizes.length > 0)
    query = query.in('size', sizes)
  if (careLevels.length > 0)
    query = query.in('care_level', careLevels)
  if (treeTypes.length > 0)
    query = query.in('tree_type', treeTypes)
  if (search) {
    const escaped = search.replace(/[%_,]/g, '\\$&')
    query = query.or(`name.ilike.%${escaped}%,species.ilike.%${escaped}%`)
  }

  switch (sortBy) {
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching tree list:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch trees',
    })
  }

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

  const total = count || 0

  return {
    trees,
    total,
    page,
    pageSize,
    hasMore: to < total - 1,
  }
})
