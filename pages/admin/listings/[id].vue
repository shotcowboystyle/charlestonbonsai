<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <UiLoadingSpinner />
    </div>

    <!-- Form -->
    <div v-else-if="form">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <NuxtLink to="/admin/listings" class="text-stone-400 hover:text-charcoal transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </NuxtLink>
        <div>
          <h1 class="font-serif text-2xl text-charcoal">Edit Tree</h1>
          <p class="text-stone-500 text-sm">{{ form.name }}</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Form -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Basic Info -->
            <div class="bg-white rounded-xl p-6 shadow-soft">
              <h2 class="font-serif text-lg text-charcoal mb-4">Basic Information</h2>
              <div class="space-y-4">
                <UiInput
                  v-model="form.name"
                  label="Tree Name"
                  required
                  :error="errors.name"
                />
                <UiInput
                  v-model="form.species"
                  label="Species"
                  required
                  :error="errors.species"
                />
                <UiTextarea
                  v-model="form.description"
                  label="Description"
                  :rows="5"
                  required
                  :error="errors.description"
                />
                <UiInput
                  v-model="form.shortDescription"
                  label="Short Description"
                  :error="errors.shortDescription"
                />
              </div>
            </div>

            <!-- Specifications -->
            <div class="bg-white rounded-xl p-6 shadow-soft">
              <h2 class="font-serif text-lg text-charcoal mb-4">Specifications</h2>
              <div class="grid grid-cols-2 gap-4">
                <UiSelect
                  v-model="form.treeType"
                  label="Tree Type"
                  :options="treeTypeOptions"
                  required
                />
                <UiSelect
                  v-model="form.careLevel"
                  label="Care Level"
                  :options="careLevelOptions"
                  required
                />
                <UiSelect
                  v-model="form.size"
                  label="Size Category"
                  :options="sizeOptions"
                  required
                />
                <UiInput
                  v-model="form.age"
                  type="number"
                  label="Age (years)"
                  required
                />
                <UiInput
                  v-model="form.height"
                  label="Height"
                  required
                />
                <UiInput
                  v-model="form.potType"
                  label="Pot Type"
                  required
                />
              </div>
            </div>

            <!-- Images -->
            <div class="bg-white rounded-xl p-6 shadow-soft">
              <h2 class="font-serif text-lg text-charcoal mb-4">Images</h2>
              <div class="space-y-4">
                <UiInput
                  v-model="form.thumbnail"
                  label="Thumbnail URL"
                  required
                />
                <div>
                  <label class="block text-sm font-medium text-charcoal mb-1.5">Gallery Images</label>
                  <div class="space-y-2">
                    <div v-for="(image, index) in form.images" :key="index" class="flex gap-2">
                      <input
                        v-model="form.images[index]"
                        type="text"
                        class="input flex-1"
                      />
                      <button
                        type="button"
                        @click="removeImage(index)"
                        class="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="addImage"
                    class="mt-2 text-sm text-sage hover:text-sage-400 transition-colors"
                  >
                    + Add another image
                  </button>
                </div>
                <UiInput
                  v-model="form.model3dUrl"
                  label="3D Model URL (optional)"
                />
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Pricing -->
            <div class="bg-white rounded-xl p-6 shadow-soft">
              <h2 class="font-serif text-lg text-charcoal mb-4">Pricing</h2>
              <UiInput
                v-model="form.price"
                type="number"
                label="Price ($)"
                required
                :error="errors.price"
              />
            </div>

            <!-- Features -->
            <div class="bg-white rounded-xl p-6 shadow-soft">
              <h2 class="font-serif text-lg text-charcoal mb-4">Features</h2>
              <div class="space-y-2">
                <div v-for="(feature, index) in form.features" :key="index" class="flex gap-2">
                  <input
                    v-model="form.features[index]"
                    type="text"
                    class="input flex-1"
                  />
                  <button
                    type="button"
                    @click="removeFeature(index)"
                    class="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
                <button
                  type="button"
                  @click="addFeature"
                  class="text-sm text-sage hover:text-sage-400 transition-colors"
                >
                  + Add feature
                </button>
              </div>
            </div>

            <!-- Status -->
            <div class="bg-white rounded-xl p-6 shadow-soft">
              <h2 class="font-serif text-lg text-charcoal mb-4">Status</h2>
              <div class="space-y-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    v-model="form.inStock"
                    type="checkbox"
                    class="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                  />
                  <span class="text-sm text-charcoal">In Stock</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    v-model="form.featured"
                    type="checkbox"
                    class="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span class="text-sm text-charcoal">Featured</span>
                </label>
              </div>
            </div>

            <!-- Actions -->
            <div class="bg-white rounded-xl p-6 shadow-soft">
              <UiButton
                type="submit"
                variant="primary"
                full-width
                :loading="saving"
              >
                Save Changes
              </UiButton>
              <NuxtLink
                to="/admin/listings"
                class="btn btn-ghost w-full mt-3"
              >
                Cancel
              </NuxtLink>
            </div>

            <!-- Preview -->
            <div class="bg-cream-50 rounded-xl p-4">
              <NuxtLink
                :to="`/gallery/${tree?.slug}`"
                target="_blank"
                class="text-sm text-sage hover:text-sage-400 transition-colors flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on site
              </NuxtLink>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <p class="text-stone-500">Tree not found</p>
      <NuxtLink to="/admin/listings" class="btn btn-outline mt-4">
        Back to Listings
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tree } from '~/types'
import { TREE_TYPE_LABELS, CARE_LEVEL_LABELS, TREE_SIZE_LABELS } from '~/types'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const router = useRouter()
const treeId = route.params.id as string

