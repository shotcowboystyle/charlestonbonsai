<script setup lang="ts">
import type { PublicTreesResponse } from '~/server/api/trees/list.get'
import type { PublicTree } from '~/types'
import { TREE_SIZE_LABELS } from '~/types'

/**
 * The collection.
 *
 * Page grammar: gallery / catalog. Objects in a walkable room, described by
 * one label schema and never by pitch. The chrome is an index of the objects
 * and it jumps; the close is an inquiry plate typeset exactly like a label.
 *
 * The scroll devices are driven by the runtime in assets/js/scrollcraft.js,
 * which reads the `data-sc-*` attributes below. Everything bespoke on this
 * page — the resolving ink wash and the seal in act five — is CSS driven off
 * `--sc-p`, the act-progress value the runtime publishes. The engine itself is
 * never modified.
 */

// No shared layout: this page's chrome is its specimen index, and its footer
// is the inquiry plate at the end of the collection.
definePageMeta({ layout: false })

const { siteName, contactEmail, contactMailto } = useSite()

useHead({
  title: `${siteName} Co. — specimen bonsai, Charleston, South Carolina`,
  meta: [
    {
      name: 'description',
      content: 'A working nursery in Charleston, South Carolina. Specimen bonsai cultivated and trained by hand, sold on inquiry when they are finished enough to leave.',
    },
  ],
})

// The whole collection, not the five-item featured cut: the rail is the
// collection, so a shortened list would be a different page.
const { data: catalog } = await useFetch<PublicTreesResponse>('/api/trees/list', {
  query: { page: 1, pageSize: 6, inStockOnly: true, sortBy: 'newest' },
  default: (): PublicTreesResponse => ({ trees: [], total: 0, page: 1, pageSize: 6, hasMore: false }),
})

const specimens = computed<PublicTree[]>(() => catalog.value?.trees ?? [])
const total = computed(() => catalog.value?.total ?? 0)
const opening = computed<PublicTree | null>(() => specimens.value[0] ?? null)

/**
 * There is no collection to walk.
 *
 * The catalog is unreachable, or genuinely empty. Everything downstream of the
 * objects has to stand down with it: a rail with nothing in it is three
 * viewport-heights of dead scroll, and an index of nothing is chrome pointing
 * at an empty room. What stays is everything that was never about the stock —
 * the bench, the study, the practice, and the way to get in touch.
 */
const hasCollection = computed(() => specimens.value.length > 0)

/**
 * The specimen act five is about. Matched on the binomial rather than the slug
 * because several catalog slugs are legacy and no longer describe their row.
 * If it is not in the collection the act still stands — the copy is about the
 * practice, and only the label facts depend on the row.
 */
const front = computed<PublicTree | null>(
  () => specimens.value.find(t => t.species?.includes('Lagerstroemia')) ?? null,
)

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

function sizeLabel(tree: PublicTree) {
  return TREE_SIZE_LABELS[tree.size] ?? tree.size
}

function handleImageError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/images/trees/placeholder-thumb.svg'
}

const root = ref<HTMLElement | null>(null)
useScrollCraft(root)

/**
 * Keyboard focus inside a pinned act.
 *
 * A control whose cue has not opened is at opacity 0. It is still in the tab
 * order and still on screen, so a keyboard reader lands on something nobody
 * can see, and an automated visibility check passes because the element has a
 * box. The runtime handles the ordinary case by centring the element, but that
 * cannot work on a pinned act: the stage is sticky, so the control holds one
 * viewport position for the entire act, and scrolling to centre it lands
 * *before* the act's top — which parks progress at 0 and leaves the cue dark.
 *
 * Only the page knows which cue belongs to which control, so the page parks
 * the act at the progress where that cue is open. `data-sc-focus-at` names it.
 */
function onFocusIn(event: FocusEvent) {
  const el = event.target
  if (!(el instanceof HTMLElement))
    return

  const cue = el.closest<HTMLElement>('[data-sc-cue][data-sc-focus-at]')
  const act = el.closest<HTMLElement>('[data-sc-act]')
  if (!cue || !act)
    return
  if (Number.parseFloat(getComputedStyle(cue).opacity) > 0.85)
    return

  const at = Number.parseFloat(cue.dataset.scFocusAt || '0.8')
  const travel = Math.max(act.offsetHeight - window.innerHeight, 1)
  // `instant`: scrollcraft.css sets scroll-behavior: smooth, and the default
  // would animate a multi-screen glide with focus off screen the whole way.
  window.scrollTo({ top: act.offsetTop + at * travel, behavior: 'instant' })

  // Force the runtime to recompute now. Otherwise its own focusin handler runs
  // next, still reads the pre-scroll opacity, and scrolls the act away again.
  window.ScrollCraft?.instances.forEach(i => i.read())
}
</script>

