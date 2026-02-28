<template>
  <NuxtLink
    :to="`/gallery/${tree.slug}`"
    class="card group"
  >
    <!-- Image -->
    <div class="aspect-tree relative overflow-hidden bg-cream-100">
      <img
        :src="tree.thumbnail"
        :alt="tree.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        @error="handleImageError"
      />
      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-2">
        <UiBadge v-if="tree.featured" variant="sage" size="sm">Featured</UiBadge>
        <UiBadge v-if="!tree.inStock" variant="error" size="sm">Sold</UiBadge>
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <div class="flex items-start justify-between gap-2 mb-2">
        <h3 class="font-serif text-lg text-charcoal group-hover:text-forest transition-colors">
          {{ tree.name }}
        </h3>
        <span class="font-semibold text-forest whitespace-nowrap">
          ${{ tree.price.toLocaleString() }}
        </span>
      </div>

      <p class="text-sm text-stone-500 italic mb-3">{{ tree.species }}</p>

      <p class="text-sm text-stone-600 line-clamp-2 mb-4">
        {{ tree.shortDescription }}
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <UiBadge variant="stone" size="sm">{{ careLevelLabel }}</UiBadge>
        <UiBadge variant="stone" size="sm">{{ sizeLabel }}</UiBadge>
      </div>

      <div class="flex items-center text-sage text-sm font-medium group-hover:text-forest transition-colors">
        View Details
        <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Tree } from '~/types'
import { CARE_LEVEL_LABELS, TREE_SIZE_LABELS } from '~/types'

interface Props {
  tree: Tree
}

const props = defineProps<Props>()

const careLevelLabel = computed(() => {
  return CARE_LEVEL_LABELS[props.tree.careLevel] || props.tree.careLevel
})

const sizeLabel = computed(() => {
  return TREE_SIZE_LABELS[props.tree.size] || props.tree.size
})

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/images/trees/placeholder-thumb.svg'
}
</script>
