<script setup lang="ts">
/**
 * Transport (content.md §5): play/pause, grow again, and a scrubber with a
 * real slider role. Pointer down seeks and pauses; dragging keeps seeking
 * with pointer capture; arrow keys step, Home/End jump.
 */
import type { TimelineState } from '~/lib/studio/timeline'
import { DUR, formatClock, STAGES } from '~/lib/studio/timeline'

const props = defineProps<{ state: TimelineState, playing: boolean, stage: number }>()
const emit = defineEmits<{ seek: [frac: number], toggle: [], restart: [] }>()

const track = ref<HTMLElement | null>(null)
const pct = computed(() => Math.round(props.state.frac * 100))
const valueText = computed(() => `${pct.value}%, ${STAGES[props.stage]?.romaji ?? ''}: ${STAGES[props.stage]?.en ?? ''}`)

function fracAt(e: PointerEvent): number {
  const r = track.value?.getBoundingClientRect()
  if (!r || r.width === 0)
    return 0
  return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
}

function down(e: PointerEvent): void {
  track.value?.setPointerCapture(e.pointerId)
  emit('seek', fracAt(e))
}

function move(e: PointerEvent): void {
  if (e.buttons & 1 && track.value?.hasPointerCapture(e.pointerId))
    emit('seek', fracAt(e))
}

function key(e: KeyboardEvent): void {
  const step = e.shiftKey ? 0.1 : 0.02
  const f = props.state.frac
  const map: Record<string, number> = { ArrowRight: f + step, ArrowUp: f + step, ArrowLeft: f - step, ArrowDown: f - step, PageUp: f + 0.1, PageDown: f - 0.1, Home: 0, End: 1 }
  const v = map[e.key]
  if (v === undefined)
    return
  e.preventDefault()
  e.stopPropagation()
  emit('seek', Math.min(1, Math.max(0, v)))
}
</script>

<template>
  <div class="st-tl">
    <button type="button" class="st-tl__btn" :aria-label="playing ? 'Pause' : 'Play'" aria-keyshortcuts="Space" @click="$emit('toggle')">
      <svg v-if="playing" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" /></svg>
      <svg v-else viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 1.5l7 4.5-7 4.5z" fill="currentColor" /></svg>
    </button>
    <button type="button" class="st-tl__btn" aria-label="Grow again from soil" aria-keyshortcuts="R" @click="$emit('restart')">
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M6 2a4 4 0 1 1-3.6 2.3" fill="none" stroke="currentColor" stroke-width="1.3" /><path d="M1.5 1.5v3h3" fill="none" stroke="currentColor" stroke-width="1.3" /></svg>
    </button>
    <div class="st-tl__body">
      <div
        ref="track"
        class="st-tl__track"
        role="slider"
        tabindex="0"
        aria-label="Growth"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="pct"
        :aria-valuetext="valueText"
        @pointerdown="down"
        @pointermove="move"
        @keydown="key"
      >
        <div class="st-tl__rail" />
        <div class="st-tl__fill" :style="{ transform: `scaleX(${state.frac})` }" />
        <span
          v-for="(s, i) in STAGES"
          :key="s.romaji"
          class="st-tl__tick"
          :class="{ 'st-tl__tick--on': i <= stage }"
          :style="{ left: `${(s.t / DUR) * 100}%` }"
          aria-hidden="true"
        >
          <span class="st-tl__tick-label"><span lang="ja">{{ s.jp }}</span> {{ s.romaji }}</span>
        </span>
        <div class="st-tl__thumb" :style="{ left: `${state.frac * 100}%` }" />
      </div>
    </div>
    <p class="st-tl__clock" aria-hidden="true">
      <span>{{ formatClock(state.t) }}</span> <span class="st-tl__dur">/ {{ formatClock(DUR) }}</span>
    </p>
  </div>
</template>
