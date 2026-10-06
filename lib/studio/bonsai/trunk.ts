/**
 * Trunk architecture per style, plus the nebari roots. Each trunk returns a
 * `TrunkPlan` telling branches.ts where along it primaries may leave and what
 * canopy silhouette to build.
 */
import type { PotSpec } from './pot'
import type { Rng } from './rng'
import type { RockSpec } from './rock'
import type { Limb, PadSeed, V3 } from './skeleton'
import type { SpeciesDef } from './species'
import type { StyleId } from './styles'
import { FULL_DEAD, makeJin, shari } from './deadwood'
import { rockPoint } from './rock'
import { addRoots, drapeRoots } from './roots'
import { add, norm, scale, taper, walk } from './skeleton'

export type Canopy = 'cone' | 'broom' | 'cascade' | 'top' | 'moyogi'

export interface TrunkPlan {
  limb: number
  from: number
  to: number
  canopy: Canopy
  /** Height of this tree (Yose-ue trees differ). */
  height: number
  /** Preferred side for primaries, as an azimuth; undefined for all round. */
  side?: number
  count: number
}

export interface GrowCtx {
  rng: Rng
  H: number
  style: StyleId
  species: SpeciesDef
  depth: number
  pot: PotSpec
  rock?: RockSpec
  soilAt: (x: number, z: number) => number
  /** Distance from (x, z) along a horizontal unit direction to the inside of the pot wall. */
  edge: (x: number, z: number, dx: number, dz: number) => number
  limbs: Limb[]
  pads: PadSeed[]
  guys: [V3, V3][]
}

export function pushLimb(ctx: GrowCtx, l: Omit<Limb, 'g0' | 'g1'>): number {
  ctx.limbs.push({ ...l, g0: 0, g1: 0 })
  return ctx.limbs.length - 1
}

/** Primaries per trunk scale with ramification depth. */
function primaries(depth: number, k = 1): number {
  return Math.max(2, Math.round((2 + depth * 2) * k))
}

function upright(ctx: GrowCtx, base: V3, height: number, r0: number, lean: V3, wander: number, parent = -1, attach = 0): number {
  const pts = walk(ctx.rng, base, add([0, 1, 0], lean), height, { steps: 9, wander, pull: scale(lean, -0.08), upturn: 0.05 })
  return pushLimb(ctx, { pts, radii: taper(pts.length, r0, r0 * 0.16, 0.85), order: 0, parent, attach, flare: parent < 0 ? 1 : 0, wire: true })
}

/** Moyogi-like S curve: alternating lateral pulls. */
function sCurve(ctx: GrowCtx, base: V3, height: number, r0: number, amp: number): number {
  const az = ctx.rng.range(0, Math.PI * 2)
  const pts: V3[] = [base]
  const n = 9
  for (let i = 1; i <= n; i++) {
    const f = i / n
    const sway = Math.sin(f * Math.PI * 1.6) * amp * (1 - f * 0.4)
    pts.push([base[0] + Math.cos(az) * sway, base[1] + f * height, base[2] + Math.sin(az) * sway * 0.6])
  }
  return pushLimb(ctx, { pts, radii: taper(pts.length, r0, r0 * 0.18, 0.7), order: 0, parent: -1, attach: 0, flare: 1, wire: true })
}

/** Helix trunk for Nejikan and Sharimiki. */
function helix(ctx: GrowCtx, base: V3, height: number, r0: number, amp: number, turns: number): number {
  const pts: V3[] = []
  const n = 14
  const ph = ctx.rng.range(0, Math.PI * 2)
  for (let i = 0; i <= n; i++) {
    const f = i / n
    const a = ph + f * turns * Math.PI * 2
    const A = amp * Math.sin(f * Math.PI) * (1 - f * 0.3)
    pts.push([base[0] + Math.cos(a) * A, base[1] + f * height, base[2] + Math.sin(a) * A * 0.8])
  }
  return pushLimb(ctx, { pts, radii: taper(pts.length, r0, r0 * 0.2, 0.75), order: 0, parent: -1, attach: 0, flare: 1, twist: (turns * 1.6) / height, wire: true })
}