const loading = ref(true)
const saving = ref(false)
const tree = ref<Tree | null>(null)
const form = ref<any>(null)
const errors = ref<Record<string, string>>({})

const treeTypeOptions = Object.entries(TREE_TYPE_LABELS).map(([value, label]) => ({ value, label }))
const careLevelOptions = Object.entries(CARE_LEVEL_LABELS).map(([value, label]) => ({ value, label }))
const sizeOptions = Object.entries(TREE_SIZE_LABELS).map(([value, label]) => ({ value, label }))

onMounted(async () => {
  const supabase = useSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .eq('id', treeId)
      .single()

    if (error) throw error

    tree.value = {
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

    form.value = {
      name: tree.value.name,
      species: tree.value.species,
      description: tree.value.description,
      shortDescription: tree.value.shortDescription,
      treeType: tree.value.treeType,
      careLevel: tree.value.careLevel,
      size: tree.value.size,
      age: tree.value.age.toString(),
      height: tree.value.height,
      potType: tree.value.potType,
      price: tree.value.price.toString(),
      thumbnail: tree.value.thumbnail,
      images: tree.value.images.length ? [...tree.value.images] : [''],
      model3dUrl: tree.value.model3dUrl || '',
      features: tree.value.features.length ? [...tree.value.features] : [],
      inStock: tree.value.inStock,
      featured: tree.value.featured,
    }
  } catch (e) {
    console.error('Error fetching tree:', e)
  } finally {
    loading.value = false
  }
})

function addImage() {
  form.value.images.push('')
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
}

function addFeature() {
  form.value.features.push('')
}

function removeFeature(index: number) {
  form.value.features.splice(index, 1)
}

async function handleSubmit() {
  errors.value = {}

  if (!form.value.name) errors.value.name = 'Name is required'
  if (!form.value.species) errors.value.species = 'Species is required'
  if (!form.value.description) errors.value.description = 'Description is required'
  if (!form.value.price) errors.value.price = 'Price is required'

  if (Object.keys(errors.value).length > 0) return

  saving.value = true

  const supabase = useSupabaseClient()

  try {
    const { error } = await supabase
      .from('trees')
      .update({
        name: form.value.name,
        species: form.value.species,
        description: form.value.description,
        short_description: form.value.shortDescription,
        tree_type: form.value.treeType,
        care_level: form.value.careLevel,
        size: form.value.size,
        age: parseInt(form.value.age),
        height: form.value.height,
        pot_type: form.value.potType,
        price: parseFloat(form.value.price),
        thumbnail: form.value.thumbnail,
        images: form.value.images.filter(Boolean),
        model_3d_url: form.value.model3dUrl || null,
        features: form.value.features.filter(Boolean),
        in_stock: form.value.inStock,
        featured: form.value.featured,
      })
      .eq('id', treeId)

    if (error) throw error

    router.push('/admin/listings')
  } catch (e) {
    console.error('Error updating tree:', e)
    errors.value.submit = 'Failed to save changes. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>
