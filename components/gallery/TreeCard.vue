<script setup lang="ts">
import type { PublicTree } from '~/types'
import { TREE_SIZE_SHORT_LABELS } from '~/types'

interface Props {
  tree: PublicTree
}

const props = defineProps<Props>()

const sizeShort = computed(() => TREE_SIZE_SHORT_LABELS[props.tree.size] || props.tree.size)
const hasModel = computed(() => Boolean(props.tree.model3dUrl))

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/images/trees/placeholder-thumb.svg'
}
</script>

<template>
  <NuxtLink
    :to="`/gallery/${tree.slug}`"
    class="specimen"
    :aria-label="`${tree.name} — ${tree.species}, price on inquiry`"
  >
    <figure class="specimen__frame">
      <img
        :src="tree.thumbnail"
        :alt="tree.name"
        class="specimen__photo ink-plate"
        loading="lazy"
        @error="handleImageError"
      >
      <span v-if="hasModel" class="specimen__mark" aria-label="3D viewer available">3D</span>
    </figure>

    <div class="specimen__meta">
      <h3 class="specimen__name">
        <span class="specimen__name-text">{{ tree.name }}</span>
      </h3>
      <p class="specimen__line">
        <span>Age {{ tree.age }} yrs</span>
        <span class="specimen__sep" aria-hidden="true">·</span>
        <span>{{ sizeShort }}</span>
        <span class="specimen__sep" aria-hidden="true">·</span>
        <span>{{ tree.height }}</span>
      </p>
      <!-- Every specimen in the catalog carries this, and it is the same on
           all of them, so it is set quietly under the record rather than
           beside the name where it would compete with it. It stays on the card
           rather than being stated once in the header because it is the
           commercial terms for this object, and a grid is scanned. -->
      <p class="specimen__price">
        Price on inquiry
      </p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.specimen {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  text-decoration: none;
  color: var(--text);
}

.specimen:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* ---- photograph ---- */

/* The plate. A hairline inset rather than a border, so it reads as the edge
   of a mounted print rather than as the outline of a tile, and so it does not
   add to the box the grid measures. */
.specimen__frame {
  position: relative;
  aspect-ratio: 3 / 4;
  margin: 0;
  background: var(--surface-raised);
  box-shadow: inset 0 0 0 1px var(--border-hair);
  overflow: hidden;
}

.specimen__photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1);
  transition: transform var(--duration-slow) var(--ease-out-quart);
  will-change: transform;
}

.specimen:hover .specimen__photo,
.specimen:focus-visible .specimen__photo {
  transform: scale(1.015);
}

/* ---- 3D mark ---- */

.specimen__mark {
  position: absolute;
  top: var(--space-2xs);
  right: var(--space-2xs);
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.45rem 0.15rem;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  line-height: 1;
  font-feature-settings: var(--feat-small-caps);
  text-transform: uppercase;
}

/* ---- metadata block ---- */

.specimen__meta {
  display: grid;
  gap: var(--space-3xs);
  align-content: start;
  padding: var(--space-sm) 0 0;
}

.specimen__price {
  margin: var(--space-3xs) 0 0;
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
}

.specimen__name {
  grid-column: 1;
  grid-row: 1;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 400;
  line-height: 1.25;
  color: var(--text);
  font-feature-settings: 'kern' 1, 'liga' 1;
}

.specimen__name-text {
  position: relative;
  display: inline-block;
  padding-bottom: 0.15em;
}

.specimen__name-text::after {
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

.specimen:hover .specimen__name-text::after,
.specimen:focus-visible .specimen__name-text::after {
  transform: scaleX(1);
}

/* "Price on inquiry" reads as a quiet status tag, not a numeric anchor —
   small caps in body face so the tree name stays the typographic lead. */

.specimen__line {
  grid-column: 1 / -1;
  grid-row: 2;
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--text-muted);
  font-feature-settings: var(--feat-spec-data);
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45em;
}

.specimen__sep {
  color: var(--text-faint);
}

/* Cardo's regular weight is delicate on dark surfaces — light strokes on
   near-black read as washed-out. Bump the name to the bold cut in dark
   mode so the typographic anchor of the specimen holds its presence. */
[data-theme='dark'] .specimen__name {
  font-weight: 700;
}
</style>