<template>
  <div ref="root" class="collection" @focusin="onFocusIn">
    <a href="#main-content" class="sr-only">Skip to the collection</a>

    <HomeSpecimenIndex :specimens="specimens" rail-act="#the-room" />

    <div class="sc-grain" aria-hidden="true" />

    <main id="main-content" tabindex="-1">
      <!-- ═══════════════════════════════════════════════════════════
           I · ARRIVAL — the reader is already in the room, in front of
           an object, and it is labelled. No title treatment and no hero
           claim: this grammar starts the collection at the top of the
           page rather than announcing it.

           Depth is four planes at four rates: the page's own sheet of
           paper, held still behind everything; a far ink wash receding
           faster than the scroll; the plate, which holds at the reader's
           speed because it is the subject and settles onto the paper as
           the act opens; and a near brush stroke that overtakes the plate
           and crosses its lower corner. That crossing is the move —
           occlusion reads as distance before any amount of blur does.
           ═══════════════════════════════════════════════════════════ -->
      <section data-sc-act="pin" data-sc-span="1.8" aria-labelledby="opening-title">
        <div data-sc-stage class="arrival" :class="{ 'is-vacant': !hasCollection }">
          <img
            class="arrival__plane arrival__plane--far"
            src="/images/ground/wash-far.png"
            alt=""
            aria-hidden="true"
            data-sc-parallax="-1.05"
          >

          <div class="arrival__inner">
            <figure v-if="opening" class="arrival__object">
              <div class="plate-frame arrival__frame">
                <img
                  :src="opening.thumbnail"
                  :alt="`${opening.name}, a ${opening.species} specimen`"
                  class="ink-plate"
                  fetchpriority="high"
                  @error="handleImageError"
                >
              </div>
            </figure>

            <!-- The label writes itself, top down, in the order it would be
                 read aloud: who, which, what it is, then the record. Every
                 window closes at 1 with a fast ramp-out, so the label is at
                 full strength for nearly the whole act and gone before the
                 stage travels off — a held cue on a middle act stays lit
                 across the un-pin and lands on the section below it. -->
            <div class="arrival__label">
              <h1 id="opening-title" class="arrival__studio" data-sc-cue="0 1 0 0.06">
                <span>{{ siteName }} Co.</span>
                <span>A working nursery in Charleston, South Carolina</span>
              </h1>

              <p v-if="!hasCollection" class="arrival__vacant" data-sc-cue="0 1 0 0.06">
                The catalog is being updated. Nothing is listed at the moment.
                Write if you are looking for something in particular, or come
                and see what is on the bench.
              </p>

              <template v-if="opening">
                <p class="arrival__num" data-sc-cue="0.08 1 0.2 0.06">
                  Specimen {{ ROMAN[0] }} of {{ ROMAN[Math.max(specimens.length - 1, 0)] ?? specimens.length }}
                </p>
                <!-- Greets, like the h1. In this grammar the opening object is
                     already labelled when the reader lands; a binomial that
                     only arrives on scroll would mean the one screen every
                     visitor sees has an unidentified tree on it. -->
                <p class="arrival__species binomial" data-sc-cue="0 1 0 0.06">
                  {{ opening.species }}
                </p>
                <p class="arrival__common" data-sc-cue="0.16 1 0.2 0.06">
                  {{ opening.name }}
                </p>

                <dl class="label-list arrival__meta" data-sc-cue="0.28 1 0.2 0.06">
                  <div v-if="opening.age">
                    <dt>Age</dt>
                    <dd>{{ opening.age }} years</dd>
                  </div>
                  <div v-if="opening.height">
                    <dt>Height</dt>
                    <dd>{{ opening.height }}</dd>
                  </div>
                  <div>
                    <dt>Class</dt>
                    <dd>{{ sizeLabel(opening) }}</dd>
                  </div>
                  <div v-if="opening.potType">
                    <dt>Pot</dt>
                    <dd>{{ opening.potType }}</dd>
                  </div>
                  <div>
                    <dt>Price</dt>
                    <dd>On inquiry</dd>
                  </div>
                </dl>
              </template>
            </div>
          </div>

          <img
            class="arrival__plane arrival__plane--near"
            src="/images/ground/wash-near.png"
            alt=""
            aria-hidden="true"
            data-sc-parallax="1.35"
          >
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════
           II · THE ROOM — the collection goes past sideways. Lateral
           travel reads as breadth where vertical reads as argument, and
           breadth is the honest shape of a catalog.

           The heading rides in as the rail's first card and the closing
           note as its last: both earn their place, and both add the
           width the travel needs. A rail narrower than the viewport
           travels zero and holds one motionless screen for its whole
           span, which no automated check reports.
           ═══════════════════════════════════════════════════════════ -->
      <section
        v-if="hasCollection"
        id="the-room"
        data-sc-act="pan"
        data-sc-span="3.2"
        aria-labelledby="room-heading"
      >
        <div data-sc-stage class="room">
          <div class="room__rail" data-sc-pan="0.04">
            <div class="room__lead">
              <h2 id="room-heading" class="room__heading">
                Everything currently on the bench.
              </h2>
              <p class="room__note">
                Sorted by nothing in particular. Nothing here was assembled for
                sale, so the collection is whatever has been worked on long
                enough to be worth looking at.
              </p>
            </div>

            <article
              v-for="(tree, i) in specimens"
              :key="tree.id"
              class="room__object"
              data-specimen
            >
              <NuxtLink :to="`/gallery/${tree.slug}`" class="room__link">
                <div class="plate-frame room__frame">
                  <img
                    :src="tree.thumbnail"
                    :alt="`${tree.name}, a ${tree.species} specimen`"
                    class="ink-plate"
                    :loading="i < 3 ? 'eager' : 'lazy'"
                    @error="handleImageError"
                  >
                </div>
                <p class="room__num">
                  {{ ROMAN[i] }}
                </p>
                <p class="room__species binomial">
                  {{ tree.species }}
                </p>
              </NuxtLink>

              <dl class="label-list room__meta">
                <div v-if="tree.age">
                  <dt>Age</dt>
                  <dd>{{ tree.age }} yrs</dd>
                </div>
                <div v-if="tree.height">
                  <dt>Height</dt>
                  <dd>{{ tree.height }}</dd>
                </div>
                <div>
                  <dt>Class</dt>
                  <dd>{{ sizeLabel(tree) }}</dd>
                </div>
              </dl>
            </article>

            <div class="room__tail">
              <p class="room__note">
                <template v-if="total > specimens.length">
                  {{ total }} specimens are in the catalog. The rest are listed
                  with the same record.
                </template>
                <template v-else>
                  That is the whole bench. Each specimen carries the same record
                  in the catalog, with its training history.
                </template>
              </p>
              <NuxtLink to="/gallery" class="rule-link">
                <span>The full catalog</span>
                <svg viewBox="0 0 24 12" fill="none" aria-hidden="true">
                  <path d="M0 6h22M17 1l5 5-5 5" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════
           III · THE BENCH — the material record. This is information
           rather than experience, so it is a flow section at a short
           stagger and not a pinned act: spending scroll here spends the
           reader's patience on the part they will not remember.
           ═══════════════════════════════════════════════════════════ -->
      <section class="bench" aria-labelledby="bench-heading">
        <div class="bench__inner" data-sc-in data-sc-stagger="70">
          <div class="bench__copy">
            <h2 id="bench-heading" class="bench__heading">
              The work is mostly waiting and noticing.
            </h2>
            <p>
              Training a juniper takes a decade before the silhouette earns its
              first photograph. Pruning is a series of decisions you live with
              for years: a branch removed in October is settled by April.
            </p>
            <p>
              Repotting follows the species, not the calendar. The pot is chosen
              after the tree has told you what it is, which is usually the last
              decision and never the first.
            </p>
            <p>
              Charleston is a return address, not a theme. The climate sets the
              schedule. The aesthetic is the species's own.
            </p>
          </div>

          <dl class="label-list bench__specs">
            <div>
              <dt>Stock</dt>
              <dd>Yamadori, nursery stock, collected</dd>
            </div>
            <div>
              <dt>Repot</dt>
              <dd>Species-specific, two to five years</dd>
            </div>
            <div>
              <dt>Wiring</dt>
              <dd>Late winter, copper and annealed aluminium</dd>
            </div>
            <div>
              <dt>Soil</dt>
              <dd>Akadama, pumice, lava, blended by species</dd>
            </div>
            <div>
              <dt>Sale</dt>
              <dd>When a tree is finished enough to leave</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════
           IV · AUTHORED SILENCE — the page empties to bare paper and one
           study. It is quiet on purpose, so that act five has something
           to arrive from. Declared in BRIEF.md so a verification pass
           reads it as intended rather than as dead scroll.
           ═══════════════════════════════════════════════════════════ -->
      <section class="study" aria-labelledby="study-line">
        <figure class="study__figure" data-sc-reveal="up" data-sc-reveal-at="0.05 0.55">
          <img
            src="/images/ground/sumi-study.png"
            alt="An ink wash study of a bonsai in a shallow oval pot."
            loading="lazy"
          >
          <figcaption>Study, ink on paper. Not a specimen.</figcaption>
        </figure>
        <p id="study-line" class="study__line">
          A drawing can be looked at from anywhere.
        </p>
      </section>

      <!-- ═══════════════════════════════════════════════════════════
           V · THE FRONT — the peak.

           One tree, drawn in ink, resolving into the photograph of
           itself as the reader scrolls. The two layers are the same file
           under two grades, so they register to the pixel and the change
           is a bleed rather than a cross-fade. It spreads from the base
           of the trunk outward, which is the order a bonsai is actually
           read in: nebari, then trunk line, then branches, then apex.

           Everything here is CSS driven off --sc-p. The registration
           lines converge on the trunk, and when the tree has arrived the
           studio's seal stamps into the margin — the only chromatic mark
           on the entire site, used exactly once.
           ═══════════════════════════════════════════════════════════ -->
      <section data-sc-act="pin" data-sc-span="3.6" aria-labelledby="front-heading">
        <div data-sc-stage class="peak">
          <div class="peak__inner">
            <div class="peak__object">
              <div class="peak__stack">
                <img
                  class="peak__photo"
                  src="/images/specimens/crape-myrtle.jpg"
                  alt="A crape myrtle bonsai in winter, bare branches, seen from its front."
                  loading="lazy"
                  width="1200"
                  height="1600"
                >
                <img
                  class="peak__wash"
                  src="/images/specimens/crape-myrtle-sumi.jpg"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  width="1200"
                  height="1600"
                >
                <span class="peak__reg peak__reg--v" aria-hidden="true" />
                <span class="peak__reg peak__reg--h" aria-hidden="true" />
              </div>

              <!-- The studio's chop. Stamped, not drawn: it arrives at the
                   moment the tree has resolved and then it stays. -->
              <svg
                class="peak__seal"
                viewBox="0 0 100 100"
                role="img"
                aria-label="The studio's seal, stamped"
              >
                <path
                  class="peak__seal-border"
                  d="M6 8 L94 5 L96 93 L5 96 Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="6"
                  stroke-linejoin="round"
                />
                <path
                  d="M50 20 L50 78"
                  stroke="currentColor"
                  stroke-width="7"
                  stroke-linecap="square"
                />
                <path
                  d="M26 40 L74 37 M31 58 L69 56"
                  stroke="currentColor"
                  stroke-width="6"
                  stroke-linecap="square"
                />
                <path
                  d="M30 79 L70 79"
                  stroke="currentColor"
                  stroke-width="5"
                  stroke-linecap="square"
                />
              </svg>
            </div>

            <div class="peak__copy">
              <h2 id="front-heading" class="peak__heading" data-sc-cue="0 0.95 0 0.12">
                Every tree has a front.
              </h2>
              <p class="peak__body" data-sc-cue="0.06 0.95 0.2 0.12">
                One side is chosen: where the trunk line reads, where the surface
                roots spread widest, where the apex sits over the base. It is
                usually decided in winter, when nothing is hidden. After that the
                tree is only ever shown from there, and every photograph you see
                of it is that one side.
              </p>

              <div
                v-if="front"
                class="peak__label"
                data-sc-cue="0.5 0.95 0.18 0.12"
                data-sc-focus-at="0.75"
              >
                <p class="peak__species binomial">
                  {{ front.species }}
                </p>
                <dl class="label-list">
                  <div v-if="front.age">
                    <dt>Age</dt>
                    <dd>{{ front.age }} years</dd>
                  </div>
                  <div v-if="front.height">
                    <dt>Height</dt>
                    <dd>{{ front.height }}</dd>
                  </div>
                  <div>
                    <dt>Class</dt>
                    <dd>{{ sizeLabel(front) }}</dd>
                  </div>
                </dl>
                <NuxtLink :to="`/gallery/${front.slug}`" class="rule-link">
                  <span>Specimen record</span>
                  <svg viewBox="0 0 24 12" fill="none" aria-hidden="true">
                    <path d="M0 6h22M17 1l5 5-5 5" stroke="currentColor" stroke-width="1" stroke-linecap="square" />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════
           VI · THE INQUIRY PLATE — the ask, typeset exactly like a
           specimen label, so it reads as part of the collection rather
           than as a call to action bolted onto the end of one. Static
           content and the last element on the page: nothing here can
           fade out before the page does.
           ═══════════════════════════════════════════════════════════ -->
      <footer class="plate" aria-labelledby="plate-heading">
        <div class="plate__inner">
          <h2 id="plate-heading" class="plate__heading">
            Visits to the nursery are by appointment.
          </h2>

          <dl class="label-list plate__lines">
            <div>
              <dt>Where</dt>
              <dd>Charleston, South Carolina. 32&deg;47&prime;N 79&deg;55&prime;W</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>By appointment, year-round</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>On inquiry, per specimen</dd>
            </div>
            <div>
              <dt>Write</dt>
              <dd><a :href="contactMailto">{{ contactEmail }}</a></dd>
            </div>
          </dl>

          <p class="plate__close">
            Inquiries about a specific specimen, its lineage, or its training
            history are welcome. Please name the tree.
          </p>

          <nav class="plate__nav" aria-label="Elsewhere on this site">
            <NuxtLink to="/gallery">
              The catalog
            </NuxtLink>
            <NuxtLink to="/visit">
              Visit
            </NuxtLink>
            <NuxtLink to="/events">
              Events
            </NuxtLink>
            <NuxtLink to="/retreats">
              Retreats
            </NuxtLink>
          </nav>

          <p class="plate__colophon">
            <span>{{ siteName }} Co.</span>
            <span>
              <NuxtLink to="/privacy-policy">Privacy</NuxtLink>
              <NuxtLink to="/terms-of-service">Terms</NuxtLink>
            </span>
          </p>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* ============================================================
   Ground and measure
   ============================================================ */
