<script setup lang="ts">
import type { FilterState, PublicTree } from '~/types'

const { siteName } = useSite()

useHead({
  title: `Catalog — ${siteName}`,
  meta: [
    {
      name: 'description',
      content: 'Working catalog of bonsai specimens cultivated and trained by hand in Charleston, South Carolina.',
    },
  ],
})

// ── state ───────────────────────────────────────────────────────────────

const trees = ref<PublicTree[]>([])
const total = ref(0)
const pending = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = 12

const filters = ref<FilterState>({
  sizes: [],
  careLevels: [],
  treeTypes: [],
  search: '',
  sortBy: 'newest',
  // This page is the in-stock catalog. Sold specimens live in /archive,
  // so the value is fixed true and not exposed in the UI.
  inStockOnly: true,
})

const searchQuery = ref('')
const mobileSheetOpen = ref(false)

// Toolbar reveal-on-scroll-up. Hidden when scrolling down past 120px;
// re-pinned when scrolling up. Below the threshold the bar always shows.
const toolbarVisible = ref(true)
const toolbarPinned = ref(false)
let lastScrollY = 0
const SCROLL_DELTA = 6
const PIN_THRESHOLD = 120

function onScroll() {
  const y = window.scrollY
  if (y < PIN_THRESHOLD) {
    toolbarVisible.value = true
    toolbarPinned.value = false
  }
  else {
    toolbarPinned.value = true
    const delta = y - lastScrollY
    if (Math.abs(delta) > SCROLL_DELTA) {
      toolbarVisible.value = delta < 0
    }
  }
  lastScrollY = y
}

// ── computed ────────────────────────────────────────────────────────────

const activeFilterCount = computed(() =>
  filters.value.sizes.length
  + filters.value.careLevels.length
  + filters.value.treeTypes.length,
)

const hasActiveFilters = computed(() =>
  activeFilterCount.value > 0 || filters.value.search.length > 0,
)

const countLabel = computed(() => {
  if (pending.value)
    return 'loading'
  const word = total.value === 1 ? 'specimen' : 'specimens'
  // When the grid hasn't fully loaded (i.e. there are more pages), show
  // progress; otherwise just the matching total.
  if (trees.value.length < total.value)
    return `${trees.value.length} of ${total.value} ${word}`
  return `${total.value} ${word}`
})

// ── fetch ───────────────────────────────────────────────────────────────

