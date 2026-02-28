<script setup lang="ts">
import type { Tree } from '~/types'

definePageMeta({
  layout: 'admin',
})

const loading = ref(true)
const recentTrees = ref<Tree[]>([])
const stats = ref({
  total: 0,
  inStock: 0,
  featured: 0,
  totalValue: 0,
})

onMounted(async () => {
  const supabase = useSupabaseClient()

  try {
    // Fetch all trees for stats
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error)
      throw error

    const trees = (data || []).map(item => ({
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

    recentTrees.value = trees.slice(0, 5)

    // Calculate stats
    stats.value = {
      total: trees.length,
      inStock: trees.filter(t => t.inStock).length,
      featured: trees.filter(t => t.featured).length,
      totalValue: trees.reduce((sum, t) => sum + t.price, 0),
    }
  }
  catch (e) {
    console.error('Error fetching dashboard data:', e)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl p-6 shadow-soft">
        <div class="flex items-center justify-between mb-2">
          <span class="text-stone-500 text-sm">Total Trees</span>
          <div class="w-10 h-10 bg-sage-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.282 2.282a5.368 5.368 0 014.106 1.586l2.084 2.084a5.36 5.36 0 011.586 4.106l.001 2.282a5.36 5.36 0 01-1.586 4.106l-2.084 2.084a5.36 5.36 0 01-4.106 1.586L13 21h-2.282a5.36 5.36 0 01-4.106-1.586l-2.084-2.084a5.36 5.36 0 01-1.586-4.106L3 11.018V8.736c0-1.539.612-3.017 1.586-4.106l2.084-2.084A5.36 5.36 0 0110.718 1H13" />
            </svg>
          </div>
        </div>
        <div class="text-3xl font-serif text-charcoal">
          {{ stats.total }}
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-soft">
        <div class="flex items-center justify-between mb-2">
          <span class="text-stone-500 text-sm">In Stock</span>
          <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="text-3xl font-serif text-charcoal">
          {{ stats.inStock }}
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-soft">
        <div class="flex items-center justify-between mb-2">
          <span class="text-stone-500 text-sm">Featured</span>
          <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
        <div class="text-3xl font-serif text-charcoal">
          {{ stats.featured }}
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-soft">
        <div class="flex items-center justify-between mb-2">
          <span class="text-stone-500 text-sm">Total Value</span>
          <div class="w-10 h-10 bg-forest-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="text-3xl font-serif text-charcoal">
          ${{ stats.totalValue.toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-xl p-6 shadow-soft mb-8">
      <h2 class="font-serif text-lg text-charcoal mb-4">
        Quick Actions
      </h2>
      <div class="flex flex-wrap gap-3">
        <NuxtLink to="/admin/listings/create" class="btn btn-primary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Tree
        </NuxtLink>
        <NuxtLink to="/admin/listings" class="btn btn-outline">
          Manage Listings
        </NuxtLink>
        <NuxtLink to="/" target="_blank" class="btn btn-ghost">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Site
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Listings -->
    <div class="bg-white rounded-xl shadow-soft overflow-hidden">
      <div class="p-6 border-b border-stone-200">
        <div class="flex items-center justify-between">
          <h2 class="font-serif text-lg text-charcoal">
            Recent Listings
          </h2>
          <NuxtLink to="/admin/listings" class="text-sm text-sage hover:text-sage-400 transition-colors">
            View all →
          </NuxtLink>
        </div>
      </div>

      <div v-if="loading" class="p-12 text-center">
        <UiLoadingSpinner />
      </div>

      <div v-else-if="recentTrees.length === 0" class="p-12 text-center text-stone-500">
        <p>No trees yet. Add your first listing!</p>
      </div>

      <table v-else class="w-full">
        <thead class="bg-cream-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
              Tree
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
              Type
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
              Price
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="tree in recentTrees" :key="tree.id" class="hover:bg-cream-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-cream rounded-lg overflow-hidden flex-shrink-0">
                  <img :src="tree.thumbnail" :alt="tree.name" class="w-full h-full object-cover">
                </div>
                <div>
                  <div class="font-medium text-charcoal">
                    {{ tree.name }}
                  </div>
                  <div class="text-xs text-stone-500">
                    {{ tree.species }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-stone-600 capitalize">
              {{ tree.treeType }}
            </td>
            <td class="px-6 py-4 text-sm font-medium text-charcoal">
              ${{ tree.price.toLocaleString() }}
            </td>
            <td class="px-6 py-4">
              <span :class="tree.inStock ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'" class="badge">
                {{ tree.inStock ? 'In Stock' : 'Sold' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <NuxtLink
                :to="`/admin/listings/${tree.id}`"
                class="text-sage hover:text-sage-400 transition-colors"
              >
                Edit
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
