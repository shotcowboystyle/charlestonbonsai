<script setup lang="ts">
import { CARE_LEVEL_LABELS, TREE_SIZE_LABELS, TREE_TYPE_LABELS } from '~/types'

definePageMeta({
  layout: 'admin',
})

const router = useRouter()

const form = ref({
  name: '',
  species: '',
  description: '',
  shortDescription: '',
  treeType: '',
  careLevel: '',
  size: '',
  age: '',
  height: '',
  potType: '',
  price: '',
  thumbnail: '',
  images: [''] as string[],
  model3dUrl: '',
  features: [] as string[],
  inStock: true,
  featured: false,
})

const errors = ref<Record<string, string>>({})
const saving = ref(false)

// Select options
const treeTypeOptions = Object.entries(TREE_TYPE_LABELS).map(([value, label]) => ({ value, label }))
const careLevelOptions = Object.entries(CARE_LEVEL_LABELS).map(([value, label]) => ({ value, label }))
const sizeOptions = Object.entries(TREE_SIZE_LABELS).map(([value, label]) => ({ value, label }))

function addImage() {
  form.value.images.push('')
  uploadingImages.value.push(false)
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
  uploadingImages.value.splice(index, 1)
}

const uploadingThumbnail = ref(false)
const uploadingImages = ref<boolean[]>([])
const uploadingModel = ref(false)

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const tokenCookie = useCookie('admin_token')

  const response = await $fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenCookie.value}`,
    },
    body: formData,
  })

  return (response as any).url
}

async function handleThumbnailUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  uploadingThumbnail.value = true
  try {
    const url = await uploadFile(file)
    form.value.thumbnail = url
  }
  catch (e) {
    console.error('Upload failed:', e)
  }
  finally {
    uploadingThumbnail.value = false
  }
}

async function handleImageUpload(event: Event, index: number) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  uploadingImages.value[index] = true
  try {
    const url = await uploadFile(file)
    form.value.images[index] = url
  }
  catch (e) {
    console.error('Upload failed:', e)
  }
  finally {
    uploadingImages.value[index] = false
  }
}

async function handleModelUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  uploadingModel.value = true
  try {
    const url = await uploadFile(file)
    form.value.model3dUrl = url
  }
  catch (e) {
    console.error('Upload failed:', e)
  }
  finally {
    uploadingModel.value = false
  }
}

function addFeature() {
  form.value.features.push('')
}

function removeFeature(index: number) {
  form.value.features.splice(index, 1)
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function handleSubmit() {
  errors.value = {}

  // Validation
  if (!form.value.name)
    errors.value.name = 'Name is required'
  if (!form.value.species)
    errors.value.species = 'Species is required'
  if (!form.value.description)
    errors.value.description = 'Description is required'
  if (!form.value.price)
    errors.value.price = 'Price is required'

  if (Object.keys(errors.value).length > 0)
    return

  saving.value = true

  const tokenCookie = useCookie('admin_token')

  try {
    const { error: createError } = await useFetch('/api/admin/listings/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
      },
      body: {
        name: form.value.name,
        slug: generateSlug(form.value.name),
        species: form.value.species,
        description: form.value.description,
        short_description: form.value.shortDescription || form.value.description.slice(0, 160),
        tree_type: form.value.treeType || 'other',
        care_level: form.value.careLevel || 'beginner',
        size: form.value.size || 'medium',
        age: Number.parseInt(form.value.age) || 0,
        height: form.value.height,
        pot_type: form.value.potType,
        price: Number.parseFloat(form.value.price) || 0,
        thumbnail: form.value.thumbnail,
        images: form.value.images.filter(Boolean),
        model_3d_url: form.value.model3dUrl || null,
        features: form.value.features.filter(Boolean),
        in_stock: form.value.inStock,
        featured: form.value.featured,
      },
    })

    if (createError.value)
      throw createError.value

    router.push('/admin/listings')
  }
  catch (e) {
    console.error('Error creating tree:', e)
    errors.value.submit = 'Failed to create listing. Please try again.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin/listings" class="text-stone-400 hover:text-charcoal transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="font-serif text-2xl text-charcoal">
        Add New Tree
      </h1>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info -->
          <div class="bg-white rounded-xl p-6 shadow-soft">
            <h2 class="font-serif text-lg text-charcoal mb-4">
              Basic Information
            </h2>
            <div class="space-y-4">
              <UiInput
                v-model="form.name"
                label="Tree Name"
                placeholder="e.g., Japanese Maple 'Deshojo'"
                required
                :error="errors.name"
              />
              <UiInput
                v-model="form.species"
                label="Species"
                placeholder="e.g., Acer palmatum 'Deshojo'"
                required
                :error="errors.species"
              />
              <UiTextarea
                v-model="form.description"
                label="Description"
                placeholder="Describe the tree's characteristics, history, and unique features..."
                :rows="5"
                required
                :error="errors.description"
              />
              <UiInput
                v-model="form.shortDescription"
                label="Short Description"
                placeholder="Brief summary for cards and previews (max 160 characters)"
                :error="errors.shortDescription"
              />
            </div>
          </div>

          <!-- Specifications -->
          <div class="bg-white rounded-xl p-6 shadow-soft">
            <h2 class="font-serif text-lg text-charcoal mb-4">
              Specifications
            </h2>
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
                placeholder="10"
                required
              />
              <UiInput
                v-model="form.height"
                label="Height"
                placeholder="e.g., 12-14 inches"
                required
              />
              <UiInput
                v-model="form.potType"
                label="Pot Type"
                placeholder="e.g., Tokoname ceramic"
                required
              />
            </div>
          </div>

          <!-- Images -->
          <div class="bg-white rounded-xl p-6 shadow-soft">
            <h2 class="font-serif text-lg text-charcoal mb-4">
              Images
            </h2>
            <div class="space-y-4">
              <UiInput
                v-model="form.thumbnail"
                label="Thumbnail URL"
                placeholder="https://example.com/image.jpg"
                required
                hint="Main image shown in gallery cards"
              />
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1.5">Thumbnail Image <span class="text-red-500">*</span></label>
                <div class="flex gap-2 items-center">
                  <input
                    v-model="form.thumbnail"
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    class="input flex-1"
                    required
                  >
                  <label class="btn btn-outline cursor-pointer whitespace-nowrap" :class="{ 'opacity-50 pointer-events-none': uploadingThumbnail }">
                    <span v-if="uploadingThumbnail">Uploading...</span>
                    <span v-else>Browse...</span>
                    <input type="file" class="hidden" accept="image/*" @change="handleThumbnailUpload">
                  </label>
                </div>
                <p class="text-xs text-stone-500 mt-1">
                  Main image shown in gallery cards
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-charcoal mb-1.5">Gallery Images</label>
                <div class="space-y-2">
                  <div v-for="(image, index) in form.images" :key="index" class="flex gap-2 items-center">
                    <input
                      v-model="form.images[index]"
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      class="input flex-1"
                    >
                    <label class="btn btn-outline cursor-pointer whitespace-nowrap" :class="{ 'opacity-50 pointer-events-none': uploadingImages[index] }">
                      <span v-if="uploadingImages[index]">Uploading...</span>
                      <span v-else>Browse...</span>
                      <input type="file" class="hidden" accept="image/*" @change="e => handleImageUpload(e, index)">
                    </label>
                    <button
                      type="button"
                      class="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                      @click="removeImage(index)"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  class="mt-2 text-sm text-sage hover:text-sage-400 transition-colors"
                  @click="addImage"
                >
                  + Add another image
                </button>
              </div>

              <div>
                <label class="block text-sm font-medium text-charcoal mb-1.5">3D Model URL (optional)</label>
                <div class="flex gap-2 items-center">
                  <input
                    v-model="form.model3dUrl"
                    type="text"
                    placeholder="https://example.com/model.glb"
                    class="input flex-1"
                  >
                  <label class="btn btn-outline cursor-pointer whitespace-nowrap" :class="{ 'opacity-50 pointer-events-none': uploadingModel }">
                    <span v-if="uploadingModel">Uploading...</span>
                    <span v-else>Browse...</span>
                    <input type="file" class="hidden" accept=".glb,.gltf" @change="handleModelUpload">
                  </label>
                </div>
                <p class="text-xs text-stone-500 mt-1">
                  GLTF/GLB file for 3D viewer
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Pricing -->
          <div class="bg-white rounded-xl p-6 shadow-soft">
            <h2 class="font-serif text-lg text-charcoal mb-4">
              Pricing
            </h2>
            <UiInput
              v-model="form.price"
              type="number"
              label="Price ($)"
              placeholder="299"
              required
              :error="errors.price"
            />
          </div>

          <!-- Features -->
          <div class="bg-white rounded-xl p-6 shadow-soft">
            <h2 class="font-serif text-lg text-charcoal mb-4">
              Features
            </h2>
            <div class="space-y-2">
              <div v-for="(feature, index) in form.features" :key="index" class="flex gap-2">
                <input
                  v-model="form.features[index]"
                  type="text"
                  placeholder="e.g., Indoor"
                  class="input flex-1"
                >
                <button
                  type="button"
                  class="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  @click="removeFeature(index)"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                class="text-sm text-sage hover:text-sage-400 transition-colors"
                @click="addFeature"
              >
                + Add feature
              </button>
            </div>
          </div>

          <!-- Status -->
          <div class="bg-white rounded-xl p-6 shadow-soft">
            <h2 class="font-serif text-lg text-charcoal mb-4">
              Status
            </h2>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="form.inStock"
                  type="checkbox"
                  class="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                >
                <span class="text-sm text-charcoal">In Stock</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="form.featured"
                  type="checkbox"
                  class="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                >
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
              Create Listing
            </UiButton>
            <NuxtLink
              to="/admin/listings"
              class="btn btn-ghost w-full mt-3"
            >
              Cancel
            </NuxtLink>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
