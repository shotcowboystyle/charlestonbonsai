import type { Limb, V3 } from './skeleton'
/**
 * Branch architecture: primaries placed by canopy silhouette, ramification
 * as alternating side shoots in each branch's own horizontal plane (the
 * bonsai fishbone), and foliage pad seeds at the tips. Ramification depth
 * comes from the size class, so a Mame carries few, large pads.
 */
import type { GrowCtx, TrunkPlan } from './trunk'
import { makeJin } from './deadwood'
import { add, cross, dirAzEl, len, norm, pointAt, polylineLength, radiusAt, scale, taper, walk } from './skeleton'
import { pushLimb } from './trunk'

const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const FRONT = Math.PI / 2

function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI)
  return d
}

function growPrimary(ctx: GrowCtx, trunkIdx: number, u: number, dir: V3, L: number, upturn: number): number {
  const trunk = ctx.limbs[trunkIdx] as Limb
  const p = pointAt(trunk.pts, u).p
  const r = Math.max(radiusAt(trunk, u) * 0.52, ctx.H * 0.004)
  const pts = walk(ctx.rng, p, dir, L, { steps: 5, wander: 0.07, pull: [0, -0.03, 0], upturn })
  return pushLimb(ctx, { pts, radii: taper(pts.length, r, r * 0.22, 0.9), order: 1, parent: trunkIdx, attach: u, pad: true, wire: true })
}

function primariesFor(ctx: GrowCtx, plan: TrunkPlan): number[] {
  const { rng } = ctx
  const trunk = ctx.limbs[plan.limb] as Limb
  const out: number[] = []
  const n = plan.count
  let az = rng.range(0, Math.PI * 2)
  for (let i = 0; i < n; i++) {
    const rel = n === 1 ? 0.5 : (i + 0.5 + rng.range(-0.25, 0.25)) / n
    const u = plan.canopy === 'broom' ? 1 : plan.from + (plan.to - plan.from) * rel
    az += GOLDEN + rng.range(-0.3, 0.3)
    let a = az
    if (plan.side !== undefined)
      a = plan.side + Math.sin(az) * 1.5
    if (rel < 0.35 && angleDiff(a, FRONT) < 0.55)
      a += 1.1
    if (plan.canopy === 'cascade') {
      const d = pointAt(trunk.pts, u).d
      const side = norm(cross(d, [0, 1, 0]))
      const s = i % 2 === 0 ? 1 : -1
      const dir = norm(add(add(scale(side, s), scale(d, 0.45)), [0, 0.15, 0]))
      out.push(growPrimary(ctx, plan.limb, u, dir, plan.height * (0.26 - 0.06 * rel) * rng.range(0.8, 1.15), 0.4))
      continue
    }
    if (plan.canopy === 'broom') {
      const el = rng.range(0.7, 1.05)
      out.push(growPrimary(ctx, plan.limb, 0.97, dirAzEl(a, el), plan.height * 0.5 * rng.range(0.85, 1.1), 0.05))
      continue
    }
    let L: number
    let el: number
    if (plan.canopy === 'top') {
      L = plan.height * rng.range(0.14, 0.24)
      el = rng.range(-0.3, 0.05)
    }
    else if (plan.canopy === 'moyogi') {
      L = plan.height * (0.34 - 0.16 * rel) * rng.range(0.85, 1.1)
      el = -0.15 + rel * 0.3
    }
    else {
      L = plan.height * (0.34 * (1 - rel) ** 0.9 + 0.06) * rng.range(0.85, 1.12)
      el = -0.34 + rel * 0.5
    }
    out.push(growPrimary(ctx, plan.limb, u, dirAzEl(a, el), L, 0.32))
  }
  return out
}

