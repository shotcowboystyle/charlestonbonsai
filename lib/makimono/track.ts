/**
 * The handscroll's timeline. Pure data and math, no DOM.
 *
 * Time `t` is position along the track, in track units. Each stretch of the
 * track has its own PACE (track units per viewport-height of scroll), so the
 * world can unroll slower than the wheel where there is something to look at.
 * The scroll reads right to
 * left like a real emakimono: as `t` grows, everything on the paper travels to
 * the right and new scenes unroll in from the left edge.
 */

export interface Leg {
  key: string
  kanji: string
  label: string
  /** Track this leg owns, in track units. */
  w: number
  /** Where the map lands inside the leg, in track units from its start. */
  rest: number
}

export const LEGS: readonly Leg[] = [
  { key: 'mountain', kanji: '山', label: 'Mountain', w: 1.3, rest: 0 },
  { key: 'hand', kanji: '手', label: 'The hand', w: 1.3, rest: 0.65 },
  { key: 'seasons', kanji: '四季', label: 'Seasons', w: 2.0, rest: 1.35 },
  { key: 'ink', kanji: '墨', label: 'Ink', w: 3.1, rest: 2.6 },
  { key: 'nursery', kanji: '庭', label: 'The nursery', w: 2.4, rest: 1.15 },
  { key: 'bench', kanji: '学', label: 'The bench', w: 2.2, rest: 1.2 },
  { key: 'seal', kanji: '印', label: 'The seal', w: 1.4, rest: 1.4 },
]

export const TOTAL = LEGS.reduce((sum, leg) => sum + leg.w, 0)

/** Track time at which leg `i` begins. */
export function legStart(i: number): number {
  return LEGS.slice(0, i).reduce((sum, leg) => sum + leg.w, 0)
}

/**
 * A copy window in track time, written as the engine's `data-sc-window`
 * string (fractions of the whole scroll). Ramps are fractions of the window.
 */
export function win(from: number, to: number, rampIn = 0.3, rampOut = 0.3): string {
  const f = (v: number) => (Math.min(Math.max(scrollAt(v) / SCROLL_TOTAL, 0), 1)).toFixed(4)
  return `${f(from)} ${f(to)} ${rampIn} ${rampOut}`
}

/**
 * Opacity of a window string at track time t, the same plateau-and-ramps curve
 * the engine applies to copy blocks. Scrims use it so they fade with their text
 * without being copy blocks themselves (the verification pass hides copy blocks
 * to photograph what is behind them, and a scrim is part of what is behind).
 */
export function windowOpacity(t: number, spec: string): number {
  const { pr, from, to, inEnd, outStart } = parseWindow(t, spec)
  if (pr < from)
    return 0
  if (pr < inEnd)
    return smooth((pr - from) / Math.max(inEnd - from, 0.001))
  if (pr <= outStart)
    return 1
  return smooth(1 - (pr - outStart) / Math.max(to - outStart, 0.001))
}

/**
 * How far through its fade-in a window is at track time t (0..1), and 1 from
 * then on. Copy rises while it fades in, then holds still: it does not drift.
 */
export function windowIn(t: number, spec: string): number {
  const { pr, from, inEnd } = parseWindow(t, spec)
  return pr >= inEnd ? 1 : smooth((pr - from) / Math.max(inEnd - from, 0.001))
}

function parseWindow(t: number, spec: string) {
  const [from = 0, to = 1, rIn = 0.3, rOut = 0.3] = spec.split(/\s+/).map(Number)
  const span = Math.max(to - from, 0.001)
  return { pr: scrollAt(t) / SCROLL_TOTAL, from, to, inEnd: from + span * rIn, outStart: to - span * rOut }
}

function smooth(x: number): number {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}

/** How fast the paper travels: band-heights of mid-plane travel per viewport-height of scroll. */
export const SPEED = 0.8

/** Parallax rate per plane. Copy never rides a plane. */
export const RATE = { far: 0.32, mist: 0.6, mid: 1, front: 1.06, near: 1.4 } as const
export type Plane = keyof typeof RATE

/**
 * Screen-space centre x (px) of something on `plane` that is anchored to sit at
 * `x` (fraction of viewport width) when the track reaches `at`.
 */
export function screenX(t: number, at: number, x: number, rate: number, vw: number, bandH: number): number {
  return x * vw + rate * SPEED * bandH * (t - at)
}

/** Reduced motion holds the world at the resting point of whichever leg the visitor is in. */
export function restTime(t: number): number {
  let i = 0
  while (i < LEGS.length - 1 && t >= legStart(i + 1)) i++
  return legStart(i) + (LEGS[i]?.rest ?? 0)
}

