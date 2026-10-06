/**
 * Coastal Cliff Temple: a cliff-top terrace with a timber railing worn
 * smooth by countless hands, a small hall to one side, cherry trees giving
 * their petals to the ocean wind, and a 15 m drop to a churning sea where
 * black rock stacks stand in rings of white foam.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { Group, MeshStandardMaterial, RingGeometry, Vector3 } from 'three'
import { addNoise, addWorldVaryings, inject, patch } from '../shader'
import { weatherUniforms } from '../weather/cover'
import { at, Batch } from './kit/batch'
import { hall } from './kit/buildings'
import { halo } from './kit/glow'
import { grass } from './kit/grass'
import { fbm, rise, smoothstep, warped } from './kit/noise'
import { createOcean } from './kit/ocean'
import { lantern } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { beam, boulder, post } from './kit/shapes'
import { terrain } from './kit/terrain'
import { broadTree } from './kit/trees'

const SEA_Y = -14.5
const edgeZ = (x: number) => -2.3 + Math.sin(x * 0.13 + 0.7) * 0.9 + (fbm(x * 0.2, 4.1, 3) - 0.5) * 1.2

/** Sea foam: white, broken up by drifting noise so rings never read as discs. */
function foamMaterial(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: '#eef2f1', roughness: 0.85, transparent: true, opacity: 0.85, depthWrite: false })
  patch(m, 'cliff-foam', (sh) => {
    sh.uniforms.uTime = weatherUniforms.uTime
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform float uTime;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', 'diffuseColor.a *= smoothstep(0.42, 0.68, sFbm2(vSWPos.xz * 0.9 + vec2(uTime * 0.08, -uTime * 0.05)));')
  })
  return m
}

