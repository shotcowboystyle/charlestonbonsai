<script setup lang="ts">
import type { FilterState, SortOption, Tree } from '~/types'
import { CARE_LEVEL_LABELS, SORT_OPTIONS, TREE_SIZE_LABELS, TREE_TYPE_LABELS } from '~/types'

// Meta
useHead({
  title: 'Gallery - Charleston Bonsai',
  meta: [
    { name: 'description', content: 'Browse our collection of premium bonsai trees. Filter by size, care level, and species to find your perfect tree.' },
  ],
})

// State
const trees = ref<Tree[]>([])
const total = ref(0)
const pending = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const page = ref(1)
const pageSize = 12

const filters = ref<FilterState>({
  sizes: [],
  careLevels: [],
  treeTypes: [],
  priceRange: [0, 10000],
  search: '',
  sortBy: 'newest',
  inStockOnly: false,
})

const searchQuery = ref('')
const sortBy = ref<SortOption>('newest')

// Computed
const hasActiveFilters = computed(() => {
  return (
    filters.value.sizes.length > 0
    || filters.value.careLevels.length > 0
    || filters.value.treeTypes.length > 0
    || filters.value.search !== ''
  )
})

// Fetch trees
async function fetchTrees(append = false) {
  if (append) {
    loadingMore.value = true
  }
  else {
    pending.value = true
    page.value = 1
  }

  try {
    const supabase = useSupabaseClient()

    const from = (page.value - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('trees')
      .select('*', { count: 'exact' })
      .range(from, to)

    // Apply filters
    if (filters.value.sizes.length > 0) {
      query = query.in('size', filters.value.sizes)
    }
    if (filters.value.careLevels.length > 0) {
      query = query.in('care_level', filters.value.careLevels)
    }
    if (filters.value.treeTypes.length > 0) {
      query = query.in('tree_type', filters.value.treeTypes)
    }
    if (filters.value.search) {
      query = query.or(`name.ilike.%${filters.value.search}%,species.ilike.%${filters.value.search}%`)
    }

    // Sort
    switch (sortBy.value) {
      case 'price-asc':
        query = query.order('price', { ascending: true })
        break
      case 'price-desc':
        query = query.order('price', { ascending: false })
        break
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
    }

    const { data, error: fetchError, count } = await query

    if (fetchError)
      throw fetchError

    // Transform snake_case to camelCase
    const transformedData = (data || []).map(item => ({
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
    })) as Tree[]

    if (append) {
      trees.value = [...trees.value, ...transformedData]
    }
    else {
      trees.value = transformedData
    }

    total.value = count || 0
    hasMore.value = to < (count || 0)
  }
  catch (e) {
    console.error('Error fetching trees:', e)
  }
  finally {
    pending.value = false
    loadingMore.value = false
  }
}

// Debounced fetch
let searchTimeout: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.search = searchQuery.value
    fetchTrees()
  }, 300)
}

function fetchTreesDebounced() {
  filters.value.sortBy = sortBy.value
  fetchTrees()
}

// Load more
function loadMore() {
  page.value++
  fetchTrees(true)
}

// Filter management
function removeFilter(type: keyof Pick<FilterState, 'sizes' | 'careLevels' | 'treeTypes'>, value: string) {
  const index = filters.value[type].indexOf(value as any)
  if (index > -1) {
    filters.value[type].splice(index, 1)
    fetchTrees()
  }
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
  searchQuery.value = ''
  sortBy.value = 'newest'
  fetchTrees()
}

// Watch filters
watch([() => filters.value.sizes, () => filters.value.careLevels, () => filters.value.treeTypes], () => {
  fetchTrees()
}, { deep: true })

// Initial fetch
onMounted(() => {
  fetchTrees()
})
</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <div class="bg-white border-b border-stone-200 pt-28 pb-8">
      <div class="container-custom">
        <h1 class="section-heading">
          Our Collection
        </h1>
        <p class="section-subheading">
          Explore our curated selection of exceptional bonsai trees
        </p>
      </div>
    </div>

    <div class="container-custom py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Filters Sidebar -->
        <aside class="lg:w-72 flex-shrink-0">
          <GalleryFilterSidebar
            v-model="filters"
            @reset="resetFilters"
          />
        </aside>

        <!-- Main Content -->
        <main class="flex-1">
          <!-- Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <p class="text-stone-500">
              <span v-if="pending">Loading...</span>
              <span v-else>{{ total }} tree{{ total !== 1 ? 's' : '' }} found</span>
            </p>

            <div class="flex items-center gap-4">
              <!-- Search -->
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search trees..."
                  class="input py-2 pl-10 pr-4 w-48 md:w-64"
                  @input="debouncedSearch"
                >
                <svg class="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <!-- Sort -->
              <select
                v-model="sortBy"
                class="input py-2 px-4 w-44"
                @change="fetchTreesDebounced"
              >
                <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Active Filters -->
          <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-2 mb-6">
            <span class="text-sm text-stone-500">Active filters:</span>
            <button
              v-for="size in filters.sizes"
              :key="size"
              class="badge bg-sage text-white hover:bg-sage-400 transition-colors"
              @click="removeFilter('sizes', size)"
            >
              {{ TREE_SIZE_LABELS[size] }}
              <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              v-for="level in filters.careLevels"
              :key="level"
              class="badge bg-sage text-white hover:bg-sage-400 transition-colors"
              @click="removeFilter('careLevels', level)"
            >
              {{ CARE_LEVEL_LABELS[level] }}
              <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              v-for="type in filters.treeTypes"
              :key="type"
              class="badge bg-sage text-white hover:bg-sage-400 transition-colors"
              @click="removeFilter('treeTypes', type)"
            >
              {{ TREE_TYPE_LABELS[type] }}
              <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              class="text-sm text-stone-500 hover:text-charcoal underline"
              @click="resetFilters"
            >
              Clear all
            </button>
          </div>

          <!-- Loading -->
          <div v-if="pending" class="flex justify-center py-12">
            <UiLoadingSpinner />
          </div>

          <!-- Empty State -->
          <div v-else-if="trees.length === 0" class="text-center py-16">
            <div class="text-6xl mb-4">
              🌲
            </div>
            <h3 class="font-serif text-xl text-charcoal mb-2">
              No trees found
            </h3>
            <p class="text-stone-500 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button class="btn btn-outline" @click="resetFilters">
              Clear Filters
            </button>
          </div>

          <!-- Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <GalleryTreeCard
              v-for="tree in trees"
              :key="tree.id"
              :tree="tree"
            />
          </div>

          <!-- Pagination -->
          <div v-if="hasMore" class="text-center mt-12">
            <button
              class="btn btn-outline"
              :disabled="loadingMore"
              @click="loadMore"
            >
              <span v-if="loadingMore">Loading...</span>
              <span v-else>Load More Trees</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
