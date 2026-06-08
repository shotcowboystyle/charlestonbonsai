<script setup lang="ts">
import type { Tree } from '~/types'
import { TREE_SIZE_LABELS } from '~/types'

const { siteName, contactEmail, contactMailto } = useSite()

useHead({
  title: `${siteName} — A working nursery`,
  meta: [
    {
      name: 'description',
      content: 'Specimen bonsai cultivated and trained by hand in Charleston, South Carolina. A working catalog for serious collectors.',
    },
  ],
})

const { data: featuredTrees, pending } = await useFetch<Tree[]>('/api/trees/featured', {
  default: () => [],
})

const hasFeatured = computed(() => Boolean(featuredTrees.value && featuredTrees.value.length > 0))

const heroSpecimen = computed<Tree | null>(() => featuredTrees.value?.[0] ?? null)
const editorialSpecimen = computed<Tree | null>(() => featuredTrees.value?.[1] ?? null)
const gridSpecimens = computed<Tree[]>(() => featuredTrees.value?.slice(2) ?? [])

const currentYear = new Date().getFullYear()

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/images/trees/placeholder-thumb.svg'
}

// Opacity-only reveal on scroll. Hero is excluded; it is visible immediately.
// Under prefers-reduced-motion, the transition duration in tokens.css is 0ms,
// so the class toggle has no visible effect — content simply appears.
const observerTargets: Element[] = []

function registerReveal(el: unknown) {
  if (el && typeof el === 'object' && 'classList' in el)
    observerTargets.push(el as Element)
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    observerTargets.forEach(el => el.classList.add('is-visible'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -80px 0px' },
  )

  observerTargets.forEach(el => observer.observe(el))

  onBeforeUnmount(() => observer.disconnect())
})
</script>

