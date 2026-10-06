/**
 * Crossfading complete looks (content.md §6). Pure: no renderer here, so the
 * snapshot rule can be unit-tested. A look is a flat record of numbers,
 * RGB triples and arrays of RGB triples; `lerpLook` interpolates every field.
 */

export type RGB = [number, number, number]
export type LookValue = number | RGB | RGB[]
export type Look = Record<string, LookValue>

const TAU = Math.PI * 2

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Shortest-path angle interpolation, so the sun never swings the long way round. */
export function lerpAngle(a: number, b: number, t: number): number {
  let d = (b - a) % TAU
  if (d > Math.PI)
    d -= TAU
  if (d < -Math.PI)
    d += TAU
  return a + d * t
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

/** Keys interpolated as angles (radians). Elevation stays linear. */
const ANGLE_KEYS = new Set(['sunAz'])

export function lerpLook<L extends Look>(A: L, B: L, t: number): L {
  const out: Look = {}
  for (const k of Object.keys(A)) {
    const a = A[k] as LookValue
    const b = B[k] as LookValue
    if (typeof a === 'number')
      out[k] = ANGLE_KEYS.has(k) ? lerpAngle(a, b as number, t) : lerp(a, b as number, t)
    else if (typeof a[0] === 'number')
      out[k] = lerpRGB(a as RGB, b as RGB, t)
    else
      out[k] = (a as RGB[]).map((c, i) => lerpRGB(c, (b as RGB[])[i] as RGB, t))
  }
  return out as L
}

export const easeInOutQuad = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)

/** sRGB hex to linear RGB, matching three's Color.setHex under colour management. */
export function hexToLinear(hex: string): RGB {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return c as RGB
}

/**
 * Holds `from`, `to` and the mix. Changing target mid-fade freezes the look
 * currently on screen as the new `from` — anything less snaps on a double tap.
 */
export class Crossfader<L extends Look> {
  from: L
  to: L
  mix = 1
  constructor(initial: L, public duration = 1.6) {
    this.from = initial
    this.to = initial
  }

  /** The eased mix actually on screen. */
  get eased(): number {
    return easeInOutQuad(this.mix)
  }

  current(): L {
    return lerpLook(this.from, this.to, this.eased)
  }

  set(next: L, instant = false): void {
    if (instant) {
      this.from = next
      this.to = next
      this.mix = 1
      return
    }
    this.from = this.current()
    this.to = next
    this.mix = 0
  }

  /** Advances the fade; returns true while a transition is running. */
  step(dt: number): boolean {
    if (this.mix >= 1)
      return false
    this.mix = Math.min(1, this.mix + Math.max(0, dt) / this.duration)
    return true
  }
}

/**
 * Slow ground state (settled snow, wetness): builds over `up` seconds,
 * clears over `down`. Frame-rate independent exponential approach.
 */
export function stepAccumulator(cur: number, target: number, dt: number, up: number, down: number): number {
  const tau = target > cur ? up : down
  const k = 1 - Math.exp(-Math.max(0, dt) / tau)
  const next = cur + (target - cur) * k
  return Math.abs(next - target) < 1e-4 ? target : next
}
