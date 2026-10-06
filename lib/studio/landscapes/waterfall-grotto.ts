/**
 * Waterfall Grotto Alcove: a stone cavern whose mossy walls and overhang
 * arch around the display, a waterfall falling past the cavern mouth into a
 * foaming pool, ferns dripping from every ledge, moss over everything, and a
 * second natural stone seat worn smooth by devoted monks.
 */
import type { BufferGeometry } from 'three'
import type { LandscapeContext, LandscapeInstance } from './types'
import { Box3, CircleGeometry, Group, Matrix4, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { at, Batch } from './kit/batch'
import { rise, smoothstep, warped } from './kit/noise'
import { stone } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { boulder } from './kit/shapes'
import { terrain } from './kit/terrain'
import { cryptomeria } from './kit/trees'
import { sheetMesh, streamMaterial, waterfallMaterial } from './kit/water'

const POOL: [number, number] = [-1.3, -2.1]

/** A fern clump: arching fronds of paired leaflets, base at the origin. */
function fernClump(seed: number, size: number): BufferGeometry {
  const parts: BufferGeometry[] = []
  const fronds = 6
  for (let f = 0; f < fronds; f++) {
    const az = (f / fronds) * Math.PI * 2 + seed
    const len = size * (0.75 + ((f * 7 + seed * 13) % 5) / 10)
    const steps = 12
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const r = len * t
      const y = len * (0.9 * t - 0.75 * t * t)
      const w = len * 0.22 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 0.004
      for (const side of [-1, 1]) {
        const leaf = new PlaneGeometry(w, w * 0.32)
        leaf.translate(side * w * 0.5, 0, 0)
        const m = new Matrix4().makeRotationY(-az).multiply(new Matrix4().makeRotationX(-Math.PI / 2 + 0.5 - t * 0.9))
        m.setPosition(Math.cos(az) * r, y, Math.sin(az) * r)
        leaf.applyMatrix4(m)
        parts.push(leaf)
      }
    }
  }
  const g = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  if (!g)
    throw new Error('fern merge failed')
  return g
}

