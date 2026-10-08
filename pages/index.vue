<script setup lang="ts">
import type Lenis from 'lenis'
import type { Bloom } from '~/lib/makimono/bloom'
import type { ScrollCraftInstance } from '~/lib/makimono/engine'
import type { Plane } from '~/lib/makimono/track'
import type { PublicTree } from '~/types'
import { createBloom } from '~/lib/makimono/bloom'
import { ENGINE_CSS, loadScrollCraft } from '~/lib/makimono/engine'
import { Enso } from '~/lib/makimono/enso'
import {
  dryness,
  FINALE,
  hungAt,
  LEGS,
  legStart,
  MISTS,
  PEAK,
  PLATES,
  ramp,
  RATE,
  restTime,
  screenX,
  SCROLL_TOTAL,
  scrollAt,
  SPEED,
  strokeProgress,
  TOTAL,
  trackAt,
  WINDOWS as W,
  windowIn,
  windowOpacity,
} from '~/lib/makimono/track'
import { TREE_SIZE_LABELS } from '~/types'

/*
 * The landing page is a handscroll (emakimono): one continuous ink world that
 * unrolls right to left as the visitor scrolls. Built in scrollcraft's
 * worldflight mode: one fixed stage, one spacer, nothing else in document flow.
 * The engine owns the track, the copy windows and the waypoint events; the
 * painted planes, the ensō brush and the ink bloom are this page's own code.
 * Brief and plan: scrollcraft/builds/makimono/BRIEF.md
 */

definePageMeta({ layout: false })

const { siteName, contactEmail, contactMailto } = useSite()

useSeo({
  title: 'Bonsai, shaped by hand in Charleston',
  description: 'Over twenty years at the bench and around two hundred trees in the nursery. Specimen bonsai trained by hand in Charleston, South Carolina. Visits by appointment.',
})

const KANJI = `盆栽${LEGS.map(l => l.kanji).join('')}`

