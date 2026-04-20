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
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        @error="handleImageError"
      >
      <!-- Forest-tinted overlay on hover -->
      <div class="absolute inset-0 bg-forest/0 group-hover:bg-forest/10 transition-colors duration-700" />
      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-2">
        <UiBadge v-if="tree.featured" variant="sage" size="sm">
          Featured
        </UiBadge>
        <UiBadge v-if="!tree.inStock" variant="error" size="sm">
          Sold
        </UiBadge>
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <h3 class="font-serif text-lg text-charcoal group-hover:text-forest transition-colors mb-1">
        {{ tree.name }}
      </h3>

      <p class="text-sm text-stone-500 italic mb-3">
        {{ tree.species }}
      </p>

      <p class="text-sm text-stone-600 line-clamp-2 mb-4">
        {{ tree.shortDescription }}
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <UiBadge variant="stone" size="sm">
          {{ careLevelLabel }}
        </UiBadge>
        <UiBadge variant="stone" size="sm">
          {{ sizeLabel }}
        </UiBadge>
      </div>

      <!-- Price + CTA in border-t area -->
      <div class="flex items-center justify-between border-t border-stone-100 pt-4">
        <span class="font-semibold text-forest">
          ${{ tree.price.toLocaleString() }}
        </span>
        <span class="text-xs tracking-widest uppercase text-stone-400 group-hover:text-forest transition-colors flex items-center gap-1">
          View
          <svg class="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