export function buildWaterfallGrotto(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const poolDip = (x: number, z: number) => smoothstep(1.6, 0.8, Math.hypot(x - POOL[0], z - POOL[1]))
  const groundAt = (x: number, z: number) => {
    const hills = rise(x, z, 9, 40) * warped(x, z, 0.02, 20) * 18 + rise(x, z, 40, 260) * warped(x + 70, z, 0.005, 60) * 70
    return hills - poolDip(x, z) * 0.45
  }
  group.add(terrain({ height: groundAt, palette: { low: '#1d2a14', mid: '#2c3b1c', high: '#3e4a26', rock: '#3a3833' }, heightScale: 10, grain: 50 }))

  const b = new Batch()
  // Cavern: a back wall, side walls and an overhang arching above the display.
  const walls: [number, number, number, number, number][] = [
    // x, z, size, flat, y-offset
    [-2.6, -4.4, 1.7, 1.5, -0.4],
    [0.2, -4.8, 1.9, 1.6, -0.4],
    [2.6, -4.2, 1.7, 1.45, -0.4],
    [4.3, -2.6, 1.4, 1.6, -0.3],
    [3.4, -0.4, 1.3, 1.5, -0.3],
    [3.6, 1.5, 1.1, 1.3, -0.3],
    [-4.6, -2.8, 1.5, 1.7, -0.4],
    [-4.9, 0.1, 1.3, 1.5, -0.3],
    [-4.4, 1.9, 1.0, 1.3, -0.3],
  ]
  walls.forEach(([x, z, s, f, y], i) => b.add(i % 3 === 1 ? 'darkStone' : 'mossStone', boulder(11 + i, s, f), at(x, y, z, rng.range(0, 6))))
  const roof: [number, number, number][] = [[-2.6, -2.2, 2.0], [0, -2.6, 2.3], [2.4, -1.8, 2.0], [-0.6, -0.4, 1.8], [1.6, 0.4, 1.6], [-3.4, 0.6, 1.5]]
  roof.forEach(([x, z, s], i) => b.add(i % 2 ? 'darkStone' : 'mossStone', boulder(31 + i, s, 0.55), at(x, 3.7 + i * 0.08, z, rng.range(0, 6), 0, Math.PI)))
  for (let i = 0; i < 14; i++) {
    const a = rng.range(Math.PI * 0.85, Math.PI * 2.15)
    const r = rng.range(2.4, 4.3)
    stone(b, Math.cos(a) * r, 0, Math.sin(a) * r, rng.range(0.25, 0.6), 50 + i, 0.55, 'mossStone', rng.range(0, 6))
  }
  // Moss carpets the floor between the stones.
  for (let i = 0; i < 9; i++) {
    const pad = new CircleGeometry(rng.range(0.6, 1.3), 14)
    pad.rotateX(-Math.PI / 2)
    const a = rng.range(0, Math.PI * 2)
    const r = rng.range(1.4, 3.6)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (poolDip(x, z) > 0.05)
      continue
    b.add('moss', pad, at(x, groundAt(x, z) + 0.015, z, rng.range(0, 6)))
  }

  // The second stone seat, worn smooth and flat on top.
  b.add('paleStone', boulder(77, 0.55, 0.38, 3), at(1.9, -0.05, -1.3, 0.4))

  // Ferns cling to ledges and drip over the pool.
  const fernSpots: [number, number, number][] = []
  walls.forEach(([x, z, sz, f, y]) => {
    const l = Math.hypot(x, z)
    const dx = -x / l
    const dz = -z / l
    fernSpots.push([x + dx * sz * 1.05, groundAt(x + dx * sz, z + dz * sz), z + dz * sz * 1.05])
    fernSpots.push([x + dx * sz * 0.8, y + sz * f * 0.75, z + dz * sz * 0.8])
  })
  roof.forEach(([x, z, sz]) => fernSpots.push([x, 3.55, z + sz * 0.75]))
  for (const [x, y, z] of fernSpots) {
    if (Math.hypot(x, z) < 1.3 && y < 1)
      continue
    const down = y > 2
    const g = fernClump(rng.range(0, 6), rng.range(0.55, 0.95))
    if (down)
      g.rotateX(Math.PI * 0.85)
    b.add('fern', g, at(x, y, z, rng.range(0, 6)))
  }

  // Ancient trees beyond the cavern mouth, quiet in the mist.
  for (let i = 0; i < 18; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = rng.range(12, 30)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    cryptomeria(b, rng, x, groundAt(x, z), z, rng.range(14, 22))
  }
  for (const m of b.build(resolver(mats))) group.add(m)

  // The waterfall: a curved sheet from the overhang lip down into the pool.
  const fallGeo = new PlaneGeometry(1.1, 4.2, 10, 24)
  const p = fallGeo.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const t = (2.1 - y) / 4.2
    p.setZ(i, Math.sin((x / 1.1 + 0.5) * Math.PI) * 0.12 + t * t * 0.45)
  }
  fallGeo.computeVertexNormals()
  const sheet = sheetMesh(fallGeo, mats.own('falls', waterfallMaterial))
  sheet.position.set(POOL[0] - 0.1, 2.0, POOL[1] - 0.75)
  sheet.rotation.y = 0.25
  group.add(sheet)

  const poolGeo = new CircleGeometry(1.25, 32)
  poolGeo.rotateX(-Math.PI / 2)
  const pool = sheetMesh(poolGeo, mats.own('pool', () => streamMaterial('#0b181a', [0.3, 1], 0.4)))
  pool.position.set(POOL[0], -0.18, POOL[1])
  group.add(pool)
  // Foam where the fall strikes the pool.
  const foamMat = mats.own('foam', () => new MeshStandardMaterial({ color: '#e9efee', roughness: 0.9, transparent: true, opacity: 0.7, depthWrite: false }))
  const fb = new Batch()
  for (let i = 0; i < 9; i++) {
    const g = boulder(90 + i, rng.range(0.18, 0.34), 0.25, 1)
    fb.add('foam', g, at(POOL[0] - 0.1 + rng.gauss() * 0.3, -0.22, POOL[1] - 0.35 + rng.gauss() * 0.25))
  }
  for (const m of fb.build(() => foamMat, { castShadow: false })) group.add(m)

  return {
    group,
    floorY: 0,
    groundAt,
    fallSource: { centre: new Vector3(0, 0, -1), radius: 4, height: 3.5 },
    emitters: { spray: new Vector3(POOL[0] - 0.1, 0.1, POOL[1] - 0.4) },
    // The overhang keeps rain and snow off the display.
    shelter: new Box3(new Vector3(-4.2, -1, -4.6), new Vector3(3.8, 3.6, 1.2)),
    dispose: () => disposeGroup(group),
  }
}