/*
  The sheet.

  One kozo paper photograph, graded into a narrow band around the ground
  colour so it is tooth rather than tint, and attached to the viewport rather
  than to the scroller. `fixed` is doing real work here: it makes the paper
  stationary while the collection travels over it, which is the physical
  relationship the page is about, and it means the same declaration on a
  pinned stage lands pixel-identically on the same sheet.

  Two earlier attempts are worth not repeating. A separate fixed layer at
  z-index -1 paints *behind* this element's own background and vanishes. The
  same layer at z-index 0, with a positive z-index on the content above it,
  makes the content a stacking context — and then every mix-blend-mode inside
  it blends against a transparent backdrop and silently does nothing.
*/
.collection {
  position: relative;
  color: var(--text);
  overflow-x: clip;
}

/* The standing index owns the left margin at desktop widths; everything on
   the page is inset past it. Below that the index becomes a top bar and the
   inset becomes a bar height. */
.collection {
  --chrome-left: 0rem;
  --chrome-top: 3.25rem;
}

@media (min-width: 1180px) {
  .collection {
    --chrome-left: 18.5rem;
    --chrome-top: 0rem;
  }
}

.sc-grain {
  z-index: var(--z-raised);
}

/* ============================================================
   I · ARRIVAL
   ============================================================ */