export interface Plate {
  /** Basename under /makimono/, served as .avif with a .webp fallback. */
  src: string
  plane: Plane
  at: number
  /** Anchor centre x, fraction of viewport width (desktop, then portrait phone). */
  x: number
  xm?: number
  /** Height as a fraction of the world band. */
  h: number
  /** Bottom edge, fraction of band height above the band's bottom. */
  y: number
  /** Asset width / height, so layout never waits on the image. */
  ratio: number
  flip?: boolean
  /**
   * Edges where the painting runs off its own paper ('t', 'b', 'l', 'r'). They
   * are feathered into the ground, because a subject sliced by a hard edge reads
   * as a layout error once it travels on screen.
   */
  fade?: string
}

// Ratios come from the processed assets (see scrollcraft/builds/makimono/process.sh).
export const PLATES: readonly Plate[] = [
  // far: pale ridges and marsh, tiled end to end
  { src: 'f-ridges', plane: 'far', at: -2.9, x: 0.5, h: 0.46, y: 0.2, ratio: 3.7, flip: true, fade: 'lr' },
  { src: 'f-ridges', plane: 'far', at: 3.4, x: 0.5, h: 0.46, y: 0.22, ratio: 3.7, fade: 'lr' },
  { src: 'f-marsh', plane: 'far', at: legStart(4) + 1.8, x: 0.5, h: 0.4, y: 0.12, ratio: 3.287, fade: 'lrb' },
  { src: 'f-ridges', plane: 'far', at: TOTAL + 3.2, x: 0.5, h: 0.5, y: 0.18, ratio: 3.7, flip: true, fade: 'lr' },

  // mid: the scenes
  { src: 'm-pine', plane: 'mid', at: 0, x: 0.84, xm: 0.84, h: 0.9, y: -0.06, ratio: 1.773, fade: 'b' },
  { src: 'm-hands2', plane: 'mid', at: 1.95, x: 0.62, xm: 0.5, h: 0.72, y: 0.02, ratio: 1.271 },
  { src: 'm-spring', plane: 'mid', at: 3.2, x: 0.5, h: 0.5, y: 0.06, ratio: 0.891 },
  { src: 'm-summer', plane: 'mid', at: 3.76, x: 0.5, h: 0.5, y: 0.06, ratio: 0.943 },
  { src: 'm-autumn', plane: 'mid', at: 4.32, x: 0.5, h: 0.5, y: 0.06, ratio: 0.9275 },
  { src: 'm-winter', plane: 'mid', at: 4.88, x: 0.5, h: 0.5, y: 0.06, ratio: 0.935 },
  { src: 'm-nursery2', plane: 'mid', at: legStart(4) + 1.1, x: 0.33, xm: 0.5, h: 0.78, y: 0.02, ratio: 1.499 },
  { src: 'm-bench', plane: 'mid', at: legStart(5) + 0.35, x: 0.4, xm: 0.5, h: 0.58, y: 0.03, ratio: 2.004 },
  { src: 'm-gate', plane: 'mid', at: TOTAL, x: 0.27, xm: 0.5, h: 0.8, y: -0.03, ratio: 1.887, fade: 'b' },

  // near: dark foreground, overtakes everything
  { src: 'n-rocks', plane: 'near', at: 0.3, x: 0.5, xm: 0.7, h: 0.26, y: -0.08, ratio: 2.03, fade: 'l' },
  { src: 'n-rocks', plane: 'near', at: 4.2, x: 0.22, h: 0.22, y: -0.08, ratio: 2.03, flip: true, fade: 'l' },
  { src: 'n-branch', plane: 'near', at: legStart(5) + 1.3, x: 0.3, h: 0.36, y: 0.72, ratio: 1.608, flip: true, fade: 't' },
  { src: 'n-rocks', plane: 'near', at: TOTAL, x: 0.08, h: 0.22, y: -0.08, ratio: 2.03, flip: true, fade: 'l' },
]

/** Full width of each processed asset; process.sh also writes -800 and -1600 copies of anything wider. */
export const PLATE_WIDTHS: Readonly<Record<string, number>> = {
  'f-ridges': 2706,
  'f-marsh': 2768,
  'm-pine': 2128,
  'm-hands2': 1525,
  'm-spring': 1069,
  'm-summer': 1132,
  'm-autumn': 1113,
  'm-winter': 1122,
  'm-nursery2': 1799,
  'm-bench': 2405,
  'm-gate': 2264,
  'n-rocks': 2436,
  'n-branch': 1930,
}

/** srcset over the processed widths, in the given format. */
export function plateSrcset(src: string, ext = 'avif'): string {
  const full = PLATE_WIDTHS[src] ?? 0
  return [800, 1600]
    .filter(w => full > w)
    .map(w => `/makimono/${src}-${w}.${ext} ${w}w`)
    .concat(`/makimono/${src}.${ext} ${full}w`)
    .join(', ')
}

/** Drawn width is h x ratio x band height; the band is 55svh on portrait phones, else 100svh. */
export function plateSizes(p: Pick<Plate, 'h' | 'ratio'>): string {
  const vh = (band: number) => `${Math.ceil(p.h * p.ratio * band)}vh`
  return `(max-aspect-ratio: 4/5) ${vh(55)}, ${vh(100)}`
}

