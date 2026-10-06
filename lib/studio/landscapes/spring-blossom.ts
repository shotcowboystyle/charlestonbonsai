/**
 * Spring Blossom Garden, Peak Bloom: cherry trees exploding white and pink
 * around a still pond that mirrors them, two islands joined to the shore by
 * curved bridges, and petals carpeting the lawn under every canopy.
 */
import type { Rng } from '../bonsai/rng'
import type { LandscapeContext, LandscapeInstance } from './types'
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group, Mesh, MeshStandardMaterial, Shape, ShapeGeometry, Vector3 } from 'three'
import { Batch } from './kit/batch'
import { halo } from './kit/glow'
import { grass } from './kit/grass'
import { rise, smoothstep, vnoise, warped } from './kit/noise'
import { archBridge, lantern, stone } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { terrain } from './kit/terrain'
import { broadTree, canopyMaterial } from './kit/trees'
import { stillWater } from './kit/water'

const POND: [number, number] = [0, -15]
const ISLANDS: [number, number, number][] = [[-3.5, -15, 2], [4, -16, 1.8]]
const WATER_Y = -0.12

function pondRadius(th: number): number {
  const ex = 10 * 5.5 / Math.hypot(5.5 * Math.cos(th), 10 * Math.sin(th))
  return ex + Math.sin(th * 3 + 1.2) * 0.5 + (vnoise(th * 1.9, 7.1) - 0.5) * 0.7
}

/** One merged mesh of small petal cards scattered by density around canopies. */
function petalCarpet(rng: Rng, count: number, spots: [number, number, number][], groundAt: (x: number, z: number) => number, inPond: (x: number, z: number) => number): Mesh {
  const pos: number[] = []
  const col: number[] = []
  const pink = new Color('#f2c3d0')
  const white = new Color('#f7eef0')
  const c = new Color()
  for (let i = 0; i < count; i++) {
    const [sx, sz, sr] = spots[i % spots.length] as [number, number, number]
    const a = rng.range(0, Math.PI * 2)
    const r = Math.sqrt(rng.next()) * sr
    const x = sx + Math.cos(a) * r
    const z = sz + Math.sin(a) * r
    if (inPond(x, z) > 0.05 || Math.hypot(x, z) < 0.5)
      continue
    const y = groundAt(x, z) + 0.012
    const s = rng.range(0.007, 0.012)
    const t = rng.range(0, Math.PI)
    const ca = Math.cos(t) * s
    const sa = Math.sin(t) * s
    pos.push(x - ca, y, z - sa, x + sa * 0.6, y, z - ca * 0.6, x + ca, y, z + sa, x - ca, y, z - sa, x + ca, y, z + sa, x - sa * 0.6, y, z + ca * 0.6)
    c.copy(pink).lerp(white, rng.next() ** 2)
    for (let k = 0; k < 6; k++) col.push(c.r, c.g, c.b)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3))
  g.computeVertexNormals()
  const mesh = new Mesh(g, new MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: DoubleSide }))
  mesh.receiveShadow = true
  mesh.name = 'petals'
  return mesh
}

