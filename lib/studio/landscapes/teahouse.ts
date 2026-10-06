/**
 * Garden Teahouse Platform: a raised timber deck under a small roof, set in
 * a moss garden. A stone path winds away and stops short, deliberately going
 * nowhere; autumn grasses bow under frost; maples and pines close the view.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { Group, Vector3 } from 'three'
import { at, Batch } from './kit/batch'
import { hall } from './kit/buildings'
import { halo } from './kit/glow'
import { grass } from './kit/grass'
import { rise, warped } from './kit/noise'
import { lantern, stone } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { beam, boulder } from './kit/shapes'
import { terrain } from './kit/terrain'
import { broadTree, gardenPine } from './kit/trees'

/** The hall turns its open bay toward the default camera so a large tree is never behind a post. */
const RY = 0.42

/** Hall-local (x, z) to world. */
function local(x: number, z: number): [number, number] {
  return [x * Math.cos(RY) + z * Math.sin(RY), -x * Math.sin(RY) + z * Math.cos(RY)]
}

/** The stepping-stone path: a gentle S from the deck steps out into the moss, ending in nothing. */
function pathPoint(u: number): [number, number] {
  return [3.9 + u * 6.0, -1.9 - u * 6.0 + Math.sin(u * 5.2) * 1.4]
}

export function buildTeahouse(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const DECK = 0.55
  const groundAt = (x: number, z: number) => {
    const swell = warped(x * 2, z * 2, 0.08, 1.5) * 0.25
    return swell * rise(x, z, 3, 6) + rise(x, z, 16, 70) * warped(x, z, 0.012, 30) * 20 + rise(x, z, 70, 320) * warped(x + 40, z, 0.004, 80) * 60 - 0.05
  }
  group.add(terrain({ height: groundAt, palette: { low: '#2f4220', mid: '#43572a', high: '#6a6a40', rock: '#5d5a50' }, heightScale: 6, grain: 60 }))

  const b = new Batch()
  // The deck and its small roof, open on every side.
  hall(b, { x: 0, z: 0, ry: RY, w: 2.6, d: 2.6, floor: DECK, h: 2.4, walls: {}, timber: 'hinoki' })
  for (let k = 0; k < 2; k++) {
    const [sx, sz] = local(3.15 + k * 0.42, 0)
    b.add('paleStone', beam(1.1, 0.16, 0.42), at(sx, (DECK * (2 - k)) / 3 - 0.08, sz, RY + Math.PI / 2))
  }
  const [fx, fz] = local(3.95, 0)
  b.add('paleStone', boulder(3, 0.5, 0.35), at(fx, groundAt(fx, fz) - 0.05, fz))

  // Stepping stones: spaced a stride apart, stopping short in the moss.
  const n = 14
  for (let i = 1; i < n; i++) {
    const [x, z] = pathPoint(i / n)
    const s = rng.range(0.22, 0.32)
    b.add('paleStone', boulder(20 + i, s, 0.32), at(x, groundAt(x, z) - s * 0.12, z, rng.range(0, 6)))
  }

  // Mossy rocks and a small lantern along the path.
  const rocks: [number, number, number][] = [[-3.2, -2.6, 0.6], [-2.4, 3.1, 0.4], [4.8, -4.6, 0.5], [7.6, 1.8, 0.7], [-5.5, -5, 0.8]]
  rocks.forEach(([x, z, s], i) => stone(b, x, groundAt(x, z) - 0.05, z, s, 60 + i, 0.6, 'mossStone', rng.range(0, 6)))
  const lp = lantern(b, 5.6, -3.0, -0.6, 0.6, groundAt(5.6, -3.0))
  group.add(halo(lp, '#ffb35c', 0.9, 0.8))
  const l = ctx.lights[0]
  if (l) {
    l.position.copy(lp).add(new Vector3(0, 0.05, 0))
    l.color.set('#ffae5a')
    l.distance = 5
    l.userData.base = 1.2
  }

  // Autumn maples and garden pines closing the garden.
  const trees: [number, number, number, string][] = [[-5.8, -7.2, 6, 'mapleRed'], [1.5, -10, 7, 'mapleLeaf'], [9.5, -6.5, 5.5, 'mapleGold'], [-9, 2, 6, 'mapleLeaf']]
  for (const [x, z, h, leaf] of trees) broadTree(b, rng, x, groundAt(x, z), z, { height: h, leaf, spread: 0.6, puffs: 8 })
  gardenPine(b, rng, -4.6, groundAt(-4.6, 1.2), 1.2, 3.4)
  gardenPine(b, rng, 8.2, groundAt(8.2, -1.2), -1.2, 4)
  for (let i = 0; i < 14; i++) {
    const a = rng.range(Math.PI * 0.9, Math.PI * 2.1)
    const r = rng.range(20, 36)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    broadTree(b, rng, x, groundAt(x, z), z, { height: rng.range(8, 13), leaf: i % 3 === 0 ? 'mapleLeaf' : 'darkLeaf', spread: 0.45, puffs: 5 })
  }

  for (const m of b.build(resolver(mats))) group.add(m)

  // Frosted autumn grasses, bowed, kept off the deck and the stepping stones.
  const nearPath = (x: number, z: number) => {
    for (let i = 1; i < n; i++) {
      const [px, pz] = pathPoint(i / n)
      if (Math.hypot(x - px, z - pz) < 0.45)
        return true
    }
    return false
  }
  group.add(grass({
    count: ctx.quality === 'high' ? 42000 : 11000,
    inner: 3.7,
    outer: 26,
    height: [0.25, 0.6],
    base: '#4d4a2c',
    tip: '#b9a472',
    frost: 0.6,
    groundAt,
    accept: (x, z) => !nearPath(x, z) && Math.hypot(x - fx, z - fz) > 0.9,
    uTime: ctx.uniforms.uTime,
    uWind: ctx.uniforms.uWind,
  }, rng.fork('grass')))

  return {
    group,
    floorY: DECK,
    groundAt,
    fallSource: { centre: new Vector3(-1, 0, -6), radius: 7, height: 6 },
    dispose: () => disposeGroup(group),
  }
}