export function buildCoastalCliff(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const groundAt = (x: number, z: number) => {
    const e = edgeZ(x)
    const drop = smoothstep(e, e - 2.2, z)
    const face = drop * (1 - drop) * (warped(x, z, 0.15, 3) - 0.5) * 8
    const hills = rise(x, z, 22, 120) * smoothstep(-5, 30, z) * warped(x, z, 0.008, 40) * 45
    return -17.5 * drop + face + hills
  }
  group.add(terrain({ height: groundAt, palette: { low: '#2f3a22', mid: '#4b5532', high: '#5f6440', rock: '#26231f' }, heightScale: 6, grain: 40 }))

  const ocean = createOcean({ y: SEA_Y, centre: [0, -60], wind: Math.PI / 2 + 0.3, sea: 2.2 })
  // kit/ocean.ts uses uSSS without declaring it, and its Jacobian foam never
  // triggers at this sea state; declare the uniform if missing and add churn:
  // broken white water on the crests and a surf band at the foot of the cliff.
  patch(ocean.mesh.material as MeshStandardMaterial, 'cliff-ocean-churn', (sh) => {
    sh.uniforms.uTime = weatherUniforms.uTime
    if (!/uniform\s+vec3\s+uSSS/.test(sh.fragmentShader))
      sh.fragmentShader = `uniform vec3 uSSS;\n${sh.fragmentShader}`
    addNoise(sh)
    sh.fragmentShader = `uniform float uTime;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'lights_fragment_begin', /* glsl */`
      float churnN = sFbm2(vOX * 0.35 + vec2(uTime * 0.05, -uTime * 0.11));
      float churn = smoothstep(0.75, 1.9, vCrest + churnN * 1.2) * smoothstep(0.35, 0.7, sNoise2(vOX * 1.7 + uTime * 0.2));
      churn += smoothstep(-13.5, -10.5, vOX.y) * smoothstep(0.3, 0.65, churnN + sNoise2(vOX * 2.3 - uTime * 0.3) * 0.4);
      churn = clamp(churn, 0.0, 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.82, 0.85, 0.84), churn);
      material.diffuseColor = diffuseColor.rgb * (1.0 - metalnessFactor);
      material.roughness = mix(material.roughness, 0.85, churn);
    `)
  })
  group.add(ocean.mesh)

  const b = new Batch()
  // Craggy black rock down the cliff face.
  for (let i = 0; i < 34; i++) {
    const x = rng.range(-30, 30)
    const e = edgeZ(x)
    const f = rng.range(0.3, 1)
    const z = e - 1 - f * 5.5
    const sz = rng.range(1.5, 3.2)
    const fl = rng.range(0.8, 1.4)
    // Keep every crag's top below the lip so none rises in front of the sea view.
    b.add('darkStone', boulder(200 + i, sz, fl), at(x, Math.min(groundAt(x, z) - 1.2, -1 - sz * fl * 1.3), z, rng.range(0, 6)))
  }
  // Sea stacks with foam rings at the waterline.
  const fb = new Batch()
  const stacks: [number, number, number][] = [[-6, -11, 2.2], [5, -16, 3], [12, -9.5, 1.8], [-15, -21, 3.6], [1.5, -27, 2.6], [-24, -13, 2.4], [20, -22, 3.2]]
  stacks.forEach(([x, z, s], i) => {
    b.add('darkStone', boulder(300 + i, s, 1.9), at(x, -18.5, z, rng.range(0, 6)))
    for (const k of [1.05, 1.4, 1.9]) {
      const ring = new RingGeometry(s * k, s * (k + 0.35), 40)
      ring.rotateX(-Math.PI / 2)
      fb.add('foam', ring, at(x, SEA_Y + 0.15 + k * 0.02, z, rng.range(0, 6)))
    }
  })
  // Surf line along the foot of the cliff.
  for (let x = -40; x <= 40; x += 3.5) {
    const ring = new RingGeometry(0.1, rng.range(3, 5), 24)
    ring.rotateX(-Math.PI / 2)
    fb.add('foam', ring, at(x, SEA_Y + 0.2, edgeZ(x) - 6.6 + rng.gauss() * 0.6))
  }
  for (const m of fb.build(() => mats.own('foam', foamMaterial), { castShadow: false, receiveShadow: false })) group.add(m)

  // The railing: weathered posts, a lower rail and a top rail polished by hands.
  for (let x = -8; x <= 8; x += 1.6) {
    const z = edgeZ(x) + 0.7
    b.add('aged', post(0.06, 1.05, 8), at(x, -0.05, z))
    const x2 = x + 1.6
    if (x2 <= 8.01) {
      const z2 = edgeZ(x2) + 0.7
      const len = Math.hypot(1.6, z2 - z)
      const ry = -Math.atan2(z2 - z, 1.6)
      b.add('keyaki', beam(len + 0.08, 0.075, 0.1), at(x + 0.8, 1.02, (z + z2) / 2, ry))
      b.add('aged', beam(len, 0.05, 0.05), at(x + 0.8, 0.52, (z + z2) / 2, ry))
    }
  }

  // A small hall to one side, and a lantern by the rail.
  hall(b, { x: -8.4, z: 1.2, ry: Math.PI / 2, w: 3, d: 2.2, floor: 0.55, h: 2.4, walls: { back: 'plaster', left: 'shoji', right: 'shoji' } })
  const lampPos = lantern(b, 3.4, edgeZ(3.4) + 1.5, 0.3, 0.8)
  group.add(halo(lampPos, '#ffb35c', 1.2, 0.9))
  const l = ctx.lights[0]
  if (l) {
    l.position.copy(lampPos)
    l.color.set('#ffae5a')
    l.distance = 6
    l.userData.base = 1.4
  }

  // Cherry trees whose petals ride the ocean wind, and quiet hills behind.
  const cherries: [number, number, number][] = [[6.8, -0.6, 5.5], [8.4, 3.8, 6.5], [-5.4, 4.6, 5], [-11, 6, 7], [10, 8, 6]]
  for (const [x, z, h] of cherries) broadTree(b, rng, x, groundAt(x, z), z, { height: h, leaf: 'cherryLeaf', spread: 0.65, puffs: 8, bark: 'charred' })
  for (let i = 0; i < 14; i++) {
    const x = rng.range(-50, 50)
    const z = rng.range(18, 45)
    broadTree(b, rng, x, groundAt(x, z), z, { height: rng.range(7, 12), leaf: i % 4 ? 'darkLeaf' : 'cherryWhite', spread: 0.45, puffs: 5 })
  }
  for (const m of b.build(resolver(mats))) group.add(m)

  group.add(grass({
    count: ctx.quality === 'high' ? 36000 : 9000,
    inner: 1.4,
    outer: 24,
    height: [0.05, 0.16],
    base: '#26321a',
    tip: '#7e8048',
    groundAt,
    accept: (x, z) => z > edgeZ(x) + 0.4 && (z > 0.6 || Math.abs(x) > 3.5),
    uTime: ctx.uniforms.uTime,
    uWind: ctx.uniforms.uWind,
  }, rng.fork('grass')))

  return {
    group,
    floorY: 0,
    groundAt,
    fallSource: { centre: new Vector3(5, 0, 1), radius: 8, height: 6 },
    update: (_dt, time) => ocean.update(time),
    // Look down past the railing to the sea.
    view: { az: 0.3, el: 0.38 },
    fogScale: 0.4,
    dispose: () => disposeGroup(group),
  }
}
