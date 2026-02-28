import type { FilterState, Tree } from '~/types'

export function useTrees() {
  const supabase = useSupabaseClient()
  const trees = ref<Tree[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  const fetchTrees = async (options?: {
    page?: number
    pageSize?: number
    filters?: Partial<FilterState>
  }) => {
    loading.value = true
    error.value = null

    const page = options?.page || 1
    const pageSize = options?.pageSize || 12
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    try {
      let query = supabase
        .from('trees')
        .select('*', { count: 'exact' })
        .range(from, to)

      // Apply filters
      if (options?.filters) {
        const { sizes, careLevels, treeTypes, inStockOnly } = options.filters

        if (sizes && sizes.length > 0) {
          query = query.in('size', sizes)
        }

        if (careLevels && careLevels.length > 0) {
          query = query.in('careLevel', careLevels)
        }

        if (treeTypes && treeTypes.length > 0) {
          query = query.in('treeType', treeTypes)
        }

        if (inStockOnly) {
          query = query.eq('inStock', true)
        }
      }

      const { data, error: supabaseError, count } = await query

      if (supabaseError)
        throw supabaseError

      trees.value = data as Tree[]
      total.value = count || 0

      return {
        trees: trees.value,
        total: total.value,
        hasMore: to < (count || 0),
      }
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch trees'
      console.error('Error fetching trees:', e)
      return null
    }
    finally {
      loading.value = false
    }
  }

  const fetchTreeBySlug = async (slug: string): Promise<Tree | null> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('trees')
        .select('*')
        .eq('slug', slug)
        .single()

      if (supabaseError)
        throw supabaseError

      return data as Tree
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch tree'
      console.error('Error fetching tree:', e)
      return null
    }
    finally {
      loading.value = false
    }
  }

  const fetchFeaturedTrees = async (limit = 5): Promise<Tree[]> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('trees')
        .select('*')
        .eq('featured', true)
        .eq('inStock', true)
        .limit(limit)

      if (supabaseError)
        throw supabaseError

      return data as Tree[]
    }
    catch (e) {
      console.error('Error fetching featured trees:', e)
      return []
    }
  }

  return {
    trees,
    loading,
    error,
    total,
    fetchTrees,
    fetchTreeBySlug,
    fetchFeaturedTrees,
  }
}
