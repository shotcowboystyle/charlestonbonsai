<script setup lang="ts">
import type { Tree } from '~/types'
import { useToastStore } from '~/stores/toast'
import { CARE_LEVEL_LABELS, TREE_SIZE_LABELS, TREE_TYPE_LABELS } from '~/types'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const treeId = route.params.id as string

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_MODEL_SIZE = 50 * 1024 * 1024 // 50MB

const loading = ref(true)
const saving = ref(false)
const tree = ref<Tree | null>(null)
const qrModalOpen = ref(false)
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

    if (error)
      throw error

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
  }
  catch {
    toast.error('Failed to load tree', 'Could not fetch tree data. Go back to listings and try again.')
  }
  finally {
    loading.value = false
  }
})

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

function validateFileSize(file: File, maxSize: number, label: string): boolean {
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024))
    toast.warning('File too large', `${label} must be under ${maxMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`)
    return false
  }
  return true
}

async function handleThumbnailUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  if (!validateFileSize(file, MAX_IMAGE_SIZE, 'Thumbnail image'))
    return

  uploadingThumbnail.value = true
  try {
    const url = await uploadFile(file)
    form.value.thumbnail = url
    toast.success('Thumbnail uploaded')
  }
  catch {
    toast.error('Thumbnail upload failed', 'Could not upload the thumbnail image. Check your connection and try again.')
  }
  finally {
    uploadingThumbnail.value = false
  }
}

async function handleImageUpload(event: Event, index: number) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  if (!validateFileSize(file, MAX_IMAGE_SIZE, `Gallery image #${index + 1}`))
    return

  uploadingImages.value[index] = true
  try {
    const url = await uploadFile(file)
    form.value.images[index] = url
    toast.success('Image uploaded')
  }
  catch {
    toast.error('Image upload failed', `Could not upload gallery image #${index + 1}. Check your connection and try again.`)
  }
  finally {
    uploadingImages.value[index] = false
  }
}

async function handleModelUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  if (!validateFileSize(file, MAX_MODEL_SIZE, '3D model file'))
    return

  uploadingModel.value = true
  try {
    const url = await uploadFile(file)
    form.value.model3dUrl = url
    toast.success('3D model uploaded')
  }
  catch {
    toast.error('Model upload failed', 'Could not upload the 3D model. Ensure the file is a valid GLB/GLTF format and try again.')
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

async function handleSubmit() {
  errors.value = {}

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
    const { error: updateError } = await useFetch(`/api/admin/listings/${treeId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
      },
      body: {
        name: form.value.name,
        species: form.value.species,
        description: form.value.description,
        short_description: form.value.shortDescription,
        tree_type: form.value.treeType,
        care_level: form.value.careLevel,
        size: form.value.size,
        age: Number.parseInt(form.value.age),
        height: form.value.height,
        pot_type: form.value.potType,
        price: Number.parseFloat(form.value.price),
        thumbnail: form.value.thumbnail,
        images: form.value.images.filter(Boolean),
        model_3d_url: form.value.model3dUrl || null,
        features: form.value.features.filter(Boolean),
        in_stock: form.value.inStock,
        featured: form.value.featured,
      },
    })

    if (updateError.value)
      throw updateError.value

    toast.success('Changes saved', `"${form.value.name}" has been updated.`)
    router.push('/admin/listings')
  }
  catch {
    toast.error('Failed to save changes', 'Something went wrong while updating. Check all required fields and try again.')
  }
  finally {
    saving.value = false
  }
}
</script>

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
          <h1 class="font-serif text-2xl text-charcoal">
            Edit Tree
          </h1>
          <p class="text-stone-500 text-sm">
            {{ form.name }}
          </p>
        </div>
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
                  required
                  :error="errors.name"
                />
                <UiInput
                  v-model="form.species"
                  label="Species"
                  required
                  :error="errors.species"
                />
                <UiRichTextEditor
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
              <h2 class="font-serif text-lg text-charcoal mb-4">
                Images
              </h2>
              <div class="space-y-4">
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
                </div>
                <div>
                  <label class="block text-sm font-medium text-charcoal mb-1.5">Gallery Images</label>
                  <div class="space-y-2">
                    <div v-for="(image, index) in form.images" :key="index" class="flex gap-2 items-center">
                      <input
                        v-model="form.images[index]"
                        type="text"
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
            <div class="bg-cream-50 rounded-xl p-4 space-y-2">
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
              <button
                type="button"
                class="text-sm text-sage hover:text-sage-400 transition-colors flex items-center gap-1"
                @click="qrModalOpen = true"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Print QR code
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <p class="text-stone-500">
        Tree not found
      </p>
      <NuxtLink to="/admin/listings" class="btn btn-outline mt-4">
        Back to Listings
      </NuxtLink>
    </div>

    <!-- QR Code Modal -->
    <AdminQrCodeModal v-model="qrModalOpen" :tree="tree" />
  </div>
</template>
