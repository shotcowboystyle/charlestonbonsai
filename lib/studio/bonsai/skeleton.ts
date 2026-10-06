/**
 * The bonsai skeleton: limbs as centreline polylines with radii, before any
 * geometry exists. Plain tuples, no three.js, so the architecture is cheap to
 * build and easy to reason about. trunk.ts and branches.ts fill it; tube.ts
 * sweeps it into geometry.
 */
import type { Rng } from './rng'

export type V3 = [number, number, number]

export interface DeadSpec {
  /** jin: a dead spike; shari: a stripped band with a live vein; full: all dead. */
  kind: 'jin' | 'shari' | 'full'
  phase: number
  /** Fraction of the circumference that is dead (shari). */
  width: number
  /** Turns of the band along the limb. */
  twist: number
}

export interface Limb {
  pts: V3[]
  radii: number[]
  /** -1 root, 0 trunk, 1 primary, 2+ ramification. */
  order: number
  parent: number
  /** 0..1 along the parent where this limb leaves it. */
  attach: number
  /** Growth window in limb units (see timeline.ts). */
  g0: number
  g1: number
  dead?: DeadSpec
  /** Nebari flare multiplier at the base of a trunk. */
  flare?: number
  /** Bark spiral, turns per metre (Nejikan). */
  twist?: number
  /** Spawns a foliage pad at its tip. */
  pad?: boolean
  /** Receives training wire in the Harigane stage. */
  wire?: boolean
}

export interface PadSeed {
  c: V3
  /** Horizontal radius in metres. */
  r: number
  /** Vertical radius as a fraction of r. */
  flat: number
  /** Limb the pad sits on; growth order decides when it arrives. */
  limb: number
}

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
export const len = (a: V3): number => Math.hypot(a[0], a[1], a[2])
export const dist = (a: V3, b: V3): number => len(sub(a, b))
export function norm(a: V3): V3 {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
export function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
export function lerp3(a: V3, b: V3, t: number): V3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}
/** Unit vector from azimuth (around +Y, 0 = +X) and elevation. */
export function dirAzEl(az: number, el: number): V3 {
  return [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)]
}

export function polylineLength(pts: V3[]): number {
  let s = 0
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1] as V3, pts[i] as V3)
  return s
}

/** Point and segment direction at fraction `u` of a polyline's arc length. */
export function pointAt(pts: V3[], u: number): { p: V3, d: V3 } {
  const total = polylineLength(pts)
  let target = Math.min(1, Math.max(0, u)) * total
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as V3
    const b = pts[i] as V3
    const l = dist(a, b)
    if (target <= l || i === pts.length - 1)
      return { p: lerp3(a, b, l > 0 ? Math.min(1, target / l) : 0), d: norm(sub(b, a)) }
    target -= l
  }
  const p = pts[0] as V3
  return { p, d: [0, 1, 0] }
}

/** Radius at fraction `u`, interpolated over the control radii. */
export function radiusAt(limb: Limb, u: number): number {
  const n = limb.radii.length
  const f = Math.min(1, Math.max(0, u)) * (n - 1)
  const i = Math.min(n - 2, Math.floor(f))
  const a = limb.radii[i] as number
  const b = limb.radii[i + 1] as number
  return a + (b - a) * (f - i)
}

export interface WalkOptions {
  steps: number
  /** Random deflection per step. */
  wander: number
  /** Constant pull applied each step (gravity, phototropism, a lean). */
  pull?: V3
  /** Upward turn that grows toward the tip — the classic rising branch end. */
  upturn?: number
}

/** A wandering polyline: the basis of every trunk and branch. */
export function walk(rng: Rng, start: V3, dir: V3, length: number, o: WalkOptions): V3[] {
  const pts: V3[] = [start]
  let d = norm(dir)
  let p = start
  const step = length / o.steps
  for (let i = 1; i <= o.steps; i++) {
    const f = i / o.steps
    const jitter: V3 = [rng.gauss() * o.wander, rng.gauss() * o.wander * 0.6, rng.gauss() * o.wander]
    let nd = add(d, jitter)
    if (o.pull)
      nd = add(nd, o.pull)
    if (o.upturn)
      nd = add(nd, [0, o.upturn * f * f, 0])
    d = norm(nd)
    p = add(p, scale(d, step))
    pts.push(p)
  }
  return pts
}

/** Linear taper from r0 to r1 over `n` control points, with a gentle swell exponent. */
export function taper(n: number, r0: number, r1: number, power = 1): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1)
    out.push(r0 + (r1 - r0) * t ** power)
  }
  return out
}

/** Order windows in limb units: roots, trunk, primaries, then ramification shares the last unit. */
function windowFor(order: number): [number, number] {
  if (order < 0)
    return [0, 1]
  if (order === 0)
    return [1, 2]
  if (order === 1)
    return [2, 3]
  const o = Math.min(order, 4) - 2
  return [3 + o * 0.22, 3.56 + o * 0.22]
}

/**
 * Assign growth windows. A limb never starts before its parent's front has
 * passed the attach point, and lower limbs start earlier than upper ones.
 */
export function assignGrowth(limbs: Limb[]): void {
  const maxLen = new Map<number, number>()
  for (const l of limbs) maxLen.set(l.order, Math.max(maxLen.get(l.order) ?? 0, polylineLength(l.pts)))
  for (const l of limbs) {
    const [w0, w1] = windowFor(l.order)
    const span = w1 - w0
    const parent = l.parent >= 0 && l.order >= 0 ? limbs[l.parent] : undefined
    const parentAt = parent ? parent.g0 + (parent.g1 - parent.g0) * l.attach : w0
    const rel = polylineLength(l.pts) / (maxLen.get(l.order) || 1)
    const g0 = Math.max(w0 + l.attach * span * 0.32, parentAt)
    l.g0 = Math.min(g0, w1 - 0.06)
    l.g1 = Math.min(w1, l.g0 + span * (0.4 + 0.6 * rel))
    if (l.g1 - l.g0 < 0.05)
      l.g1 = l.g0 + 0.05
  }
}
