/**
 * Mountain Dojo at Dawn: a timber hall on a stone plinth at the edge of a
 * misty ridge. Weathered beams, shoji screens glowing with first light,
 * tatami catching the sun through the openings, a single bronze bell hanging
 * silent, and open doors onto a valley that falls away into mist, with
 * cherry trees just outside so petals drift in.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { CylinderGeometry, Group, Matrix4, Vector3 } from 'three'
import { at, Batch } from './kit/batch'
import { rise, smoothstep, warped } from './kit/noise'
import { lantern } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { room } from './kit/room'
import { beam, lathe, post } from './kit/shapes'
import { terrain } from './kit/terrain'
import { broadTree, cryptomeria, gardenPine } from './kit/trees'

export function buildMountainDojo(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const out = mats.outdoor()
  const group = new Group()
  const W = 4.6
  const D = 4.4
  const H = 3.6
  const PLINTH = -0.65

  // The ridge: level around the temple, a steep drop to the valley behind (-z), far ridges beyond.
  const groundAt = (x: number, z: number) => {
    const drop = smoothstep(-8, -16, z) * 55
    const ridge = rise(x, z, 14, 60) * warped(x, z, 0.01, 30) * 10
    const far = rise(x, z, 90, 400) * warped(x - 40, z + 30, 0.004, 90) * 120
    return PLINTH - drop + ridge * (1 - smoothstep(-6, -14, z)) + far
  }
  group.add(terrain({ height: groundAt, palette: { low: '#3a4630', mid: '#566042', high: '#7a7a60', rock: '#5f5c55' }, heightScale: 30, grain: 40 }))

  // Outside: stone plinth and steps, cherry trees by the doors, cryptomeria and pines along the ridge.
  const ob = new Batch()
  ob.add('stone', beam(W * 2 + 2.4, 0.7, D * 2 + 2.4), at(0, PLINTH + 0.32, 0))
  ob.add('darkStone', beam(W * 2 + 2.8, 0.25, D * 2 + 2.8), at(0, PLINTH - 0.1, 0))
  for (let k = 0; k < 3; k++) ob.add('stone', beam(2.2, 0.18, 0.4), at(2.3, PLINTH + 0.6 - k * 0.2, -D - 1.4 - k * 0.38))
  const cherries: [number, number, number][] = [[-7.8, -7.6, 5.5], [8.2, -7.2, 4.8], [-9.4, -2, 5.2], [-9.0, 4.2, 4.4], [9.6, 2.8, 5]]
  for (const [x, z, h] of cherries) broadTree(ob, rng, x, groundAt(x, z), z, { height: h, bark: 'charred', leaf: 'cherryLeaf', spread: 0.5, puffs: 8 })
  for (let i = 0; i < 18; i++) {
    const a = rng.range(Math.PI * 0.1, Math.PI * 0.9)
    const r = rng.range(10, 24)
    const x = Math.cos(a) * r * 1.4
    const z = Math.sin(a) * r * 0.9
    if (i % 3 === 0)
      gardenPine(ob, rng, x, groundAt(x, z), z, rng.range(4, 7))
    else cryptomeria(ob, rng, x, groundAt(x, z), z, rng.range(12, 22))
  }
  lantern(ob, 3.9, -D - 1.6, 0.2, 0.75, PLINTH + 0.68)
  for (const m of ob.build(resolver(out, {}, 1))) group.add(m)

  // The hall: shoji on the right, open doors onto the valley behind and to the left.
  const b = new Batch()
  const info = room(b, {
    w: W,
    d: D,
    h: H,
    floor: 'tatami',
    // Old timber walls darkened by incense keep the room dim, so the dawn light and the shoji glow carry it.
    wall: 'darkWall',
    timber: 'aged',
    openings: {
      back: [{ x: -1.8, y0: 0.05, w: 2.4, h: 2.3, kind: 'door' }, { x: 1.8, y0: 0.05, w: 2.4, h: 2.3, kind: 'door' }],
      left: [{ x: -1.3, y0: 0.05, w: 2.0, h: 2.3, kind: 'door' }, { x: 2.0, y0: 0.4, w: 1.6, h: 1.8, kind: 'shoji' }],
      // Dawn light enters from the east: a lattice window between the glowing shoji
      // and a row of transom windows lay the first sun on the tatami.
      right: [{ x: -2.2, y0: 0.4, w: 1.6, h: 1.9, kind: 'shoji' }, { x: 0, y0: 1.1, w: 1.6, h: 1.4, kind: 'window' }, { x: 2.2, y0: 0.4, w: 1.6, h: 1.9, kind: 'shoji' }],
      front: [{ x: -2.4, y0: 1.8, w: 1.4, h: 1.0, kind: 'window' }, { x: 0, y0: 1.8, w: 1.4, h: 1.0, kind: 'window' }, { x: 2.4, y0: 1.8, w: 1.4, h: 1.0, kind: 'window' }],
    },
  })

  // Heavy weathered tie beams under the ceiling.
  for (const z of [-1.5, 1.5]) b.add('aged', beam(W * 2, 0.3, 0.26), at(0, H - 0.45, z))

  // The bell frame in the back-left corner: two posts, a crossbeam, the bell hanging silent.
  const bx = -3.1
  const bz = -2.6
  b.add('aged', post(0.09, 2.1, 10), at(bx - 0.7, 0.05, bz))
  b.add('aged', post(0.09, 2.1, 10), at(bx + 0.7, 0.05, bz))
  b.add('aged', beam(1.8, 0.16, 0.16), at(bx, 2.12, bz))
  b.add('aged', beam(1.6, 0.1, 0.12), at(bx, 0.35, bz))
  // Local bell: kit bell()'s lathe profile runs top-down, so its faces point inward and cull away.
  const bs = 1.2
  const top = 1.92
  b.add('bronze', lathe([[0.27, 0], [0.3, 0], [0.3, 0.04], [0.26, 0.2], [0.24, 0.5], [0.16, 0.6], [0.002, 0.62]], 28), at(bx, top - 0.62 * bs, bz, 0).multiply(new Matrix4().makeScale(bs, bs, bs)))
  b.add('bronze', new CylinderGeometry(0.04, 0.04, 0.16, 8), at(bx, top + 0.06, bz))
  b.add('aged', beam(0.08, 0.08, 1.1), at(bx + 0.5, 1.2, bz + 0.3, 0.4))

  for (const m of b.build(resolver(mats, {}, 0))) group.add(m)

  return {
    group,
    floorY: 0.05,
    groundAt: (x, z) => (Math.abs(x) < W && Math.abs(z) < D ? 0.05 : groundAt(x, z)),
    interior: info.interior,
    apertures: info.apertures,
    fallSource: { centre: new Vector3(-1, 0, -5.5), radius: 5, height: 5 },
    dispose: () => disposeGroup(group),
  }
}
