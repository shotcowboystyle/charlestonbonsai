import type { FilterState, TreeSize, CareLevel, TreeType, SortOption } from '~/types'

export const useFilters = () => {
  const route = useRoute()
  const router = useRouter()

  const filters = ref<FilterState>({
    sizes: [],
    careLevels: [],
    treeTypes: [],
    priceRange: [0, 10000],
    search: '',
    sortBy: 'newest',
    inStockOnly: false,
  })

  // Initialize from URL query params
  const initFromQuery = () => {
    const query = route.query
    
    if (query.sizes) {
      filters.value.sizes = (query.sizes as string).split(',') as TreeSize[]
    }
    if (query.careLevels) {
      filters.value.careLevels = (query.careLevels as string).split(',') as CareLevel[]
    }
    if (query.treeTypes) {
      filters.value.treeTypes = (query.treeTypes as string).split(',') as TreeType[]
    }
    if (query.search) {
      filters.value.search = query.search as string
    }
    if (query.sortBy) {
      filters.value.sortBy = query.sortBy as SortOption
    }
    if (query.inStock === 'true') {
      filters.value.inStockOnly = true
    }
  }

  // Update URL query params
  const updateQuery = debounce(() => {
    const query: Record<string, string> = {}

    if (filters.value.sizes.length > 0) {
      query.sizes = filters.value.sizes.join(',')
    }
    if (filters.value.careLevels.length > 0) {
      query.careLevels = filters.value.careLevels.join(',')
    }
    if (filters.value.treeTypes.length > 0) {
      query.treeTypes = filters.value.treeTypes.join(',')
    }
    if (filters.value.search) {
      query.search = filters.value.search
    }
    if (filters.value.sortBy !== 'newest') {
      query.sortBy = filters.value.sortBy
    }
    if (filters.value.inStockOnly) {
      query.inStock = 'true'
    }

    router.push({ query })
  }, 300)

  const toggleSize = (size: TreeSize) => {
    const index = filters.value.sizes.indexOf(size)
    if (index === -1) {
      filters.value.sizes.push(size)
    } else {
      filters.value.sizes.splice(index, 1)
    }
    updateQuery()
  }

  const toggleCareLevel = (level: CareLevel) => {
    const index = filters.value.careLevels.indexOf(level)
    if (index === -1) {
      filters.value.careLevels.push(level)
    } else {
      filters.value.careLevels.splice(index, 1)
    }
    updateQuery()
  }

  const toggleTreeType = (type: TreeType) => {
    const index = filters.value.treeTypes.indexOf(type)
    if (index === -1) {
      filters.value.treeTypes.push(type)
    } else {
      filters.value.treeTypes.splice(index, 1)
    }
    updateQuery()
  }

  const setSearch = (search: string) => {
    filters.value.search = search
    updateQuery()
  }

  const setSortBy = (sortBy: SortOption) => {
    filters.value.sortBy = sortBy
    updateQuery()
  }

  const toggleInStockOnly = () => {
    filters.value.inStockOnly = !filters.value.inStockOnly
    updateQuery()
  }

  const resetFilters = () => {
    filters.value = {
      sizes: [],
      careLevels: [],
      treeTypes: [],
      priceRange: [0, 10000],
      search: '',
      sortBy: 'newest',
      inStockOnly: false,
    }
    router.push({ query: {} })
  }

  const hasActiveFilters = computed(() => {
    return (
      filters.value.sizes.length > 0 ||
      filters.value.careLevels.length > 0 ||
      filters.value.treeTypes.length > 0 ||
      filters.value.search !== '' ||
      filters.value.inStockOnly
    )
  })

  return {
    filters,
    initFromQuery,
    toggleSize,
    toggleCareLevel,
    toggleTreeType,
    setSearch,
    setSortBy,
    toggleInStockOnly,
    resetFilters,
    hasActiveFilters,
  }
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
