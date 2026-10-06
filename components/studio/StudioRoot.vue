<script setup lang="ts">
/**
 * Bonsai Studio root: owns the engine lifecycle and wires the chrome to it.
 * three.js is only reached through the dynamic engine import in onMounted,
 * so nothing touches `window` during SSR or `nuxt generate`.
 */
import type { Engine } from '~/lib/studio/engine'
import type { KeyAction } from '~/lib/studio/keys'
import type { Selection, SelectionKey } from '~/lib/studio/state'
import type { TimelineState } from '~/lib/studio/timeline'
import { atmoById } from '~/lib/studio/atmospheres'
import { sizeById, sizeRangeLabel } from '~/lib/studio/bonsai/sizes'
import { speciesById } from '~/lib/studio/bonsai/species'
import { styleById } from '~/lib/studio/bonsai/styles'
import { installHooks } from '~/lib/studio/hooks'
import { keyToAction } from '~/lib/studio/keys'
import { landscapeMetaById } from '~/lib/studio/landscapes/meta'
import { cycleValue, parseQuery, sizeLocked, toQuery, withValue } from '~/lib/studio/state'
import { DUR, STAGES, timelineState } from '~/lib/studio/timeline'
import { useToastStore } from '~/stores/toast'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Automation: ?capture=1 hides the chrome so scorecards and stills measure the scene alone.
const capture = route.query.capture === '1'
const selection = ref<Selection>(parseQuery(route.query))
const tl = shallowRef<TimelineState>(timelineState(reduced ? DUR : 0))
const playing = ref(!reduced)
const stage = ref(0)
const sound = ref(false)
const failed = ref(false)
const ready = ref(false)
const announce = ref('')

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const headerRef = ref<{ el: HTMLElement | null } | null>(null)
const footerRef = ref<HTMLElement | null>(null)
const plaqueRef = ref<{ el: HTMLElement | null } | null>(null)

const style = computed(() => styleById(selection.value.style))
const species = computed(() => speciesById(selection.value.tree))
const size = computed(() => sizeById(selection.value.size))
const scene = computed(() => landscapeMetaById(selection.value.scene))
const atmo = computed(() => atmoById(selection.value.atmo))
const stageInfo = computed(() => STAGES[stage.value] ?? STAGES[0]!)
const palette = computed(() => {
  const c = atmo.value.css
  return { '--st-paper': c.paper, '--st-ink': c.ink, '--st-ink-soft': c.inkSoft, '--st-line': c.line, '--st-accent': c.accent, '--st-scrim': c.scrim }
})

let engine: Engine | null = null
let unhook: (() => void) | null = null
let observer: ResizeObserver | null = null

function select<K extends SelectionKey>(key: K, value: Selection[K], instant = false): void {
  const next = withValue(selection.value, key, value)
  if (next === selection.value)
    return
  selection.value = next
  engine?.setSelection(next, instant)
}

function onPick(key: SelectionKey, value: string): void {
  select(key, value as Selection[typeof key])
}

function cycle(key: SelectionKey, dir: 1 | -1 = 1): void {
  const next = cycleValue(selection.value, key, dir)
  if (next === selection.value)
    return
  selection.value = next
  engine?.setSelection(next)
}

watch(selection, (sel) => {
  router.replace({ query: { ...route.query, ...toQuery(sel) } })
})

watch([stage, selection], () => {
  announce.value = `${stageInfo.value.romaji}, ${stageInfo.value.en}. ${species.value.common}, ${style.value.name} style, ${size.value.name} ${sizeRangeLabel(size.value.id)}.`
})

function seekFrac(f: number): void {
  engine?.seek(Math.min(1, Math.max(0, f)) * DUR)
}

function togglePlay(): void {
  if (!engine)
    return
  if (engine.playing)
    engine.pause()
  else engine.play()
}

function toggleSound(): void {
  sound.value = !sound.value
  engine?.audio.setEnabled(sound.value)
  localStorage.setItem('cb-studio-sound', sound.value ? 'on' : 'off')
}

/** Sound stays off until a gesture: a stored "on" preference starts on the first tap or key. */
function armSound(): void {
  const start = () => {
    if (sound.value)
      engine?.audio.setEnabled(true)
  }
  window.addEventListener('pointerdown', start, { once: true })
  window.addEventListener('keydown', start, { once: true })
}

function restart(): void {
  engine?.restart()
}

function run(a: KeyAction): void {
  if (a.type === 'toggle')
    togglePlay()
  else if (a.type === 'restart')
    restart()
  else if (a.type === 'reset-view')
    engine?.resetView()
  else if (a.type === 'cycle')
    cycle(a.key, a.dir)
  else if (a.type === 'orbit')
    engine?.nudge(a.az, a.el)
  else if (a.type === 'zoom')
    engine?.zoomBy(a.factor)
  else if (a.type === 'sound')
    toggleSound()
}

