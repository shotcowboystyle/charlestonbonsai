/**
 * The growth timeline. `timelineState(t)` is a pure function of time: every
 * reveal value the scene uses is derived here, so playing forwards, scrubbing
 * backwards and seeking from a deep link all produce identical frames.
 */

export interface Stage {
  t: number
  jp: string
  romaji: string
  en: string
}

/** Total run in seconds. Unhurried, but short enough to replay. */
export const DUR = 8.0

/** Each stage finishes at this fraction of its span, leaving a beat of stillness. */
export const SETTLE = 0.93

export const STAGES: readonly Stage[] = [
  { t: 0.0, jp: '根張り', romaji: 'Nebari', en: 'Root flare and soil' },
  { t: 1.2, jp: '幹', romaji: 'Miki', en: 'Trunk' },
  { t: 2.35, jp: '枝', romaji: 'Eda', en: 'Primary branches' },
  { t: 3.45, jp: '小枝', romaji: 'Koeda', en: 'Ramification' },
  { t: 4.6, jp: '針金', romaji: 'Harigane', en: 'Wiring' },
  { t: 5.75, jp: '葉', romaji: 'Ha', en: 'Foliage' },
  { t: 6.95, jp: '苔', romaji: 'Koke', en: 'Moss and top-dressing' },
]

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)

/** Fast-out: members snap into place rather than sliding. */
export const easeOut = (x: number) => 1 - (1 - x) ** 2.6

export function stageIndexAt(t: number): number {
  let i = 0
  for (let k = 0; k < STAGES.length; k++) {
    if (t >= (STAGES[k] as Stage).t)
      i = k
  }
  return i
}

export function stageSpan(i: number): number {
  const s = STAGES[i] as Stage
  const next = STAGES[i + 1]
  return (next ? next.t : DUR) - s.t
}

/** Raw local fraction of stage `i` in [0, 1] over its whole span. */
export function stageLocal(t: number, i: number): number {
  return clamp01((t - (STAGES[i] as Stage).t) / stageSpan(i))
}

/** Eased progress of stage `i`, finishing at SETTLE of its span. */
export function stageProgress(t: number, i: number): number {
  const f = clamp01((t - (STAGES[i] as Stage).t) / (stageSpan(i) * SETTLE))
  return easeInOut(f)
}

/** The §2 staggered envelope: every member still reaches 1 on time. */
export function stagger(grow: number, delay: number): number {
  return delay >= 1 ? 0 : clamp01((grow - delay) / (1 - delay))
}

export interface TimelineState {
  t: number
  stage: number
  /** Overall fraction of the run, for the fill bar and percentage. */
  frac: number
  /** 0..1 rise of the clipping plane through pot, soil and rock. */
  plane: number
  /** Growth front in limb units: roots 0..1, trunk 1..2, primaries 2..3, ramification 3..4. */
  growth: number
  /** Wiring stage: coil-in envelope and the strip-out envelope. */
  wireGrow: number
  wireOut: number
  wireVisible: boolean
  foliage: number
  moss: number
}

export function timelineState(tIn: number): TimelineState {
  const t = Math.min(DUR, Math.max(0, tIn))
  const stage = stageIndexAt(t)
  const nebariLocal = clamp01(t / (stageSpan(0) * SETTLE))
  const plane = easeInOut(clamp01(nebariLocal / 0.62))
  const roots = easeInOut(clamp01((nebariLocal - 0.38) / 0.62))
  const growth = roots + stageProgress(t, 1) + stageProgress(t, 2) + stageProgress(t, 3)
  const wl = stageLocal(t, 4)
  const wireGrow = t < (STAGES[4] as Stage).t ? 0 : clamp01(wl / 0.5)
  const wireOut = wl > 0.78 ? clamp01((wl - 0.78) / (SETTLE - 0.78)) : 0
  return {
    t,
    stage,
    frac: t / DUR,
    plane,
    growth,
    wireGrow,
    wireOut,
    wireVisible: stage === 4 && wireOut < 1,
    foliage: stageProgress(t, 5),
    moss: stageProgress(t, 6),
  }
}

/** "0:04.20" style readout for the transport. */
export function formatClock(t: number): string {
  const s = Math.max(0, t)
  const whole = Math.floor(s)
  const cs = Math.floor((s - whole) * 100)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}
