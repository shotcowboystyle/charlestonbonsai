<script setup lang="ts">
import type { CareLevel, FilterState, SortOption, TreeSize, TreeType } from '~/types'
import {
  CARE_LEVEL_LABELS,
  SORT_OPTIONS,
  TREE_SIZE_SHORT_LABELS,
  TREE_TYPE_LABELS,
} from '~/types'

interface Props {
  modelValue: FilterState
  searchQuery: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterState]
  'update:searchQuery': [value: string]
  'openMobile': []
}>()

type MenuKey = 'species' | 'size' | 'care' | 'sort'
const openMenu = ref<MenuKey | null>(null)

// Drafts: local state mutated inside an open menu. Committed to the parent
// only when the menu closes, so multiple toggles inside a single popover
// produce one parent update (one network fetch).
const draft = ref<FilterState>({ ...props.modelValue })

// Search has its own state — it is not menu-gated.
const search = ref(props.searchQuery)

watch(() => props.searchQuery, (v) => {
  search.value = v
})

let searchDebounce: ReturnType<typeof setTimeout> | undefined
function onSearchInput() {
  if (searchDebounce)
    clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    emit('update:searchQuery', search.value)
  }, 250)
}

function clearSearch() {
  search.value = ''
  emit('update:searchQuery', '')
}

function openMenuFor(key: MenuKey) {
  // Opening a menu freshly snapshots the parent state. This makes draft a
  // working copy that the user can mutate freely until they commit on close.
  if (openMenu.value === key) {
    closeMenu()
    return
  }
  draft.value = {
    ...props.modelValue,
    sizes: [...props.modelValue.sizes],
    careLevels: [...props.modelValue.careLevels],
    treeTypes: [...props.modelValue.treeTypes],
  }
  openMenu.value = key
}

function closeMenu() {
  if (openMenu.value === null)
    return
  const next: FilterState = {
    ...props.modelValue,
    sizes: draft.value.sizes,
    careLevels: draft.value.careLevels,
    treeTypes: draft.value.treeTypes,
    sortBy: draft.value.sortBy,
  }
  openMenu.value = null
  // Only emit if anything actually changed.
  if (
    next.sortBy !== props.modelValue.sortBy
    || !sameSet(next.sizes, props.modelValue.sizes)
    || !sameSet(next.careLevels, props.modelValue.careLevels)
    || !sameSet(next.treeTypes, props.modelValue.treeTypes)
  ) {
    emit('update:modelValue', next)
  }
}

function sameSet<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length)
    return false
  const bs = new Set(b)
  return a.every(x => bs.has(x))
}

function toggleSize(value: TreeSize) {
  draft.value.sizes = toggleIn(draft.value.sizes, value)
}
function toggleCare(value: CareLevel) {
  draft.value.careLevels = toggleIn(draft.value.careLevels, value)
}
function toggleSpecies(value: TreeType) {
  draft.value.treeTypes = toggleIn(draft.value.treeTypes, value)
}
function pickSort(value: SortOption) {
  draft.value.sortBy = value
  closeMenu()
}

function toggleIn<T>(arr: T[], v: T): T[] {
  const i = arr.indexOf(v)
  if (i === -1)
    return [...arr, v]
  const next = [...arr]
  next.splice(i, 1)
  return next
}

// Close on outside click / Esc.
const rootEl = ref<HTMLElement>()
function onDocClick(e: MouseEvent) {
  if (!openMenu.value)
    return
  const target = e.target as Node | null
  if (rootEl.value && target && !rootEl.value.contains(target)) {
    closeMenu()
  }
}
function onDocKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && openMenu.value)
    closeMenu()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKey)
})

// Live counts surfaced on each trigger label
const speciesCount = computed(() => props.modelValue.treeTypes.length)
const sizeCount = computed(() => props.modelValue.sizes.length)
const careCount = computed(() => props.modelValue.careLevels.length)

const activeSortLabel = computed(() => {
  return SORT_OPTIONS.find(o => o.value === props.modelValue.sortBy)?.label ?? 'Newest first'
})

