<script setup lang="ts">
import type { PublicTree } from '~/types'

/**
 * The chrome for a gallery page: an index of the objects, and it jumps.
 *
 * This is not a wordmark-and-CTA bar. In a catalog the reader's question is
 * "what is in the collection", so the persistent element answers that: every
 * specimen, numbered, named by binomial, with the one currently in front of
 * them marked.
 *
 * Jumping is the part that makes it navigation rather than decoration. The
 * specimens live inside a horizontally panning act, so a fragment link cannot
 * reach them — the browser would scroll to the act and stop, leaving the rail
 * at whatever offset it happened to hold. Instead we solve for the vertical
 * scroll position whose act-progress puts the requested plate in the middle of
 * the viewport, and go there.
 */

const props = defineProps<{
  specimens: PublicTree[]
  /** Selector for the `data-sc-act="pan"` section holding the rail. */
  railAct: string
}>()

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const { siteName } = useSite()
const active = ref(-1)

function railParts() {
  const act = document.querySelector<HTMLElement>(props.railAct)
  const rail = act?.querySelector<HTMLElement>('[data-sc-pan]')
  if (!act || !rail)
    return null
  const items = Array.from(rail.querySelectorAll<HTMLElement>('[data-specimen]'))
  if (!items.length)
    return null
  // The engine sizes a pinned act to `span * 100vh` and sticks its stage for
  // one viewport, so the scroll distance that maps to progress 0..1 is the
  // section height less one viewport.
  const travelY = Math.max(act.offsetHeight - window.innerHeight, 1)
  // The rail travels exactly its own overflow, plus any `data-sc-pan` overshoot.
  const extra = Number.parseFloat(rail.getAttribute('data-sc-pan') || '0') || 0
  const travelX = Math.max(rail.scrollWidth - window.innerWidth, 0) * (1 + extra)
  return { act, rail, items, travelY, travelX }
}

/** Vertical scroll position that centres specimen `i` in the viewport. */
function scrollTargetFor(i: number) {
  const parts = railParts()
  if (!parts)
    return null
  const { act, items, travelY, travelX } = parts
  const item = items[i]
  if (!item)
    return null
  if (travelX <= 0) {
    // A rail that does not overflow never travels; the act is a still frame and
    // the honest answer is the top of it.
    return act.offsetTop
  }
  const centre = item.offsetLeft + item.offsetWidth / 2
  const wanted = Math.min(Math.max(centre - window.innerWidth / 2, 0), travelX)
  return act.offsetTop + (wanted / travelX) * travelY
}

function jump(i: number) {
  const y = scrollTargetFor(i)
  if (y == null)
    return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' })
}

/**
 * Which plate is in front of the reader. Read from the rail's real position
 * rather than from act progress, so it stays honest if the act ever falls back
 * to a native scroll region (which is what reduced motion does to a pan).
 */
