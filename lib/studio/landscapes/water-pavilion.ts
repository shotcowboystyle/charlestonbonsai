/**
 * Zen Garden Water Pavilion: a timber pavilion standing over a stream, its
 * plank floor open in gaps so the water shows through, stones set in the
 * current with foam trailing them, trees arching over so the key light
 * dapples the deck, and moss on every bank.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { at, Batch } from './kit/batch'
import { roofGeometry } from './kit/buildings'
import { halo } from './kit/glow'
import { grass } from './kit/grass'
import { rise, smoothstep, warped } from './kit/noise'
import { lantern, stone } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { beam, post } from './kit/shapes'
import { terrain } from './kit/terrain'
import { broadTree, gardenPine } from './kit/trees'
import { streamMaterial } from './kit/water'

const HW = 1.6
const WATER_Y = -0.35
const DECK_Y = 0.42

/** Stream centreline: winds, but passes through the origin under the pavilion. */
function centre(x: number): number {
  return 2.2 * Math.sin(0.12 * x) + 3 * (Math.sin(0.05 * x + 1) - Math.sin(1))
}

function ribbon(x0: number, x1: number, n: number, width: number): BufferGeometry {
  const pos: number[] = []
  const nrm: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    const c = centre(x)
    pos.push(x, WATER_Y, c - width / 2, x, WATER_Y, c + width / 2)
    nrm.push(0, 1, 0, 0, 1, 0)
    if (i < n) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nrm), 3))
  g.setIndex(idx)
  return g
}

