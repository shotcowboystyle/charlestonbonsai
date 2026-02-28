<template>
  <div class="min-h-screen bg-cream">
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center items-center min-h-[60vh]">
      <UiLoadingSpinner />
    </div>

    <!-- Not Found -->
    <div v-else-if="!tree" class="container-custom py-32 text-center">
      <div class="text-6xl mb-4">🌲</div>
      <h1 class="font-serif text-2xl text-charcoal mb-4">Tree Not Found</h1>
      <p class="text-stone-500 mb-8">The tree you're looking for doesn't exist or has been removed.</p>
      <NuxtLink to="/gallery" class="btn btn-primary">
        Back to Gallery
      </NuxtLink>
    </div>

    <!-- Tree Detail -->
    <div v-else>
      <!-- Breadcrumb -->
      <div class="bg-white border-b border-stone-200 pt-24 pb-4">
        <div class="container-custom">
          <nav class="flex items-center gap-2 text-sm text-stone-500">
            <NuxtLink to="/" class="hover:text-charcoal transition-colors">Home</NuxtLink>
            <span>/</span>
            <NuxtLink to="/gallery" class="hover:text-charcoal transition-colors">Gallery</NuxtLink>
            <span>/</span>
            <span class="text-charcoal">{{ tree.name }}</span>
          </nav>
        </div>
      </div>

      <div class="container-custom py-8 lg:py-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <!-- Images & 3D -->
          <div class="space-y-6">
            <!-- Main Image -->
            <div class="aspect-square bg-white rounded-2xl overflow-hidden shadow-soft">
              <img
                :src="currentImage"
                :alt="tree.name"
                class="w-full h-full object-contain"
              />
            </div>

            <!-- Thumbnails -->
            <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button
                v-for="(image, index) in allImages"
                :key="index"
                :class="[
                  'w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                  currentImageIndex === index ? 'border-forest' : 'border-transparent hover:border-stone-300'
                ]"
                @click="currentImageIndex = index"
              >
                <img :src="image" :alt="`${tree.name} ${index + 1}`" class="w-full h-full object-cover" />
              </button>
            </div>

            <!-- 3D Viewer -->
            <div v-if="tree.model3dUrl" class="bg-white rounded-2xl p-6 shadow-soft">
              <h3 class="font-serif text-lg text-charcoal mb-4">3D View</h3>
              <GalleryTreeViewer3D
                :model-url="tree.model3dUrl"
                class="aspect-square"
              />
              <p class="text-sm text-stone-500 mt-3 text-center">
                Drag to rotate • Scroll to zoom
              </p>
            </div>
          </div>

          <!-- Details -->
          <div>
            <!-- Header -->
            <div class="mb-6">
              <div class="flex flex-wrap gap-2 mb-3">
                <UiBadge v-if="tree.featured" variant="sage">Featured</UiBadge>
                <UiBadge v-if="!tree.in_stock" variant="error">Sold</UiBadge>
                <UiBadge v-else variant="success">In Stock</UiBadge>
              </div>
              <h1 class="font-serif text-3xl md:text-4xl text-charcoal mb-2">{{ tree.name }}</h1>
              <p class="text-lg text-stone-500 italic">{{ tree.species }}</p>
            </div>

            <!-- Price -->
            <div class="mb-8">
              <span class="text-3xl font-semibold text-forest">${{ tree.price.toLocaleString() }}</span>
            </div>

            <!-- Description -->
            <div class="prose prose-stone max-w-none mb-8">
              <p class="text-stone-600 leading-relaxed">{{ tree.description }}</p>
            </div>

            <!-- Specs -->
            <div class="bg-cream-50 rounded-xl p-6 mb-8">
              <h3 class="font-serif text-lg text-charcoal mb-4">Specifications</h3>
              <dl class="grid grid-cols-2 gap-4">
                <div>
                  <dt class="text-sm text-stone-500">Age</dt>
                  <dd class="font-medium text-charcoal">{{ tree.age }} years</dd>
                </div>
                <div>
                  <dt class="text-sm text-stone-500">Height</dt>
                  <dd class="font-medium text-charcoal">{{ tree.height }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-stone-500">Size Category</dt>
                  <dd class="font-medium text-charcoal">{{ TREE_SIZE_LABELS[tree.size] }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-stone-500">Care Level</dt>
                  <dd class="font-medium text-charcoal">{{ CARE_LEVEL_LABELS[tree.care_level] }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-stone-500">Pot Type</dt>
                  <dd class="font-medium text-charcoal">{{ tree.pot_type }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-stone-500">Species</dt>
                  <dd class="font-medium text-charcoal">{{ TREE_TYPE_LABELS[tree.tree_type] }}</dd>
                </div>
              </dl>
            </div>

            <!-- Features -->
            <div v-if="tree.features?.length" class="mb-8">
              <h3 class="font-serif text-lg text-charcoal mb-3">Features</h3>
              <div class="flex flex-wrap gap-2">
                <UiBadge
                  v-for="feature in tree.features"
                  :key="feature"
                  variant="forest"
                >
                  {{ feature }}
                </UiBadge>
              </div>
            </div>

            <!-- CTA -->
            <div class="space-y-4">
              <a
                :href="inquireLink"
                class="btn btn-primary w-full"
              >
                Inquire About This Tree
              </a>
              <p class="text-sm text-stone-500 text-center">
                Questions? Call us at <a href="tel:+18435551234" class="text-forest hover:underline">(843) 555-1234</a>
              </p>
            </div>
          </div>
        </div>

        <!-- Related Trees -->
        <div v-if="relatedTrees.length" class="mt-16 pt-16 border-t border-stone-200">
          <h2 class="section-heading mb-8">You May Also Like</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GalleryTreeCard
              v-for="relatedTree in relatedTrees"
              :key="relatedTree.id"
              :tree="relatedTree"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tree } from '~/types'
import { TREE_SIZE_LABELS, CARE_LEVEL_LABELS, TREE_TYPE_LABELS } from '~/types'

const route = useRoute()
const slug = route.params.id as string

// Fetch tree
const { data: tree, pending } = await useFetch<Tree>(`/api/trees/${slug}`)

// Meta
useHead({
  title: computed(() => tree.value ? `${tree.value.name} - Charleston Bonsai` : 'Loading...'),
  meta: [
    { 
      name: 'description', 
      content: computed(() => tree.value?.short_description || 'Bonsai tree details')
    },
  ],
})

// Image gallery
const currentImageIndex = ref(0)

const allImages = computed(() => {
  if (!tree.value) return []
  const images = [...tree.value.images]
  if (tree.value.thumbnail && !images.includes(tree.value.thumbnail)) {
    images.unshift(tree.value.thumbnail)
  }
  return images.length > 0 ? images : ['/images/trees/placeholder-thumb.svg']
})

const currentImage = computed(() => {
  return allImages.value[currentImageIndex.value] || '/images/trees/placeholder-thumb.svg'
})

// Inquire link
const inquireLink = computed(() => {
  if (!tree.value) return '#'
  const subject = encodeURIComponent(`Inquiry about: ${tree.value.name}`)
  const body = encodeURIComponent(`Hi, I'm interested in the ${tree.value.name} ($${tree.value.price}). Please let me know if it's still available.`)
  return `mailto:hello@charlestonbonsai.com?subject=${subject}&body=${body}`
})

// Related trees
const relatedTrees = ref<Tree[]>([])

watch(tree, async (newTree) => {
  if (newTree) {
    // Fetch related trees (same type, excluding current)
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('trees')
      .select('*')
      .eq('tree_type', newTree.tree_type)
      .neq('id', newTree.id)
      .eq('in_stock', true)
      .limit(4)
    
    relatedTrees.value = (data as Tree[]) || []
  }
}, { immediate: true })

</script>
