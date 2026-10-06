import type { InteriorSpec } from '../types'
/**
 * Interior shell for the dojos: tatami floor with cloth borders, walls with
 * real openings (so the key light cuts the window's shape onto the floor —
 * 3d-wood-lighting-scorecard: let a real wall with a real opening cast),
 * kumiko lattice in the windows, shoji that glow when backlit, ceiling beams
 * and a curved roof outside. Returns the InteriorSpec that keeps the camera
 * inside and the rain outside.
 */
import type { Batch } from './batch'
import { Box3, BoxGeometry, PlaneGeometry, Vector3 } from 'three'
import { at } from './batch'
import { roofGeometry } from './buildings'
import { beam, post } from './shapes'

export interface Opening {
  /** Centre along the wall, metres from the wall's middle. */
  x: number
  y0: number
  w: number
  h: number
  kind: 'window' | 'door' | 'shoji'
}

export type Side = 'front' | 'back' | 'left' | 'right'

export interface RoomSpec {
  w: number
  d: number
  h: number
  floor: 'tatami' | 'wood'
  wall: string
  timber: string
  openings: Partial<Record<Side, Opening[]>>
  roof?: boolean
}

export interface RoomInfo {
  interior: InteriorSpec
  /** World-space centres and normals of windows and doors, for light and particles. */
  apertures: { centre: Vector3, normal: Vector3, w: number, h: number, kind: Opening['kind'] }[]
}

const T = 0.16

export function room(b: Batch, s: RoomSpec): RoomInfo {
  const { w, d, h } = s
  if (s.floor === 'tatami') {
    const mw = 1.82
    const md = 0.91
    for (let x = -w; x < w - 0.01; x += mw) {
      for (let z = -d; z < d - 0.01; z += md) {
        const cw = Math.min(mw, w - x)
        const cd = Math.min(md, d - z)
        b.add('tatami', new BoxGeometry(cw - 0.012, 0.05, cd - 0.012), at(x + cw / 2, 0.025, z + cd / 2))
        b.add('charred', new BoxGeometry(cw, 0.048, 0.035), at(x + cw / 2, 0.024, z + 0.0175))
        b.add('charred', new BoxGeometry(cw, 0.048, 0.035), at(x + cw / 2, 0.024, z + cd - 0.0175))
      }
    }
  }
  else {
    for (let x = -w; x < w; x += 0.24) b.add(s.timber, beam(0.235, 0.05, d * 2), at(x + 0.12, 0.025, 0))
  }

  const apertures: RoomInfo['apertures'] = []
  const sides: [Side, number, Vector3, Vector3][] = [
    ['front', w, new Vector3(0, 0, d), new Vector3(1, 0, 0)],
    ['back', w, new Vector3(0, 0, -d), new Vector3(-1, 0, 0)],
    ['left', d, new Vector3(-w, 0, 0), new Vector3(0, 0, 1)],
    ['right', d, new Vector3(w, 0, 0), new Vector3(0, 0, -1)],
  ]
  for (const [side, half, origin, along] of sides) {
    const ry = Math.atan2(-along.z, along.x)
    const normal = origin.clone().normalize()
    const place = (cx: number, cy: number, sw: number, sh: number, key = s.wall, depth = T) => {
      if (sw <= 0.005 || sh <= 0.005)
        return
      const p = origin.clone().addScaledVector(along, cx)
      b.add(key, new BoxGeometry(sw, sh, depth), at(p.x, cy, p.z, ry))
    }
    const ops = [...(s.openings[side] ?? [])].sort((a, c) => a.x - c.x)
    let cursor = -half
    for (const o of ops) {
      const l = o.x - o.w / 2
      const r = o.x + o.w / 2
      place((cursor + l) / 2, h / 2, l - cursor, h)
      place(o.x, o.y0 / 2, o.w, o.y0)
      place(o.x, (o.y0 + o.h + h) / 2, o.w, h - o.y0 - o.h)
      const p = origin.clone().addScaledVector(along, o.x)
      apertures.push({ centre: new Vector3(p.x, o.y0 + o.h / 2, p.z), normal, w: o.w, h: o.h, kind: o.kind })
      if (o.kind === 'window') {
        const n = Math.max(2, Math.round(o.w / 0.22))
        for (let k = 1; k < n; k++) place(l + (k * o.w) / n, o.y0 + o.h / 2, 0.025, o.h, s.timber, 0.04)
        place(o.x, o.y0 + o.h / 2, o.w, 0.025, s.timber, 0.04)
      }
      if (o.kind === 'shoji') {
        const pp = origin.clone().addScaledVector(along, o.x).addScaledVector(normal, -0.02)
        b.add('paper', new PlaneGeometry(o.w, o.h), at(pp.x, o.y0 + o.h / 2, pp.z, ry + Math.PI))
        const nb = Math.max(2, Math.round(o.w / 0.3))
        for (let k = 0; k <= nb; k++) place(l + (k * o.w) / nb, o.y0 + o.h / 2, 0.03, o.h, s.timber, 0.05)
        for (let k = 0; k <= 6; k++) place(o.x, o.y0 + (k * o.h) / 6, o.w, 0.03, s.timber, 0.05)
      }
      place(o.x, o.y0 + o.h + 0.05, o.w + 0.12, 0.1, s.timber, T + 0.04)
      cursor = r
    }
    place((cursor + half) / 2, h / 2, half - cursor, h)
  }

  for (const [x, z] of [[-w, -d], [w, -d], [-w, d], [w, d], [0, -d], [0, d], [-w, 0], [w, 0]] as [number, number][]) b.add(s.timber, post(0.11, h, 12), at(x, 0, z))
  b.add(s.timber, beam(w * 2 + 0.3, 0.24, 0.2), at(0, h - 0.12, -d + 0.05))
  b.add(s.timber, beam(w * 2 + 0.3, 0.24, 0.2), at(0, h - 0.12, d - 0.05))
  for (let x = -w + 1.2; x < w; x += 1.8) b.add(s.timber, beam(0.16, 0.2, d * 2), at(x, h - 0.1, 0))
  b.add(s.timber, new BoxGeometry(w * 2 + 0.4, 0.04, d * 2 + 0.4), at(0, h + 0.02, 0))
  if (s.roof !== false)
    b.add('roof', roofGeometry({ w: w + 0.3, d: d + 0.3, overhang: 1.1, yEave: h + 0.15, yRidge: h + 0.15 + Math.min(w, d) * 0.85 }), at(0, 0, 0))

  return {
    interior: { box: new Box3(new Vector3(-w, 0, -d), new Vector3(w, h, d)), radius: Math.min(w, d) - 0.35, ceil: h, minSunEl: 0.5 },
    apertures,
  }
}