/* No `position` here. The runtime pins a stage with `position: sticky`, and a
   scoped rule on the same element outranks it — the act then scrolls past as
   an ordinary block and every cue and parallax rate inside it fires against a
   frame nobody is looking at. Sticky is already a containing block for the
   absolutely positioned planes below. */
.arrival {
  /* Identical declaration to .collection, and identical because of `fixed`:
     both resolve against the viewport, so the stage sits on exactly the same
     sheet with no seam. It is repeated rather than inherited because a pinned
     stage is a stacking context — the ink washes inside it multiply against
     THIS backdrop, and a transparent one would make them do nothing. */
  background: var(--sheet);
}

/* The ink planes.

   Each is a transparent PNG whose alpha IS the darkness of the brush stroke,
   so compositing it is arithmetically the same as multiplying the original
   photograph of the stroke, minus the sheet it was photographed on. Using the
   photograph directly with mix-blend-mode instead puts a faintly darker
   rectangle over the page wherever the plane is — and inside a pinned stage
   the blend has nothing to blend with at all, because a sticky element is its
   own stacking context.

   Oversized and offset so their own travel never brings an edge into frame. */
.arrival__plane {
  position: absolute;
  max-width: none;
  height: auto;
  pointer-events: none;
  user-select: none;
}

/* The ink planes exist to give an object depth. With no object they are two
   marks on an empty sheet with the only copy on the page sitting across them,
   which reads as damage rather than as atmosphere. */
