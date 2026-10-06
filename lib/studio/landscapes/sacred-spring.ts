/**
 * Sacred Spring Pool: clear water welling from a mossy rock into a pool so
 * transparent its stone bed shows, coins glimmering beneath the surface, a
 * torii placed to stand reflected in the water from the display, ancient
 * cryptomeria all around, a weathered spirit house, and a shimenawa rope
 * hung with paper shide across the gate.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { CatmullRomCurve3, CylinderGeometry, Group, PlaneGeometry, Shape, ShapeGeometry, TubeGeometry, Vector3 } from 'three'
import { at, Batch } from './kit/batch'
import { halo } from './kit/glow'
import { grass } from './kit/grass'
import { rise, smoothstep, vnoise, warped } from './kit/noise'
import { lantern, spiritHouse, stone, torii } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { terrain } from './kit/terrain'
import { cryptomeria } from './kit/trees'
import { sheetMesh, stillWater, waterfallMaterial } from './kit/water'

// Laid out along the default view (camera azimuth 0.42): pool, then the gate, on one line.
const FWD: [number, number] = [-Math.sin(0.42), -Math.cos(0.42)]
const RIGHT: [number, number] = [Math.cos(0.42), -Math.sin(0.42)]
const along = (d: number, side = 0): [number, number] => [FWD[0] * d + RIGHT[0] * side, FWD[1] * d + RIGHT[1] * side]
const POOL = along(5.3, 0.3)
const GATE = along(10.8)
const WATER_Y = -0.1
const pondR = (th: number) => 2.9 + Math.sin(th * 2 + 1.1) * 0.45 + Math.sin(th * 3 + 0.4) * 0.3 + (vnoise(th * 1.9, 7.7) - 0.5) * 0.4

export function buildSacredSpring(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const inPool = (x: number, z: number) => {
    const dx = x - POOL[0]
    const dz = z - POOL[1]
    return smoothstep(pondR(Math.atan2(dz, dx)) + 0.4, pondR(Math.atan2(dz, dx)) - 0.7, Math.hypot(dx, dz))
  }
  const groundAt = (x: number, z: number) => {
    const hills = rise(x, z, 14, 60) * warped(x, z, 0.015, 24) * 16 + rise(x, z, 60, 300) * warped(x + 40, z, 0.004, 70) * 70
    return hills - inPool(x, z) * 0.62
  }
  group.add(terrain({ height: groundAt, palette: { low: '#2b2f22', mid: '#33401f', high: '#46502b', rock: '#4a4741' }, heightScale: 8, grain: 50 }))

  // The pool: crystal-clear over its stone bed.
  const shape = new Shape()
  for (let i = 0; i <= 80; i++) {
    const th = (i / 80) * Math.PI * 2
    const r = pondR(th) + 0.3
    const x = POOL[0] + Math.cos(th) * r
    const z = POOL[1] + Math.sin(th) * r
    if (i === 0)
      shape.moveTo(x, -z)
    else shape.lineTo(x, -z)
  }
  group.add(stillWater({ geometry: new ShapeGeometry(shape, 4), y: WATER_Y, deep: '#0c2626', clarity: 0.86, resolution: ctx.quality === 'high' ? 0.5 : 0.35 }))

  const b = new Batch()
  // Pebbles and coins on the bed, seen through the water.
  for (let i = 0; i < (ctx.quality === 'high' ? 150 : 80); i++) {
    const th = rng.range(0, Math.PI * 2)
    const r = Math.sqrt(rng.next()) * (pondR(th) - 0.75)
    const x = POOL[0] + Math.cos(th) * r
    const z = POOL[1] + Math.sin(th) * r
    stone(b, x, groundAt(x, z) - 0.02, z, rng.range(0.05, 0.16), 400 + i, 0.5, i % 3 ? 'paleStone' : 'stone', rng.range(0, 6))
  }
  for (let i = 0; i < 46; i++) {
    const th = rng.range(0, Math.PI * 2)
    const r = Math.sqrt(rng.next()) * (pondR(th) - 0.6)
    const x = POOL[0] + Math.cos(th) * r
    const z = POOL[1] + Math.sin(th) * r
    b.add('gold', new CylinderGeometry(0.012, 0.012, 0.0025, 14), at(x, groundAt(x, z) + 0.03, z, rng.range(0, 6), rng.range(-0.3, 0.3), rng.range(-0.3, 0.3)))
  }
  // Mossy stones ring the pool; the spring rock rises at the back.
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * Math.PI * 2 + rng.range(-0.2, 0.2)
    const r = pondR(th) + rng.range(0.35, 0.8)
    const x = POOL[0] + Math.cos(th) * r
    const z = POOL[1] + Math.sin(th) * r
    if (Math.hypot(x, z) < 1.5)
      continue
    stone(b, x, groundAt(x, z) - 0.1, z, rng.range(0.25, 0.55), 450 + i, 0.6, 'mossStone', rng.range(0, 6))
  }
  const [sx, sz] = along(7.9, -2.4)
  const SPRING = new Vector3(sx, 0, sz)
  stone(b, SPRING.x, groundAt(SPRING.x, SPRING.z) - 0.4, SPRING.z, 1.35, 7, 1.15, 'mossStone', 0.6)
  stone(b, SPRING.x + 1.2, groundAt(SPRING.x + 1.2, SPRING.z - 0.6) - 0.3, SPRING.z - 0.6, 0.8, 8, 0.9, 'darkStone', 1.8)

  // The torii, placed so its reflection lies in the pool from the display.
  torii(b, GATE[0], GATE[1], 0.42, 1.15)
  // Shimenawa across the gate with zigzag paper shide.
  const ropeY = 2.62 * 1.15
  const gate = (u: number, y: number) => new Vector3(GATE[0] + RIGHT[0] * u - FWD[0] * 0.15, y, GATE[1] + RIGHT[1] * u - FWD[1] * 0.15)
  const rope = new CatmullRomCurve3([-1.5, -0.75, 0, 0.75, 1.5].map(u => gate(u, ropeY - 0.22 * (1 - (u / 1.5) ** 2))))
  b.add('straw', new TubeGeometry(rope, 24, 0.055, 8), at(0, 0, 0))
  for (const u of [-0.9, 0, 0.9]) {
    const y0 = ropeY - 0.22 * (1 - (u / 1.5) ** 2) - 0.06
    for (let k = 0; k < 4; k++) {
      const p = gate(u + (k % 2 ? 0.035 : -0.035), y0 - 0.06 - k * 0.1)
      b.add('paper', new PlaneGeometry(0.07, 0.11), at(p.x, p.y, p.z, 0.42))
    }
  }

  // Spirit house and a stone lantern for the night.
  const [hx, hz] = along(4.2, 3.6)
  spiritHouse(b, hx, groundAt(hx, hz), hz, -0.2, 1)
  const [lx, lz] = along(3.4, -3.2)
  const lamp = lantern(b, lx, lz, 0.5, 0.85, groundAt(lx, lz))
  group.add(halo(lamp, '#ffb35c', 1.2, 0.85))
  const l = ctx.lights[0]
  if (l) {
    l.position.copy(lamp)
    l.color.set('#ffae5a')
    l.distance = 6
    l.userData.base = 1.4
  }

  // Ancient cryptomeria all round, leaving the gate's sight line open.
  for (let i = 0; i < (ctx.quality === 'high' ? 34 : 22); i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = rng.range(6.5, 26)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const d = x * FWD[0] + z * FWD[1]
    if (Math.abs(x * RIGHT[0] + z * RIGHT[1]) < 3.4 && d > 1.5 && d < 15)
      continue
    if (inPool(x, z) > 0)
      continue
    cryptomeria(b, rng, x, groundAt(x, z), z, rng.range(20, 32))
  }
  // Cryptomeria bark is a deep red-brown; borrow the oiled keyaki for the trunks.
  for (const m of b.build(resolver(mats, { straw: () => mats.get('thatch'), sugi: () => mats.get('keyaki') }))) group.add(m)

  // Clear water emerging from the rock: a small trickle into the pool.
  const trickle = new PlaneGeometry(0.22, 1.3, 2, 8)
  const tp = trickle.getAttribute('position')
  for (let i = 0; i < tp.count; i++) tp.setZ(i, ((0.65 - tp.getY(i)) / 1.3) ** 2 * 0.35)
  trickle.computeVertexNormals()
  const sheet = sheetMesh(trickle, mats.own('trickle', waterfallMaterial))
  sheet.position.set(SPRING.x + 0.75, 0.55, SPRING.z + 0.95)
  sheet.rotation.y = 0.35
  group.add(sheet)

  group.add(grass({
    count: ctx.quality === 'high' ? 22000 : 6000,
    inner: 1.6,
    outer: 22,
    height: [0.06, 0.18],
    base: '#1f2a16',
    tip: '#5d6a33',
    groundAt,
    accept: (x, z) => inPool(x, z) < 0.02,
    uTime: ctx.uniforms.uTime,
    uWind: ctx.uniforms.uWind,
  }, rng.fork('grass')))

  return {
    group,
    floorY: 0,
    groundAt,
    dispose: () => disposeGroup(group),
  }
}