<template>
  <div class="atelier">
    <!-- ───────────────────────────────────────────────────
         I. OPENING PLATE — A single tree.
         No headline. No CTA. The tree is the page.
         ─────────────────────────────────────────────────── -->
    <section class="plate" aria-labelledby="plate-eyebrow">
      <header class="plate__masthead">
        <p id="plate-eyebrow" class="plate__eyebrow">
          <span>{{ siteName }}</span>
          <span class="plate__bullet" aria-hidden="true">·</span>
          <span>A working nursery</span>
        </p>
      </header>

      <div class="plate__image">
        <img
          v-if="heroSpecimen?.thumbnail"
          :src="heroSpecimen.thumbnail"
          :alt="`${heroSpecimen.name} — ${heroSpecimen.species}`"
          fetchpriority="high"
          @error="handleImageError"
        >
        <div v-else class="plate__placeholder" aria-hidden="true" />
      </div>

      <figcaption v-if="heroSpecimen" class="plate__caption">
        <p class="plate__caption-eyebrow">
          Specimen 01
        </p>
        <p class="plate__species">
          <em>{{ heroSpecimen.species }}</em>
        </p>
        <p class="plate__name">
          {{ heroSpecimen.name }}
        </p>
        <dl class="plate__meta">
          <div v-if="heroSpecimen.age">
            <dt>Age</dt>
            <dd>{{ heroSpecimen.age }} years</dd>
          </div>
          <div v-if="heroSpecimen.height">
            <dt>Height</dt>
            <dd>{{ heroSpecimen.height }} cm</dd>
          </div>
          <div>
            <dt>Class</dt>
            <dd>{{ TREE_SIZE_LABELS[heroSpecimen.size] || heroSpecimen.size }}</dd>
          </div>
        </dl>
      </figcaption>

      <footer class="plate__footer">
        <span class="plate__year">Est. {{ currentYear }}</span>
        <span class="plate__lat">32°47′N · 79°55′W</span>
      </footer>
    </section>

    <!-- ───────────────────────────────────────────────────
         II. THE WORK — A statement.
         Plain-spoken. No marketing. A single accent rule.
         ─────────────────────────────────────────────────── -->
    <section :ref="registerReveal" class="work reveal" aria-labelledby="work-heading">
      <p class="work__eyebrow">
        <span class="work__numeral">II</span>
        <span>The Work</span>
      </p>
      <h2 id="work-heading" class="work__statement">
        Each tree here has been wired by hand, repotted on its own schedule,
        and watched through more than one season. Nothing in this catalog
        was assembled for sale. Trees are sold when they are finished
        enough to leave.
      </h2>
      <span class="work__rule" aria-hidden="true" />
    </section>

    <!-- ───────────────────────────────────────────────────
         III. THE HAND — Process and a specimen of work.
         Asymmetric two-column. Prose + a hand-set spec block.
         ─────────────────────────────────────────────────── -->
    <section :ref="registerReveal" class="hand reveal" aria-labelledby="hand-heading">
      <div class="hand__image">
        <img
          src="/images/hero/pattern.svg"
          alt="A juniper after wiring, mid-season."
          loading="lazy"
        >
        <p class="hand__caption">
          A juniper after wiring, mid-season.
        </p>
      </div>

      <div class="hand__copy">
        <p class="hand__eyebrow">
          <span class="hand__numeral">III</span>
          <span>The Hand</span>
        </p>
        <h2 id="hand-heading" class="hand__heading">
          The work is mostly waiting and noticing.
        </h2>
        <div class="hand__prose">
          <p>
            Training a juniper takes a decade before the silhouette earns its
            first photograph. Pruning is a series of decisions you live with
            for years — a branch removed in October is settled by April.
          </p>
          <p>
            Repotting follows the species, not the calendar: <em>chinensis</em>
            on a four-year interval, <em>californica</em> on three. The pot is
            chosen after the tree has told you what it is, which is usually the
            last decision and never the first.
          </p>
          <p>
            Charleston is a return address, not a theme. The climate sets the
            schedule. The aesthetic is the species's own.
          </p>
        </div>

        <dl class="hand__specs">
          <div>
            <dt>Trained in-house</dt>
            <dd>Yamadori, nursery stock, collected</dd>
          </div>
          <div>
            <dt>Repot interval</dt>
            <dd>Species-specific, 2–5 years</dd>
          </div>
          <div>
            <dt>Wiring season</dt>
            <dd>Late winter, copper &amp; annealed aluminum</dd>
          </div>
          <div>
            <dt>Soil</dt>
            <dd>Akadama, pumice, lava — blended by species</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ───────────────────────────────────────────────────
         IV. THE CATALOG — Editorial specimen.
         A single tree in full detail. The centerpiece.
         ─────────────────────────────────────────────────── -->
    <section
      v-if="editorialSpecimen"
      :ref="registerReveal"
      class="editorial reveal"
      aria-labelledby="editorial-heading"
    >
      <header class="editorial__header">
        <p class="editorial__eyebrow">
          <span class="editorial__numeral">IV</span>
          <span>The Catalog · Featured</span>
        </p>
        <h2 id="editorial-heading" class="editorial__heading">
          From the working catalog.
        </h2>
      </header>

      <NuxtLink :to="`/gallery/${editorialSpecimen.slug}`" class="editorial__plate">
        <img
          :src="editorialSpecimen.thumbnail"
          :alt="`${editorialSpecimen.name} — ${editorialSpecimen.species}`"
          loading="lazy"
          @error="handleImageError"
        >
      </NuxtLink>

      <div class="editorial__caption">
        <div class="editorial__id">
          <p class="editorial__species">
            <em>{{ editorialSpecimen.species }}</em>
          </p>
          <p class="editorial__name">
            {{ editorialSpecimen.name }}
          </p>
        </div>

        <dl class="editorial__meta">
          <div v-if="editorialSpecimen.age">
            <dt>Age</dt>
            <dd>{{ editorialSpecimen.age }} yrs</dd>
          </div>
          <div v-if="editorialSpecimen.height">
            <dt>Height</dt>
            <dd>{{ editorialSpecimen.height }} cm</dd>
          </div>
          <div>
            <dt>Class</dt>
            <dd>{{ TREE_SIZE_LABELS[editorialSpecimen.size] || editorialSpecimen.size }}</dd>
          </div>
          <div v-if="editorialSpecimen.potType">
            <dt>Pot</dt>
            <dd>{{ editorialSpecimen.potType }}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{{ formatPrice(editorialSpecimen.price) }}</dd>
          </div>
        </dl>

        <p v-if="editorialSpecimen.shortDescription" class="editorial__note">
          {{ editorialSpecimen.shortDescription }}
        </p>

        <NuxtLink :to="`/gallery/${editorialSpecimen.slug}`" class="editorial__link">
          <span>Specimen file</span>
          <svg viewBox="0 0 24 12" fill="none" aria-hidden="true">
            <path d="M0 6h22M17 1l5 5-5 5" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
          </svg>
        </NuxtLink>
      </div>
    </section>

    <!-- ───────────────────────────────────────────────────
         V. THE CATALOG — Small grid of remaining specimens.
         Quiet text link to the gallery below, not a button.
         ─────────────────────────────────────────────────── -->
    <section
      v-if="gridSpecimens.length"
      :ref="registerReveal"
      class="grid-section reveal"
      aria-labelledby="grid-heading"
    >
      <header class="grid-section__header">
        <p class="grid-section__eyebrow">
          <span class="grid-section__numeral">V</span>
          <span>The Catalog · Continued</span>
        </p>
        <h2 id="grid-heading" class="grid-section__heading">
          Also currently on the bench.
        </h2>
      </header>

      <div class="grid-section__grid" :data-count="gridSpecimens.length">
        <HomeFeaturedTreeCard
          v-for="tree in gridSpecimens"
          :key="tree.id"
          :tree="tree"
        />
      </div>

      <NuxtLink to="/gallery" class="grid-section__more">
        <span>The full catalog</span>
        <svg viewBox="0 0 24 12" fill="none" aria-hidden="true">
          <path d="M0 6h22M17 1l5 5-5 5" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
        </svg>
      </NuxtLink>
    </section>

    <!-- Catalog loading: reserve structural space, no spinner. -->
    <section v-else-if="pending" class="catalog-pending" aria-hidden="true">
      <div class="catalog-pending__plate" />
      <div class="catalog-pending__row">
        <div class="catalog-pending__small" />
        <div class="catalog-pending__small" />
        <div class="catalog-pending__small" />
      </div>
    </section>

    <!-- Catalog empty / error fallback: a single quiet message. -->
    <section v-else-if="!hasFeatured" :ref="registerReveal" class="catalog-empty reveal">
      <p class="catalog-empty__copy">
        The catalog is being updated.
        <NuxtLink to="/gallery" class="catalog-empty__link">
          Browse the full collection
          <svg viewBox="0 0 24 12" fill="none" aria-hidden="true">
            <path d="M0 6h22M17 1l5 5-5 5" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
          </svg>
        </NuxtLink>
      </p>
    </section>

    <!-- ───────────────────────────────────────────────────
         VI. THE PLACE — A quiet visit.
         Address, hours, mailto, set as a typographic block.
         ─────────────────────────────────────────────────── -->
    <section id="visit" :ref="registerReveal" class="visit reveal" aria-labelledby="visit-heading">
      <p class="visit__eyebrow">
        <span class="visit__numeral">VI</span>
        <span>The Place</span>
      </p>
      <h2 id="visit-heading" class="visit__heading">
        Visits to the nursery are by appointment.
      </h2>

      <dl class="visit__lines">
        <div>
          <dt>Where</dt>
          <dd>Charleston, South Carolina</dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>By appointment, year-round</dd>
        </div>
        <div>
          <dt>Write</dt>
          <dd>
            <a :href="contactMailto">
              {{ contactEmail }}
            </a>
          </dd>
        </div>
      </dl>

      <p class="visit__close">
        Inquiries about specific specimens, lineage, or training history are
        welcome. Please name the tree.
      </p>
    </section>
  </div>