.arrival.is-vacant .arrival__plane {
  display: none;
}

/* The far wash: one pale band, sitting behind and a little below the plate,
   at the height a distant treeline would be. Sized so the whole gesture is in
   frame — cropping into a wash removes the two things that make it read as
   one (the dry-brush break at its end and the clean paper around it) and
   leaves an even grey field with a hard edge. */
.arrival__plane--far {
  z-index: 1;
  left: 50%;
  top: 2%;
  translate: -50% 0;
  width: 120%;
  opacity: 0.5;
}

/* The one plane in front of the subject. Its heavy end sits under the plate's
   lower left corner and its dry-brush tail runs off the left edge, so it
   overtakes and crosses the object as the reader scrolls. That crossing is
   the move: occlusion reads as distance before any amount of blur does.

   It is deliberately kept inside the object column. A brush stroke travelling
   over the label column would put ink across the specimen record, which is
   both unreadable and a lie about what the mark is. */
.arrival__plane--near {
  z-index: 3;
  width: 48%;
  left: -8%;
  bottom: -12%;
  opacity: 0.5;
}

@media (max-width: 879px) {
  .arrival__plane--near {
    width: 96%;
    left: -34%;
    bottom: -8%;
    opacity: 0.38;
  }
}

/*
  Portrait is art-directed, not shrunk.

  On a phone the act is still pinned, so the plate and its record have to fit
  inside one viewport with nothing clipped — a catalog plate with the crown of
  the tree cut off by the chrome is worse than a smaller plate. The object row
  is therefore elastic and the label row is not: the label takes the height it
  needs and the plate takes whatever is left, keeping its 3:4 and centring
  itself. That self-adjusts from a 667pt phone to a 932pt one with no
  breakpoints, and the plate lands around three quarters of the screen width,
  which reads as a mounted plate on paper rather than as a full-bleed photo.
*/
.arrival__inner {
  position: relative;
  z-index: 2;
  height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  align-content: center;
  gap: clamp(1rem, 4vw, 4rem);
  padding: calc(var(--chrome-top) + var(--space-md)) clamp(1.25rem, 4vw, 3rem) var(--space-lg);
  padding-left: calc(var(--chrome-left) + clamp(1.25rem, 4vw, 3rem));
  max-width: 92rem;
  margin-inline: auto;
  width: 100%;
}

/* Object low, paper above it. The label hangs at the object's own baseline
   rather than floating at the vertical centre, so the pair reads as one
   mounted thing with room over it — which is the proportion a scroll is hung
   at, and the reason the composition feels still. */
