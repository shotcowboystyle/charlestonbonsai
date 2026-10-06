/**
 * Sweeps skeleton limbs into one merged wood geometry (3d-high-poly-models:
 * rings along a smooth curve, transported frames, continuous taper, child
 * starts buried in the parent, denser rings at the nebari flare).
 *
 * Every vertex carries what the growth shader needs to reveal the wood along
 * its growth path instead of by height:
 *   aAxis    centreline point the ring is built around
 *   aGrowth  growth time at this ring (limb units, see timeline.ts)
 *   aDir     xyz: tangent scaled to metres per growth unit; w: max pull-back
 *   aDead    deadwood mask (0 bark, 1 bleached wood)
 */
import type { Limb } from './skeleton'
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Vector3 } from 'three'
import { deadAt } from './deadwood'

const TAU = Math.PI * 2

export interface TubeStats {
  vertices: number
  triangles: number
}

export function sweepLimbs(limbs: Limb[], trunkR: number): { geometry: BufferGeometry, stats: TubeStats } {
  const pos: number[] = []
  const nrm: number[] = []
  const uv: number[] = []
  const axis: number[] = []
  const grow: number[] = []
  const dir: number[] = []
  const dead: number[] = []
  const idx: number[] = []

  const T = new Vector3()
  const N = new Vector3()
  const B = new Vector3()
  const prevT = new Vector3()
  const tmp = new Vector3()
  const c = new Vector3()

  for (const limb of limbs) {
    const pts = limb.pts.map(p => new Vector3(p[0], p[1], p[2]))
    if (pts.length < 2)
      continue
    const curve = new CatmullRomCurve3(pts, false, 'centripetal')
    const L = curve.getLength()
    if (L <= 1e-6)
      continue
    const r0 = limb.radii[0] ?? 0.001
    const rEnd = limb.radii[limb.radii.length - 1] ?? r0 * 0.2
    const rAvg = (r0 + rEnd) / 2
    const flare = limb.flare ?? 0
    const ds = Math.min(L / 3, Math.max(rAvg * 1.3, L / 44))
    const maxRings = limb.order <= 0 ? 44 : limb.order === 1 ? 18 : 7
    const n = Math.max(3, Math.min(maxRings, Math.ceil(L / ds)) + (flare > 0 ? 6 : 0))
    const sides = limb.order < 0 ? 7 : Math.max(5, Math.min(22, Math.round(6 + 16 * Math.sqrt(r0 / trunkR))))
    const gSpan = Math.max(1e-4, limb.g1 - limb.g0)
    const mPerG = L / gSpan

    const us: number[] = []
    for (let i = 0; i <= n; i++) us.push(flare > 0 ? (i / n) ** 1.35 : i / n)
    const radius = (u: number) => {
      const k = limb.radii.length - 1
      const f = Math.min(k, u * k)
      const i = Math.min(k - 1, Math.floor(f))
      return (limb.radii[i] as number) + ((limb.radii[i + 1] as number) - (limb.radii[i] as number)) * (f - i)
    }

    curve.getTangentAt(0, prevT)
    N.set(0, 1, 0).cross(prevT)
    if (N.lengthSq() < 1e-6)
      N.set(1, 0, 0).cross(prevT)
    N.normalize()

    const ringStart = pos.length / 3
    const ringCount = us.length + 1
    for (let ri = 0; ri < ringCount; ri++) {
      const apex = ri === us.length
      const u = apex ? 1 : (us[ri] as number)
      curve.getPointAt(u, c)
      curve.getTangentAt(u, T)
      // Parallel transport: rotate N by the change in tangent so the ring never spins.
      tmp.crossVectors(prevT, T)
      const sin = tmp.length()
      if (sin > 1e-6) {
        const ang = Math.asin(Math.min(1, sin))
        N.applyAxisAngle(tmp.normalize(), prevT.dot(T) < 0 ? Math.PI - ang : ang)
      }
      N.sub(tmp.copy(T).multiplyScalar(N.dot(T))).normalize()
      B.crossVectors(T, N)
      prevT.copy(T)

      const s = u * L
      const r = apex ? 0 : radius(u)
      if (apex)
        c.addScaledVector(T, rEnd * 0.7)
      const uPrev = ri > 0 ? (us[Math.min(ri - 1, us.length - 1)] as number) : 0
      const dsPrev = Math.max(1e-5, (u - uPrev) * L)
      const g = limb.g0 + (apex ? gSpan : gSpan * u)
      const dr = apex ? -rEnd / Math.max(1e-5, rEnd * 0.7) : (radius(Math.min(1, u + 0.01)) - radius(Math.max(0, u - 0.01))) / (0.02 * L)
      const twist = (limb.twist ?? 0) * s
      for (let j = 0; j <= sides; j++) {
        const th = (j / sides) * TAU
        const ct = Math.cos(th)
        const st = Math.sin(th)
        let rr = r
        if (flare > 0 && !apex) {
          const e = Math.exp(-s / (r0 * 1.3))
          rr *= 1 + flare * 0.85 * e + flare * 0.4 * Math.exp(-s / r0) * (0.5 + 0.5 * Math.cos(5 * th + 1.3)) ** 3
        }
        const rx = N.x * ct + B.x * st
        const ry = N.y * ct + B.y * st
        const rz = N.z * ct + B.z * st
        pos.push(c.x + rx * rr, c.y + ry * rr, c.z + rz * rr)
        tmp.set(rx - T.x * dr, ry - T.y * dr, rz - T.z * dr).normalize()
        nrm.push(tmp.x, tmp.y, tmp.z)
        uv.push(j / sides + twist, s)
        axis.push(c.x, c.y, c.z)
        grow.push(g)
        dir.push(T.x * mPerG, T.y * mPerG, T.z * mPerG, dsPrev / mPerG)
        dead.push(deadAt(limb.dead, th, u))
      }
    }
    for (let ri = 0; ri < ringCount - 1; ri++) {
      const a = ringStart + ri * (sides + 1)
      const b = a + sides + 1
      for (let j = 0; j < sides; j++) idx.push(a + j, a + j + 1, b + j, a + j + 1, b + j + 1, b + j)
    }
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nrm), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.setAttribute('aAxis', new BufferAttribute(new Float32Array(axis), 3))
  g.setAttribute('aGrowth', new BufferAttribute(new Float32Array(grow), 1))
  g.setAttribute('aDir', new BufferAttribute(new Float32Array(dir), 4))
  g.setAttribute('aDead', new BufferAttribute(new Float32Array(dead), 1))
  g.setIndex(idx)
  g.computeBoundingSphere()
  g.computeBoundingBox()
  return { geometry: g, stats: { vertices: pos.length / 3, triangles: idx.length / 3 } }
}