useHead({
  link: [
    { rel: 'stylesheet', href: ENGINE_CSS },
    { rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?family=Yuji+Syuku&text=${encodeURIComponent(KANJI)}&display=swap` },
    { rel: 'preload', as: 'image', href: '/makimono/m-pine.avif', type: 'image/avif' },
  ],
})

const { data: featured } = await useFetch<PublicTree[]>('/api/trees/featured', { default: () => [] })

/** The tree the ink becomes. The owner swaps it by featuring a different tree in the admin. */
const peakTree = computed(() => featured.value?.[0] ?? null)
/** The trees hung under the oaks, after the peak. */
const hung = computed(() => featured.value?.slice(1, 5) ?? [])
const FALLBACK_PHOTO = '/makimono/specimen-fallback.jpg'

const SEASONS = (['春', '夏', '秋', '冬'] as const).map((kanji, i) => ({
  kanji,
  at: PLATES.find(p => p.src === ['m-spring', 'm-summer', 'm-autumn', 'm-winter'][i])?.at ?? 0,
}))

function metaLine(tree: PublicTree): string {
  return [
    tree.age ? `${tree.age} yrs` : null,
    tree.height ? `${tree.height} cm` : null,
    TREE_SIZE_LABELS[tree.size] ?? tree.size,
  ].filter(Boolean).join(' · ')
}

/** Ticks around the ensō where each waypoint begins. */
const ticks = LEGS.map((leg, i) => {
  const theta = (115 / 180) * Math.PI + Math.PI * 2 * 1.03 * strokeProgress(legStart(i))
  // Rounded: server and browser disagree on the last digit of Math.cos, which breaks hydration.
  return { key: leg.key, x: (50 + 47 * Math.cos(theta)).toFixed(2), y: (50 + 47 * Math.sin(theta)).toFixed(2) }
})

const current = ref(0)
const sealed = ref(false)
const reduced = ref(false)
const webgl = ref(true)

const rootEl = ref<HTMLElement | null>(null)
const flightEl = ref<HTMLElement | null>(null)
const bandEl = ref<HTMLElement | null>(null)
const paperEl = ref<HTMLElement | null>(null)
const ensoEl = ref<HTMLElement | null>(null)
const ensoCanvas = ref<HTMLCanvasElement | null>(null)
const bloomCanvas = ref<HTMLCanvasElement | null>(null)
const routeEl = ref<HTMLElement | null>(null)

function goTo(i: number) {
  const leg = LEGS[i]
  if (!leg || !flightEl.value)
    return
  routeEl.value?.hidePopover?.()
  const top = flightEl.value.offsetTop + scrollAt(legStart(i) + leg.rest) * window.innerHeight
  if (lenis)
    lenis.scrollTo(top)
  else
    window.scrollTo({ top, behavior: reduced.value ? 'auto' : 'smooth' })
}

// ---------------------------------------------------------------------------
// The world loop. Everything below runs only in the browser.
// ---------------------------------------------------------------------------

interface Item {
  el: HTMLElement
  plane: Plane
  at: number
  /** Anchor on portrait phones. */
  atm: number
  x: number
  xm: number
  /** Offset from the anchor, in band-heights. */
  dx: number
  flip: boolean
  focusable: boolean
  w: number
  shown: boolean
}

let engine: ScrollCraftInstance | null = null
let enso: Enso | null = null
let bloom: Bloom | null = null
let raf = 0
let lenis: Lenis | null = null
let themeObserver: MutationObserver | null = null
const cleanups: Array<() => void> = []

function readColor(css: string): [number, number, number] {
  // Computed colours may come back as oklch(); let the canvas resolve them.
  const c = document.createElement('canvas')
  c.width = c.height = 1
  const ctx = c.getContext('2d')
  if (!ctx)
    return [0, 0, 0]
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

onMounted(async () => {
  const root = rootEl.value
  const flight = flightEl.value
  const band = bandEl.value
  if (!root || !flight || !band)
    return
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches

  const scrollcraft = await loadScrollCraft()
  if (!rootEl.value)
    return // navigated away while the engine loaded
  engine = scrollcraft.mount(root, { lerp: 0.12 })

  // The scroll itself glides: wheel input eases toward its target instead of
  // jumping, so a flick cannot throw the visitor past a scene. Touch keeps its
  // native momentum. Reduced motion keeps native scrolling.
  if (!reduced.value) {
    const { default: LenisCtor } = await import('lenis')
    if (!rootEl.value)
      return
    lenis = new LenisCtor({ lerp: 0.08, autoRaf: false })
  }

  // A webfont swapping in changes every copy block's height, and some early
  // loads report innerHeight as 0; one resize after both settles the spacer.
  const relayout = () => dispatchEvent(new Event('resize'))
  addEventListener('load', relayout, { once: true })
  void document.fonts?.ready.then(relayout)

  // ---- items -------------------------------------------------------------
  const items: Item[] = []
  root.querySelectorAll<HTMLElement>('[data-mk-plane]').forEach((el) => {
    const d = el.dataset
    items.push({
      el,
      plane: d.mkPlane as Plane,
      at: Number(d.mkAt),
      atm: Number(d.mkAtm ?? d.mkAt),
      x: Number(d.mkX),
      xm: Number(d.mkXm ?? d.mkX),
      dx: Number(d.mkDx ?? 0),
      flip: d.mkFlip === '1',
      // A link must stay focusable, so it is parked off screen rather than hidden.
      focusable: el.tagName === 'A',
      w: 0,
      shown: false,
    })
  })

  let t = 0
  let rawPrev = 0
  let speed = 0
  let then = performance.now()
  let last = -1
  let heldAt = -1
  let vw = 0
  let vh = 0
  let H = 0
  let portrait = false
  let flightTop = 0
  let cornerX = 0
  let cornerY = 0
  let cornerSize = 1
  let moon = { x: 0, y: 0, size: 0 }

  function layout() {
    vw = window.innerWidth
    vh = window.innerHeight
    portrait = vw / vh < 0.8
    // Phones get a band in the upper half of the screen and the copy under it.
    H = portrait ? Math.round(vh * 0.55) : vh
    const bandBottom = portrait ? Math.round(vh * 0.33) : 0
    root!.style.setProperty('--band-h', `${H}px`)
    root!.style.setProperty('--band-bottom', `${bandBottom}px`)
    flightTop = flight!.offsetTop
    for (const it of items) {
      it.w = it.el.offsetWidth
      it.shown = false
      if (!it.focusable)
        it.el.style.visibility = 'hidden'
    }
    const map = ensoEl.value?.querySelector<HTMLElement>('.mk-enso__map')
    if (map) {
      const prev = map.style.transform
      map.style.transform = 'none'
      const r = map.getBoundingClientRect()
      map.style.transform = prev
      cornerX = r.left + r.width / 2
      cornerY = r.top + r.height / 2
      cornerSize = r.width || 1
    }
    moon = portrait
      ? { x: vw * 0.62, y: vh * 0.2, size: Math.min(vw * 0.56, vh * 0.27) }
      : { x: vw * 0.5, y: vh * 0.3, size: Math.min(vh * 0.41, vw * 0.28) }
    root!.style.setProperty('--moon-x', `${moon.x}px`)
    root!.style.setProperty('--moon-y', `${moon.y}px`)
    root!.style.setProperty('--moon-size', `${moon.size}px`)
    bloom?.resize()
    last = -1
    heldAt = -1
  }

  const scrims = [...root.querySelectorAll<HTMLElement>('[data-mk-window]')].map(el => ({
    el,
    spec: el.dataset.mkWindow ?? '',
    op: -1,
  }))

  // The engine drifts copy upward across its whole window; it rises while it
  // fades in and then holds still instead (the CSS turns the engine's transform off).
  const copies = [...root.querySelectorAll<HTMLElement>('[data-sc-copy]')].map(el => ({
    el,
    spec: el.dataset.scWindow === 'finale' ? W.finale : el.dataset.scWindow ?? '',
    rise: -1,
  }))

  // ---- the ensō ----------------------------------------------------------
  if (ensoCanvas.value) {
    enso = new Enso(ensoCanvas.value, '#1d211c')
  }

  // ---- the bloom ---------------------------------------------------------
  const setBloomColors = () => {
    bloom?.setInk(readColor(getComputedStyle(root).color))
    last = -1
  }
  // WebGL setup (context, shader compile, texture upload) costs ~1s of main
  // thread, so it waits until the visitor heads for the peak instead of
  // blocking first paint. Leaves ample lead: the peak is legs away.
  let bloomStarted = false
  const startBloom = async () => {
    bloomStarted = true
    if (!bloomCanvas.value)
      return
    let b: Bloom | null
    try {
      b = await createBloom(bloomCanvas.value, '/makimono/b-tree.jpg', '/makimono/b-bloom.jpg')
    }
    catch {
      // Safe to continue: a GPU that cannot compile the shader gets the static
      // figure (painting and photograph), which tells the same story without motion.
      b = null
    }
    if (!rootEl.value) {
      b?.destroy() // navigated away while the bloom loaded
      return
    }
    bloom = b
    webgl.value = Boolean(bloom)
    if (bloom) {
      bloom.resize()
      setBloomColors()
      const photo = peakTree.value?.thumbnail || FALLBACK_PHOTO
      // Safe to fall back: a catalog photo that fails to load is replaced by the
      // nursery's own photograph of a real tree, so the peak never shows an empty hole.
      bloom.setPhoto(photo)
        .catch(() => bloom?.setPhoto(FALLBACK_PHOTO))
        .catch(() => {
          // Safe to continue: with no photograph at all the painted tree stays on the paper.
        })
        .finally(() => { last = -1 })
    }
  }
  themeObserver = new MutationObserver(setBloomColors)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  layout()
  addEventListener('resize', layout)
  cleanups.push(() => removeEventListener('resize', layout))

  const onWaypoint = (e: Event) => {
    current.value = (e as CustomEvent<{ index: number }>).detail.index
  }
  root.addEventListener('sc:waypoint', onWaypoint)
  cleanups.push(() => root.removeEventListener('sc:waypoint', onWaypoint))

  // Keyboard focus inside the world brings the thing focused into view.
  const onFocus = (e: FocusEvent) => {
    const host = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-mk-t]')
    if (!host)
      return
    const t = Number((portrait && host.dataset.mkTm) || host.dataset.mkT)
    // Instant: the page's smooth scrolling would leave the focus ring on an
    // invisible element for the whole glide.
    const top = flightTop + scrollAt(t) * vh
    if (lenis)
      lenis.scrollTo(top, { immediate: true })
    else
      window.scrollTo({ top, behavior: 'instant' })
    // Let the engine re-read now rather than on its next scroll event, so the
    // focused block is legible the moment the ring lands on it.
    dispatchEvent(new Event('scroll'))
  }
  root.addEventListener('focusin', onFocus)
  cleanups.push(() => root.removeEventListener('focusin', onFocus))

  // ---- loop ---------------------------------------------------------------
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    lenis?.raf(now)
    const dt = Math.min(now - then, 64) / 1000
    then = now
    const raw = trackAt(Math.min(Math.max((window.scrollY - flightTop) / Math.max(vh, 1), 0), SCROLL_TOTAL))
    const inst = Math.abs(raw - rawPrev) / Math.max(dt, 1e-3)
    rawPrev = raw
    speed += (inst - speed) * 0.08
    // Lenis already glides the scroll; without it the world rides a damped
    // playhead so wheel judder never reaches the paper.
    t = reduced.value || lenis ? raw : t + (raw - t) * (1 - (1 - 0.12) ** (dt * 60))
    const dry = dryness(speed)

    enso?.extend(strokeProgress(raw), dry)
    if (enso?.busy)
      enso.tick()

    if (!bloomStarted && raw > PEAK.show - 1.5)
      void startBloom()

    if (Math.abs(t - last) < 1e-4)
      return
    last = t

    // paper fibre slides with the mid plane, so even blank paper reads as travel
    if (paperEl.value && !reduced.value) {
      const tile = 480
      const travel = (SPEED * H * t) % tile
      paperEl.value.style.transform = `translate3d(${(travel - tile).toFixed(1)}px,0,0)`
    }

    // Reduced motion: nothing travels. The world holds each leg's resting
    // composition and fades in when the leg changes, a cut instead of a pan.
    let tw = t
    if (reduced.value) {
      tw = restTime(raw)
      if (tw !== heldAt) {
        heldAt = tw
        band.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' })
      }
    }

    for (const it of items) {
      const left = screenX(tw, portrait ? it.atm : it.at, portrait ? it.xm : it.x, RATE[it.plane], vw, H) + it.dx * H - it.w / 2
      const visible = left < vw + 60 && left + it.w > -60
      if (visible !== it.shown) {
        if (it.focusable) {
          // One damped step can carry a link from on screen to far off it, so
          // park it outside the frame rather than trusting its last position.
          if (!visible)
            it.el.style.transform = 'translate3d(-200vw,0,0)'
        }
        else {
          it.el.style.visibility = visible ? 'visible' : 'hidden'
        }
        it.shown = visible
      }
      if (visible)
        it.el.style.transform = `translate3d(${left.toFixed(1)}px,0,0)${it.flip ? ' scaleX(-1)' : ''}`
    }

    for (const sc of scrims) {
      const op = windowOpacity(raw, sc.spec)
      if (Math.abs(op - sc.op) > 0.002) {
        sc.el.style.opacity = op.toFixed(3)
        sc.op = op
      }
    }

    for (const c of copies) {
      const rise = reduced.value ? 0 : (1 - windowIn(raw, c.spec)) * 2
      if (Math.abs(rise - c.rise) > 0.005) {
        c.el.style.translate = `0 ${rise.toFixed(2)}vh`
        c.rise = rise
      }
    }

    // the peak
    if (bloom && t > PEAK.show - 0.4 && t < PEAK.hide + 0.4) {
      const drop = ramp(t, PEAK.show + 0.04, PEAK.bloomFrom) * 0.05
      const grow = ramp(t, PEAK.bloomFrom, PEAK.bloomTo)
      const p1 = grow > 0 ? 0.05 + 0.95 * (1 - (1 - grow) ** 3) : drop
      const q = ramp(t, PEAK.photoFrom, PEAK.photoTo)
      bloom.render({ p1, p2: q * q * (3 - 2 * q), wet: 1 - dry })
    }

    // the finale: the ensō leaves its corner and rises as the moon
    const map = ensoEl.value?.querySelector<HTMLElement>('.mk-enso__map')
    if (map) {
      const k = ramp(t, FINALE.riseFrom, FINALE.riseTo)
      const e = reduced.value ? (k > 0.5 ? 1 : 0) : k * k * (3 - 2 * k)
      const s = 1 + (moon.size / cornerSize - 1) * e
      map.style.transform = e > 0
        ? `translate3d(${((moon.x - cornerX) * e).toFixed(1)}px,${((moon.y - cornerY) * e).toFixed(1)}px,0) scale(${s.toFixed(4)})`
        : ''
      ensoEl.value?.classList.toggle('is-moon', e > 0.98)
    }
    sealed.value = raw >= FINALE.seal - 0.02
  }
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  cleanups.forEach(fn => fn())
  themeObserver?.disconnect()
  bloom?.destroy()
  lenis?.destroy()
  lenis = null
  engine?.destroy()
  engine = null
  enso = null
  bloom = null
})
</script>

<template>
  <div ref="rootEl" class="mk" :class="{ 'mk--rm': reduced, 'mk--sealed': sealed }">
    <LayoutNavbar />

    <main id="main-content" tabindex="-1">
      <div
        ref="flightEl"
        class="mk-flight"
        data-sc-mode="worldflight"
        data-sc-seam="0.16"
        data-sc-lerp="0.12"
      >
        <!-- The world. Decorative paint; every word lives in the copy layer. -->
        <!-- The sc-* classes are what the engine adds on mount; rendering them up
             front pins the stage on first paint instead of after the script. -->
        <div data-sc-world class="sc-world mk-world">
          <div ref="paperEl" class="mk-paper" aria-hidden="true" />

          <div ref="bandEl" class="mk-band">
            <img
              v-for="(p, i) in PLATES"
              :key="`plate-${i}`"
              class="mk-plate"
              :class="`mk-plate--${p.plane}`"
              :src="`/makimono/${p.src}.avif`"
              alt=""
              aria-hidden="true"
              decoding="async"
              :fetchpriority="p.at < 1 ? 'high' : 'low'"
              :style="{ '--h': p.h, '--y': p.y, '--r': p.ratio, '--x': p.x, '--xm': p.xm ?? p.x, '--dx0': -RATE[p.plane] * SPEED * p.at }"
              :data-first="Math.abs(RATE[p.plane] * SPEED * p.at) < 1.2 ? '' : undefined"
              :data-mk-plane="p.plane"
              :data-mk-at="p.at"
              :data-mk-x="p.x"
              :data-mk-xm="p.xm ?? p.x"
              :data-mk-flip="p.flip ? 1 : 0"
              :data-fade="p.fade"
              @error="(e: Event) => ((e.target as HTMLImageElement).src = `/makimono/${p.src}.webp`)"
            >

            <div
              v-for="(m, i) in MISTS"
              :key="`mist-${i}`"
              class="mk-mist"
              aria-hidden="true"
              :style="{ '--w': m.w, '--h': m.h, '--y': m.y }"
              data-mk-plane="mist"
              :data-mk-at="m.at"
              :data-mk-x="m.x"
            />

            <span
              v-for="s in SEASONS"
              :key="s.kanji"
              class="mk-season"
              lang="ja"
              aria-hidden="true"
              data-mk-plane="mid"
              :data-mk-at="s.at"
              data-mk-x="0.5"
              :data-mk-window="W.seasons"
            >{{ s.kanji }}</span>
          </div>

          <!-- Timing legs for the engine: waypoints and copy windows. They hold no media. -->
          <div
            v-for="(leg, i) in LEGS"
            :key="leg.key"
            data-sc-segment
            :data-sc-w="(scrollAt(legStart(i + 1)) - scrollAt(legStart(i))).toFixed(4)"
            :data-sc-waypoint="leg.label"
            aria-hidden="true"
          />
        </div>

        <div data-sc-world-copy class="sc-world__copy mk-copy">
          <!-- Paper mist behind each block. Siblings of the copy and not copy blocks
               themselves, so the contrast pass photographs them as part of the backdrop.
               They fade on the same windows as their text (see windowOpacity). -->
          <div class="mk-scrim mk-scrim--hero" :data-mk-window="W.hero" aria-hidden="true" style="opacity: 1" />
          <div class="mk-scrim mk-scrim--hand" :data-mk-window="W.hand" aria-hidden="true" />
          <div class="mk-scrim mk-scrim--seasons" :data-mk-window="W.seasons" aria-hidden="true" />
          <div class="mk-scrim mk-scrim--nursery" :data-mk-window="W.nursery" aria-hidden="true" />
          <div class="mk-scrim mk-scrim--bench" :data-mk-window="W.bench" aria-hidden="true" />
          <div class="mk-scrim mk-scrim--finale" :data-mk-window="W.finale" aria-hidden="true" />

          <section class="mk-block mk-block--hero" data-sc-copy :data-sc-window="W.hero" data-mk-t="0" aria-labelledby="mk-h1" style="opacity: 1">
            <p class="mk-tategaki" lang="ja" aria-hidden="true">
              盆栽
            </p>
            <h1 id="mk-h1" class="mk-h1">
              Bonsai, shaped by hand in Charleston.
            </h1>
            <p class="mk-lede">
              Over twenty years at the bench. Around two hundred trees in the nursery, each sold only when ready to leave.
            </p>
            <NuxtLink to="/visit" class="mk-link">
              Arrange a visit
            </NuxtLink>
          </section>

          <section
            class="mk-block mk-block--hand"
            data-sc-copy
            :data-sc-window="W.hand"
            :data-mk-t="legStart(1) + LEGS[1]!.rest"
            aria-labelledby="mk-hand"
          >
            <h2 id="mk-hand" class="mk-h2">
              The work is mostly waiting.
            </h2>
            <p class="mk-body">
              Wire goes on in late winter, copper or annealed aluminum, and comes off before it marks the bark.
              A branch removed in October is settled by April.
            </p>
          </section>

          <section
            class="mk-block mk-block--seasons"
            data-sc-copy
            :data-sc-window="W.seasons"
            :data-mk-t="legStart(2) + LEGS[2]!.rest"
            aria-labelledby="mk-seasons"
          >
            <h2 id="mk-seasons" class="mk-h2">
              One tree, every season.
            </h2>
            <p class="mk-body">
              Repotting follows the species, not the calendar. The pot is chosen after the tree has told you what it is,
              which is usually the last decision and never the first.
            </p>
          </section>

          <!-- The peak. Silence first (no copy), then the drop, the bloom, the real tree. -->
          <div class="mk-veil" :data-mk-window="W.veil" aria-hidden="true" />
          <div class="mk-peak" data-sc-copy :data-sc-window="W.peak" aria-hidden="true">
            <canvas v-show="webgl" ref="bloomCanvas" class="mk-bloom" />
            <figure v-if="!webgl" class="mk-bloom mk-bloom--still">
              <img src="/makimono/b-tree.jpg" alt="" class="mk-bloom__paint">
              <img :src="peakTree?.thumbnail || FALLBACK_PHOTO" alt="" class="mk-bloom__photo">
            </figure>
          </div>

          <section
            class="mk-block mk-block--peak"
            data-sc-copy
            :data-sc-window="W.real"
            :data-mk-t="legStart(3) + LEGS[3]!.rest"
            aria-labelledby="mk-real"
          >
            <p class="mk-kicker">
              Not a painting.
            </p>
            <h2 id="mk-real" class="mk-h2">
              This one is real.
            </h2>
            <template v-if="peakTree">
              <p class="mk-body">
                <em class="mk-species">{{ peakTree.species }}</em>, {{ peakTree.name }}. In the nursery now.
              </p>
              <NuxtLink :to="`/gallery/${peakTree.slug}`" class="mk-link">
                See this tree
              </NuxtLink>
            </template>
            <template v-else>
              <p class="mk-body">
                A tree from the nursery bench, photographed where it grows.
              </p>
              <NuxtLink to="/gallery" class="mk-link">
                The catalog
              </NuxtLink>
            </template>
          </section>

          <section
            class="mk-block mk-block--nursery"
            data-sc-copy
            :data-sc-window="W.nursery"
            :data-mk-t="legStart(4) + LEGS[4]!.rest"
            aria-labelledby="mk-nursery"
          >
            <h2 id="mk-nursery" class="mk-h2">
              Around two hundred trees, in the Lowcountry.
            </h2>
            <p class="mk-body">
              Nursery stock and collected trees, trained in-house and grown in akadama, pumice and lava, blended by species.
            </p>
            <NuxtLink to="/gallery" class="mk-link">
              The catalog
            </NuxtLink>
          </section>

          <!-- Real specimens, hung under the oaks like scrolls. Labels are facts, not pitch. -->
          <NuxtLink
            v-for="(tree, i) in hung"
            :key="tree.id"
            :to="`/gallery/${tree.slug}`"
            class="mk-hung"
            data-mk-plane="front"
            :data-mk-at="hungAt(i)"
            :data-mk-atm="hungAt(i, true)"
            data-mk-x="0.52"
            data-mk-xm="0.5"
            :data-mk-t="hungAt(i)"
            :data-mk-tm="hungAt(i, true)"
          >
            <span class="mk-hung__cord" aria-hidden="true" />
            <span class="mk-hung__silk">
              <img
                :src="tree.thumbnail"
                :alt="`${tree.name}, ${tree.species}`"
                loading="lazy"
                decoding="async"
                width="300"
                height="400"
              >
            </span>
            <span class="mk-hung__label">
              <em>{{ tree.species }}</em>
              <span class="mk-hung__name">{{ tree.name }}</span>
              <span class="mk-hung__meta">{{ metaLine(tree) }}</span>
              <span class="mk-hung__price">Price on inquiry</span>
            </span>
          </NuxtLink>

          <section
            class="mk-block mk-block--bench"
            data-sc-copy
            :data-sc-window="W.bench"
            :data-mk-t="legStart(5) + LEGS[5]!.rest"
            aria-labelledby="mk-bench"
          >
            <h2 id="mk-bench" class="mk-h2">
              The bench travels.
            </h2>
            <p class="mk-body">
              Retreats in the Blue Ridge: one tree per guest, worked across the visit and carried home.
              Arrangements composed for a room and an evening, across the Lowcountry.
            </p>
            <p class="mk-pair">
              <NuxtLink to="/retreats" class="mk-link">
                Retreats
              </NuxtLink>
              <NuxtLink to="/events" class="mk-link">
                Events
              </NuxtLink>
            </p>
          </section>

          <section class="mk-block mk-block--finale" data-sc-copy data-sc-window="finale" :data-mk-t="TOTAL" aria-labelledby="mk-finale">
            <p class="mk-kicker">
              You drew this circle on the way here.
            </p>
            <h2 id="mk-finale" class="mk-h2">
              Come and see the trees.
            </h2>
            <address class="mk-body mk-address">
              Visits are by appointment, Tuesday through Saturday, at 943 Godber Street, Charleston, SC 29412.
              <a :href="contactMailto">{{ contactEmail }}</a>
            </address>
            <footer class="mk-colophon" role="contentinfo">
              <LayoutSubscribeForm />
              <p class="mk-colophon__legal">
                <span>© {{ new Date().getFullYear() }} {{ siteName }}</span>
                <NuxtLink to="/privacy-policy">
                  Privacy
                </NuxtLink>
                <NuxtLink to="/terms-of-service">
                  Terms
                </NuxtLink>
              </p>
            </footer>
          </section>
        </div>

        <div data-sc-spacer class="sc-world__spacer" aria-hidden="true" />
      </div>
    </main>

    <!-- The visitor's ensō: the route map, the record of the journey, and at the end, the moon. -->
    <div ref="ensoEl" class="mk-enso">
      <button
        type="button"
        class="mk-enso__map"
        popovertarget="mk-route"
        aria-label="Map of the scroll"
      >
        <canvas ref="ensoCanvas" class="mk-enso__canvas" aria-hidden="true" />
        <span
          v-for="tick in ticks"
          :key="tick.key"
          class="mk-enso__tick"
          aria-hidden="true"
          :style="{ left: `${tick.x}%`, top: `${tick.y}%` }"
        />
      </button>
      <NuxtLink
        to="/visit"
        class="mk-seal"
        :tabindex="sealed ? 0 : -1"
        :aria-hidden="sealed ? undefined : 'true'"
      >
        <span class="mk-seal__stamp" lang="ja" aria-hidden="true">盆栽</span>
        <span class="mk-seal__label">Arrange a visit</span>
      </NuxtLink>
    </div>

    <nav id="mk-route" ref="routeEl" popover class="mk-route" aria-label="Handscroll">
      <ol>
        <li v-for="(leg, i) in LEGS" :key="leg.key">
          <button type="button" :aria-current="i === current ? 'step' : undefined" @click="goTo(i)">
            <span class="mk-route__kanji" lang="ja" aria-hidden="true">{{ leg.kanji }}</span>
            <span>{{ leg.label }}</span>
          </button>
        </li>
      </ol>
    </nav>
  </div>
</template>

<style>
/* Map the engine's tokens onto the site's. Only the engine stylesheet reads --sc-*,
   and it is only on the page while this route is. */
:root {
  --sc-canvas: var(--surface);
  --sc-surface: var(--surface-raised);
  --sc-ink: var(--text);
  --sc-ink-soft: var(--text-muted);
  --sc-accent: oklch(0.55 0.17 31);
  --sc-accent-ink: oklch(0.97 0.012 70);
  --sc-font-display: var(--font-display);
  --sc-font-text: var(--font-body);
}

/* The engine stylesheet asks for native smooth scrolling, which fights Lenis. */
html.lenis { scroll-behavior: auto; }
</style>

<style scoped>
.mk {
  --paper: var(--surface);
  --sumi: var(--text);
  /* Shu-niku, the vermilion of seal paste. The page's one accent, used only for the seal. */
  --shu: oklch(0.55 0.17 31);
  --shu-ink: oklch(0.97 0.012 70);
  --kanji: 'Yuji Syuku', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
  --gutter: clamp(1.25rem, 6vw, 6.5rem);
  --band-h: 100svh;
  --band-bottom: 0px;
  --moon-x: 50vw;
  --moon-y: 30vh;
  --moon-size: 40vh;
  background: var(--paper);
  color: var(--sumi);
}

/* ---------------------------------------------------------------- world -- */
.mk-world {
  background: var(--paper);
}

.mk-paper {
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(100vw + 480px);
  opacity: 0.55;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='480'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.09' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0.11  0 0 0 0 0.12  0 0 0 0 0.10  0 0 0 0.07 0'/></filter><rect width='480' height='480' filter='url(%23f)'/></svg>");
  background-size: 480px 480px;
  will-change: transform;
}

.mk-band {
  position: absolute;
  inset: 0;
}

.mk-plate,
.mk-mist,
.mk-season,
.mk-hung {
  position: absolute;
  left: 0;
  visibility: hidden;
  will-change: transform;
}

.mk-plate {
  /* Where the plate sits at t = 0, so the first paint is right before any script runs. */
  --px: var(--x);
  transform: translate3d(calc(var(--px) * 100vw + var(--dx0) * var(--band-h) - 50%), 0, 0);
  bottom: calc(var(--band-bottom) + var(--y) * var(--band-h));
  height: calc(var(--h) * var(--band-h));
  width: calc(var(--h) * var(--band-h) * var(--r));
  max-width: none;
  pointer-events: none;
  user-select: none;
}

/* Feathered edges: a painting that runs off its own paper dissolves into the
   ground instead of ending on a hard line. The mask is in the plate's own
   coordinates, so it follows a flipped plate. */
.mk-plate[data-fade] {
  --fl: 0%;
  --fr: 0%;
  --ft: 0%;
  --fb: 0%;
  --mask:
    linear-gradient(to right, transparent, #000 var(--fl), #000 calc(100% - var(--fr)), transparent),
    linear-gradient(to bottom, transparent, #000 var(--ft), #000 calc(100% - var(--fb)), transparent);
  -webkit-mask-image: var(--mask);
  -webkit-mask-composite: source-in;
  mask-image: var(--mask);
  mask-composite: intersect;
}
.mk-plate[data-fade*='l'] { --fl: 18%; }
.mk-plate[data-fade*='r'] { --fr: 18%; }
.mk-plate[data-fade*='t'] { --ft: 22%; }
.mk-plate[data-fade*='b'] { --fb: 16%; }
.mk-plate--far[data-fade*='b'] { --fb: 40%; }

.mk-plate[data-first] { visibility: visible; }
.mk-plate[data-mk-flip='1'] { transform: translate3d(calc(var(--px) * 100vw + var(--dx0) * var(--band-h) - 50%), 0, 0) scaleX(-1); }

.mk-plate--far { z-index: 1; }
.mk-mist { z-index: 2; }
.mk-plate--mid, .mk-season { z-index: 3; }
.mk-plate--near { z-index: 5; }

.mk-mist {
  bottom: calc(var(--band-bottom) + var(--y) * var(--band-h));
  width: calc(var(--w) * var(--band-h));
  height: calc(var(--h) * var(--band-h));
  background: radial-gradient(closest-side, var(--paper) 30%, color-mix(in oklch, var(--paper) 70%, transparent) 62%, transparent);
  pointer-events: none;
}

.mk-season {
  bottom: calc(var(--band-bottom) + 0.57 * var(--band-h));
  width: 1.6em;
  opacity: 0;
  text-align: center;
  font-family: var(--kanji);
  font-size: clamp(1rem, calc(var(--band-h) * 0.03), 1.6rem);
  color: var(--text-muted);
  pointer-events: none;
}

/* A hanging scroll: cord, silk mount, the photograph, a museum label.
   It lives in the copy layer (reading order, focus), but travels with the world. */
.mk-hung {
  visibility: visible;
  z-index: 1;
  transform: translate3d(-200vw, 0, 0);
  pointer-events: auto;
  bottom: calc(var(--band-bottom) + 0.06 * var(--band-h));
  width: clamp(8.5rem, calc(var(--band-h) * 0.21), 13rem);
  display: flex;
  flex-direction: column;
  padding: 0.9rem 0.85rem 1rem;
  background: color-mix(in oklch, var(--paper) 88%, var(--sumi));
  border-top: 3px solid var(--sumi);
  border-bottom: 3px solid var(--sumi);
  box-shadow: 0 2px 4px color-mix(in oklch, var(--sumi) 12%, transparent),
              0 14px 28px -12px color-mix(in oklch, var(--sumi) 30%, transparent);
  color: var(--sumi);
  text-decoration: none;
  transition: box-shadow 180ms var(--sc-ease-out, ease-out);
}

.mk-hung__cord {
  position: absolute;
  left: 33%;
  bottom: calc(100% + 3px);
  width: 34%;
  height: 1.4rem;
  background:
    linear-gradient(to top right, transparent calc(50% - 0.6px), var(--text-muted) 50%, transparent calc(50% + 0.6px)) left / 50% 100% no-repeat,
    linear-gradient(to top left, transparent calc(50% - 0.6px), var(--text-muted) 50%, transparent calc(50% + 0.6px)) right / 50% 100% no-repeat;
}

.mk-hung__silk {
  display: block;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--surface-sunken);
}

.mk-hung__silk img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mk-hung__label {
  display: grid;
  gap: 0.15rem;
  margin-top: 0.7rem;
  font-size: 0.75rem;
  line-height: 1.35;
}

.mk-hung__label em {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-style: italic;
}

.mk-hung__name {
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.66rem;
}

.mk-hung__meta {
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

.mk-hung__price {
  color: var(--text-muted);
}

@media (hover: hover) and (pointer: fine) {
  .mk-hung:hover {
    box-shadow: 0 3px 6px color-mix(in oklch, var(--sumi) 14%, transparent),
                0 22px 40px -14px color-mix(in oklch, var(--sumi) 36%, transparent);
  }
}

.mk-hung:active { scale: 0.98; }

/* ----------------------------------------------------------------- copy -- */
.mk-block {
  position: absolute;
  max-width: 27rem;
  display: grid;
  gap: 1.1rem;
  justify-items: start;
}

/* The engine's copy drift is replaced by the page's rise-on-fade-in (see `copies`). */
.mk-copy [data-sc-copy] { transform: none !important; }

.mk-block--hero { left: calc(var(--gutter) + 2.5rem); top: 31vh; max-width: 30rem; }
.mk-block--hand { left: var(--gutter); top: 18vh; }
.mk-block--seasons { right: var(--gutter); top: 11vh; }
.mk-block--peak { z-index: 5; right: var(--gutter); top: 0; bottom: 0; margin-block: auto; height: fit-content; max-width: 22rem; }
.mk-block--nursery { right: var(--gutter); top: 13vh; }
.mk-block--bench { right: var(--gutter); top: 14vh; }
.mk-block--finale {
  right: var(--gutter);
  top: 16vh;
  bottom: 4vh;
  max-width: 25rem;
  align-content: start;
  grid-template-rows: auto auto auto 1fr;
}

/* Long horizontal mist bands (suyari-gasumi) behind the copy. */
.mk-scrim {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  background: radial-gradient(closest-side, var(--paper) 62%, color-mix(in oklch, var(--paper) 78%, transparent) 80%, transparent);
}
.mk-scrim--hero { left: -12vw; top: 14vh; width: 70vw; height: 76vh; }
.mk-scrim--hand { left: -14vw; top: 0; width: 64vw; height: 62vh; }
.mk-scrim--seasons { right: -14vw; top: -4vh; width: 64vw; height: 60vh; }
.mk-scrim--nursery { right: -14vw; top: -4vh; width: 64vw; height: 64vh; }
.mk-scrim--bench { right: -14vw; top: -4vh; width: 64vw; height: 64vh; }
.mk-scrim--finale { right: -10vw; top: 2vh; width: 58vw; height: 100vh; }

.mk-veil {
  position: absolute;
  z-index: 3;
  inset: 0;
  opacity: 0;
  background: var(--paper);
  pointer-events: none;
}

.mk-tategaki {
  position: absolute;
  right: calc(100% + 1.5rem);
  top: 0.2rem;
  margin: 0;
  writing-mode: vertical-rl;
  font-family: var(--kanji);
  font-size: 1.6rem;
  letter-spacing: 0.3em;
  color: var(--text-muted);
}

.mk-h1 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.6rem, 1.6rem + 3.2vw, 4.75rem);
  line-height: 1.02;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.mk-h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.9rem, 1.3rem + 1.9vw, 3.1rem);
  line-height: 1.06;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.mk-lede,
.mk-body {
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--text-muted);
  max-width: 34ch;
  text-wrap: pretty;
  font-style: normal;
}

.mk-lede { font-size: 1.15rem; max-width: 30ch; }

.mk-species {
  font-family: var(--font-display);
  color: var(--sumi);
}

.mk-kicker {
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.05rem;
  color: var(--text-muted);
}

.mk-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--sumi);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.5em;
  transition: color 160ms var(--sc-ease-out, ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .mk-link:hover { color: var(--shu); }
}

.mk-pair { display: flex; gap: 2rem; margin: 0; }

.mk-address a { color: var(--sumi); display: inline-block; margin-top: 0.4rem; }

.mk-colophon {
  align-self: end;
  display: grid;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-hair);
  font-size: 0.8rem;
  color: var(--text-muted);
  width: 100%;
}

.mk-colophon__legal {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.25rem;
  margin: 0;
}

.mk-colophon__legal a { color: inherit; }

/* ----------------------------------------------------------------- peak -- */
.mk-peak {
  position: absolute;
  z-index: 4;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.mk-bloom {
  aspect-ratio: 3 / 4;
  height: min(84svh, 112vw);
  translate: -12vw 0;
}

.mk-bloom--still { position: relative; margin: 0; }
.mk-bloom--still img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.mk-bloom__paint { mix-blend-mode: multiply; }
.mk-bloom__photo {
  mask-image: radial-gradient(closest-side, #000 80%, transparent 98%);
}

/* ----------------------------------------------------------------- ensō -- */
.mk-enso {
  position: fixed;
  right: clamp(1rem, 2.5vw, 2.25rem);
  bottom: clamp(1rem, 2.5vw, 2.25rem);
  z-index: 60;
}

.mk-enso__map {
  position: relative;
  display: block;
  width: 7rem;
  height: 7rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transform-origin: 50% 50%;
  will-change: transform;
}

.mk-enso__canvas {
  width: 100%;
  height: 100%;
}

.mk-enso__tick {
  position: absolute;
  width: 3px;
  height: 3px;
  margin: -1.5px 0 0 -1.5px;
  border-radius: 50%;
  background: var(--text-faint);
  transition: opacity 240ms var(--sc-ease-out, ease-out);
}

.mk-enso.is-moon .mk-enso__tick { opacity: 0; }

.mk-seal {
  position: fixed;
  left: calc(var(--moon-x) + var(--moon-size) * 0.24);
  top: calc(var(--moon-y) + var(--moon-size) * 0.2);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  color: var(--sumi);
  text-decoration: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms var(--sc-ease-out, ease-out);
}

.mk-seal__stamp {
  display: grid;
  place-items: center;
  width: 3.6rem;
  height: 3.6rem;
  padding: 0.2rem;
  writing-mode: vertical-rl;
  font-family: var(--kanji);
  font-size: 1.35rem;
  line-height: 1;
  color: var(--shu-ink);
  background: var(--shu);
  border-radius: 3px;
  box-shadow: inset 0 0 0 2px var(--shu), inset 0 0 0 3px var(--shu-ink);
  rotate: -3deg;
  scale: 1.18;
  transition: scale 260ms cubic-bezier(0.2, 1.4, 0.4, 1);
}

.mk-seal__label {
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.5em;
  white-space: nowrap;
}

.mk--sealed .mk-seal { opacity: 1; pointer-events: auto; }
.mk--sealed .mk-seal__stamp { scale: 1; }

@media (hover: hover) and (pointer: fine) {
  .mk-seal:hover .mk-seal__label { color: var(--shu); }
}
.mk-seal:active .mk-seal__stamp { scale: 0.96; }

.mk-route {
  inset: auto clamp(1rem, 2.5vw, 2.25rem) calc(clamp(1rem, 2.5vw, 2.25rem) + 7.75rem) auto;
  margin: 0;
  padding: 0.5rem;
  border: 1px solid var(--border-hair);
  border-radius: 4px;
  background: var(--surface);
  color: var(--sumi);
  box-shadow: 0 2px 4px color-mix(in oklch, var(--sumi) 10%, transparent),
              0 18px 40px -12px color-mix(in oklch, var(--sumi) 28%, transparent);
}

.mk-route ol { list-style: none; margin: 0; padding: 0; }

.mk-route button {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0 1rem 0 0.75rem;
  border: 0;
  border-radius: 3px;
  background: transparent;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms var(--sc-ease-out, ease-out);
}

.mk-route button:hover { background: var(--surface-raised); }
.mk-route button[aria-current] { color: var(--shu); }

.mk-route__kanji {
  width: 2.2rem;
  font-family: var(--kanji);
  font-size: 1.1rem;
  text-align: center;
}

/* ---------------------------------------------------------- dark paper -- */
[data-theme='dark'] .mk-plate,
[data-theme='dark'] .mk-enso__canvas {
  filter: invert(1) hue-rotate(180deg);
}

/* ------------------------------------------------------ portrait phones -- */
@media (max-aspect-ratio: 4/5) {
  .mk {
    --band-h: 55svh;
    --band-bottom: 33svh;
  }

  .mk-plate {
    --px: var(--xm);
  }

  .mk-block,
  .mk-block--hero,
  .mk-block--hand,
  .mk-block--seasons,
  .mk-block--peak,
  .mk-block--nursery,
  .mk-block--bench {
    left: 1.25rem;
    right: 1.25rem;
    top: auto;
    bottom: calc(1.5rem + env(safe-area-inset-bottom));
    margin: 0;
    max-width: none;
    height: auto;
    gap: 0.75rem;
  }

  .mk-block--finale {
    left: 1.25rem;
    right: 1.25rem;
    top: calc(50svh + 3.75rem);
    bottom: calc(1rem + env(safe-area-inset-bottom));
    max-width: none;
    gap: 0.75rem;
  }

  .mk-scrim {
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    bottom: 0;
    width: auto !important;
    height: 42svh !important;
    background: linear-gradient(to top, var(--paper) 72%, transparent);
  }

  .mk-scrim--finale { height: 50svh !important; background: linear-gradient(to top, var(--paper) 86%, transparent); }

  .mk-hung { width: clamp(9.5rem, calc(var(--band-h) * 0.4), 15rem); }

  .mk-tategaki { display: none; }
  .mk-h1 { font-size: 2.15rem; }
  .mk-h2 { font-size: 1.7rem; }
  .mk-lede, .mk-body { font-size: 1rem; max-width: none; }

  .mk-peak { place-items: start center; padding-top: 12svh; }
  .mk-bloom { height: 52svh; translate: none; }

  .mk-enso { top: 4.5rem; bottom: auto; right: 0.75rem; }
  .mk-enso__map { width: 4.75rem; height: 4.75rem; }
  .mk-route { inset: 10rem 0.75rem auto auto; }
  /* On a phone the gate fills the band, so the seal becomes the first line of the close. */
  .mk-seal { left: 1.25rem; top: 50svh; flex-direction: row; align-items: center; }
  .mk-seal__stamp { width: 3rem; height: 3rem; font-size: 1.1rem; }
}

/* ------------------------------------------------------- reduced motion -- */
.mk--rm .mk-enso__map { transition: transform 0s, opacity 220ms ease-out; }
.mk--rm .mk-seal__stamp { transition: none; scale: 1; }
</style>
