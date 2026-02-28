<script setup lang="ts">
import type { Tree } from '~/types'
import { TREE_SIZE_LABELS, TREE_TYPE_LABELS } from '~/types'

definePageMeta({
  layout: 'admin',
})

const loading = ref(true)
const trees = ref<Tree[]>([])
const search = ref('')
const filterStatus = ref('')
const filterType = ref('')
const deleteModalOpen = ref(false)
const treeToDelete = ref<Tree | null>(null)

const filteredTrees = computed(() => {
  let result = trees.value

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(searchLower)
      || t.species.toLowerCase().includes(searchLower),
    )
  }

  if (filterStatus.value === 'inStock') {
    result = result.filter(t => t.inStock)
  }
  else if (filterStatus.value === 'sold') {
    result = result.filter(t => !t.inStock)
  }

  if (filterType.value) {
    result = result.filter(t => t.treeType === filterType.value)
  }

  return result
})

onMounted(async () => {
  await fetchTrees()
})

async function fetchTrees() {
  loading.value = true
  const supabase = useSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error)
      throw error

    trees.value = (data || []).map(item => ({
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
      inStock: item.inStock,
      featured: item.featured,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) as Tree[]
  }
  catch (e) {
    console.error('Error fetching trees:', e)
  }
  finally {
    loading.value = false
  }
}

async function toggleFeatured(tree: Tree) {
  const supabase = useSupabaseClient()

  try {
    const { error } = await supabase
      .from('trees')
      .update({ featured: !tree.featured })
      .eq('id', tree.id)

    if (error)
      throw error

    tree.featured = !tree.featured
  }
  catch (e) {
    console.error('Error updating featured status:', e)
  }
}

function confirmDelete(tree: Tree) {
  treeToDelete.value = tree
  deleteModalOpen.value = true
}

async function handleDelete() {
  if (!treeToDelete.value)
    return

  const supabase = useSupabaseClient()

  try {
    const { error } = await supabase
      .from('trees')
      .delete()
      .eq('id', treeToDelete.value.id)

    if (error)
      throw error

    trees.value = trees.value.filter(t => t.id !== treeToDelete.value!.id)
    deleteModalOpen.value = false
    treeToDelete.value = null
  }
  catch (e) {
    console.error('Error deleting tree:', e)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="font-serif text-2xl text-charcoal">
          Manage Listings
        </h1>
        <p class="text-stone-500 text-sm mt-1">
          {{ trees.length }} trees in collection
        </p>
      </div>
      <NuxtLink to="/admin/listings/create" class="btn btn-primary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add New Tree
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-4 shadow-soft mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="search"
            type="text"
            placeholder="Search trees..."
            class="input py-2"
          >
        </div>
        <select v-model="filterStatus" class="input py-2 w-40">
          <option value="">
            All Status
          </option>
          <option value="inStock">
            In Stock
          </option>
          <option value="sold">
            Sold
          </option>
        </select>
        <select v-model="filterType" class="input py-2 w-40">
          <option value="">
            All Types
          </option>
          <option v-for="(label, type) in TREE_TYPE_LABELS" :key="type" :value="type">
            {{ label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-soft overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <UiLoadingSpinner />
      </div>

      <div v-else-if="filteredTrees.length === 0" class="p-12 text-center text-stone-500">
        <p v-if="search || filterStatus || filterType">
          No trees match your filters.
        </p>
        <p v-else>
          No trees yet. Add your first listing!
        </p>
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
              Size
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
              Price
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
              Featured
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="tree in filteredTrees" :key="tree.id" class="hover:bg-cream-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-cream rounded-lg overflow-hidden flex-shrink-0">
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
            <td class="px-6 py-4 text-sm text-stone-600">
              {{ TREE_SIZE_LABELS[tree.size] }}
            </td>
            <td class="px-6 py-4 text-sm font-medium text-charcoal">
              ${{ tree.price.toLocaleString() }}
            </td>
            <td class="px-6 py-4">
              <span :class="tree.inStock ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'" class="badge">
                {{ tree.inStock ? 'In Stock' : 'Sold' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <button
                class="w-6 h-6 rounded flex items-center justify-center transition-colors" :class="[
                  tree.featured ? 'bg-amber-100 text-amber-500' : 'bg-stone-100 text-stone-400 hover:bg-stone-200',
                ]"
                @click="toggleFeatured(tree)"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-3">
                <NuxtLink
                  :to="`/gallery/${tree.slug}`"
                  target="_blank"
                  class="text-stone-400 hover:text-charcoal transition-colors"
                  title="View on site"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </NuxtLink>
                <NuxtLink
                  :to="`/admin/listings/${tree.id}`"
                  class="text-sage hover:text-sage-400 transition-colors"
                >
                  Edit
                </NuxtLink>
                <button
                  class="text-red-400 hover:text-red-600 transition-colors"
                  @click="confirmDelete(tree)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Modal -->
    <UiModal v-model="deleteModalOpen" title="Delete Tree" size="sm">
      <p class="text-stone-600">
        Are you sure you want to delete <strong>{{ treeToDelete?.name }}</strong>? This action cannot be undone.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost" @click="deleteModalOpen = false">
            Cancel
          </button>
          <button class="btn bg-red-500 text-white hover:bg-red-600" @click="handleDelete">
            Delete Tree
          </button>
        </div>
      </template>
    </UiModal>
  </div>
</template>
