/**
 * Indoor Dojo, Winter Afternoon: a dark timber hall where the key light
 * carves golden rectangles through high windows onto the tatami, a bronze
 * brazier glows red in the corner, a hanging scroll waits in the alcove, and
 * snow lies beyond the windows and the half-open shoji.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { BoxGeometry, CylinderGeometry, Group, PlaneGeometry, Vector3 } from 'three'
import { at, Batch } from './kit/batch'
import { halo } from './kit/glow'
import { rise, warped } from './kit/noise'
import { brazier } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { room } from './kit/room'
import { beam } from './kit/shapes'
import { terrain } from './kit/terrain'
import { cryptomeria, gardenPine } from './kit/trees'

export function buildWinterDojo(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const out = mats.outdoor()
  const group = new Group()
  const W = 4.6
  const D = 4.6
  const H = 3.4
  const groundAt = (x: number, z: number) => rise(x, z, 9, 40) * warped(x, z, 0.01, 30) * 14 + rise(x, z, 60, 300) * warped(x + 90, z, 0.004, 60) * 60 - 0.05

  // Outside: a snowy garden, visible through every opening.
  group.add(terrain({ height: groundAt, palette: { low: '#d7dbe0', mid: '#e6e8ec', high: '#f1f2f4', rock: '#8a8a8c' }, heightScale: 8, grain: 30 }))
  const ob = new Batch()
  for (let i = 0; i < 26; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = rng.range(9, 26)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (i % 3 === 0)
      gardenPine(ob, rng, x, groundAt(x, z), z, rng.range(4, 7), 'snowPine')
    else cryptomeria(ob, rng, x, groundAt(x, z), z, rng.range(12, 20), 'snowSugi')
  }
  for (const m of ob.build(resolver(out, {}, 1))) group.add(m)

  // The hall: high clerestory windows on three sides, a half-open shoji to the garden.
  const b = new Batch()
  const info = room(b, {
    w: W,
    d: D,
    h: H,
    floor: 'tatami',
    wall: 'darkWall',
    timber: 'aged',
    openings: {
      right: [{ x: -2.4, y0: 2.15, w: 1.5, h: 0.75, kind: 'window' }, { x: 0, y0: 2.15, w: 1.5, h: 0.75, kind: 'window' }, { x: 2.4, y0: 2.15, w: 1.5, h: 0.75, kind: 'window' }],
      left: [{ x: -1.6, y0: 2.15, w: 1.5, h: 0.75, kind: 'window' }, { x: 1.6, y0: 2.15, w: 1.5, h: 0.75, kind: 'window' }],
      front: [{ x: -2.2, y0: 2.15, w: 1.4, h: 0.75, kind: 'window' }, { x: 2.2, y0: 2.15, w: 1.4, h: 0.75, kind: 'window' }],
      back: [{ x: 2.3, y0: 0.05, w: 1.6, h: 2.1, kind: 'door' }, { x: 0.5, y0: 0.05, w: 1.6, h: 2.1, kind: 'shoji' }, { x: -2.4, y0: 2.15, w: 1.2, h: 0.7, kind: 'window' }],
    },
  })

  // Tokonoma alcove: raised keyaki base, hanging scroll with an ensō.
  b.add('keyaki', beam(1.7, 0.14, 0.75), at(-2.6, 0.07, -D + 0.42))
  b.add('aged', beam(0.12, H, 0.12), at(-1.72, H / 2, -D + 0.75))
  b.add('scroll', new PlaneGeometry(0.62, 1.55), at(-2.6, 1.55, -D + 0.1))
  b.add('aged', new CylinderGeometry(0.02, 0.02, 0.74, 8), at(-2.6, 0.76, -D + 0.11, 0, 0, Math.PI / 2))
  b.add('aged', new CylinderGeometry(0.014, 0.014, 0.68, 8), at(-2.6, 2.34, -D + 0.11, 0, 0, Math.PI / 2))
  b.add('bronze', new BoxGeometry(0.003, 0.26, 0.003), at(-2.6, 2.5, -D + 0.11))

  // The brazier glows red in the corner; its embers light the wall behind.
  const ember = brazier(b, -3.4, 3.2, 1.1, 0.0)
  b.add('aged', beam(0.9, 0.04, 0.9), at(-3.4, 0.07, 3.2))
  const light = ctx.lights[0]
  if (light) {
    light.position.copy(ember).add(new Vector3(0, 0.25, 0))
    light.color.set('#ff6a2a')
    light.distance = 7
    light.userData.base = 2.2
  }
  group.add(halo(ember.clone().add(new Vector3(0, 0.08, 0)), '#ff6a2a', 1.2, 0.8))

  // A low writing desk and cushion near the alcove give the room a human scale.
  b.add('keyaki', beam(0.9, 0.05, 0.5), at(2.6, 0.34, -2.8))
  for (const [x, z] of [[2.2, -3.0], [3.0, -3.0], [2.2, -2.6], [3.0, -2.6]]) b.add('keyaki', beam(0.05, 0.3, 0.05), at(x!, 0.17, z!))
  b.add('charred', beam(0.55, 0.08, 0.55), at(2.6, 0.09, -2.1))

  const res = resolver(mats, {}, 0)
  for (const m of b.build(res)) group.add(m)

  return {
    group,
    floorY: 0.05,
    groundAt: (x, z) => (Math.abs(x) < W && Math.abs(z) < D ? 0.05 : groundAt(x, z)),
    emitters: { embers: ember.clone() },
    interior: info.interior,
    apertures: info.apertures,
    dispose: () => disposeGroup(group),
  }
}