// Static maps used for menu options
const sizeEntries = Object.entries(TREE_SIZE_SHORT_LABELS) as [TreeSize, string][]
const careEntries = Object.entries(CARE_LEVEL_LABELS) as [CareLevel, string][]
const speciesEntries = Object.entries(TREE_TYPE_LABELS) as [TreeType, string][]
</script>

<template>
  <div ref="rootEl" class="bar">
    <div class="bar__filters" role="toolbar" aria-label="Catalog filters">
      <div class="bar__cell">
        <button
          type="button"
          class="bar__trigger"
          :class="{ 'bar__trigger--open': openMenu === 'species', 'bar__trigger--active': speciesCount > 0 }"
          :aria-expanded="openMenu === 'species'"
          aria-haspopup="true"
          @click="openMenuFor('species')"
        >
          <span class="bar__trigger-label">species</span>
          <span v-if="speciesCount" class="bar__trigger-count">·&nbsp;{{ speciesCount }}</span>
          <svg class="bar__caret" viewBox="0 0 8 5" aria-hidden="true">
            <path d="M0.5 0.5 L4 4 L7.5 0.5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
          </svg>
        </button>
        <div v-if="openMenu === 'species'" class="bar__menu bar__menu--wide" role="menu">
          <ul class="bar__menu-list bar__menu-list--two">
            <li v-for="[key, label] in speciesEntries" :key="key">
              <button
                type="button"
                class="bar__option"
                :class="{ 'bar__option--checked': draft.treeTypes.includes(key) }"
                role="menuitemcheckbox"
                :aria-checked="draft.treeTypes.includes(key)"
                @click="toggleSpecies(key)"
              >
                <span class="bar__check" aria-hidden="true">
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 L5 8.5 L9.5 3.5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="square" /></svg>
                </span>
                <span class="bar__option-label">{{ label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <span class="bar__sep" aria-hidden="true" />

      <div class="bar__cell">
        <button
          type="button"
          class="bar__trigger"
          :class="{ 'bar__trigger--open': openMenu === 'size', 'bar__trigger--active': sizeCount > 0 }"
          :aria-expanded="openMenu === 'size'"
          aria-haspopup="true"
          @click="openMenuFor('size')"
        >
          <span class="bar__trigger-label">size</span>
          <span v-if="sizeCount" class="bar__trigger-count">·&nbsp;{{ sizeCount }}</span>
          <svg class="bar__caret" viewBox="0 0 8 5" aria-hidden="true">
            <path d="M0.5 0.5 L4 4 L7.5 0.5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
          </svg>
        </button>
        <div v-if="openMenu === 'size'" class="bar__menu" role="menu">
          <ul class="bar__menu-list">
            <li v-for="[key, label] in sizeEntries" :key="key">
              <button
                type="button"
                class="bar__option"
                :class="{ 'bar__option--checked': draft.sizes.includes(key) }"
                role="menuitemcheckbox"
                :aria-checked="draft.sizes.includes(key)"
                @click="toggleSize(key)"
              >
                <span class="bar__check" aria-hidden="true">
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 L5 8.5 L9.5 3.5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="square" /></svg>
                </span>
                <span class="bar__option-label">{{ label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <span class="bar__sep" aria-hidden="true" />

      <div class="bar__cell">
        <button
          type="button"
          class="bar__trigger"
          :class="{ 'bar__trigger--open': openMenu === 'care', 'bar__trigger--active': careCount > 0 }"
          :aria-expanded="openMenu === 'care'"
          aria-haspopup="true"
          @click="openMenuFor('care')"
        >
          <span class="bar__trigger-label">care</span>
          <span v-if="careCount" class="bar__trigger-count">·&nbsp;{{ careCount }}</span>
          <svg class="bar__caret" viewBox="0 0 8 5" aria-hidden="true">
            <path d="M0.5 0.5 L4 4 L7.5 0.5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
          </svg>
        </button>
        <div v-if="openMenu === 'care'" class="bar__menu" role="menu">
          <ul class="bar__menu-list">
            <li v-for="[key, label] in careEntries" :key="key">
              <button
                type="button"
                class="bar__option"
                :class="{ 'bar__option--checked': draft.careLevels.includes(key) }"
                role="menuitemcheckbox"
                :aria-checked="draft.careLevels.includes(key)"
                @click="toggleCare(key)"
              >
                <span class="bar__check" aria-hidden="true">
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 L5 8.5 L9.5 3.5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="square" /></svg>
                </span>
                <span class="bar__option-label">{{ label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <span class="bar__sep" aria-hidden="true" />

      <div class="bar__cell">
        <button
          type="button"
          class="bar__trigger bar__trigger--sort"
          :class="{ 'bar__trigger--open': openMenu === 'sort' }"
          :aria-expanded="openMenu === 'sort'"
          aria-haspopup="true"
          @click="openMenuFor('sort')"
        >
          <span class="bar__trigger-label">sort</span>
          <span class="bar__trigger-value">·&nbsp;{{ activeSortLabel.toLowerCase() }}</span>
          <svg class="bar__caret" viewBox="0 0 8 5" aria-hidden="true">
            <path d="M0.5 0.5 L4 4 L7.5 0.5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
          </svg>
        </button>
        <div v-if="openMenu === 'sort'" class="bar__menu bar__menu--right" role="menu">
          <ul class="bar__menu-list">
            <li v-for="opt in SORT_OPTIONS" :key="opt.value">
              <button
                type="button"
                class="bar__option bar__option--radio"
                :class="{ 'bar__option--checked': draft.sortBy === opt.value }"
                role="menuitemradio"
                :aria-checked="draft.sortBy === opt.value"
                @click="pickSort(opt.value)"
              >
                <span class="bar__option-label">{{ opt.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="bar__mobile-trigger"
      @click="emit('openMobile')"
    >
      <span class="bar__mobile-label">Filter &amp; Sort</span>
      <span v-if="speciesCount + sizeCount + careCount > 0" class="bar__mobile-count">
        ·&nbsp;{{ speciesCount + sizeCount + careCount }}
      </span>
    </button>

    <div class="bar__search">
      <label for="catalog-search" class="sr-only">Search the catalog</label>
      <svg class="bar__search-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1" />
        <path d="M11 11 L14 14" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
      </svg>
      <input
        id="catalog-search"
        v-model="search"
        type="text"
        autocomplete="off"
        spellcheck="false"
        placeholder="species, name, or feature"
        class="bar__search-input"
        @input="onSearchInput"
      >
      <button
        v-if="search.length"
        type="button"
        class="bar__search-clear"
        aria-label="Clear search"
        @click="clearSearch"
      >
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-md);
}

/* ────────────────────────────────────────────────
   Filter triggers — desktop only.
   On <640px these collapse to a single mobile trigger.
   ──────────────────────────────────────────────── */

.bar__filters {
  display: none;
  align-items: center;
  gap: 0;
}

@media (min-width: 640px) {
  .bar__filters {
    display: inline-flex;
  }
}

.bar__cell {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.bar__sep {
  width: 1px;
  height: 0.875rem;
  margin: 0 var(--space-md);
  background: var(--border-hair);
}

.bar__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  background: transparent;
  border: 0;
  padding: var(--space-2xs) 0;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
  position: relative;
  transition: color var(--duration-base) var(--ease-out-quart);
}

.bar__trigger:hover,
.bar__trigger--open {
  color: var(--text);
}

.bar__trigger--active {
  color: var(--accent);
}

.bar__trigger-label {
  display: inline-block;
}

.bar__trigger-count,
.bar__trigger-value {
  letter-spacing: 0.08em;
  text-transform: none;
  font-feature-settings: var(--feat-spec-data);
  color: inherit;
}

.bar__trigger-value {
  color: var(--text-faint);
}

.bar__caret {
  width: 0.5rem;
  height: 0.3125rem;
  margin-left: 0.1rem;
  transition: transform var(--duration-base) var(--ease-out-quart);
  color: inherit;
}

.bar__trigger--open .bar__caret {
  transform: rotate(180deg);
}

.bar__trigger:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

/* ────────────────────────────────────────────────
   Popovers
   ──────────────────────────────────────────────── */

.bar__menu {
  position: absolute;
  top: calc(100% + var(--space-2xs));
  left: 0;
  z-index: var(--z-overlay);
  min-width: 14rem;
  background: var(--surface);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lift);
  padding: var(--space-xs) 0;
  animation: menu-in var(--duration-fast) var(--ease-out-quart);
}

.bar__menu--right {
  left: auto;
  right: 0;
}

.bar__menu--wide {
  min-width: 22rem;
}

@keyframes menu-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.bar__menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.bar__menu-list--two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 var(--space-md);
  padding: 0 var(--space-2xs);
}

.bar__option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  width: 100%;
  padding: var(--space-2xs) var(--space-sm);
  background: transparent;
  border: 0;
  text-align: left;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out-quart);
}

.bar__option:hover {
  background: var(--surface-raised);
}

.bar__option:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--accent);
}

