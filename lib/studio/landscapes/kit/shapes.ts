/**
 * Geometry vocabulary shared by every prop (threejs-towers: build the
 * vocabulary before the building). Timber gets a rounded arris so edges catch
 * a highlight (3d-wood-material); stones are welded, noise-displaced and
 * flattened so they read embedded rather than dropped.
 */
import type { BufferGeometry } from 'three'
import { CylinderGeometry, IcosahedronGeometry, LatheGeometry, Vector2 } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { fbm } from './noise'

/** A board or beam with a rounded arris, centred on the origin. */
export function beam(w: number, h: number, d: number): BufferGeometry {
  const r = Math.min(w, h, d) * 0.12
  return new RoundedBoxGeometry(w, h, d, 2, Math.max(0.002, r))
}

/** A vertical post standing on y = 0. */
export function post(r: number, h: number, sides = 12, taper = 1): BufferGeometry {
  const g = new CylinderGeometry(r * taper, r, h, sides, 1)
  g.translate(0, h / 2, 0)
  return g
}

/** Surface of revolution from [radius, y] pairs. */
export function lathe(profile: [number, number][], segs = 24): BufferGeometry {
  // LatheGeometry faces outward only when the profile climbs; flip descending ones.
  if (profile.length > 1 && (profile[0] as [number, number])[1] > (profile[profile.length - 1] as [number, number])[1])
    profile = [...profile].reverse()
  return new LatheGeometry(profile.map(([r, y]) => new Vector2(Math.max(0.0005, r), y)), segs)
}

/** A boulder: displaced icosphere, flattened and sunk a little into the ground. */
export function boulder(seed: number, size: number, flat = 0.62, detail = 3): BufferGeometry {
  let g: BufferGeometry = new IcosahedronGeometry(1, detail)
  g.deleteAttribute('normal')
  g.deleteAttribute('uv')
  g = mergeVertices(g)
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const n = fbm(x * 1.3 + seed * 3.1, z * 1.3 + y * 0.9 - seed, 4)
    const facet = Math.round(n * 5) / 5
    const k = 0.72 + n * 0.45 + (facet - n) * 0.25
    p.setXYZ(i, x * k * size, y * k * size * flat, z * k * size)
  }
  g.translate(0, size * flat * 0.22, 0)
  g.computeVertexNormals()
  return g
}