</template>

<style scoped>
/* ============================================================
   Outer container
   ============================================================ */
.atelier {
  background: var(--surface);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

/* Numeral typographic detail — applies to every section eyebrow */
.plate__eyebrow,
.work__eyebrow,
.hand__eyebrow,
.editorial__eyebrow,
.grid-section__eyebrow,
.visit__eyebrow {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-sm);
  margin: 0;
}

.work__numeral,
.hand__numeral,
.editorial__numeral,
.grid-section__numeral,
.visit__numeral {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.8125rem;
  letter-spacing: 0;
  color: var(--accent);
  text-transform: none;
}

/* Reveal-on-scroll. Default state visible (SSR-safe). On the client,
   the .reveal class begins at opacity 0; IntersectionObserver adds
   .is-visible to fade in. Under prefers-reduced-motion the transition
   duration in tokens.css is 0ms so there is no visible delay. */
@media (prefers-reduced-motion: no-preference) {
  .reveal {
    opacity: 0;
    transition: opacity var(--duration-deliberate) var(--ease-out-expo);
  }
  .reveal.is-visible {
    opacity: 1;
  }
}

/* ============================================================
   I. OPENING PLATE
   ============================================================ */
.plate {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  padding: 5.5rem clamp(1.25rem, 4vw, 3rem) clamp(1.5rem, 3vw, 2.5rem);
  gap: var(--space-xl);
}