function ramify(ctx: GrowCtx, parents: number[], order: number): number[] {
  const { rng, H } = ctx
  const out: number[] = []
  for (const pi of parents) {
    const parent = ctx.limbs[pi] as Limb
    if (parent.dead)
      continue
    const plen = polylineLength(parent.pts)
    const n = order === 2 ? (H > 1 ? 4 : 3) : 2
    for (let k = 0; k < n; k++) {
      const u = 0.32 + 0.58 * ((k + 0.5) / n) + rng.range(-0.05, 0.05)
      const at = pointAt(parent.pts, u)
      let lateral = cross(at.d, [0, 1, 0])
      if (len(lateral) < 0.2)
        lateral = dirAzEl(rng.range(0, Math.PI * 2), 0)
      lateral = norm(lateral)
      const side = k % 2 === 0 ? 1 : -1
      const dir = norm(add(add(scale(at.d, 0.7), scale(lateral, side * 0.9)), [0, 0.1, 0]))
      const L = plen * 0.46 * (1 - u * 0.35) * rng.range(0.85, 1.15)
      const r = Math.max(radiusAt(parent, u) * 0.62, H * 0.002)
      const pts = walk(rng, at.p, dir, L, { steps: 3, wander: 0.08, upturn: 0.25 })
      out.push(pushLimb(ctx, { pts, radii: taper(pts.length, r, r * 0.3), order, parent: pi, attach: u, pad: true }))
    }
  }
  return out
}

function aerialRoots(ctx: GrowCtx, prims: number[]): void {
  const picks = prims.slice(0, 3)
  for (const pi of picks) {
    const parent = ctx.limbs[pi] as Limb
    const p = pointAt(parent.pts, 0.22).p
    const ground = ctx.soilAt(p[0], p[2])
    if (p[1] - ground < ctx.H * 0.05)
      continue
    const pts: V3[] = []
    for (let k = 0; k <= 4; k++) {
      const f = k / 4
      pts.push([p[0] + ctx.rng.gauss() * ctx.H * 0.004, p[1] + (ground - p[1]) * f, p[2] + ctx.rng.gauss() * ctx.H * 0.004])
    }
    const r = ctx.H * 0.005
    pushLimb(ctx, { pts, radii: taper(pts.length, r, r * 0.8), order: 2, parent: pi, attach: 0.22 })
  }
}

/** Seed pads at the tips of every pad-bearing limb, plus apex pads. */
function seedPads(ctx: GrowCtx, plans: TrunkPlan[]): void {
  const { H, species } = ctx
  const hasChild = new Set(ctx.limbs.map(l => l.parent))
  ctx.limbs.forEach((l, i) => {
    if (!l.pad || l.dead)
      return
    const L = polylineLength(l.pts)
    const terminal = !hasChild.has(i)
    let r = terminal ? Math.max(L * 0.56, H * 0.06) : L * 0.34
    r = Math.min(r, H * 0.24)
    const tip = l.pts[l.pts.length - 1] as V3
    ctx.pads.push({ c: add(tip, [0, r * species.padFlat * 0.3, 0]), r, flat: species.padFlat, limb: i })
  })
  for (const plan of plans) {
    if (plan.canopy === 'broom' || plan.canopy === 'cascade')
      continue
    const t = ctx.limbs[plan.limb] as Limb
    const tip = t.pts[t.pts.length - 1] as V3
    const r = plan.height * (plan.canopy === 'top' ? 0.09 : 0.12)
    ctx.pads.push({ c: add(tip, [0, r * 0.2, 0]), r, flat: species.padFlat * 1.15, limb: plan.limb })
  }
  if (ctx.style === 'kengai' || ctx.style === 'han-kengai') {
    const t = ctx.limbs[plans[0]?.limb ?? 0] as Limb
    const head = pointAt(t.pts, 0.2).p
    ctx.pads.push({ c: add(head, [0, H * 0.05, 0]), r: H * 0.11, flat: species.padFlat, limb: plans[0]?.limb ?? 0 })
  }
}

export function buildBranches(ctx: GrowCtx, plans: TrunkPlan[]): void {
  let level: number[] = []
  for (const plan of plans) level.push(...primariesFor(ctx, plan))
  const prims = level.slice()
  if (ctx.style === 'sharimiki' && prims.length > 3) {
    makeJin(ctx.limbs[prims[1] as number] as Limb)
    makeJin(ctx.limbs[prims[prims.length - 2] as number] as Limb)
  }
  for (let o = 2; o <= ctx.depth; o++) level = ramify(ctx, level, o)
  if (ctx.species.aerialRoots)
    aerialRoots(ctx, prims)
  seedPads(ctx, plans)
}
