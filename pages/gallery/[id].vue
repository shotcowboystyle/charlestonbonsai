<script setup lang="ts">
import type { Ref } from 'vue'
import type { PublicTreesResponse } from '~/server/api/trees/list.get'
import type { PublicTree } from '~/types'
import { CARE_LEVEL_LABELS, TREE_SIZE_SHORT_LABELS, TREE_TYPE_LABELS } from '~/types'

const route = useRoute()
const slug = route.params.id as string
const { siteName, contactEmail } = useSite()

const { data: fetched, error: fetchError } = await useFetch<PublicTree>(`/api/trees/${slug}`)

// Surface real HTTP status. A missing specimen is a true 404 so search
// engines drop the URL; an unreachable API is whatever status the fetch
// returned. The styled error surface lives in error.vue.
if (fetchError.value || !fetched.value) {
  throw createError({
    statusCode: fetchError.value?.statusCode ?? 404,
    statusMessage: fetchError.value?.statusMessage ?? 'That specimen isn’t in the catalog.',
    fatal: true,
  })
}

// Narrowed ref — the createError above guarantees fetched.value is a
// PublicTree from this point on. The cast lets the template skip null checks.
const tree = fetched as Ref<PublicTree>

useHead({
  title: `${tree.value.name} — ${siteName}`,
  meta: [
    {
      name: 'description',
      content: tree.value.shortDescription || `${tree.value.name} — a specimen from the ${siteName} catalog.`,
    },
  ],
})

// ── images ──────────────────────────────────────────────────────────────

const allImages = computed<string[]>(() => {
  if (!tree.value)
    return []
  const images = [...tree.value.images]
  if (tree.value.thumbnail && !images.includes(tree.value.thumbnail))
    images.unshift(tree.value.thumbnail)
  return images.length > 0 ? images : ['/images/trees/placeholder-thumb.svg']
})

const heroImage = computed(() => allImages.value[0] ?? '/images/trees/placeholder-thumb.svg')
const additionalPlates = computed(() => allImages.value.slice(1))

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/images/trees/placeholder-thumb.svg'
}

// ── 3D lens ─────────────────────────────────────────────────────────────

const isThreeDActive = ref(false)
const hasModel = computed(() => Boolean(tree.value?.model3dUrl))

function toggleThreeD() {
  isThreeDActive.value = !isThreeDActive.value
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && isThreeDActive.value) {
    isThreeDActive.value = false
  }
}

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

// ── caption ─────────────────────────────────────────────────────────────

interface CaptionPair {
  label: string
  value: string
}

const captionPairs = computed<CaptionPair[]>(() => {
  if (!tree.value)
    return []
  const t = tree.value
  const pairs: CaptionPair[] = []
  if (t.age)
    pairs.push({ label: 'Age', value: `${t.age} yrs` })
  if (t.height)
    pairs.push({ label: 'Height', value: t.height })
  if (t.size)
    pairs.push({ label: 'Size', value: TREE_SIZE_SHORT_LABELS[t.size] ?? t.size })
  if (t.potType)
    pairs.push({ label: 'Pot', value: t.potType })
  if (t.careLevel)
    pairs.push({ label: 'Care', value: CARE_LEVEL_LABELS[t.careLevel] ?? t.careLevel })
  if (t.treeType)
    pairs.push({ label: 'Species', value: TREE_TYPE_LABELS[t.treeType] ?? t.treeType })
  return pairs
})

// ── inquire link ────────────────────────────────────────────────────────

const inquireLink = computed(() => {
  if (!tree.value)
    return '#'
  const subject = encodeURIComponent(`Inquiry — ${tree.value.name}`)
  const body = encodeURIComponent(`Hi, I'd like to know if ${tree.value.name} is still available.`)
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`
})

const notifyLink = computed(() => {
  if (!tree.value)
    return '#'
  const subject = encodeURIComponent(`Notify me — similar to ${tree.value.name}`)
  const body = encodeURIComponent(`Hi, I was interested in ${tree.value.name} but see it has been sold. Please write when similar trees are ready.`)
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`
})

// ── related ─────────────────────────────────────────────────────────────

