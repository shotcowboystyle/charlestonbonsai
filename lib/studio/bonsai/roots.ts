/**
 * Roots: the nebari flare radiating over the soil, and roots draped over a
 * rock into the soil for Sekijoju and Ishitsuki. Both stay inside the pot
 * wall (`ctx.edge`) so nothing pokes through the ceramic.
 */
import type { RockSpec } from './rock'
import type { V3 } from './skeleton'
import type { GrowCtx } from './trunk'
import { rockPoint } from './rock'
import { dirAzEl, norm, taper } from './skeleton'
import { pushLimb } from './trunk'

/** Nebari: surface roots radiating over the soil from a trunk base. */
export function addRoots(ctx: GrowCtx, base: V3, r0: number, count: number, reach: number, parent: number): void {
  const { rng } = ctx
  const start = rng.range(0, Math.PI * 2)
  for (let i = 0; i < count; i++) {
    const az = start + (i / count) * Math.PI * 2 + rng.range(-0.25, 0.25)
    const d = dirAzEl(az, 0)
    const L = Math.max(r0 * 0.4, Math.min(reach * rng.range(0.7, 1.15), ctx.edge(base[0], base[2], d[0], d[2]) - r0 * 1.15))
    const at = (k: number, lift: number): V3 => {
      const x = base[0] + d[0] * k
      const z = base[2] + d[2] * k
      return [x, ctx.soilAt(x, z) + lift, z]
    }
    const pts: V3[] = [
      [base[0] + d[0] * r0 * 0.15, base[1] + r0 * 0.55, base[2] + d[2] * r0 * 0.15],
      at(r0 * 0.85, r0 * 0.12),
      at(r0 + L * 0.3, r0 * 0.06),
      at(r0 + L * 0.65, 0),
      at(r0 + L, -r0 * 0.3),
    ]
    pushLimb(ctx, { pts, radii: [r0 * 0.5, r0 * 0.36, r0 * 0.22, r0 * 0.14, r0 * 0.06], order: -1, parent, attach: 0 })
  }
}

/** Roots draped over a rock surface into the soil (Sekijoju, Ishitsuki). */
export function drapeRoots(ctx: GrowCtx, rock: RockSpec, fromY: number, centre: number, spread: number, r0: number, count: number, parent: number): void {
  const { rng } = ctx
  for (let i = 0; i < count; i++) {
    const th0 = centre + (count === 1 ? 0 : (i / (count - 1) - 0.5) * spread) + rng.range(-0.15, 0.15)
    const pts: V3[] = []
    const n = 7
    const rr = r0 * 0.35
    for (let k = 0; k <= n; k++) {
      const f = k / n
      const y = fromY * (1 - f) + rock.height * 0.02 * f
      pts.push(rockPoint(rock, y, th0 + Math.sin(f * 4 + i) * 0.12, rr * 0.55))
    }
    const last = pts[pts.length - 1] as V3
    const out = norm([last[0] - rock.base[0], 0, last[2] - rock.base[2]])
    const k = Math.max(0, Math.min(r0 * 1.5, ctx.edge(last[0], last[2], out[0], out[2]) - rr * 2))
    const x = last[0] + out[0] * k
    const z = last[2] + out[2] * k
    pts.push([x, ctx.soilAt(x, z) - rr * 0.4, z])
    pushLimb(ctx, { pts, radii: taper(pts.length, rr, rr * 0.35, 1), order: -1, parent, attach: 0 })
  }
}