@media (min-width: 880px) {
  .arrival__inner {
    grid-template-columns: minmax(0, 1.25fr) minmax(19rem, 23rem);
    grid-template-rows: auto;
    align-content: end;
    align-items: end;
    padding-bottom: clamp(2rem, 7vh, 4.5rem);
  }
}

.arrival__object {
  margin: 0;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* The plate settles onto the paper as the act opens: a hair of scale and a
   short rise, finished inside the first third so the reader is looking at a
   resting object for most of the act rather than at something still arriving.
   Restraint is the whole point — larger or slower is not more premium.

   Driven from --sc-p rather than from an entrance transition, because the act
   is pinned: an entrance would fire once, off screen, before the reader ever
   reached it. */
.arrival__frame {
  --settle: clamp(0, calc(var(--sc-p, 1) * 3.2), 1);

  /* Height-led below the desktop breakpoint: the plate is as large as the
     space the label leaves it, and never larger than the column. */
  height: 100%;
  width: auto;
  max-width: min(100%, 27rem);
  aspect-ratio: 3 / 4;
  transform:
    translateY(calc((1 - var(--settle)) * 14px))
    scale(calc(1 + (1 - var(--settle)) * 0.035));
}

@media (min-width: 880px) {
  /* No max-height. Capping the height of a box that already has an
     aspect-ratio does not scale it down — it changes the ratio, and
     object-fit then crops the difference off the top and bottom of the
     photograph. On a catalog plate that means cutting the foot off the pot,
     which is the one part of a bonsai photograph that is never optional. */
  .arrival__frame {
    height: auto;
    width: min(100%, 30rem);
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arrival__frame { transform: none; }
}

.arrival__label {
  display: grid;
  gap: var(--space-2xs);
  align-content: center;
}

/* The page's h1 is the collection's own identification, set at label scale.
   A display headline here would be a hero claim, which this grammar does not
   have: the collection starts at the top of the page. */
.arrival__studio {
  display: grid;
  gap: var(--space-3xs);
  margin: 0 0 var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-hair);
  font-weight: 400;
}

.arrival__studio > span:first-child {
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  color: var(--text);
}

.arrival__studio > span:last-child {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
}

/* Set as running text rather than as a label key: it is the one thing on this
   page that is not a fact about an object, so it does not wear the schema. */
.arrival__vacant {
  margin: 0;
  max-width: 34ch;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.0625rem;
  line-height: 1.55;
  color: var(--text-muted);
}

.arrival__num {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  font-feature-settings: var(--feat-small-caps);
}

.arrival__species {
  margin: var(--space-3xs) 0 0;
  font-size: clamp(1.75rem, 3.4vw, 2.5rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--text);
  text-wrap: balance;
}

.arrival__common {
  margin: var(--space-2xs) 0 0;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
}

.arrival__meta {
  margin-top: var(--space-md);
}

/* ============================================================
   II · THE ROOM
   ============================================================ */
/*
  No `overflow` here, and that is deliberate.

  The runtime already clips a stage (`.sc-stage { overflow: clip }`), and under
  prefers-reduced-motion it replaces the rail's transform with a real
  horizontal scroll region on this exact element — because a rail's travel is
  navigation, not decoration, and zeroing it would park the act on its first
  screenful and make specimens III to VI unreachable.

  A scoped `overflow: hidden` here ties on specificity and wins on order, so it
  silently reinstates exactly that failure: the transform is gone, the stage
  cannot scroll, and half the collection is simply missing for anyone who has
  asked their machine to stop animating things. Nothing reports it — the
  harness sees a stage full of content.
*/
.room {
  display: flex;
  align-items: center;
  padding-top: var(--chrome-top);
}

.room__rail {
  display: flex;
  align-items: flex-start;
  gap: clamp(1.5rem, 3vw, 3rem);
  padding-inline: clamp(1.25rem, 4vw, 3rem);
  padding-left: calc(var(--chrome-left) + clamp(1.25rem, 4vw, 3rem));
}

.room__lead,
.room__tail {
  flex: 0 0 auto;
  width: min(78vw, 22rem);
  display: grid;
  gap: var(--space-md);
  align-content: center;
  padding-block: var(--space-xl);
}

.room__heading {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 2.8vw, 2.25rem);
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--text);
  text-wrap: balance;
}

.room__note {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-muted);
  text-wrap: pretty;
}

.room__object {
  flex: 0 0 auto;
  width: min(72vw, 19rem);
  display: grid;
  gap: var(--space-2xs);
}

.room__link {
  display: grid;
  gap: var(--space-2xs);
  text-decoration: none;
  color: inherit;
}

.room__frame {
  aspect-ratio: 3 / 4;
  transition: box-shadow var(--duration-base) var(--ease-out-quart);
}

@media (hover: hover) and (pointer: fine) {
  .room__link:hover .room__frame,
  .room__link:focus-visible .room__frame {
    box-shadow: inset 0 0 0 1px var(--accent);
  }
}

.room__num {
  margin: var(--space-2xs) 0 0;
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--accent);
}

/* Rail copy is read cropped for most of its life — an object is half in
   frame as it enters and as it leaves — so the binomial is kept to its own
   line and nothing wraps into a neighbour. */