/** Build every trunk for the style; returns the plans branches.ts grows from. */
export function buildTrunks(ctx: GrowCtx): TrunkPlan[] {
  const { rng, H, pot } = ctx
  const soil = (x: number, z: number): V3 => [x, ctx.soilAt(x, z) - 0.02 * H, z]
  const plans: TrunkPlan[] = []
  const P = (limb: number, from: number, to: number, canopy: Canopy, height = H, count = primaries(ctx.depth), side?: number) =>
    plans.push({ limb, from, to, canopy, height, count, side })
  const s = ctx.style

  if (s === 'chokkan') {
    const r0 = 0.072 * H
    const t = upright(ctx, soil(0, 0), 0.9 * H, r0, [0, 0, 0], 0.015)
    addRoots(ctx, soil(0, 0), r0, 7, 0.2 * H, t)
    P(t, 0.3, 0.92, 'cone')
  }
  else if (s === 'shakan') {
    const r0 = 0.07 * H
    const b = soil(-pot.w * 0.3, 0)
    const t = upright(ctx, b, 0.95 * H, r0, [0.62, 0, 0.08], 0.03)
    addRoots(ctx, b, r0, 6, 0.22 * H, t)
    P(t, 0.3, 0.92, 'cone')
    ctx.guys.push([add(b, [0.3 * H, 0.45 * H, 0]), [-pot.w * 0.95, pot.rimY, pot.d * 0.4]])
  }
  else if (s === 'kengai' || s === 'han-kengai') {
    const cascade = s === 'kengai'
    const r0 = (cascade ? 0.05 : 0.056) * H
    const b = soil(-pot.w * 0.15, 0)
    const ctl: V3[] = [b, add(b, [0, 0.1 * H, 0]), add(b, [0.08 * H, 0.16 * H, 0.02 * H]), add(b, [0.18 * H, 0.13 * H, 0.05 * H])]
    if (cascade) {
      // Over the rim, then an S-curve stepping out and down past the pot's foot.
      const D = b[1] + 0.5 * H
      for (let k = 1; k <= 6; k++) {
        const f = k / 6
        ctl.push([b[0] + H * (0.26 + 0.09 * Math.sin(f * Math.PI * 1.6) + 0.06 * f), b[1] + 0.05 * H - D * f ** 1.1, H * (0.07 + 0.09 * f)])
      }
    }
    else {
      ctl.push(add(b, [0.32 * H, 0.1 * H, 0.08 * H]), add(b, [0.46 * H, 0.0, 0.1 * H]), add(b, [0.58 * H, -0.08 * H, 0.12 * H]), add(b, [0.68 * H, -0.12 * H, 0.12 * H]))
    }
    const pts = ctl.map((p, i) => (i === 0 ? p : add(p, [rng.gauss() * 0.01 * H, rng.gauss() * 0.01 * H, rng.gauss() * 0.01 * H])))
    const t = pushLimb(ctx, { pts, radii: taper(pts.length, r0, r0 * 0.2, 0.8), order: 0, parent: -1, attach: 0, flare: 1, wire: true })
    addRoots(ctx, b, r0, 6, 0.16 * H, t)
    P(t, 0.18, 1, 'cascade', H, primaries(ctx.depth, 1.6))
    ctx.guys.push([add(b, [0.2 * H, 0.17 * H, 0.03 * H]), [-pot.w * 0.9, pot.rimY, -pot.d * 0.5]])
  }
  else if (s === 'sokan' || s === 'sankan') {
    const r0 = 0.07 * H
    const b = soil(0, 0)
    const t0 = upright(ctx, b, 0.9 * H, r0, [-0.12, 0, 0.02], 0.02)
    addRoots(ctx, b, r0 * 1.15, 7, 0.22 * H, t0)
    P(t0, 0.32, 0.92, 'cone', H, primaries(ctx.depth), Math.PI)
    const extra = s === 'sokan' ? [[0.72, 0.3]] : [[0.76, 0.35], [0.52, -0.5]]
    for (const [h, lean] of extra as [number, number][]) {
      const t = upright(ctx, add(b, [0, 0.03 * H, 0]), h * 0.9 * H, r0 * h * 0.85, [lean, 0, h < 0.6 ? 0.25 : -0.1], 0.02, t0, 0.04)
      P(t, 0.35, 0.92, 'cone', h * H, primaries(ctx.depth, 0.8), lean > 0 ? 0 : Math.PI * 0.5)
    }
  }
  else if (s === 'yose-ue') {
    const n = H < 0.12 ? 3 : H < 0.5 ? 5 : 7
    const placed: [number, number][] = []
    for (let i = 0; i < n; i++) {
      let x = 0
      let z = 0
      for (let k = 0; k < 40; k++) {
        x = rng.range(-0.72, 0.72) * pot.w
        z = rng.range(-0.55, 0.55) * pot.d
        if (placed.every(([px, pz]) => Math.hypot(px - x, pz - z) > pot.w * 0.18))
          break
      }
      if (i === 0) {
        x = -0.12 * pot.w
        z = 0.08 * pot.d
      }
      placed.push([x, z])
      const h = H * (i === 0 ? 1 : rng.range(0.42, 0.9))
      const r0 = h * 0.04 * (i === 0 ? 1.25 : 1)
      const t = upright(ctx, soil(x, z), 0.92 * h, r0, [rng.range(-0.06, 0.06), 0, rng.range(-0.04, 0.04)], 0.012)
      addRoots(ctx, soil(x, z), r0, 4, 0.12 * h, t)
      P(t, 0.42, 0.94, 'cone', h, Math.max(2, primaries(ctx.depth, 0.6)))
    }
  }
  else if (s === 'bunjingi') {
    const r0 = 0.035 * H
    const b = soil(-pot.w * 0.1, 0)
    const pts = walk(rng, b, [0.25, 1, 0.05], H * 0.98, { steps: 10, wander: 0.09, pull: [-0.03, 0, 0], upturn: 0 })
    const t = pushLimb(ctx, { pts, radii: taper(pts.length, r0, r0 * 0.3, 0.6), order: 0, parent: -1, attach: 0, flare: 0.6, wire: true })
    addRoots(ctx, b, r0, 4, 0.1 * H, t)
    P(t, 0.74, 0.96, 'top', H, Math.max(2, Math.round(ctx.depth * 0.8)))
  }
  else if (s === 'hokidachi') {
    const r0 = 0.075 * H
    const t = upright(ctx, soil(0, 0), 0.38 * H, r0, [0, 0, 0], 0.01)
    addRoots(ctx, soil(0, 0), r0, 8, 0.2 * H, t)
    P(t, 0.94, 1, 'broom', H, primaries(ctx.depth, 0.9))
  }
  else if (s === 'nejikan') {
    const r0 = 0.08 * H
    const t = helix(ctx, soil(0, 0), 0.88 * H, r0, 0.07 * H, 1.3)
    addRoots(ctx, soil(0, 0), r0, 6, 0.2 * H, t)
    P(t, 0.36, 0.95, 'cone')
  }
  else if (s === 'ikadabuki') {
    const r0 = 0.045 * H
    const L = pot.w * 1.5
    const y = ctx.soilAt(0, 0) + r0 * 0.3
    const pts: V3[] = Array.from({ length: 7 }, (_, i) => [-L / 2 + (i / 6) * L, y + Math.sin(i * 1.3) * r0 * 0.3, rng.gauss() * pot.d * 0.06])
    const raft = pushLimb(ctx, { pts, radii: taper(pts.length, r0 * 1.1, r0 * 0.5, 1), order: 0, parent: -1, attach: 0, wire: true })
    const us = [0.12, 0.34, 0.55, 0.78, 0.95]
    us.forEach((u, i) => {
      const h = H * [0.6, 1.0, 0.82, 0.66, 0.45][i]!
      const p: V3 = [-L / 2 + u * L, y, rng.gauss() * pot.d * 0.06]
      const t = upright(ctx, p, h * 0.9, r0 * (0.6 + h / H * 0.4), [rng.range(-0.08, 0.08), 0, 0], 0.015, raft, u)
      P(t, 0.4, 0.93, 'cone', h, Math.max(2, primaries(ctx.depth, 0.55)))
      if (i % 2 === 0)
        addRoots(ctx, p, r0 * 0.7, 3, 0.1 * H, raft)
    })
  }
  else if (s === 'sekijoju' && ctx.rock) {
    const rock = ctx.rock
    const r0 = 0.07 * H
    const top: V3 = [rock.base[0], rock.base[1] + rock.height * 0.93, rock.base[2]]
    const t = upright(ctx, top, H * 0.78, r0, [0.1, 0, 0.05], 0.03)
    drapeRoots(ctx, rock, rock.height * 0.9, 0, Math.PI * 2 * 0.85, r0, 6, t)
    P(t, 0.3, 0.93, 'cone')
  }
  else if (s === 'ishitsuki' && ctx.rock) {
    const rock = ctx.rock
    const r0 = 0.05 * H
    const th = Math.PI * 0.35
    const y = rock.height * 0.6
    const b = rockPoint(rock, y, th, -r0 * 0.4)
    const out = norm([Math.cos(th), 0, Math.sin(th)])
    const t = upright(ctx, b, H * 0.62, r0, scale(out, 0.55), 0.04)
    drapeRoots(ctx, rock, y, th, 1.6, r0, 4, t)
    P(t, 0.28, 0.93, 'cone', H * 0.8)
  }
  else if (s === 'shito' || s === 'mame') {
    const r0 = 0.12 * H
    const t = sCurve(ctx, soil(0, 0), 0.82 * H, r0, 0.12 * H)
    addRoots(ctx, soil(0, 0), r0, 5, 0.16 * H, t)
    P(t, 0.3, 0.9, 'moyogi', H, 3)
  }
  else if (s === 'sharimiki') {
    const r0 = 0.1 * H
    const t = helix(ctx, soil(0, 0), 0.82 * H, r0, 0.06 * H, 0.8)
    const trunk = ctx.limbs[t] as Limb
    trunk.dead = shari(rng, 0.55)
    addRoots(ctx, soil(0, 0), r0, 5, 0.18 * H, t)
    const tip = trunk.pts[trunk.pts.length - 1] as V3
    const jin = walk(rng, tip, [0.15, 1, 0], 0.16 * H, { steps: 4, wander: 0.2 })
    makeJin(ctx.limbs[pushLimb(ctx, { pts: jin, radii: taper(jin.length, r0 * 0.22, r0 * 0.02), order: 1, parent: t, attach: 1 })] as Limb)
    P(t, 0.34, 0.9, 'cone', H, primaries(ctx.depth, 0.8))
  }
  else {
    // Tanuki: a gnarled deadwood trunk with a living tree grafted up its front.
    const rd = 0.13 * H
    const b = soil(0, -pot.d * 0.1)
    const dpts = walk(rng, b, [0.08, 1, 0], 0.72 * H, { steps: 8, wander: 0.16 })
    const dead = pushLimb(ctx, { pts: dpts, radii: taper(dpts.length, rd, rd * 0.12, 0.7), order: 0, parent: -1, attach: 0, flare: 1.2, dead: FULL_DEAD })
    const rl = 0.042 * H
    const lpts: V3[] = dpts.slice(0, 7).map((p, i) => add(p, [0, 0, rd * (1 - (i / 6) * 0.75) + rl * 0.3]))
    const last = lpts[lpts.length - 1] as V3
    lpts.push(add(last, [0.05 * H, 0.12 * H, 0.02 * H]), add(last, [0.08 * H, 0.24 * H, 0.01 * H]))
    const live = pushLimb(ctx, { pts: lpts, radii: taper(lpts.length, rl, rl * 0.25, 0.9), order: 0, parent: -1, attach: 0, wire: true })
    addRoots(ctx, b, rd, 5, 0.18 * H, dead)
    P(live, 0.55, 0.95, 'cone', H, primaries(ctx.depth, 0.75))
  }
  return plans
}