export function buildSpringBlossom(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const inPond = (x: number, z: number) => {
    const dx = x - POND[0]
    const dz = z - POND[1]
    return smoothstep(pondRadius(Math.atan2(dz, dx)) + 0.7, pondRadius(Math.atan2(dz, dx)) - 0.6, Math.hypot(dx, dz))
  }
  const island = (x: number, z: number) => Math.max(...ISLANDS.map(([ix, iz, ir]) => smoothstep(ir + 0.5, ir * 0.3, Math.hypot(x - ix, z - iz))))
  const groundAt = (x: number, z: number) => {
    const hills = rise(x, z, 18, 70) * warped(x, z, 0.012, 30) * 18 + rise(x, z, 70, 320) * warped(x + 40, z, 0.004, 80) * 55
    return hills - inPond(x, z) * 0.7 + island(x, z) * 0.95
  }
  group.add(terrain({ height: groundAt, palette: { low: '#4f5a33', mid: '#6d7445', high: '#8a8a5a', rock: '#6b665c' }, heightScale: 8, grain: 45 }))

  const shape = new Shape()
  for (let i = 0; i <= 120; i++) {
    const th = (i / 120) * Math.PI * 2
    const R = pondRadius(th) + 0.3
    const x = POND[0] + Math.cos(th) * R
    const z = POND[1] + Math.sin(th) * R
    if (i === 0)
      shape.moveTo(x, -z)
    else shape.lineTo(x, -z)
  }
  group.add(stillWater({ geometry: new ShapeGeometry(shape, 4), y: WATER_Y, deep: '#0d1416', clarity: 0.2, resolution: ctx.quality === 'high' ? 0.5 : 0.35 }))

  const b = new Batch()
  // Curved bridges: shore to the first island, then island to island.
  archBridge(b, -3.5, -11.3, Math.PI / 2, 3.6, 1.3, 0.7, WATER_Y + 0.12)
  archBridge(b, 0.25, -15.6, -0.12, 4.6, 1.3, 0.8, WATER_Y + 0.12)

  // Cherries in peak bloom: on the islands, around the shore, and a ring behind.
  const trees: [number, number, number][] = [
    [-3.7, -15.3, 6],
    [4.2, -16.3, 5.5],
    [-8.5, -9, 7],
    [8.5, -9.5, 7.5],
    [-12, -16, 8.5],
    [12, -17, 8],
    [-1, -23, 9],
    [7, -23.5, 8.5],
    [-5.8, -3.5, 5],
    [6.4, -4.8, 5.5],
    [-6, 4, 6],
    [6.5, 3.5, 5.5],
    [-14, -4, 7],
    [14, -2, 7],
  ]
  const spots: [number, number, number][] = []
  trees.forEach(([x, z, h], i) => {
    broadTree(b, rng, x, groundAt(x, z), z, { height: h, leaf: i % 3 === 1 ? 'blossomWhite' : 'blossomPink', bark: 'charred', spread: 0.75, puffs: 10, flat: 0.72 })
    spots.push([x, z, h * 0.75])
  })
  for (let i = 0; i < 20; i++) {
    const a = rng.range(Math.PI * 0.85, Math.PI * 2.15)
    const r = rng.range(20, 36)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    broadTree(b, rng, x, groundAt(x, z), z, { height: rng.range(7, 11), leaf: i % 4 === 0 ? 'greenLeaf' : i % 2 ? 'blossomWhite' : 'blossomPink', bark: 'charred', spread: 0.55, puffs: 6 })
  }
  spots.push([0, 0, 2.5], [0, 0, 2.5], [0, 0, 4], [0, 0, 4], [-2, -3, 4], [2, -3, 4], [0, -6, 6])

  // Stones along the shore and a lantern by the first bridge.
  const rocks: [number, number, number][] = [[-5.6, -9.6, 0.5], [4.8, -9.8, 0.45], [-1.4, -9.4, 0.35], [9.2, -13.5, 0.6], [-9.8, -13, 0.55], [2.4, -3.6, 0.3]]
  rocks.forEach(([x, z, s], i) => stone(b, x, groundAt(x, z) - 0.08, z, s, 70 + i, 0.6, 'mossStone', rng.range(0, 6)))
  const lamp = lantern(b, -5, -9.2, 0.5, 0.85, groundAt(-5, -9.2))
  group.add(halo(lamp, '#ffb35c', 1.3, 0.85))
  const l = ctx.lights[0]
  if (l) {
    l.position.copy(lamp)
    l.color.set('#ffae5a')
    l.distance = 6
    l.userData.base = 1.4
  }

  for (const m of b.build(resolver(mats, {
    blossomPink: () => canopyMaterial('#ffb0c6'),
    blossomWhite: () => canopyMaterial('#fff3f5'),
  }))) group.add(m)
  group.add(petalCarpet(rng.fork('petals'), ctx.quality === 'high' ? 22000 : 8000, spots, groundAt, inPond))

  group.add(grass({
    count: ctx.quality === 'high' ? 26000 : 7000,
    inner: 3,
    outer: 26,
    height: [0.04, 0.1],
    base: '#2f3d1c',
    tip: '#80894a',
    groundAt,
    accept: (x, z) => inPond(x, z) < 0.05,
    uTime: ctx.uniforms.uTime,
    uWind: ctx.uniforms.uWind,
  }, rng.fork('grass')))

  return {
    group,
    floorY: groundAt(0, 0),
    groundAt,
    fallSource: { centre: new Vector3(0, 0, -6), radius: 12, height: 8 },
    dispose: () => disposeGroup(group),
  }
}
