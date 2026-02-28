<script setup lang="ts">
import type { FilterState } from '~/types'
import { CARE_LEVEL_LABELS, TREE_SIZE_LABELS, TREE_TYPE_LABELS } from '~/types'

interface Props {
  modelValue: FilterState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterState]
  'reset': []
}>()

const sizeOptions = TREE_SIZE_LABELS
const careLevelOptions = CARE_LEVEL_LABELS
const treeTypeOptions = TREE_TYPE_LABELS

const hasActiveFilters = computed(() => {
  return (
    props.modelValue.sizes.length > 0
    || props.modelValue.careLevels.length > 0
    || props.modelValue.treeTypes.length > 0
  )
})

function isSelected(type: keyof Pick<FilterState, 'sizes' | 'careLevels' | 'treeTypes'>, value: string): boolean {
  return (props.modelValue[type] as string[]).includes(value)
}

function toggleFilter(type: keyof Pick<FilterState, 'sizes' | 'careLevels' | 'treeTypes'>, value: string) {
  const newValue = [...props.modelValue[type]] as string[]
  const index = newValue.indexOf(value)

  if (index === -1) {
    newValue.push(value)
  }
  else {
    newValue.splice(index, 1)
  }

  emit('update:modelValue', {
    ...props.modelValue,
    [type]: newValue,
  })
}

function toggleInStock() {
  emit('update:modelValue', {
    ...props.modelValue,
    inStockOnly: !props.modelValue.inStockOnly,
  })
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-soft p-6 sticky top-24">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-serif text-lg text-charcoal">
        Filters
      </h3>
      <button
        v-if="hasActiveFilters"
        class="text-sm text-sage hover:text-sage-400 transition-colors"
        @click="$emit('reset')"
      >
        Clear all
      </button>
    </div>

    <!-- Tree Size -->
    <div class="mb-6">
      <h4 class="font-medium text-charcoal mb-3">
        Size
      </h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(label, size) in sizeOptions"
          :key="size"
          class="filter-chip text-sm" :class="[
            isSelected('sizes', size) && 'filter-chip-active',
          ]"
          @click="toggleFilter('sizes', size)"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <!-- Care Level -->
    <div class="mb-6">
      <h4 class="font-medium text-charcoal mb-3">
        Care Level
      </h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(label, level) in careLevelOptions"
          :key="level"
          class="filter-chip text-sm" :class="[
            isSelected('careLevels', level) && 'filter-chip-active',
          ]"
          @click="toggleFilter('careLevels', level)"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <!-- Tree Type -->
    <div class="mb-6">
      <h4 class="font-medium text-charcoal mb-3">
        Species
      </h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(label, type) in treeTypeOptions"
          :key="type"
          class="filter-chip text-sm" :class="[
            isSelected('treeTypes', type) && 'filter-chip-active',
          ]"
          @click="toggleFilter('treeTypes', type)"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <!-- In Stock Toggle -->
    <div class="border-t border-stone-200 pt-6">
      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          :checked="modelValue.inStockOnly"
          class="w-5 h-5 rounded border-stone-300 text-sage focus:ring-sage"
          @change="toggleInStock"
        >
        <span class="text-sm text-charcoal">Show in-stock only</span>
      </label>
    </div>
  </div>
</template>