async function fetchTrees(append = false) {
  if (append) {
    loadingMore.value = true
  }
  else {
    pending.value = true
    page.value = 1
  }
  error.value = null

  try {
    const supabase = useSupabaseClient()

    const from = (page.value - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('trees')
      .select('*', { count: 'exact' })
      .eq('in_stock', true)
      .range(from, to)

    if (filters.value.sizes.length > 0)
      query = query.in('size', filters.value.sizes)
    if (filters.value.careLevels.length > 0)
      query = query.in('care_level', filters.value.careLevels)
    if (filters.value.treeTypes.length > 0)
      query = query.in('tree_type', filters.value.treeTypes)
    if (filters.value.search) {
      const escaped = filters.value.search.replace(/[%_,]/g, '\\$&')
      query = query.or(`name.ilike.%${escaped}%,species.ilike.%${escaped}%`)
    }

    switch (filters.value.sortBy) {
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data, error: fetchError, count } = await query
    if (fetchError)
      throw fetchError

    const transformed = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      species: item.species,
      treeType: item.tree_type,
      description: item.description,
      shortDescription: item.short_description,
      careLevel: item.care_level,
      size: item.size,
      age: item.age,
      height: item.height,
      potType: item.pot_type,
      images: item.images,
      thumbnail: item.thumbnail,
      model3dUrl: item.model_3d_url,
      features: item.features,
      inStock: item.in_stock,
      featured: item.featured,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) as PublicTree[]

    if (append)
      trees.value = [...trees.value, ...transformed]
    else
      trees.value = transformed

    total.value = count || 0
    hasMore.value = to < (count || 0) - 1
  }
  catch (e) {
    console.error('Failed to load catalog:', e)
    error.value = 'The catalog couldn’t load.'
    if (!append)
      trees.value = []
  }
  finally {
    pending.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  page.value++
  fetchTrees(true)
}

// ── filter updates ──────────────────────────────────────────────────────

function updateFilters(next: FilterState) {
  filters.value = { ...next, inStockOnly: true }
  fetchTrees()
}

function updateSearch(next: string) {
  filters.value = { ...filters.value, search: next }
  fetchTrees()
}

function removeSpecies(value: string) {
  filters.value.treeTypes = filters.value.treeTypes.filter(v => v !== value)
  fetchTrees()
}
function removeSize(value: string) {
  filters.value.sizes = filters.value.sizes.filter(v => v !== value)
  fetchTrees()
}
function removeCare(value: string) {
  filters.value.careLevels = filters.value.careLevels.filter(v => v !== value)
  fetchTrees()
}

function clearAll() {
  filters.value = {
    sizes: [],
    careLevels: [],
    treeTypes: [],
    search: '',
    sortBy: 'newest',
    inStockOnly: true,
  }
  searchQuery.value = ''
  fetchTrees()
}

// ── lifecycle ───────────────────────────────────────────────────────────

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  fetchTrees()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

// Empty-state branches
const emptyState = computed<'narrow' | 'zero' | null>(() => {
  if (pending.value || error.value || trees.value.length > 0)
    return null
  if (hasActiveFilters.value)
    return 'narrow'
  return 'zero'
})
</script>

<template>
  <div class="catalog">
    <!-- ───────── masthead ───────── -->
    <header class="catalog__masthead">
      <p class="catalog__eyebrow">
        Catalog
      </p>
      <p class="catalog__count">
        <span :class="{ 'catalog__count-num--quiet': pending }">{{ countLabel }}</span>
        <span v-if="!pending && !hasActiveFilters" class="catalog__count-tag" aria-hidden="true">· in stock</span>
      </p>
    </header>

    <!-- ───────── toolbar (sticky, reveal on scroll-up) ───────── -->
    <div
      class="catalog__toolbar-wrap"
      :class="{
        'is-pinned': toolbarPinned,
        'is-hidden': toolbarPinned && !toolbarVisible,
      }"
    >
      <div class="catalog__toolbar">
        <GalleryFilterToolbar
          :model-value="filters"
          :search-query="searchQuery"
          @update:model-value="updateFilters"
          @update:search-query="updateSearch"
          @open-mobile="mobileSheetOpen = true"
        />
      </div>
    </div>

    <!-- ───────── active filter pills ───────── -->
    <div v-if="activeFilterCount > 0" class="catalog__pills">
      <GalleryFilterPills
        :model-value="filters"
        @remove-species="removeSpecies"
        @remove-size="removeSize"
        @remove-care="removeCare"
        @clear-all="clearAll"
      />
    </div>

    <!-- ───────── grid / states ───────── -->
    <section class="catalog__grid-wrap" :aria-busy="pending ? 'true' : 'false'">
      <!-- loading: skeleton grid -->
      <ul v-if="pending" class="catalog__grid" aria-label="Loading catalog">
        <li v-for="n in 8" :key="n">
          <GalleryCardSkeleton />
        </li>
      </ul>

      <!-- error -->
      <div v-else-if="error" class="catalog__notice" role="alert">
        <p class="catalog__notice-line">
          {{ error }}
        </p>
        <button type="button" class="catalog__notice-action" @click="fetchTrees()">
          Try again
        </button>
      </div>

      <!-- empty (filters narrow) -->
      <div v-else-if="emptyState === 'narrow'" class="catalog__notice">
        <p class="catalog__notice-line">
          Nothing in stock matches that combination right now.
        </p>
        <p class="catalog__notice-body">
          Clear the filters to see the full catalog, or visit the archive of past specimens.
        </p>
        <div class="catalog__notice-actions">
          <button type="button" class="catalog__notice-action" @click="clearAll">
            Clear filters
          </button>
          <NuxtLink to="/archive" class="catalog__notice-action">
            Browse the archive
          </NuxtLink>
        </div>
      </div>

      <!-- empty (zero stock) -->
      <div v-else-if="emptyState === 'zero'" class="catalog__notice">
        <p class="catalog__notice-line">
          The bench is between specimens.
        </p>
        <p class="catalog__notice-body">
          New trees come up most weeks — leave an address at the foot of the page and we’ll write when the next is ready.
        </p>
      </div>

      <!-- grid -->
      <ul v-else class="catalog__grid">
        <li
          v-for="(tree, i) in trees"
          :key="tree.id"
          class="catalog__cell"
          :style="{ animationDelay: `${Math.min(i, 11) * 25}ms` }"
        >
          <GalleryTreeCard :tree="tree" />
        </li>
        <!-- append skeletons while loading more -->
        <template v-if="loadingMore">
          <li v-for="n in 4" :key="`s-${n}`">
            <GalleryCardSkeleton />
          </li>
        </template>
      </ul>

      <!-- load more -->
      <div v-if="!pending && !error && hasMore" class="catalog__more">
        <button
          type="button"
          class="catalog__more-btn"
          :disabled="loadingMore"
          @click="loadMore"
        >
          <span v-if="loadingMore">loading more</span>
          <span v-else>load twelve more</span>
          <span class="catalog__more-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>

    <!-- ───────── mobile filter sheet ───────── -->
    <GalleryMobileFilterSheet
      :open="mobileSheetOpen"
      :model-value="filters"
      @update:open="mobileSheetOpen = $event"
      @update:model-value="updateFilters"
    />
  </div>