/** Paper-coloured mist veils between the far and mid planes (suyari-gasumi). */
export const MISTS: readonly { at: number, x: number, w: number, h: number, y: number }[] = [
  { at: 0.4, x: 0.5, w: 1.5, h: 0.3, y: 0.3 },
  { at: 2.5, x: 0.4, w: 1.3, h: 0.28, y: 0.38 },
  { at: 5.2, x: 0.5, w: 1.8, h: 0.4, y: 0.22 },
  { at: legStart(5), x: 0.5, w: 1.4, h: 0.3, y: 0.34 },
  { at: legStart(5) + 1.5, x: 0.55, w: 1.6, h: 0.34, y: 0.3 },
]

/** The peak, in track time. */
export const PEAK = {
  // A paper mist closes over the world first (the clouds that separate scenes
  // in a real handscroll), then nothing, then the drop.
  veilFrom: legStart(3) + 0.12,
  veilTo: legStart(4) + 0.15,
  show: legStart(3) + 0.8,
  bloomFrom: legStart(3) + 0.92,
  bloomTo: legStart(3) + 1.68,
  photoFrom: legStart(3) + 1.8,
  photoTo: legStart(3) + 2.3,
  // the photograph then holds, fully resolved, for about half a viewport
  hide: legStart(4) - 0.05,
} as const

/** The finale: the ensō leaves its corner and becomes the moon, then the seal lands. */
export const FINALE = {
  riseFrom: TOTAL - 1.15,
  riseTo: TOTAL - 0.35,
  seal: TOTAL - 0.3,
} as const

/**
 * Track units per viewport-height of scroll, from track time `from` on. Lower
 * is slower: the hero leaves at full speed, the real tree and the bench hold.
 */
export const PACE: readonly { from: number, pace: number }[] = [
  { from: 0, pace: 1 },
  { from: legStart(1), pace: 0.7 },
  { from: legStart(2), pace: 0.85 },
  { from: PEAK.photoFrom, pace: 0.5 },
  { from: legStart(4), pace: 0.85 },
  { from: legStart(5), pace: 0.6 },
  { from: legStart(6), pace: 0.85 },
]

/** Viewport-heights of scroll needed to reach track time t. */
export function scrollAt(t: number): number {
  let s = 0
  PACE.forEach(({ from, pace }, i) => {
    const to = PACE[i + 1]?.from ?? Infinity
    if (t > from)
      s += (Math.min(t, to) - from) / pace
  })
  return s
}

/** Track time at scroll position s (viewport-heights). Inverse of scrollAt. */
export function trackAt(s: number): number {
  for (const [i, { from, pace }] of PACE.entries()) {
    const len = ((PACE[i + 1]?.from ?? Infinity) - from) / pace
    if (s <= len)
      return from + s * pace
    s -= len
  }
  return TOTAL
}

/** Length of the whole scroll, in viewport-heights. */
export const SCROLL_TOTAL = scrollAt(TOTAL)

/** Hung specimen i's anchor. Portrait spaces them wider, to fit a bigger card (0.4 band-h) and a gap. */
export function hungAt(i: number, portrait = false): number {
  return portrait ? legStart(4) + 0.45 + i * 0.56 : legStart(4) + 0.75 + i * 0.42
}

/** Copy windows, in track time. Each block gets one, and its scrim shares it. */
export const WINDOWS = {
  // on screen at load, gone within the first 40% of a screen of scroll
  hero: win(0, 0.4, 0, 0.95),
  hand: win(legStart(1) - 0.05, legStart(2)),
  // holds through the autumn tree, fades as the ink veil closes over the world
  seasons: win(legStart(2) + 0.15, legStart(3) + 0.45, 0.25, 0.2),
  veil: win(PEAK.veilFrom, PEAK.veilTo, 0.12, 0.14),
  peak: win(PEAK.show, PEAK.hide, 0.03, 0.12),
  real: win(PEAK.photoFrom + 0.25, PEAK.hide, 0.3, 0.15),
  // holds until the last hung specimen is centred
  nursery: win(legStart(4) + 0.25, legStart(5) + 0.05, 0.25, 0.2),
  // a beat of empty paper after the nursery before it comes in
  bench: win(legStart(5) + 0.45, legStart(6) - 0.05, 0.2, 0.2),
  // the engine's "finale": in from 0.4 of the last leg, holds to the end
  finale: win(legStart(6) + 0.4 * LEGS[6]!.w, TOTAL, 0.55, 0),
} as const

/** Ensō stroke progress (0..1) for track time t. The circle closes as the seal lands. */
export function strokeProgress(t: number): number {
  return Math.min(Math.max(t / FINALE.seal, 0), 1)
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function ramp(t: number, from: number, to: number): number {
  return clamp01((t - from) / (to - from))
}

/** Scroll speed (viewport-heights per second) to brush dryness, 0 = wet and slow, 1 = dry and fast. */
export function dryness(speed: number): number {
  return clamp01((speed - 0.6) / 5)
}
