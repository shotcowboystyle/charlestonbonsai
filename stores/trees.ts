import type { FilterState, Tree } from '~/types'
import { defineStore } from 'pinia'

export const useTreesStore = defineStore('trees', () => {
  // State
  const trees = ref<Tree[]>([])
  const featuredTrees = ref<Tree[]>([])
  const currentTree = ref<Tree | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(12)
  const hasMore = ref(false)

  // Filter state
  const filters = ref<FilterState>({
    sizes: [],
    careLevels: [],
    treeTypes: [],
    priceRange: [0, 10000],
    search: '',
    sortBy: 'newest',
    inStockOnly: false,
  })

  // Getters
  const filteredTrees = computed(() => {
    let result = [...trees.value]

    // Filter by size
    if (filters.value.sizes.length > 0) {
      result = result.filter(tree => filters.value.sizes.includes(tree.size))
    }

    // Filter by care level
    if (filters.value.careLevels.length > 0) {
      result = result.filter(tree => filters.value.careLevels.includes(tree.careLevel))
    }

    // Filter by tree type
    if (filters.value.treeTypes.length > 0) {
      result = result.filter(tree => filters.value.treeTypes.includes(tree.treeType))
    }

    // Filter by price range
    result = result.filter(
      tree => tree.price >= filters.value.priceRange[0] && tree.price <= filters.value.priceRange[1],
    )

    // Filter by search
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      result = result.filter(
        tree =>
          tree.name.toLowerCase().includes(searchLower)
          || tree.species.toLowerCase().includes(searchLower)
          || tree.description.toLowerCase().includes(searchLower),
      )
    }

    // Filter by in stock
    if (filters.value.inStockOnly) {
      result = result.filter(tree => tree.inStock)
    }

    // Sort
    switch (filters.value.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
    }

    return result
  })

  const hasActiveFilters = computed(() => {
    return (
      filters.value.sizes.length > 0
      || filters.value.careLevels.length > 0
      || filters.value.treeTypes.length > 0
      || filters.value.priceRange[0] > 0
      || filters.value.priceRange[1] < 10000
      || filters.value.search !== ''
      || filters.value.inStockOnly
    )
  })

  // Actions
  async function fetchTrees(page = 1) {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()

      const from = (page - 1) * pageSize.value
      const to = from + pageSize.value - 1

      const { data, error: supabaseError, count } = await supabase
        .from('trees')
        .select('*', { count: 'exact' })
        .range(from, to)

      if (supabaseError)
        throw supabaseError

      trees.value = data as Tree[]
      total.value = count || 0
      currentPage.value = page
      hasMore.value = to < (count || 0)
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch trees'
      console.error('Error fetching trees:', e)
    }
    finally {
      loading.value = false
    }
  }

  async function fetchFeaturedTrees() {
    try {
      const supabase = useSupabaseClient()

      const { data, error: supabaseError } = await supabase
        .from('trees')
        .select('*')
        .eq('featured', true)
        .eq('inStock', true)
        .limit(5)

      if (supabaseError)
        throw supabaseError

      featuredTrees.value = data as Tree[]
    }
    catch (e) {
      console.error('Error fetching featured trees:', e)
    }
  }

  async function fetchTreeBySlug(slug: string) {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()

      const { data, error: supabaseError } = await supabase
        .from('trees')
        .select('*')
        .eq('slug', slug)
        .single()

      if (supabaseError)
        throw supabaseError

      currentTree.value = data as Tree
      return currentTree.value
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

  async function fetchTreeById(id: string) {
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()

      const { data, error: supabaseError } = await supabase
        .from('trees')
        .select('*')
        .eq('id', id)
        .single()

      if (supabaseError)
        throw supabaseError

      currentTree.value = data as Tree
      return currentTree.value
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

  function updateFilters(newFilters: Partial<FilterState>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      sizes: [],
      careLevels: [],
      treeTypes: [],
      priceRange: [0, 10000],
      search: '',
      sortBy: 'newest',
      inStockOnly: false,
    }
  }

  function clearCurrentTree() {
    currentTree.value = null
  }

  return {
    // State
    trees,
    featuredTrees,
    currentTree,
    loading,
    error,
    total,
    currentPage,
    pageSize,
    hasMore,
    filters,

    // Getters
    filteredTrees,
    hasActiveFilters,

    // Actions
    fetchTrees,
    fetchFeaturedTrees,
    fetchTreeBySlug,
    fetchTreeById,
    updateFilters,
    resetFilters,
    clearCurrentTree,
  }
})