// useAsyncData runs during SSR so the related row is rendered in the
// initial HTML — search engines see the cross-links, and the page does
// not shift on hydration.
const treeId = tree.value.id
const treeType = tree.value.treeType
const { data: relatedTrees } = await useAsyncData<PublicTree[]>(
  `related-${slug}`,
  async () => {
    // Over-fetch by one so we can drop the current tree if it appears in
    // the page, while still returning up to 3 related specimens.
    const result = await $fetch<PublicTreesResponse>('/api/trees/list', {
      query: {
        treeTypes: [treeType],
        inStockOnly: true,
        pageSize: 4,
      },
    })
    return result.trees.filter(t => t.id !== treeId).slice(0, 3)
  },
  { default: () => [] },
)
</script>

<template>
  <div class="monograph">
    <article class="monograph__shell">
      <NuxtLink to="/gallery" class="monograph__return">
        <span aria-hidden="true">←</span>
        back to the catalog
      </NuxtLink>

      <header class="monograph__masthead">
        <p class="monograph__species">
          <em>{{ tree.species }}</em>
        </p>
        <div class="monograph__title-row">
          <h1 class="monograph__name">
            {{ tree.name }}
          </h1>
          <p class="monograph__price">
            Price on inquiry
          </p>
        </div>
        <p v-if="!tree.inStock" class="monograph__status">
          Sold
        </p>
      </header>

      <!-- hero plate -->
      <figure class="monograph__hero" :class="{ 'is-3d': isThreeDActive }">
        <div class="monograph__hero-inner">
          <img
            v-show="!isThreeDActive"
            :src="heroImage"
            :alt="`${tree.name} — ${tree.species}`"
            class="monograph__hero-image"
            fetchpriority="high"
            @error="handleImageError"
          >
          <GalleryTreeViewer3D
            v-if="hasModel && isThreeDActive"
            :model-url="tree.model3dUrl!"
            :require-activation="false"
            class="monograph__hero-viewer"
          />
        </div>
        <button
          v-if="hasModel"
          type="button"
          class="monograph__lens"
          :class="{ 'monograph__lens--active': isThreeDActive }"
          :aria-pressed="isThreeDActive"
          :aria-label="isThreeDActive ? 'Return to still photograph' : 'View as three-dimensional model'"
          @click="toggleThreeD"
        >
          <span v-if="isThreeDActive" aria-hidden="true">× still</span>
          <span v-else aria-hidden="true">3D</span>
        </button>
        <figcaption v-if="isThreeDActive" class="monograph__hero-caption">
          Drag to rotate
          <span class="monograph__hero-caption-sep" aria-hidden="true">·</span>
          pinch or scroll to zoom
          <span class="monograph__hero-caption-sep" aria-hidden="true">·</span>
          press × or Esc to return
        </figcaption>
      </figure>

      <!-- museum caption -->
      <dl v-if="captionPairs.length" class="monograph__caption">
        <div v-for="pair in captionPairs" :key="pair.label" class="monograph__caption-pair">
          <dt>{{ pair.label }}</dt>
          <dd>{{ pair.value }}</dd>
        </div>
      </dl>

      <!-- prose description -->
      <section
        v-if="tree.description"
        class="monograph__prose prose"
        v-html="tree.description"
      />

      <!-- inquire -->
      <div class="monograph__inquire">
        <template v-if="tree.inStock">
          <a :href="inquireLink" class="monograph__inquire-link">
            Write to inquire about this tree
            <span aria-hidden="true">→</span>
          </a>
          <p class="monograph__inquire-helper">
            Opens in your email · {{ contactEmail }}
          </p>
        </template>
        <template v-else>
          <a :href="notifyLink" class="monograph__inquire-link">
            This specimen has been sold. Write to be notified of similar trees
            <span aria-hidden="true">→</span>
          </a>
        </template>
      </div>

      <!-- additional plates -->
      <div v-if="additionalPlates.length" class="monograph__plates">
        <figure
          v-for="(image, i) in additionalPlates"
          :key="`${tree.id}-plate-${i}`"
          class="monograph__plate"
        >
          <div class="monograph__plate-inner">
            <img
              :src="image"
              :alt="`${tree.name}, additional view ${i + 2}`"
              loading="lazy"
              @error="handleImageError"
            >
          </div>
          <figcaption class="monograph__plate-caption">
            Plate {{ String(i + 2).padStart(2, '0') }}
          </figcaption>
        </figure>
      </div>

      <!-- features -->
      <p v-if="tree.features?.length" class="monograph__features">
        <span class="monograph__features-label">Features</span>
        <span class="monograph__features-sep" aria-hidden="true">·</span>
        <span class="monograph__features-list">
          <template v-for="(f, i) in tree.features" :key="f">
            <span>{{ f }}</span>
            <span v-if="i < tree.features.length - 1" class="monograph__features-sep" aria-hidden="true">·</span>
          </template>
        </span>
      </p>

      <hr class="monograph__rule">

      <!-- related -->
      <section v-if="relatedTrees.length" class="monograph__related" aria-labelledby="related-eyebrow">
        <h2 id="related-eyebrow" class="monograph__related-eyebrow">
          Also in this species
        </h2>
        <ul class="monograph__related-grid">
          <li v-for="related in relatedTrees" :key="related.id">
            <GalleryTreeCard :tree="related" />
          </li>
        </ul>
      </section>
    </article>
  </div>
