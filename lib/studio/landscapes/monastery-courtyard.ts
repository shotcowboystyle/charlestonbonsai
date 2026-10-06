/**
 * Zen Monastery Inner Courtyard: immaculate grey stone paving, walls that
 * close in tight, roofed corridors on two sides, a still reflecting basin
 * with a bamboo spout at its head, and a single plum blooming white against
 * a dark wall. No ornament except intention.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { BoxGeometry, CylinderGeometry, Group, PlaneGeometry, Vector3 } from 'three'
import { at, Batch } from './kit/batch'
import { hall } from './kit/buildings'
import { disposeGroup, resolver } from './kit/resolve'
import { beam, boulder, lathe } from './kit/shapes'
import { terrain } from './kit/terrain'
import { broadTree } from './kit/trees'
import { stillWater } from './kit/water'

const X0 = -6.2
const X1 = 6.6
const Z0 = -6.8
const Z1 = 6.4
const POOL = { x: 0, z: -3.6, w: 3.2, d: 1.1 }

export function buildMonasteryCourtyard(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const groundAt = () => 0
  group.add(terrain({ height: () => -0.02, palette: { low: '#55534d', mid: '#5c5a54', high: '#64625b', rock: '#55534d' }, heightScale: 1, grain: 30, r1: 200 }))

  const b = new Batch()
  // Paving: 0.6 m flags with hairline joints, each set a fraction off level.
  const T = 0.6
  for (let x = X0; x < X1 - 0.01; x += T) {
    for (let z = Z0; z < Z1 - 0.01; z += T) {
      const cx = x + T / 2
      const cz = z + T / 2
      if (Math.abs(cx - POOL.x) < POOL.w / 2 + 0.25 && Math.abs(cz - POOL.z) < POOL.d / 2 + 0.25)
        continue
      const h = 0.06 + rng.range(-0.003, 0.003)
      b.add('flag', new BoxGeometry(T - 0.012, h, T - 0.012), at(cx, h / 2 - 0.04, cz))
    }
  }

  // Reflecting basin: granite curb, dark floor, bamboo spout feeding a stone tsukubai at its head.
  const curbH = 0.12
  const { x: px, z: pz, w: pw, d: pd } = POOL
  b.add('darkStone', new BoxGeometry(pw, 0.04, pd), at(px, -0.3, pz))
  for (const sz of [-1, 1]) b.add('stone', beam(pw + 0.5, curbH, 0.25), at(px, curbH / 2 - 0.02, pz + sz * (pd / 2 + 0.125)))
  for (const sx of [-1, 1]) b.add('stone', beam(0.25, curbH, pd + 0.5), at(px + sx * (pw / 2 + 0.125), curbH / 2 - 0.02, pz))
  const tx = px - pw / 2 - 0.75
  b.add('stone', lathe([[0.36, 0], [0.4, 0.12], [0.38, 0.42], [0.3, 0.46], [0.24, 0.4], [0.0, 0.38]], 20), at(tx, -0.02, pz))
  b.add('bamboo', new CylinderGeometry(0.035, 0.035, 0.9, 10), at(tx - 0.45, 0.4, pz, 0, 0, 0))
  b.add('bamboo', new CylinderGeometry(0.03, 0.03, 0.55, 10), at(tx - 0.2, 0.78, pz, 0, 0, Math.PI / 2 - 0.12))
  b.add('stone', boulder(11, 0.22, 0.7), at(tx + 0.1, -0.02, pz + 0.55))

  // Corridors (engawa) on the back and left: open to the court, plastered behind.
  // Walls are solid boxes so they read from inside the court (hall() planes face outward).
  hall(b, { x: 0.2, z: Z0 - 1.5, ry: 0, w: 7.2, d: 1.5, floor: 0.45, h: 2.5, walls: {}, timber: 'aged' })
  hall(b, { x: X0 - 1.5, z: -0.2, ry: Math.PI / 2, w: 6.8, d: 1.5, floor: 0.45, h: 2.5, walls: {}, timber: 'aged' })
  b.add('plaster', new BoxGeometry(14.8, 2.95, 0.22), at(0.2, 1.47, Z0 - 2.95))
  b.add('plaster', new BoxGeometry(0.22, 2.95, 14), at(X0 - 2.95, 1.47, -0.2))
  for (let k = 0; k < 6; k++) b.add('aged', beam(0.12, 2.95, 0.12), at(-6.4 + k * 2.6, 1.47, Z0 - 2.82))

  // Tall dark walls closing the right and front, capped with tiles.
  const wallH = 3.4
  b.add('darkWall', new BoxGeometry(0.4, wallH, Z1 - Z0 + 3.2), at(X1 + 0.2, wallH / 2, (Z0 + Z1) / 2 - 0.4))
  b.add('darkWall', new BoxGeometry(X1 - X0 + 3.4, wallH, 0.4), at((X0 + X1) / 2 - 1.3, wallH / 2, Z1 + 0.2))
  b.add('roof', beam(0.9, 0.12, Z1 - Z0 + 3.4), at(X1 + 0.2, wallH + 0.06, (Z0 + Z1) / 2 - 0.4))
  b.add('roof', beam(X1 - X0 + 3.6, 0.12, 0.9), at((X0 + X1) / 2 - 1.3, wallH + 0.06, Z1 + 0.2))
  b.add('stone', new BoxGeometry(0.5, 0.3, Z1 - Z0 + 3.2), at(X1 + 0.2, 0.13, (Z0 + Z1) / 2 - 0.4))

  // The single plum, blooming white against the dark wall.
  const plum = new Vector3(X1 - 2.0, 0, -2.6)
  broadTree(b, rng, plum.x, 0, plum.z, { height: 2.5, bark: 'charred', leaf: 'plumLeaf', spread: 0.9, puffs: 10, flat: 0.45 })
  const bed = new PlaneGeometry(1.5, 1.5)
  bed.rotateX(-Math.PI / 2)
  b.add('moss', bed, at(plum.x, 0.025, plum.z))

  for (const m of b.build(resolver(mats, { flag: () => mats.get('paleStone') }))) group.add(m)

  const water = stillWater({ geometry: new PlaneGeometry(pw, pd), y: -0.06, deep: '#0b0d0e', clarity: 0.15, resolution: ctx.quality === 'high' ? 0.5 : 0.35 })
  water.position.x = px
  water.position.z = pz
  group.add(water)

  return {
    group,
    floorY: 0.02,
    groundAt,
    fallSource: { centre: plum.clone().setY(0), radius: 2.2, height: 3.8 },
    dispose: () => disposeGroup(group),
  }
}