@media (min-width: 900px) {
  .plate {
    grid-template-columns: minmax(18rem, 1fr) minmax(0, 2.2fr);
    grid-template-rows: auto 1fr auto;
    column-gap: clamp(2rem, 5vw, 5rem);
    row-gap: var(--space-xl);
  }
}

.plate__masthead {
  grid-column: 1 / -1;
}

.plate__eyebrow {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2xs);
}

.plate__bullet {
  color: var(--accent);
  font-size: 0.875rem;
  letter-spacing: 0;
}

.plate__image {
  position: relative;
  grid-column: 1 / -1;
  grid-row: 2 / 3;
  min-height: 24rem;
  background: var(--surface-raised);
  overflow: hidden;
}

@media (min-width: 900px) {
  .plate__image {
    grid-column: 2 / 3;
    grid-row: 1 / 4;
    align-self: stretch;
    min-height: 0;
  }
}

.plate__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.plate__placeholder {
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(
      45deg,
      transparent 0 14px,
      color-mix(in oklch, var(--ink-3) 14%, transparent) 14px 15px
    );
}

.plate__caption {
  grid-column: 1 / -1;
  grid-row: 3 / 4;
  align-self: end;
  display: grid;
  gap: var(--space-2xs);
  max-width: 26rem;
}

@media (min-width: 900px) {
  .plate__caption {
    grid-column: 1 / 2;
    grid-row: 3 / 4;
    padding-bottom: var(--space-md);
  }
}

.plate__caption-eyebrow {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.875rem;
  color: var(--accent);
  margin: 0 0 var(--space-3xs);
  font-feature-settings: var(--feat-small-caps);
}

.plate__species {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0;
}

.plate__species em {
  font-style: italic;
}

.plate__name {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: var(--space-2xs) 0 0;
  font-feature-settings: var(--feat-small-caps);
}

.plate__meta {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: var(--space-md);
  margin: var(--space-md) 0 0;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-hair);
}

.plate__meta > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
}

.plate__meta dt {
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
}

.plate__meta dd {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-spec-data);
}

.plate__footer {
  grid-column: 1 / -1;
  display: none;
  justify-content: space-between;
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
}

@media (min-width: 900px) {
  .plate__footer {
    display: flex;
    grid-column: 1 / 2;
    align-self: end;
  }
}

/* ============================================================
   II. THE WORK
   ============================================================ */
.work {
  padding: var(--section-y) clamp(1.25rem, 4vw, 3rem);
  max-width: 80rem;
  margin: 0 auto;
  display: grid;
  gap: var(--space-xl);
}

.work__statement {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.625rem, 3.4vw, 2.75rem);
  line-height: 1.18;
  letter-spacing: -0.012em;
  color: var(--text);
  margin: 0;
  max-width: 32ch;
  font-feature-settings: var(--feat-running-text);
}

.work__rule {
  display: block;
  width: var(--space-xl);
  height: 1px;
  background: var(--accent);
}

/* ============================================================
   III. THE HAND
   ============================================================ */
.hand {
  padding: var(--section-y) clamp(1.25rem, 4vw, 3rem);
  max-width: 80rem;
  margin: 0 auto;
  display: grid;
  gap: var(--space-xl);
}