function onKey(e: KeyboardEvent): void {
  const el = e.target as HTMLElement
  const action = keyToAction(e, { tag: el.tagName ?? 'body', role: el.getAttribute?.('role') ?? null })
  if (!action)
    return
  e.preventDefault()
  run(action)
}

function measure() {
  const root = rootRef.value
  const head = headerRef.value?.el
  const foot = footerRef.value
  const w = root?.clientWidth ?? window.innerWidth
  const h = root?.clientHeight ?? window.innerHeight
  const strip = root?.querySelector<HTMLElement>('.st-selectors')
  const mobile = w <= 760 || h <= 460
  const stripH = mobile && strip ? strip.offsetHeight : 0
  root?.style.setProperty('--st-foot-h', `${foot?.offsetHeight ?? 0}px`)
  return { width: w, height: h, top: head?.offsetHeight ?? 0, bottom: (foot?.offsetHeight ?? 0) + stripH }
}

function webglAvailable(): boolean {
  const c = document.createElement('canvas')
  return Boolean(c.getContext('webgl2'))
}

onMounted(async () => {
  sound.value = localStorage.getItem('cb-studio-sound') === 'on'
  window.addEventListener('keydown', onKey)
  if (!webglAvailable() || !canvasRef.value) {
    failed.value = true
    toast.addToast('warning', { title: 'The studio needs WebGL', description: 'This browser cannot draw the 3D garden, so a still study is shown instead.' })
    return
  }
  try {
    const { createEngine } = await import('~/lib/studio/engine')
    engine = createEngine({
      canvas: canvasRef.value,
      selection: selection.value,
      reducedMotion: reduced,
      mobile: Math.min(window.innerWidth, window.innerHeight) < 600,
      measure,
      onTime: (s, p) => {
        tl.value = s
        playing.value = p
      },
      onStage: (s) => {
        stage.value = s
      },
      onPlaque: (x, y) => {
        const el = plaqueRef.value?.el
        if (!el)
          return
        const w = el.offsetWidth
        const px = Math.min(Math.max(8, x + 16), (rootRef.value?.clientWidth ?? 0) - w - 8)
        el.style.transform = `translate3d(${px.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateY(-50%)`
      },
    })
    if (sound.value)
      armSound()
    unhook = installHooks({
      seek: seekFrac,
      select,
      orbit: (az, el, zoom) => engine?.orbit(az, el, zoom),
      perf: () => engine?.perf(),
      state: () => ({ t: engine?.t ?? 0, playing: engine?.playing ?? false, selection: selection.value }),
      project: (x, y, z) => engine?.project(x, y, z) ?? [0, 0],
    })
    observer = new ResizeObserver(() => engine?.layout())
    if (rootRef.value)
      observer.observe(rootRef.value)
    ready.value = true
  }
  catch (err) {
    // Safe to continue: the static fallback replaces the canvas and the toast
    // reports the failure to the visitor; there is no data to protect.
    failed.value = true
    toast.addToast('error', { title: 'The studio could not start', description: err instanceof Error ? err.message : String(err) })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  observer?.disconnect()
  unhook?.()
  engine?.dispose()
  engine = null
})
</script>

<template>
  <div ref="rootRef" class="st" :class="{ 'st--ready': ready, 'st--night': atmo.id === 'tsukiyo', 'st--interior': scene.interior, 'st--capture': capture }" :style="palette" :data-atmo="atmo.id">
    <canvas v-show="!failed" ref="canvasRef" class="st__canvas" aria-label="Bonsai Studio: a 3D garden. Drag to turn the view, pinch or scroll to zoom, double-click to reset." role="img" tabindex="0" />
    <StudioFallback v-if="failed" :species="species.common" :style-name="style.name" />

    <StudioHeader ref="headerRef" :sound="sound" @toggle-sound="toggleSound">
      <StudioSelectors :selection="selection" :size-locked="sizeLocked(selection)" @cycle="cycle" @pick="onPick" />
    </StudioHeader>

    <section class="st__headline" aria-label="Current tree">
      <p class="st__kanji" lang="ja">
        {{ style.jp }}
      </p>
      <h1 class="st__title">
        {{ style.name }} <span class="st__title-en">{{ style.english }}</span>
      </h1>
      <p class="st__line">
        {{ species.common }} <em>{{ species.latin }}</em>, {{ size.name }}, in the {{ scene.en }}
      </p>
    </section>

    <p class="st__pct" :class="{ 'st__pct--done': tl.frac >= 1 }" aria-hidden="true">
      {{ Math.round(tl.frac * 100) }}<span>%</span>
    </p>

    <StudioPlaque ref="plaqueRef" :stage="stageInfo" :species="species" :size="size" />
    <p class="sr-only" aria-live="polite">
      {{ announce }}
    </p>

    <footer ref="footerRef" class="st__footer">
      <StudioTimeline :state="tl" :playing="playing" :stage="stage" @seek="seekFrac" @toggle="togglePlay" @restart="restart" />
    </footer>
  </div>
</template>

<style src="./studio.css"></style>

<style src="./studio-controls.css"></style>

<style src="./studio-mobile.css"></style>