</template>

<style scoped>
.catalog {
  --nav-h: 4.75rem;
  --catalog-pad-x: clamp(1.25rem, 4vw, 3rem);
  --catalog-max-w: 96rem;

  min-height: 100vh;
  padding-top: var(--nav-h);
  background: var(--surface);
  color: var(--text);
}

/* ───────── masthead ───────── */

.catalog__masthead {
  max-width: var(--catalog-max-w);
  margin: 0 auto;
  padding: var(--space-2xl) var(--catalog-pad-x) var(--space-xl);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: var(--space-md);
  border-bottom: 1px solid var(--border-hair);
}

@media (max-width: 480px) {
  .catalog__masthead {
    grid-template-columns: 1fr;
    padding-top: var(--space-xl);
    padding-bottom: var(--space-md);
  }
}

.catalog__eyebrow {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--accent);
  font-feature-settings: var(--feat-small-caps);
}

.catalog__count {
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  color: var(--text-muted);
  font-feature-settings: var(--feat-spec-data);
  letter-spacing: 0.01em;
}

.catalog__count-num--quiet {
  opacity: 0.6;
}

.catalog__count-tag {
  color: var(--text-faint);
  font-style: normal;
  margin-left: 0.2em;
}

/* ───────── toolbar (sticky, reveal on scroll-up) ───────── */

.catalog__toolbar-wrap {
  position: sticky;
  top: var(--nav-h);
  /* One layer below the fixed navbar so the navbar's solid surface
     covers the toolbar as it slides out of view on scroll-down. */
  z-index: var(--z-raised);
  background: var(--surface);
  border-bottom: 1px solid transparent;
  transition:
    transform var(--duration-base) var(--ease-out-quart),
    border-color var(--duration-base) var(--ease-out-quart),
    background-color var(--duration-base) var(--ease-out-quart);
}

.catalog__toolbar-wrap.is-pinned {
  background: color-mix(in oklch, var(--surface) 92%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom-color: var(--border-hair);
}

.catalog__toolbar-wrap.is-hidden {
  transform: translateY(-110%);
}

.catalog__toolbar {
  max-width: var(--catalog-max-w);
  margin: 0 auto;
  padding: var(--space-sm) var(--catalog-pad-x);
}

/* ───────── pills ───────── */

.catalog__pills {
  max-width: var(--catalog-max-w);
  margin: 0 auto;
  padding: var(--space-sm) var(--catalog-pad-x) 0;
}

/* ───────── grid + states ───────── */

.catalog__grid-wrap {
  max-width: var(--catalog-max-w);
  margin: 0 auto;
  padding: var(--space-lg) var(--catalog-pad-x) var(--space-3xl);
}

.catalog__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  column-gap: var(--space-lg);
  row-gap: var(--space-xl);
}

.catalog__cell {
  animation: card-in var(--duration-slow) var(--ease-out-quart) both;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ───────── notices (empty / error) ───────── */

.catalog__notice {
  padding: var(--space-3xl) 0;
  display: grid;
  gap: var(--space-md);
  justify-items: start;
  max-width: 46ch;
}

.catalog__notice-line {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3.2vw, 2rem);
  line-height: 1.15;
  color: var(--text);
  letter-spacing: -0.012em;
}

.catalog__notice-body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text-muted);
}

.catalog__notice-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-2xs);
}

.catalog__notice-action {
  background: transparent;
  border: 0;
  padding: 0;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
  text-decoration: none;
  position: relative;
  display: inline-block;
  padding-bottom: 0.25em;
}

.catalog__notice-action::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--accent);
  transform: scaleX(1);
  transform-origin: left;
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.catalog__notice-action:hover::after {
  transform: scaleX(0);
  transform-origin: right;
}

.catalog__notice-action:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

/* ───────── load more ───────── */

.catalog__more {
  display: flex;
  justify-content: center;
  padding-top: var(--space-2xl);
}

.catalog__more-btn {
  display: inline-flex;
  align-items: baseline;
  gap: 0.6em;
  background: transparent;
  border: 0;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.125rem;
  color: var(--text);
  cursor: pointer;
  position: relative;
}

.catalog__more-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.catalog__more-btn::after {
  content: '';
  position: absolute;
  left: var(--space-md);
  right: var(--space-md);
  bottom: var(--space-2xs);
  height: 1px;
  background: var(--text-faint);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.catalog__more-btn:hover:not(:disabled)::after,
.catalog__more-btn:focus-visible::after {
  transform: scaleX(1);
}

.catalog__more-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.catalog__more-arrow {
  display: inline-block;
  transition: transform var(--duration-base) var(--ease-out-quart);
  font-family: var(--font-body);
  font-style: normal;
  color: var(--accent);
}

.catalog__more-btn:hover:not(:disabled) .catalog__more-arrow {
  transform: translateX(0.25em);
}
</style>