function readActive() {
  const parts = railParts()
  if (!parts) {
    active.value = -1
    return
  }
  const { act, rail, items } = parts
  const actBox = act.getBoundingClientRect()
  if (actBox.bottom < 0 || actBox.top > window.innerHeight) {
    active.value = -1
    return
  }
  const mid = window.innerWidth / 2
  let best = -1
  let bestDist = Number.POSITIVE_INFINITY
  for (let i = 0; i < items.length; i++) {
    const box = items[i]!.getBoundingClientRect()
    const dist = Math.abs(box.left + box.width / 2 - mid)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  // Ignore the lead and trailing cards, which are not specimens.
  active.value = rail.contains(items[best] ?? null) ? best : -1
}

let ticking = false
function onScroll() {
  if (ticking)
    return
  ticking = true
  requestAnimationFrame(() => {
    readActive()
    ticking = false
  })
}

onMounted(() => {
  // The first read has to happen after the runtime has sized the acts — it
  // sets each pinned section's height to `span * 100vh` in its own layout
  // pass, and before that the rail act measures as a short block sitting near
  // the top of the document, so every specimen looks like it is on screen and
  // the index marks one at a page position where none of them are. Nothing
  // re-runs it either, because the reader has not scrolled yet.
  readActive()
  requestAnimationFrame(() => requestAnimationFrame(readActive))
  document.fonts?.ready.then(readActive)

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})

const activeName = computed(() => props.specimens[active.value]?.species ?? null)
</script>

<template>
  <!-- Desktop: a standing index in the left margin. -->
  <nav class="index" aria-label="Specimens in this collection">
    <!-- The mark only. What the studio is belongs to the page's h1, which sits
         in the first specimen's label; saying it twice on one screen is the
         kind of repetition that reads as a template. -->
    <p class="index__mark">
      <span class="index__studio">{{ siteName }} Co.</span>
    </p>

    <!-- No list when there is no collection. An index of nothing is chrome
         pointing at an empty room; the mark and the way out still stand. -->
    <ol v-if="specimens.length" class="index__list">
      <li v-for="(tree, i) in specimens" :key="tree.id">
        <button
          type="button"
          class="index__item"
          :aria-current="active === i ? 'true' : undefined"
          @click="jump(i)"
        >
          <span class="index__num" aria-hidden="true">{{ ROMAN[i] }}</span>
          <span class="index__name binomial">{{ tree.species }}</span>
        </button>
      </li>
    </ol>

    <p class="index__foot" :class="{ 'index__foot--bare': !specimens.length }">
      <NuxtLink to="/gallery">
        The full catalog
      </NuxtLink>
      <!-- Terms for objects that are not listed are not terms. -->
      <span v-if="specimens.length">Price on inquiry</span>
    </p>
  </nav>

  <!-- Narrow viewports: one quiet bar. The reader scrolls the collection with
       their thumb, so a jumping index would be a second way to do what the
       page already does. It carries the studio mark, the plate currently in
       front of them, and the one link off this page. -->
  <div class="bar">
    <NuxtLink to="/" class="bar__mark">
      {{ siteName }} Co.
    </NuxtLink>
    <span v-if="activeName" class="bar__now binomial">{{ activeName }}</span>
    <NuxtLink to="/gallery" class="bar__link">
      Catalog
    </NuxtLink>
  </div>
</template>

<style scoped>
/* ── the standing index ─────────────────────────────────────────── */

.index {
  display: none;
}

@media (min-width: 1180px) {
  .index {
    position: fixed;
    z-index: var(--z-sticky);
    top: clamp(1.75rem, 4vh, 3rem);
    bottom: clamp(1.75rem, 4vh, 3rem);
    left: clamp(1.5rem, 3vw, 3rem);
    width: 14.5rem;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: var(--space-lg);
    align-content: start;
  }
}

.index__mark {
  display: grid;
  gap: var(--space-3xs);
  margin: 0;
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-hair);
}

.index__studio {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  letter-spacing: -0.01em;
  color: var(--text);
}

.index__foot {
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
}

.index__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3xs);
  align-content: start;
}

.index__item {
  display: grid;
  grid-template-columns: 1.75rem 1fr;
  gap: var(--space-2xs);
  width: 100%;
  padding: 0.3125rem 0;
  background: none;
  border: 0;
  text-align: left;
  cursor: pointer;
  /* Inactive entries are still navigation and still 14px, so they sit at
     ink-2 rather than ink-3, which measures 3.63:1 on paper. The mark for
     the active entry is a weight and rule change, not a lift out of a
     colour that was never readable. */
  color: var(--text-muted);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.index__num {
  font-family: var(--font-display);
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  padding-top: 0.15em;
}

.index__name {
  font-size: 0.875rem;
  line-height: 1.3;
  text-wrap: balance;
}

@media (hover: hover) and (pointer: fine) {
  .index__item:hover { color: var(--text); }
}

.index__item:focus-visible {
  color: var(--text);
}

/* The mark for the plate in front of the reader. A tick in the accent plus a
   real change of ink weight, so it does not rely on colour alone. */
.index__item[aria-current] {
  color: var(--text);
}

.index__item[aria-current] .index__num {
  color: var(--accent);
}

.index__item[aria-current] .index__name {
  font-style: italic;
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-underline-offset: 0.28em;
  text-decoration-thickness: 1px;
}

.index__foot {
  display: grid;
  /* Pack to the top. Without this the foot stretches into the column's free
     row and its link stretches with it, so the link's underline renders
     hundreds of pixels below its own text as a stray rule near the bottom of
     the page. Only visible when the list above it is absent. */
  align-content: start;
  gap: var(--space-2xs);
  margin: 0;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-hair);
}

/* With no list between them, the mark's rule and the foot's rule stack into a
   double line twenty pixels apart. One rule is the divider. */
.index__foot--bare {
  padding-top: 0;
  border-top: 0;
}

.index__foot a {
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: 2px;
  width: max-content;
  transition:
    color var(--duration-base) var(--ease-out-quart),
    border-color var(--duration-base) var(--ease-out-quart);
}

.index__foot a:hover,
.index__foot a:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

/* ── the narrow-viewport bar ────────────────────────────────────── */

.bar {
  position: fixed;
  z-index: var(--z-sticky);
  inset: 0 0 auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-xs) clamp(1.25rem, 4vw, 3rem);
  background: color-mix(in oklch, var(--surface) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-hair);
}

@media (min-width: 1180px) {
  .bar { display: none; }
}

.bar__mark {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  color: var(--text);
  text-decoration: none;
}

.bar__now {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar__link {
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: 2px;
  font-feature-settings: var(--feat-small-caps);
}

.bar__link:hover,
.bar__link:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