.bar__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.875rem;
  height: 0.875rem;
  border: 1px solid var(--text-faint);
  border-radius: 2px;
  color: var(--accent-ink);
  background: transparent;
  flex-shrink: 0;
  transition:
    background-color var(--duration-fast) var(--ease-out-quart),
    border-color var(--duration-fast) var(--ease-out-quart);
}

.bar__check svg {
  width: 0.75rem;
  height: 0.75rem;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out-quart);
}

.bar__option--checked .bar__check {
  background: var(--accent);
  border-color: var(--accent);
}

.bar__option--checked .bar__check svg {
  opacity: 1;
}

.bar__option--radio .bar__option-label::before {
  content: '';
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: var(--space-2xs);
  border-radius: 50%;
  background: transparent;
  outline: 1px solid var(--text-faint);
  outline-offset: 2px;
  vertical-align: 0.05em;
  transition: background-color var(--duration-fast) var(--ease-out-quart);
}

.bar__option--radio.bar__option--checked .bar__option-label::before {
  background: var(--accent);
  outline-color: var(--accent);
}

.bar__option-label {
  font-feature-settings: 'kern' 1, 'liga' 1;
}

/* ────────────────────────────────────────────────
   Mobile trigger (single button on small screens)
   ──────────────────────────────────────────────── */