</template>

<style scoped>
.monograph {
  --nav-h: 4.75rem;
  --col-pad-x: clamp(1.25rem, 5vw, 2.5rem);
  --col-max: 56rem;
  --reading-max: 38rem;

  min-height: 100vh;
  padding-top: var(--nav-h);
  background: var(--surface);
  color: var(--text);
}

.monograph__shell {
  max-width: var(--col-max);
  margin: 0 auto;
  padding: var(--space-xl) var(--col-pad-x) var(--space-3xl);
}

/* ──────── return link ──────── */

.monograph__return {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5em;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  text-decoration: none;
  padding: var(--space-2xs) 0;
  margin-bottom: var(--space-2xl);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.monograph__return:hover {
  color: var(--text);
}

.monograph__return:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

/* ──────── masthead ──────── */

.monograph__masthead {
  margin-bottom: var(--space-xl);
  display: grid;
  gap: var(--space-2xs);
}

.monograph__species {
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--text-faint);
  letter-spacing: 0.01em;
}

.monograph__title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: var(--space-md);
  row-gap: var(--space-2xs);
}

@media (max-width: 480px) {
  .monograph__title-row {
    grid-template-columns: 1fr;
  }
}

.monograph__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2rem, 4.5vw, 3rem);
  line-height: 1.05;
  letter-spacing: -0.025em;
  color: var(--text);
}

/* "Price on inquiry" reads as a status tag in the masthead — small caps
   in body face so the tree name remains the sole typographic anchor. */
.monograph__price {
  margin: 0;
  align-self: baseline;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  line-height: 1.4;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  white-space: nowrap;
}

.monograph__status {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--accent);
  font-feature-settings: var(--feat-small-caps);
}

/* ──────── hero plate ──────── */

.monograph__hero {
  position: relative;
  margin: 0 0 var(--space-md);
  background: var(--surface-raised);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.monograph__hero-inner {
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--surface-sunken);
}

.monograph__hero-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.monograph__hero-viewer {
  position: absolute;
  inset: 0;
}

.monograph__lens {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  padding: 0.4rem 0.7rem;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
  transition:
    background-color var(--duration-base) var(--ease-out-quart),
    color var(--duration-base) var(--ease-out-quart),
    border-color var(--duration-base) var(--ease-out-quart);
}

.monograph__lens:hover {
  border-color: var(--text);
}

.monograph__lens--active {
  background: var(--text);
  color: var(--surface);
  border-color: var(--text);
}

.monograph__lens:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.monograph__hero-caption {
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--border-hair);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-faint);
  text-align: center;
}

.monograph__hero-caption-sep {
  margin: 0 0.4em;
  color: var(--text-faint);
  opacity: 0.6;
}

/* ──────── caption (museum spec block) ──────── */

.monograph__caption {
  margin: 0 0 var(--space-2xl);
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2xs) var(--space-md);
}

.monograph__caption-pair {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5em;
  font-family: var(--font-body);
  font-size: 0.875rem;
}