@media (min-width: 900px) {
  .hand {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    column-gap: clamp(2.5rem, 6vw, 5rem);
    align-items: start;
  }
}

.hand__image {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.hand__image img {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  background: var(--surface-raised);
  display: block;
}

.hand__caption {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
}

.hand__copy {
  display: grid;
  gap: var(--space-md);
}

@media (min-width: 900px) {
  .hand__copy {
    padding-top: var(--space-2xl);
  }
}

.hand__heading {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 2.8vw, 2.25rem);
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--text);
  margin: 0;
  max-width: 22ch;
}

.hand__prose {
  display: grid;
  gap: var(--space-sm);
  max-width: 38rem;
  color: var(--text-muted);
}

.hand__prose p {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.65;
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.hand__prose em {
  font-family: var(--font-display);
  font-style: italic;
  color: var(--text);
}

.hand__specs {
  display: grid;
  gap: 0;
  margin: var(--space-md) 0 0;
  border-top: 1px solid var(--border-hair);
}

.hand__specs > div {
  display: grid;
  grid-template-columns: minmax(8rem, 12rem) 1fr;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--border-hair);
}

.hand__specs dt {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
  align-self: baseline;
}

.hand__specs dd {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  color: var(--text);
  margin: 0;
  align-self: baseline;
}

/* ============================================================
   IV. EDITORIAL SPECIMEN
   ============================================================ */
.editorial {
  padding: var(--section-y) clamp(1.25rem, 4vw, 3rem);
  max-width: 90rem;
  margin: 0 auto;
  display: grid;
  gap: var(--space-xl);
}

@media (min-width: 1000px) {
  .editorial {
    grid-template-columns: minmax(0, 7fr) minmax(20rem, 4fr);
    grid-template-rows: auto 1fr;
    column-gap: clamp(2.5rem, 5vw, 5rem);
    row-gap: var(--space-2xl);
  }
}

.editorial__header {
  display: grid;
  gap: var(--space-md);
  max-width: 36rem;
}

@media (min-width: 1000px) {
  .editorial__header {
    grid-column: 1 / -1;
  }
}

.editorial__heading {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 2.6vw, 2.125rem);
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--text);
  margin: 0;
}

.editorial__plate {
  display: block;
  background: var(--surface-raised);
  overflow: hidden;
  aspect-ratio: 4 / 5;
}

.editorial__plate img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity var(--duration-slow) var(--ease-out-quart);
}

.editorial__plate:hover img,
.editorial__plate:focus-visible img {
  opacity: 0.94;
}

.editorial__caption {
  display: grid;
  gap: var(--space-md);
  align-content: start;
}

@media (min-width: 1000px) {
  .editorial__caption {
    padding-top: var(--space-md);
  }
}

.editorial__id {
  display: grid;
  gap: var(--space-3xs);
}

.editorial__species {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--text);
  margin: 0;
}

.editorial__species em {
  font-style: italic;
}

.editorial__name {
  font-family: var(--font-body);
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0;
  font-feature-settings: var(--feat-small-caps);
}

.editorial__meta {
  display: grid;
  gap: 0;
  border-top: 1px solid var(--border-hair);
}

.editorial__meta > div {
  display: grid;
  grid-template-columns: minmax(5rem, 7rem) 1fr;
  gap: var(--space-md);
  padding: var(--space-2xs) 0;
  border-bottom: 1px solid var(--border-hair);
}

.editorial__meta dt {
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
  align-self: baseline;
}

.editorial__meta dd {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-spec-data);
  align-self: baseline;
}

.editorial__note {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text-muted);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.editorial__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-body);
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  text-decoration: none;
  font-feature-settings: var(--feat-small-caps);
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: var(--space-2xs);
  width: max-content;
  transition: color var(--duration-base) var(--ease-out-quart),
              border-color var(--duration-base) var(--ease-out-quart);
}

