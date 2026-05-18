<script setup lang="ts">
import type { CareLevel, FilterState, TreeSize, TreeType } from '~/types'
import {
  CARE_LEVEL_LABELS,
  TREE_SIZE_SHORT_LABELS,
  TREE_TYPE_LABELS,
} from '~/types'

interface Props {
  modelValue: FilterState
}
const props = defineProps<Props>()

const emit = defineEmits<{
  removeSpecies: [value: TreeType]
  removeSize: [value: TreeSize]
  removeCare: [value: CareLevel]
  clearAll: []
}>()

const hasAny = computed(() =>
  props.modelValue.treeTypes.length
  + props.modelValue.sizes.length
  + props.modelValue.careLevels.length > 0,
)
</script>

<template>
  <ul v-if="hasAny" class="pills" aria-label="Active filters">
    <li v-for="t in modelValue.treeTypes" :key="`s-${t}`">
      <button type="button" class="pill" @click="emit('removeSpecies', t)">
        <span class="pill__label">{{ TREE_TYPE_LABELS[t] }}</span>
        <span class="pill__x" aria-hidden="true">×</span>
        <span class="sr-only">Remove filter</span>
      </button>
    </li>
    <li v-for="s in modelValue.sizes" :key="`sz-${s}`">
      <button type="button" class="pill" @click="emit('removeSize', s)">
        <span class="pill__label">{{ TREE_SIZE_SHORT_LABELS[s] }}</span>
        <span class="pill__x" aria-hidden="true">×</span>
        <span class="sr-only">Remove filter</span>
      </button>
    </li>
    <li v-for="c in modelValue.careLevels" :key="`c-${c}`">
      <button type="button" class="pill" @click="emit('removeCare', c)">
        <span class="pill__label">{{ CARE_LEVEL_LABELS[c] }}</span>
        <span class="pill__x" aria-hidden="true">×</span>
        <span class="sr-only">Remove filter</span>
      </button>
    </li>
    <li>
      <button type="button" class="pills__clear" @click="emit('clearAll')">
        clear all
      </button>
    </li>
  </ul>
</template>

<style scoped>
.pills {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2xs) var(--space-xs);
}

.pill {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5em;
  padding: 0.3rem 0.75rem;
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: var(--radius-pill);
  color: var(--accent);
  font-family: var(--font-body);
  font-size: 0.75rem;
  line-height: 1.1;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out-quart),
    color var(--duration-fast) var(--ease-out-quart);
}

.pill:hover {
  background: var(--accent);
  color: var(--accent-ink);
}

.pill:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.pill__label {
  font-feature-settings: 'kern' 1, 'liga' 1;
}

.pill__x {
  font-family: var(--font-display);
  font-size: 0.875rem;
  line-height: 1;
  opacity: 0.7;
}

.pill:hover .pill__x {
  opacity: 1;
}

.pills__clear {
  background: transparent;
  border: 0;
  padding: 0.3rem 0.5rem;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out-quart);
}

.pills__clear:hover {
  color: var(--text);
}

.pills__clear:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}
</style>
