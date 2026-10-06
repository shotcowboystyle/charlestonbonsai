/**
 * Deadwood: jin (dead branch spikes), shari (a stripped band running up the
 * trunk with a live vein beside it) and the whole-dead Tanuki trunk. The tube
 * sweeper samples `deadAt` per vertex into an `aDead` attribute; the bark
 * shader turns that into bleached, silvery, grain-lined wood.
 */
import type { Rng } from './rng'
import type { DeadSpec, Limb } from './skeleton'

const TAU = Math.PI * 2

/** 0 = living bark, 1 = deadwood. `u` is the fraction along the limb. */
export function deadAt(spec: DeadSpec | undefined, theta: number, u: number): number {
  if (!spec)
    return 0
  if (spec.kind === 'jin' || spec.kind === 'full')
    return 1
  const centre = spec.phase + spec.twist * TAU * u
  let d = Math.abs(((theta - centre) % TAU + TAU) % TAU)
  if (d > Math.PI)
    d = TAU - d
  const half = spec.width * Math.PI
  // Soft edge: the live vein rolls over the shari boundary.
  const edge = 0.18
  const v = 1 - Math.min(1, Math.max(0, (d - half + edge) / (2 * edge)))
  // The band thins toward the base so the tree still reads as alive at the nebari.
  return v * Math.min(1, u * 6 + 0.25)
}

export function shari(rng: Rng, width: number): DeadSpec {
  return { kind: 'shari', phase: rng.range(0, TAU), width, twist: rng.range(0.35, 0.8) * (rng.next() < 0.5 ? -1 : 1) }
}

export const JIN: DeadSpec = { kind: 'jin', phase: 0, width: 1, twist: 0 }
export const FULL_DEAD: DeadSpec = { kind: 'full', phase: 0, width: 1, twist: 0 }

/** Turn a limb into a jin: no foliage, no wire, sharp bleached tip. */
export function makeJin(limb: Limb): Limb {
  limb.dead = JIN
  limb.pad = false
  limb.wire = false
  const n = limb.radii.length
  limb.radii = limb.radii.map((r, i) => r * (1 - (i / Math.max(1, n - 1)) ** 0.7 * 0.92))
  return limb
}
