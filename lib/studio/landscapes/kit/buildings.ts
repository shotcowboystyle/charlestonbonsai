/**
 * Timber buildings. The roof follows the threejs-towers rule — the whole
 * character of an East Asian roof is one function of position along the
 * eave: concave sag down the slope, corners lifting and flaring outward —
 * clamped so overshoot never feeds a negative base into `pow`.
 */
import type { Batch } from './batch'
import { BoxGeometry, BufferAttribute, BufferGeometry, Matrix4, PlaneGeometry } from 'three'
import { at } from './batch'
import { beam, post } from './shapes'

export interface RoofSpec {
  /** Half-width (x) and half-depth (z) of the wall line. */
  w: number
  d: number
  overhang: number
  yEave: number
  yRidge: number
  /** Ridge half-length as a fraction of w: 0 is a pyramid, ~0.6 a hip roof. */
  ridge?: number
  lift?: number
  sag?: number
  thickness?: number
}

function roofPoint(o: Required<RoofSpec>, panel: number, u: number, t: number): [number, number, number] {
  const tc = Math.min(1, Math.max(0, t))
  const g = 1 - (1 - tc) ** o.sag
  const corner = Math.abs(u) ** 2
  const flare = 1 + 0.06 * corner * tc ** 3.2
  const y = o.yRidge - (o.yRidge - o.yEave) * g + o.lift * corner * tc ** 2.6
  const W = o.w + o.overhang
  const D = o.d + o.overhang
  const rw = o.w * o.ridge
  if (panel < 2) {
    const s = panel === 0 ? 1 : -1
    const x = (u * rw * (1 - tc) + u * W * tc) * flare
    return [x, y, s * D * tc * flare]
  }
  const s = panel === 2 ? 1 : -1
  const z = u * D * tc * flare
  return [s * (rw + (W - rw) * tc) * flare, y, z]
}

export function roofGeometry(spec: RoofSpec, nu = 12, nt = 8): BufferGeometry {
  const o: Required<RoofSpec> = { ridge: 0.55, lift: 0.35, sag: 1.7, thickness: 0.12, ...spec }
  const pos: number[] = []
  const idx: number[] = []
  for (let panel = 0; panel < 4; panel++) {
    for (const side of [0, 1]) {
      const base = pos.length / 3
      for (let j = 0; j <= nt; j++) {
        for (let i = 0; i <= nu; i++) {
          const [x, y, z] = roofPoint(o, panel, (i / nu) * 2 - 1, j / nt)
          pos.push(x, y - side * o.thickness, z)
        }
      }
      // Front/back panels face +z/-z, sides face +x/-x; flip for underside and mirrored panels.
      const flip = (panel === 1 || panel === 2) !== (side === 1)
      for (let j = 0; j < nt; j++) {
        for (let i = 0; i < nu; i++) {
          const a = base + j * (nu + 1) + i
          const b = a + nu + 1
          if (flip)
            idx.push(a, b, a + 1, a + 1, b, b + 1)
          else idx.push(a, a + 1, b, a + 1, b + 1, b)
        }
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export interface HallSpec {
  x: number
  z: number
  ry: number
  w: number
  d: number
  /** Floor height of the raised deck. */
  floor: number
  /** Wall height above the floor. */
  h: number
  /** Which sides are walled: front (+z), back, left (-x), right. 'shoji' glows when lit. */
  walls: { front?: 'open' | 'shoji' | 'plaster', back?: 'open' | 'shoji' | 'plaster', left?: 'open' | 'shoji' | 'plaster', right?: 'open' | 'shoji' | 'plaster' }
  roof?: 'roof' | 'thatch'
  timber?: string
}

/** A raised timber hall: deck, posts, tie beams, walls and a curved hip roof. */
export function hall(b: Batch, s: HallSpec): void {
  const T = (x: number, y: number, z: number) => new Matrix4().makeRotationY(s.ry).setPosition(0, 0, 0).premultiply(new Matrix4().makeTranslation(s.x, 0, s.z)).multiply(at(x, y, z))
  const timber = s.timber ?? 'aged'
  b.add(timber, beam(s.w * 2 + 0.6, 0.12, s.d * 2 + 0.6), T(0, s.floor - 0.06, 0))
  const nx = Math.max(2, Math.round((s.w * 2) / 1.8))
  const nz = Math.max(2, Math.round((s.d * 2) / 1.8))
  const postAt = (px: number, pz: number) => b.add(timber, post(0.1, s.floor + s.h + 0.3, 10), T(px, 0, pz))
  for (let i = 0; i <= nx; i++) {
    postAt(-s.w + (2 * s.w * i) / nx, s.d)
    postAt(-s.w + (2 * s.w * i) / nx, -s.d)
  }
  for (let i = 1; i < nz; i++) {
    postAt(-s.w, -s.d + (2 * s.d * i) / nz)
    postAt(s.w, -s.d + (2 * s.d * i) / nz)
  }
  const top = s.floor + s.h
  b.add(timber, beam(s.w * 2 + 0.4, 0.22, 0.18), T(0, top, s.d))
  b.add(timber, beam(s.w * 2 + 0.4, 0.22, 0.18), T(0, top, -s.d))
  b.add(timber, beam(0.18, 0.22, s.d * 2 + 0.4), T(s.w, top, 0))
  b.add(timber, beam(0.18, 0.22, s.d * 2 + 0.4), T(-s.w, top, 0))
  const wall = (kind: 'open' | 'shoji' | 'plaster' | undefined, len: number, m: Matrix4) => {
    if (!kind || kind === 'open')
      return
    const g = kind === 'shoji' ? new PlaneGeometry(len, s.h * 0.92) : new BoxGeometry(len, s.h * 0.92, 0.08)
    b.add(kind === 'shoji' ? 'paper' : 'plaster', g, m)
    if (kind === 'shoji') {
      const nb = Math.round(len / 0.45)
      for (let k = 0; k <= nb; k++) b.add(timber, beam(0.03, s.h * 0.92, 0.04), m.clone().multiply(at(-len / 2 + (k * len) / nb, 0, 0.01)))
      for (let k = 1; k < 5; k++) b.add(timber, beam(len, 0.025, 0.04), m.clone().multiply(at(0, -s.h * 0.46 + (k * s.h * 0.92) / 5, 0.01)))
    }
  }
  const mid = s.floor + s.h * 0.48
  wall(s.walls.front, s.w * 2, T(0, mid, s.d).multiply(new Matrix4()))
  wall(s.walls.back, s.w * 2, T(0, mid, -s.d).multiply(new Matrix4().makeRotationY(Math.PI)))
  wall(s.walls.left, s.d * 2, T(-s.w, mid, 0).multiply(new Matrix4().makeRotationY(-Math.PI / 2)))
  wall(s.walls.right, s.d * 2, T(s.w, mid, 0).multiply(new Matrix4().makeRotationY(Math.PI / 2)))
  const rise = Math.min(s.w, s.d) * 0.9
  b.add(s.roof ?? 'roof', roofGeometry({ w: s.w, d: s.d, overhang: 0.9, yEave: top + 0.2, yRidge: top + 0.2 + rise }), T(0, 0, 0))
  b.add(timber, beam(s.w * 2 * 0.55 + 0.3, 0.2, 0.2), T(0, top + 0.25 + rise, 0))
}