export function buildWaterPavilion(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const channel = (x: number, z: number) => smoothstep(HW + 1.3, HW - 0.3, Math.abs(z - centre(x)))
  const groundAt = (x: number, z: number) => {
    const hills = rise(x, z, 14, 60) * warped(x, z, 0.012, 30) * 16 + rise(x, z, 60, 300) * warped(x - 70, z, 0.004, 80) * 50
    return 0.05 + hills - channel(x, z) * 1.0
  }
  group.add(terrain({ height: groundAt, palette: { low: '#25351a', mid: '#34471f', high: '#4f5c2c', rock: '#4c4b42' }, heightScale: 6, grain: 50 }))

  const water = new Mesh(ribbon(-70, 70, 280, HW * 2 + 0.9), streamMaterial('#173232', [1, 0], 0.35))
  water.receiveShadow = true
  water.renderOrder = 1
  water.name = 'stream'
  group.add(water)

  const b = new Batch()
  // Plank floor spanning the stream, with real gaps between boards.
  const pw = 0.13
  const gap = 0.04
  for (let x = -2.2; x <= 2.2 - pw; x += pw + gap) b.add('sugi', beam(pw, 0.05, 3.9), at(x + pw / 2, DECK_Y - 0.025, 0))
  for (const z of [-1.7, 0, 1.7]) b.add('aged', beam(4.6, 0.12, 0.14), at(0, DECK_Y - 0.11, z))
  for (const x of [-2.15, 0, 2.15]) {
    for (const z of [-1.75, 1.75]) b.add('aged', post(0.08, DECK_Y + 1.1, 10), at(x, -1.1, z))
  }
  // Low rail along the sides, worn smooth.
  for (const z of [-1.9, 1.9]) {
    b.add('aged', beam(4.4, 0.06, 0.07), at(0, DECK_Y + 0.42, z))
    for (const x of [-2.15, -1.08, 0, 1.08, 2.15]) b.add('aged', beam(0.07, 0.42, 0.07), at(x, DECK_Y + 0.21, z))
  }
  // Roof over the back half only, so the front of the deck takes the dappled light.
  for (const x of [-2.1, 2.1]) {
    for (const z of [-1.8, -0.35]) b.add('aged', post(0.085, 2.65, 10), at(x, DECK_Y, z))
  }
  b.add('aged', beam(4.5, 0.18, 0.16), at(0, DECK_Y + 2.6, -1.8))
  b.add('aged', beam(4.5, 0.18, 0.16), at(0, DECK_Y + 2.6, -0.35))
  b.add('roof', roofGeometry({ w: 2.3, d: 0.85, overhang: 0.55, yEave: DECK_Y + 2.7, yRidge: DECK_Y + 3.55, ridge: 0.7 }), at(0, 0, -1.08))

  // Stones set in the current, with foam trailing downstream.
  const foam: [number, number, number][] = []
  for (let i = 0; i < 22; i++) {
    const x = (i < 11 ? -14 : 3) + (i % 11) * 1.05 + rng.range(-0.3, 0.3)
    if (Math.abs(x) < 2.8)
      continue
    const z = centre(x) + Math.sin(i * 1.7) * HW * 0.6
    const s = rng.range(0.22, 0.5)
    stone(b, x, WATER_Y - s * 0.35, z, s, 90 + i, 0.75, i % 3 ? 'mossStone' : 'darkStone', rng.range(0, 6))
    foam.push([x + s * 1.1, z, s])
  }
  for (const [x, z, s] of foam) {
    const f = new PlaneGeometry(s * 2.2, s * 0.7)
    f.rotateX(-Math.PI / 2)
    b.add('foam', f, at(x, WATER_Y + 0.006, z, rng.range(-0.15, 0.15)))
  }

  // Trees arching over the pavilion and banks; mossy rocks and ferns along the water.
  const over: [number, number, number][] = [[-3.6, 3.6, 8], [3.2, -4.2, 9], [-4.3, -4.6, 7.5], [4.6, 3.4, 7]]
  for (const [x, z, h] of over) broadTree(b, rng, x, groundAt(x, z), z, { height: h, leaf: 'greenLeaf', spread: 0.8, puffs: 9 })
  for (let i = 0; i < 18; i++) {
    const a = rng.range(Math.PI * 0.8, Math.PI * 2.2)
    const r = rng.range(16, 34)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (channel(x, z) > 0.1)
      continue
    if (i % 4 === 0)
      gardenPine(b, rng, x, groundAt(x, z), z, rng.range(5, 8))
    else broadTree(b, rng, x, groundAt(x, z), z, { height: rng.range(8, 13), leaf: i % 2 ? 'darkLeaf' : 'greenLeaf', spread: 0.5, puffs: 6 })
  }
  for (let i = 0; i < 26; i++) {
    const x = rng.range(-16, 16)
    if (Math.abs(x) < 2.8)
      continue
    const side = rng.next() < 0.5 ? -1 : 1
    const z = centre(x) + side * (HW + rng.range(0.3, 1.4))
    stone(b, x, groundAt(x, z) - 0.06, z, rng.range(0.25, 0.6), 130 + i, 0.55, 'mossStone', rng.range(0, 6))
    for (let k = 0; k < 5; k++) {
      const fx = x + rng.range(-0.5, 0.5)
      const fz = z + rng.range(-0.4, 0.4)
      const frond = new PlaneGeometry(0.09, 0.42)
      frond.translate(0, 0.21, 0)
      b.add('fern', frond, at(fx, groundAt(fx, fz), fz, rng.range(0, 6.28), rng.range(-0.9, -0.4)))
    }
  }
  const lamp = lantern(b, -3.4, 2.4, 0.3, 0.75, groundAt(-3.4, 2.4))
  group.add(halo(lamp, '#ffb35c', 1.2, 0.85))
  const l = ctx.lights[0]
  if (l) {
    l.position.copy(lamp)
    l.color.set('#ffae5a')
    l.distance = 5
    l.userData.base = 1.3
  }

  for (const m of b.build(resolver(mats, {
    foam: () => new MeshStandardMaterial({ color: '#e9efee', roughness: 0.5, transparent: true, opacity: 0.5, depthWrite: false }),
  }))) group.add(m)

  group.add(grass({
    count: ctx.quality === 'high' ? 30000 : 8000,
    inner: 2.6,
    outer: 24,
    height: [0.05, 0.14],
    base: '#1f2e14',
    tip: '#5f7034',
    groundAt,
    accept: (x, z) => channel(x, z) < 0.05,
    uTime: ctx.uniforms.uTime,
    uWind: ctx.uniforms.uWind,
  }, rng.fork('grass')))

  return {
    group,
    floorY: DECK_Y,
    groundAt,
    fallSource: { centre: new Vector3(0, 0, 0), radius: 6, height: 7 },
    dispose: () => disposeGroup(group),
  }
}