.monograph__caption-pair dt {
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
}

.monograph__caption-pair dd {
  margin: 0;
  color: var(--text);
  font-feature-settings: var(--feat-spec-data);
}

/* ──────── prose ──────── */

.monograph__prose {
  margin: 0 0 var(--space-2xl);
  max-width: var(--reading-max);
}

/* ──────── inquire ──────── */

.monograph__inquire {
  margin: 0 0 var(--space-3xl);
  max-width: var(--reading-max);
  display: grid;
  gap: var(--space-2xs);
}

.monograph__inquire-link {
  position: relative;
  display: inline-block;
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  color: var(--text);
  text-decoration: none;
  padding-bottom: 0.2em;
  width: max-content;
  max-width: 100%;
}

.monograph__inquire-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.monograph__inquire-link:hover::after,
.monograph__inquire-link:focus-visible::after {
  transform: scaleX(1);
}

.monograph__inquire-link:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.monograph__inquire-helper {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-faint);
}

/* ──────── additional plates ──────── */

.monograph__plates {
  display: grid;
  gap: var(--space-3xl);
  margin-bottom: var(--space-3xl);
}

.monograph__plate {
  margin: 0;
}

.monograph__plate-inner {
  background: var(--surface-raised);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.monograph__plate-inner img {
  display: block;
  width: 100%;
  height: auto;
  background: var(--surface-sunken);
}

.monograph__plate-caption {
  margin-top: var(--space-xs);
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
}

/* ──────── features ──────── */

.monograph__features {
  margin: 0 0 var(--space-2xl);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45em;
}

.monograph__features-label {
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
}

.monograph__features-list {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45em;
}

.monograph__features-sep {
  color: var(--text-faint);
}

/* ──────── closing rule + related ──────── */

.monograph__rule {
  border: 0;
  border-top: 1px solid var(--border-hair);
  margin: var(--space-3xl) 0 var(--space-2xl);
}

.monograph__related {
  margin-bottom: var(--space-xl);
}

.monograph__related-eyebrow {
  margin: 0 0 var(--space-lg);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--accent);
  font-feature-settings: var(--feat-small-caps);
}

.monograph__related-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
  column-gap: var(--space-lg);
  row-gap: var(--space-xl);
}

/* ──────── dark-mode display weight bump ──────── */

[data-theme='dark'] .monograph__name {
  font-weight: 700;
}

/* ──────── prose (TipTap output) ──────── */

/* Inherited defaults: covers seeded plain-text descriptions that come
   through without paragraph tags. TipTap-authored content uses the
   element-specific overrides below. */
.prose {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text);
}

.prose :deep(p) {
  margin: 0 0 1.1em;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text);
}

.prose :deep(p:last-child) {
  margin-bottom: 0;
}

.prose :deep(h2) {
  margin: 2em 0 0.6em;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.375rem, 2.4vw, 1.625rem);
  line-height: 1.2;
  letter-spacing: -0.012em;
  color: var(--text);
}

.prose :deep(h3) {
  margin: 1.6em 0 0.4em;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 1.125rem;
  color: var(--text);
}

.prose :deep(h2:first-child),
.prose :deep(h3:first-child) {
  margin-top: 0;
}

.prose :deep(blockquote) {
  margin: 1.4em 0;
  padding-left: var(--space-md);
  border-left: 1px solid var(--accent);
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.125rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.prose :deep(ul),
.prose :deep(ol) {
  margin: 0 0 1.1em;
  padding-left: 1.25em;
}

.prose :deep(li) {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text);
  margin-bottom: 0.25em;
}

.prose :deep(a) {
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 0.05em;
  transition: color var(--duration-base) var(--ease-out-quart);
}

.prose :deep(a:hover) {
  color: var(--accent);
}

.prose :deep(strong) {
  font-weight: 700;
  color: var(--text);
}

.prose :deep(em) {
  font-style: italic;
}

[data-theme='dark'] .prose :deep(p),
[data-theme='dark'] .prose :deep(li) {
  line-height: 1.72;
}

[data-theme='dark'] .prose :deep(h2) {
  font-weight: 700;
}
</style>