.room__species {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.25;
  color: var(--text);
}

.room__meta {
  margin-top: var(--space-2xs);
}

/* Objects arrive in sequence rather than sliding in as one sheet: lateral
   travel alone reads as a slideshow on rails. The opacity floors at 0.55 so a
   plate that has not settled reads as arriving, not as failing to load. */
@media (prefers-reduced-motion: no-preference) {
  .room__object {
    --settle: clamp(0, calc((var(--sc-p, 1) * 6 - var(--i, 0)) * 1.4), 1);

    opacity: calc(0.55 + 0.45 * var(--settle));
    transform: translateY(calc((1 - var(--settle)) * 10px));
  }

  .room__object:first-of-type {
    opacity: 1;
    transform: none;
  }
}

.room__object:nth-of-type(1) { --i: 0; }
.room__object:nth-of-type(2) { --i: 0.55; }
.room__object:nth-of-type(3) { --i: 1.1; }
.room__object:nth-of-type(4) { --i: 1.65; }
.room__object:nth-of-type(5) { --i: 2.2; }
.room__object:nth-of-type(6) { --i: 2.75; }

/* ============================================================
   III · THE BENCH
   ============================================================ */
.bench {
  /* Reduced block padding: this section follows a pinned act, which needs a
     full viewport to travel off. Full section padding on top of that would
     hand the reader another empty screen. */
  padding: clamp(3rem, 6vw, 5rem) clamp(1.25rem, 4vw, 3rem) var(--section-y);
  padding-left: calc(var(--chrome-left) + clamp(1.25rem, 4vw, 3rem));
  max-width: 92rem;
  margin-inline: auto;
}

.bench__inner {
  display: grid;
  gap: clamp(2rem, 5vw, 4.5rem);
}

@media (min-width: 900px) {
  .bench__inner {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    align-items: start;
  }
}

.bench__copy {
  display: grid;
  gap: var(--space-sm);
  max-width: 38rem;
}

.bench__heading {
  margin: 0 0 var(--space-2xs);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 2.8vw, 2.25rem);
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--text);
  max-width: 20ch;
  text-wrap: balance;
}

.bench__copy p {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text-muted);
  text-wrap: pretty;
  font-feature-settings: var(--feat-running-text);
}

.bench__specs {
  align-self: start;
}

@media (min-width: 900px) {
  .bench__specs { margin-top: 0.6rem; }
}

/* ============================================================
   IV · AUTHORED SILENCE
   ============================================================ */
.study {
  display: grid;
  justify-items: center;
  gap: var(--space-xl);
  padding: clamp(4rem, 12vh, 9rem) clamp(1.25rem, 4vw, 3rem);
  padding-left: calc(var(--chrome-left) + clamp(1.25rem, 4vw, 3rem));
}

.study__figure {
  margin: 0;
  display: grid;
  gap: var(--space-sm);
  justify-items: center;
  width: min(100%, 17rem);
}

.study__figure img {
  width: 100%;
  height: auto;
}

.study__figure figcaption,
.study__line {
  margin: 0;
  text-align: center;
}

.study__figure figcaption {
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
}

.study__line {
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  color: var(--text-muted);
}

/* ============================================================
   V · THE FRONT — the peak
   ============================================================ */
.peak {
  display: grid;
  align-items: center;
  padding-top: var(--chrome-top);
}

.peak__inner {
  display: grid;
  gap: clamp(1.75rem, 4vw, 4rem);
  align-items: center;
  width: 100%;
  max-width: 92rem;
  margin-inline: auto;
  padding: var(--space-xl) clamp(1.25rem, 4vw, 3rem);
  padding-left: calc(var(--chrome-left) + clamp(1.25rem, 4vw, 3rem));
}

@media (min-width: 880px) {
  .peak__inner {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 25rem);
  }
}

.peak__object {
  position: relative;
  justify-self: center;
  width: min(100%, 27rem);
}

.peak__stack {
  position: relative;
  aspect-ratio: 3 / 4;
  max-height: 62vh;
  margin-inline: auto;
}

.peak__stack img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* The drawing is opaque and it covers the photograph completely: the act has
   to open on a drawing, not on a photograph with ink laid over it. Its own
   paper is graded to the tone this page actually renders at, so the sheet it
   is drawn on has no visible edge and the tree appears to sit directly on the
   page.

   The photograph underneath keeps its hairline, because it is a mounted print
   and that is what one looks like. The frame is therefore the last thing to
   arrive: it is uncovered only when the bleed reaches the edges, so the act
   ends on the drawing having become a photograph, mounted. */
.peak__photo {
  box-shadow: inset 0 0 0 1px var(--border-hair);
}