.bar__mobile-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: var(--space-2xs) var(--space-sm);
  background: transparent;
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
}

.bar__mobile-trigger:hover {
  background: var(--surface-raised);
}

.bar__mobile-trigger:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

@media (min-width: 640px) {
  .bar__mobile-trigger {
    display: none;
  }
}

.bar__mobile-count {
  text-transform: none;
  letter-spacing: 0.05em;
  color: var(--accent);
}

/* ────────────────────────────────────────────────
   Search — inline at right end
   ──────────────────────────────────────────────── */

.bar__search {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: clamp(8rem, 30vw, 16rem);
}

.bar__search-icon {
  position: absolute;
  left: 0;
  width: 1rem;
  height: 1rem;
  color: var(--text-faint);
  pointer-events: none;
}

.bar__search-input {
  width: 100%;
  padding: var(--space-2xs) var(--space-md) var(--space-2xs) 1.5rem;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--border-hair);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.875rem;
  transition: border-color var(--duration-base) var(--ease-out-quart);
  border-radius: 0;
}

.bar__search-input::placeholder {
  color: var(--text-faint);
  font-style: italic;
  font-family: var(--font-display);
  font-size: 0.9375rem;
}

.bar__search-input:hover {
  border-bottom-color: var(--text-faint);
}

.bar__search-input:focus,
.bar__search-input:focus-visible {
  outline: none;
  border-bottom-color: var(--accent);
  box-shadow: none;
}

.bar__search-clear {
  position: absolute;
  right: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  color: var(--text-faint);
  font-family: var(--font-display);
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.bar__search-clear:hover {
  color: var(--text);
}

.bar__search-clear:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
