<script setup lang="ts">
import type { CareLevel, FilterState, SortOption, TreeSize, TreeType } from '~/types'
import {
  CARE_LEVEL_LABELS,
  SORT_OPTIONS,
  TREE_SIZE_SHORT_LABELS,
  TREE_TYPE_LABELS,
} from '~/types'

interface Props {
  open: boolean
  modelValue: FilterState
}
const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: FilterState]
}>()

// Draft is initialised every time the sheet opens. Closing without
// pressing Apply discards the draft.
const draft = ref<FilterState>(snapshot(props.modelValue))

function snapshot(s: FilterState): FilterState {
  return {
    ...s,
    sizes: [...s.sizes],
    careLevels: [...s.careLevels],
    treeTypes: [...s.treeTypes],
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    draft.value = snapshot(props.modelValue)
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function close() {
  emit('update:open', false)
}

function apply() {
  emit('update:modelValue', draft.value)
  emit('update:open', false)
}

function reset() {
  draft.value = {
    ...draft.value,
    sizes: [],
    careLevels: [],
    treeTypes: [],
    sortBy: 'newest',
  }
}

function toggleSize(v: TreeSize) {
  draft.value.sizes = toggleIn(draft.value.sizes, v)
}
function toggleCare(v: CareLevel) {
  draft.value.careLevels = toggleIn(draft.value.careLevels, v)
}
function toggleSpecies(v: TreeType) {
  draft.value.treeTypes = toggleIn(draft.value.treeTypes, v)
}
function pickSort(v: SortOption) {
  draft.value.sortBy = v
}
function toggleIn<T>(arr: T[], v: T): T[] {
  const i = arr.indexOf(v)
  if (i === -1)
    return [...arr, v]
  const next = [...arr]
  next.splice(i, 1)
  return next
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape')
    close()
}

const draftCount = computed(() =>
  draft.value.sizes.length + draft.value.careLevels.length + draft.value.treeTypes.length,
)

const sizeEntries = Object.entries(TREE_SIZE_SHORT_LABELS) as [TreeSize, string][]
const careEntries = Object.entries(CARE_LEVEL_LABELS) as [CareLevel, string][]
const speciesEntries = Object.entries(TREE_TYPE_LABELS) as [TreeType, string][]
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-backdrop">
      <div
        v-if="open"
        class="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        @keydown="onKey"
      >
        <div class="sheet__backdrop" @click="close" />
        <Transition name="sheet-panel">
          <div v-if="open" class="sheet__panel">
            <header class="sheet__head">
              <p id="sheet-title" class="sheet__title">
                Filter &amp; Sort
              </p>
              <button
                type="button"
                class="sheet__close"
                aria-label="Close filter sheet"
                @click="close"
              >
                Close
              </button>
            </header>

            <div class="sheet__body">
              <section class="sheet__section">
                <h3 class="sheet__section-title">
                  Species
                </h3>
                <ul class="sheet__opts sheet__opts--two">
                  <li v-for="[key, label] in speciesEntries" :key="key">
                    <label class="sheet__opt">
                      <input
                        type="checkbox"
                        class="sheet__check"
                        :checked="draft.treeTypes.includes(key)"
                        @change="toggleSpecies(key)"
                      >
                      <span>{{ label }}</span>
                    </label>
                  </li>
                </ul>
              </section>

              <section class="sheet__section">
                <h3 class="sheet__section-title">
                  Size
                </h3>
                <ul class="sheet__opts sheet__opts--two">
                  <li v-for="[key, label] in sizeEntries" :key="key">
                    <label class="sheet__opt">
                      <input
                        type="checkbox"
                        class="sheet__check"
                        :checked="draft.sizes.includes(key)"
                        @change="toggleSize(key)"
                      >
                      <span>{{ label }}</span>
                    </label>
                  </li>
                </ul>
              </section>

              <section class="sheet__section">
                <h3 class="sheet__section-title">
                  Care
                </h3>
                <ul class="sheet__opts sheet__opts--two">
                  <li v-for="[key, label] in careEntries" :key="key">
                    <label class="sheet__opt">
                      <input
                        type="checkbox"
                        class="sheet__check"
                        :checked="draft.careLevels.includes(key)"
                        @change="toggleCare(key)"
                      >
                      <span>{{ label }}</span>
                    </label>
                  </li>
                </ul>
              </section>

              <section class="sheet__section">
                <h3 class="sheet__section-title">
                  Sort
                </h3>
                <ul class="sheet__opts">
                  <li v-for="opt in SORT_OPTIONS" :key="opt.value">
                    <label class="sheet__opt sheet__opt--radio">
                      <input
                        type="radio"
                        name="sheet-sort"
                        class="sheet__radio"
                        :checked="draft.sortBy === opt.value"
                        @change="pickSort(opt.value)"
                      >
                      <span>{{ opt.label }}</span>
                    </label>
                  </li>
                </ul>
              </section>
            </div>

            <footer class="sheet__foot">
              <button
                type="button"
                class="sheet__reset"
                :disabled="draftCount === 0 && draft.sortBy === 'newest'"
                @click="reset"
              >
                Reset
              </button>
              <button
                type="button"
                class="sheet__apply"
                @click="apply"
              >
                Apply
              </button>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sheet__backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in oklch, var(--ink-1) 35%, transparent);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.sheet__panel {
  position: relative;
  background: var(--surface);
  border-top: 1px solid var(--border-hair);
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: var(--radius-md);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}

.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-md) var(--space-sm);
  border-bottom: 1px solid var(--border-hair);
}