/*
  The bleed.

  --bleed grows a circle out of the base of the trunk. The wash is masked
  away inside that circle, so the photograph underneath is uncovered from the
  nebari outward. The 26% gap between the two stops is the feather, and it is
  what makes the edge read as ink spreading into wet paper rather than as a
  wipe.

  Driven entirely from --sc-p, the act progress the runtime publishes. No
  JavaScript on this page touches it.
*/
.peak__wash {
  --bleed: max(0%, calc((var(--sc-p, 0) - 0.14) * 205%));

  -webkit-mask-image: radial-gradient(
    circle at 47% 76%,
    transparent max(0%, calc(var(--bleed) - 26%)),
    #000 var(--bleed)
  );
  mask-image: radial-gradient(
    circle at 47% 76%,
    transparent max(0%, calc(var(--bleed) - 26%)),
    #000 var(--bleed)
  );
}

/* The registration lines a display stand is squared up against. They arrive
   offset and converge on the base of the trunk as the tree resolves. */
.peak__reg {
  position: absolute;
  background: var(--accent);
  opacity: calc(0.55 * clamp(0, calc((var(--sc-p, 0) - 0.1) * 5), 1));
  pointer-events: none;
}

.peak__reg--v {
  left: 47%;
  top: 8%;
  bottom: 8%;
  width: 1px;
  transform: translateX(calc((1 - clamp(0, calc((var(--sc-p, 0) - 0.14) * 1.6), 1)) * 4.5rem));
}

.peak__reg--h {
  top: 76%;
  left: 6%;
  right: 6%;
  height: 1px;
  transform: translateY(calc((1 - clamp(0, calc((var(--sc-p, 0) - 0.14) * 1.6), 1)) * 3rem));
}

/*
  The seal.

  Vermillion, and the only chromatic mark anywhere on this site. It stamps
  once, when the tree has arrived on its front, and then it holds — it does
  not fade back out, because a seal that could be taken back would not be a
  seal.
*/
.peak__seal {
  --stamp: clamp(0, calc((var(--sc-p, 0) - 0.72) * 7), 1);

  position: absolute;
  right: 0;
  bottom: 1rem;
  width: clamp(2.75rem, 5vw, 3.75rem);
  height: auto;
  color: var(--seal);
  opacity: calc(0.92 * var(--stamp));
  transform:
    scale(calc(0.9 + 0.1 * var(--stamp)))
    rotate(calc((1 - var(--stamp)) * -5deg));
  transform-origin: 50% 80%;
  pointer-events: none;
}

/* Off the image and onto the paper beside it, which is where a seal goes:
   the mark is applied to the sheet the work is mounted on, not to the work. */
@media (min-width: 880px) {
  .peak__seal {
    right: -3.25rem;
    bottom: 2.5rem;
  }
}

.peak__copy {
  display: grid;
  gap: var(--space-md);
  align-content: center;
}

.peak__heading {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.75rem, 3.2vw, 2.75rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text);
  text-wrap: balance;
}

.peak__body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text-muted);
  max-width: 34ch;
  text-wrap: pretty;
  font-feature-settings: var(--feat-running-text);
}

.peak__label {
  display: grid;
  gap: var(--space-sm);
  padding-top: var(--space-sm);
}

.peak__species {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text);
}

/* ============================================================
   VI · THE INQUIRY PLATE
   ============================================================ */
.plate {
  padding: var(--section-y) clamp(1.25rem, 4vw, 3rem) clamp(2.5rem, 6vw, 4rem);
  padding-left: calc(var(--chrome-left) + clamp(1.25rem, 4vw, 3rem));
  border-top: 1px solid var(--border-hair);
}

.plate__inner {
  max-width: 44rem;
  display: grid;
  gap: var(--space-xl);
}

.plate__heading {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--text);
  max-width: 24ch;
  text-wrap: balance;
}

.plate__lines a {
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: 1px;
  transition:
    color var(--duration-base) var(--ease-out-quart),
    border-color var(--duration-base) var(--ease-out-quart);
}

.plate__lines a:hover,
.plate__lines a:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.plate__close {
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text-muted);
  max-width: 42ch;
}

.plate__nav,
.plate__colophon {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-feature-settings: var(--feat-small-caps);
}

.plate__nav {
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-hair);
}

.plate__nav a {
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  padding-bottom: 2px;
  transition:
    color var(--duration-base) var(--ease-out-quart),
    border-color var(--duration-base) var(--ease-out-quart);
}

.plate__nav a:hover,
.plate__nav a:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.plate__colophon {
  justify-content: space-between;
  color: var(--text-muted);
}

.plate__colophon span:last-child {
  display: inline-flex;
  gap: var(--space-md);
}

.plate__colophon a {
  color: inherit;
  text-decoration: none;
}

.plate__colophon a:hover,
.plate__colophon a:focus-visible {
  color: var(--accent);
}

/* ============================================================
   Reduced motion
   ------------------------------------------------------------
   Fewer and gentler, not zero. The bleed in act five is a mask, not
   movement, and it is the entire meaning of the act — so it keeps
   tracking the reader's scroll. What goes is travel: the registration
   lines are already converged, and the seal stamps without rotating
   or growing.
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .peak__reg--v,
  .peak__reg--h {
    transform: none;
  }

  .peak__seal {
    transform: none;
  }

  .arrival__plane {
    transform: none !important;
  }
}
</style>
