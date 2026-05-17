<script setup lang="ts">
import type { Tree } from '~/types'

interface Props {
  tree: Tree
}

const props = defineProps<Props>()

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/images/trees/placeholder-thumb.svg'
}

const priceFormatted = computed(() =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(props.tree.price),
)
</script>

<template>
  <NuxtLink
    :to="`/gallery/${tree.slug}`"
    class="specimen group"
  >
    <div class="specimen__plate">
      <img
        :src="tree.thumbnail"
        :alt="tree.name"
        class="specimen__image"
        loading="lazy"
        @error="handleImageError"
      >
      <span
        v-if="!tree.inStock"
        class="specimen__sold"
      >
        Sold
      </span>
    </div>

    <div class="specimen__caption">
      <p class="specimen__species">
        <em>{{ tree.species }}</em>
      </p>
      <p class="specimen__name">
        {{ tree.name }}
      </p>
      <p class="specimen__price">
        <span class="specimen__rule" aria-hidden="true" />
        {{ priceFormatted }}
        <svg
          class="specimen__arrow"
          viewBox="0 0 24 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 6h22M17 1l5 5-5 5" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
        </svg>
      </p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.specimen {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  text-decoration: none;
  color: var(--text);
}

.specimen__plate {
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--surface-raised);
  overflow: hidden;
}

.specimen__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity var(--duration-slow) var(--ease-out-quart);
}

.specimen:hover .specimen__image,
.specimen:focus-visible .specimen__image {
  opacity: 0.92;
}

.specimen__sold {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  padding: var(--space-3xs) var(--space-2xs);
  font-feature-settings: var(--feat-small-caps);
}

.specimen__caption {
  display: grid;
  gap: var(--space-3xs);
}

.specimen__species {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--text-muted);
  font-feature-settings: var(--feat-running-text);
  margin: 0;
}

.specimen__species em {
  font-style: italic;
}

.specimen__name {
  font-family: var(--font-body);
  font-size: 0.875rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-small-caps);
}

.specimen__price {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text);
  font-feature-settings: var(--feat-spec-data);
  margin-top: var(--space-2xs);
  margin-bottom: 0;
}

.specimen__rule {
  display: inline-block;
  height: 1px;
  width: var(--space-md);
  background: var(--ink-4);
  transition:
    width var(--duration-slow) var(--ease-out-quart),
    background var(--duration-slow) var(--ease-out-quart);
}

.specimen:hover .specimen__rule,
.specimen:focus-visible .specimen__rule {
  width: var(--space-xl);
  background: var(--accent);
}

.specimen__arrow {
  width: 1.25rem;
  height: 0.625rem;
  margin-left: auto;
  color: var(--text-faint);
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity var(--duration-base) var(--ease-out-quart),
    transform var(--duration-base) var(--ease-out-quart),
    color var(--duration-base) var(--ease-out-quart);
}

.specimen:hover .specimen__arrow,
.specimen:focus-visible .specimen__arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--accent);
}
</style>