.sheet__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.125rem;
  color: var(--text);
}

.sheet__close {
  background: transparent;
  border: 0;
  padding: var(--space-2xs) var(--space-xs);
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
}

.sheet__close:hover {
  color: var(--text);
}

.sheet__close:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.sheet__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
  display: grid;
  gap: var(--space-lg);
}

.sheet__section-title {
  margin: 0 0 var(--space-sm);
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
}

.sheet__opts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2xs);
}

.sheet__opts--two {
  grid-template-columns: 1fr 1fr;
  column-gap: var(--space-md);
}

.sheet__opt {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs) 0;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--text);
  cursor: pointer;
}

.sheet__check,
.sheet__radio {
  appearance: none;
  width: 1rem;
  height: 1rem;
  margin: 0;
  border: 1px solid var(--text-faint);
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background-color var(--duration-fast) var(--ease-out-quart),
    border-color var(--duration-fast) var(--ease-out-quart);
}

.sheet__check {
  border-radius: 2px;
}

.sheet__radio {
  border-radius: 50%;
}

.sheet__check:checked {
  background: var(--accent);
  border-color: var(--accent);
}

.sheet__check:checked::after {
  content: '';
  width: 0.625rem;
  height: 0.625rem;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 6.2 L5 8.5 L9.5 3.5' fill='none' stroke='%23fff' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.sheet__radio:checked {
  border-color: var(--accent);
}

.sheet__radio:checked::after {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--accent);
}

.sheet__check:focus-visible,
.sheet__radio:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.sheet__foot {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-hair);
  background: var(--surface);
}

.sheet__reset {
  background: transparent;
  border: 1px solid var(--border);
  padding: var(--space-2xs) var(--space-md);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.sheet__reset:hover:not(:disabled) {
  color: var(--text);
  border-color: var(--text);
}

.sheet__reset:disabled {
  opacity: 0.45;
  cursor: default;
}

.sheet__reset:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.sheet__apply {
  background: var(--text);
  color: var(--surface);
  border: 0;
  padding: var(--space-xs) var(--space-md);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.sheet__apply:hover {
  background: var(--accent);
}

.sheet__apply:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Backdrop and panel transitions */
.sheet-backdrop-enter-active,
.sheet-backdrop-leave-active {
  transition: opacity var(--duration-base) var(--ease-out-quart);
}

.sheet-backdrop-enter-from,
.sheet-backdrop-leave-to {
  opacity: 0;
}

.sheet-panel-enter-active,
.sheet-panel-leave-active {
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.sheet-panel-enter-from,
.sheet-panel-leave-to {
  transform: translateY(100%);
}
</style>
