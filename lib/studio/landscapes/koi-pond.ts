/**
 * Koi Pond Garden: black water that mirrors the sky, a vermilion arch
 * bridge, gold and white koi gliding beneath lily pads, a stone lantern
 * glowing amber at the water's edge, a dense bamboo grove behind, and
 * moss-covered rocks framing the timber meditation platform the display
 * stands on.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { DoubleSide, Group, MeshStandardMaterial, Shape, ShapeGeometry, Vector3 } from 'three'
import { bloomGeometry } from '../bonsai/leaves'
import { at, Batch } from './kit/batch'
import { halo } from './kit/glow'
import { grass } from './kit/grass'
import { koi, lilyPadGeometry, lilyPads } from './kit/koi'
import { rise, smoothstep, vnoise, warped } from './kit/noise'
import { archBridge, lantern, stone } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { beam, post } from './kit/shapes'
import { terrain } from './kit/terrain'
import { bambooGrove, broadTree, gardenPine } from './kit/trees'
import { stillWater } from './kit/water'

const POND: [number, number] = [0.5, -7]

function pondRadius(th: number): number {
  return 5.2 + Math.sin(th * 2 + 0.6) * 1.1 + Math.sin(th * 3 + 2.1) * 0.6 + (vnoise(th * 1.7, 3.3) - 0.5) * 0.8
}

export function buildKoiPond(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const WATER_Y = -0.14
  const pondDepth = (x: number, z: number) => {
    const dx = x - POND[0]
    const dz = z - POND[1]
    const r = Math.hypot(dx, dz)
    const R = pondRadius(Math.atan2(dz, dx))
    return smoothstep(R + 0.6, R - 0.8, r)
  }
  const groundAt = (x: number, z: number) => {
    const hills = rise(x, z, 16, 70) * warped(x, z, 0.012, 30) * 22 + rise(x, z, 70, 320) * warped(x - 50, z, 0.004, 80) * 60
    return hills - pondDepth(x, z) * 0.75
  }
  group.add(terrain({ height: groundAt, palette: { low: '#2c3a1e', mid: '#3d4d26', high: '#5b6335', rock: '#5c5a52' }, heightScale: 8, grain: 45 }))

  // Water: the pond outline as a reflector, black and still.
  const shape = new Shape()
  for (let i = 0; i <= 96; i++) {
    const th = (i / 96) * Math.PI * 2
    const R = pondRadius(th) + 0.25
    const x = POND[0] + Math.cos(th) * R
    const z = POND[1] + Math.sin(th) * R
    if (i === 0)
      shape.moveTo(x, -z)
    else shape.lineTo(x, -z)
  }
  group.add(stillWater({ geometry: new ShapeGeometry(shape, 4), y: WATER_Y, deep: '#05080a', clarity: 0.35, resolution: ctx.quality === 'high' ? 0.5 : 0.35 }))
  group.add(koi(rng.fork('koi'), ctx.quality === 'high' ? 14 : 8, POND, 3.6, WATER_Y - 0.22))

  const b = new Batch()
  const { pads, flowers } = lilyPads(rng.fork('lily'), 34, [POND[0] - 1.5, POND[1] + 0.5], 3.4, WATER_Y)
  for (const m of pads) b.add('lilyPad', lilyPadGeometry(), m)
  for (const m of flowers) b.add('lotus', bloomGeometry('flower', '#f3c9d6', '#f6e6a0').rotateX(-Math.PI / 2), m.clone().scale(new Vector3(2.2, 2.2, 2.2)))

  // The vermilion bridge across the far side of the pond.
  archBridge(b, POND[0] + 0.4, POND[1] - 1.2, 0.35, 8.6, 1.5, 1.25, WATER_Y + 0.05)

  // Meditation platform under the display, framed by mossy rocks.
  const deckY = 0.32
  b.add('hinoki', beam(3.2, 0.08, 3.0), at(0, deckY - 0.04, 0))
  for (const [x, z] of [[-1.5, -1.4], [1.5, -1.4], [-1.5, 1.4], [1.5, 1.4], [0, -1.4], [0, 1.4]]) b.add('aged', post(0.07, deckY, 8), at(x!, -0.2, z!))
  b.add('paleStone', beam(0.9, 0.18, 0.5), at(0.2, 0.09, 1.9))
  const rocks: [number, number, number][] = [[-2.3, -0.8, 0.7], [-2.0, 1.3, 0.45], [2.4, -1.6, 0.55], [2.7, 0.9, 0.38], [-4.2, -3.9, 0.85], [4.6, -3.2, 0.7], [-5.8, -8.5, 0.9], [6.2, -9.7, 0.6]]
  rocks.forEach(([x, z, s], i) => stone(b, x, groundAt(x, z) - 0.1, z, s, 40 + i, 0.6, 'mossStone', rng.range(0, 6)))

  // Lantern at the water's edge, glowing amber at dusk.
  const lamp = lantern(b, -3.6, -2.6, 0.4, 1, groundAt(-3.6, -2.6))
  group.add(halo(lamp, '#ffb35c', 1.4, 0.9))
  const l = ctx.lights[0]
  if (l) {
    l.position.copy(lamp).add(new Vector3(0, 0.05, 0))
    l.color.set('#ffae5a')
    l.distance = 6
    l.userData.base = 1.6
  }

  // Bamboo grove and garden trees behind.
  bambooGrove(b, rng.fork('bamboo'), 9, -14, 7, ctx.quality === 'high' ? 90 : 45, groundAt)
  bambooGrove(b, rng.fork('bamboo2'), -11, -10, 5, ctx.quality === 'high' ? 50 : 25, groundAt)
  gardenPine(b, rng, -6.5, groundAt(-6.5, -2.5), -2.5, 4.2)
  broadTree(b, rng, 7.5, groundAt(7.5, -3), -3, { height: 6, leaf: 'greenLeaf', spread: 0.55 })
  for (let i = 0; i < 16; i++) {
    const a = rng.range(Math.PI * 0.9, Math.PI * 2.1)
    const r = rng.range(22, 40)
    broadTree(b, rng, Math.cos(a) * r, groundAt(Math.cos(a) * r, Math.sin(a) * r), Math.sin(a) * r, { height: rng.range(8, 14), leaf: i % 2 ? 'darkLeaf' : 'greenLeaf', spread: 0.45, puffs: 5 })
  }

  for (const m of b.build(resolver(mats, {
    lilyPad: () => mats.get('fern'),
    lotus: () => new MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: DoubleSide }),
  }))) group.add(m)

  group.add(grass({
    count: ctx.quality === 'high' ? 40000 : 10000,
    inner: 2.2,
    outer: 26,
    height: [0.08, 0.22],
    base: '#22301a',
    tip: '#6b7a3a',
    groundAt,
    accept: (x, z) => pondDepth(x, z) < 0.05,
    uTime: ctx.uniforms.uTime,
    uWind: ctx.uniforms.uWind,
  }, rng.fork('grass')))

  return {
    group,
    floorY: deckY,
    groundAt: (x, z) => (Math.abs(x) < 1.6 && Math.abs(z) < 1.5 ? deckY : groundAt(x, z)),
    dispose: () => disposeGroup(group),
  }
}