.editorial__link svg {
  width: 1.25rem;
  height: 0.625rem;
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.editorial__link:hover,
.editorial__link:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.editorial__link:hover svg,
.editorial__link:focus-visible svg {
  transform: translateX(4px);
}

/* ============================================================
   V. CATALOG GRID
   ============================================================ */
.grid-section {
  padding: var(--section-y) clamp(1.25rem, 4vw, 3rem);
  max-width: 90rem;
  margin: 0 auto;
  display: grid;
  gap: var(--space-2xl);
}

.grid-section__header {
  display: grid;
  gap: var(--space-md);
  max-width: 36rem;
}

.grid-section__heading {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.375rem, 2.4vw, 2rem);
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--text);
  margin: 0;
}

.grid-section__grid {
  display: grid;
  gap: clamp(2rem, 4vw, 3.5rem) clamp(1.5rem, 3vw, 2.5rem);
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .grid-section__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1000px) {
  .grid-section__grid[data-count="3"] {
    grid-template-columns: repeat(3, 1fr);
  }
  .grid-section__grid[data-count="4"] {
    grid-template-columns: repeat(4, 1fr);
  }
}

.grid-section__more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-body);
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  text-decoration: none;
  font-feature-settings: var(--feat-small-caps);
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: var(--space-2xs);
  width: max-content;
  justify-self: start;
  transition: color var(--duration-base) var(--ease-out-quart),
              border-color var(--duration-base) var(--ease-out-quart);
}

.grid-section__more svg {
  width: 1.25rem;
  height: 0.625rem;
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.grid-section__more:hover,
.grid-section__more:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.grid-section__more:hover svg,
.grid-section__more:focus-visible svg {
  transform: translateX(4px);
}

/* ============================================================
   Catalog states — pending & empty
   ============================================================ */
.catalog-pending {
  padding: var(--section-y) clamp(1.25rem, 4vw, 3rem);
  max-width: 90rem;
  margin: 0 auto;
  display: grid;
  gap: var(--space-2xl);
}

.catalog-pending__plate {
  width: 100%;
  aspect-ratio: 4 / 5;
  background: var(--surface-raised);
  border: 1px solid var(--border-hair);
}

.catalog-pending__row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
}

.catalog-pending__small {
  aspect-ratio: 4 / 5;
  background: var(--surface-raised);
  border: 1px solid var(--border-hair);
}

.catalog-empty {
  padding: var(--section-y) clamp(1.25rem, 4vw, 3rem);
  max-width: 80rem;
  margin: 0 auto;
}

.catalog-empty__copy {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.125rem;
  color: var(--text-muted);
  margin: 0;
}

.catalog-empty__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  margin-left: var(--space-2xs);
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: 2px;
  font-style: normal;
  font-family: var(--font-body);
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-feature-settings: var(--feat-small-caps);
  transition: color var(--duration-base) var(--ease-out-quart),
              border-color var(--duration-base) var(--ease-out-quart);
}

.catalog-empty__link svg {
  width: 1.25rem;
  height: 0.625rem;
}

.catalog-empty__link:hover,
.catalog-empty__link:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

/* ============================================================
   VI. THE PLACE
   ============================================================ */
.visit {
  padding: var(--section-y) clamp(1.25rem, 4vw, 3rem) calc(var(--section-y) * 1.2);
  max-width: 80rem;
  margin: 0 auto;
  display: grid;
  gap: var(--space-xl);
}

.visit__heading {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  line-height: 1.18;
  letter-spacing: -0.012em;
  color: var(--text);
  margin: 0;
  max-width: 26ch;
}

.visit__lines {
  display: grid;
  gap: 0;
  margin: 0;
  max-width: 38rem;
  border-top: 1px solid var(--border-hair);
}

.visit__lines > div {
  display: grid;
  grid-template-columns: minmax(5rem, 7rem) 1fr;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--border-hair);
}

.visit__lines dt {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
  align-self: baseline;
}

.visit__lines dd {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--text);
  margin: 0;
  align-self: baseline;
}

.visit__lines a {
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: 1px;
  transition: color var(--duration-base) var(--ease-out-quart),
              border-color var(--duration-base) var(--ease-out-quart);
}

.visit__lines a:hover,
.visit__lines a:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.visit__close {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text-muted);
  max-width: 38rem;
  margin: 0;
}
</style>
