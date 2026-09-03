import type { TreeRow } from '~/server/utils/mappers'
import type { PublicTree } from '~/types'
import { mapPublicTreeRows } from '~/server/utils/mappers'
import { createAnonClient } from '~/server/utils/supabase'
import { escapeLikePattern, hasMorePages, parseTreeListQuery } from '~/server/utils/tree-query'

export interface PublicTreesResponse {
  trees: PublicTree[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export default defineEventHandler(async (event): Promise<PublicTreesResponse> => {
  const supabase = createAnonClient()

  const {
    page,
    pageSize,
    inStockOnly,
    sizes,
    careLevels,
    treeTypes,
    search,
    sortBy,
    from,
    to,
  } = parseTreeListQuery(getQuery(event))

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
    const escaped = escapeLikePattern(search)
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

  const total = count || 0

  return {
    trees: mapPublicTreeRows(data as TreeRow[] | null),
    total,
    page,
    pageSize,
    hasMore: hasMorePages(to, total),
  }
})
