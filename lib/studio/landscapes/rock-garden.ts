import type { MeshStandardMaterial, Vector4 } from 'three'
/**
 * Rock Garden Temple: raked white gravel whose waves circle mossy boulders
 * set in asymmetric groups (and the display itself), a weathered timber
 * fence, the temple's veranda, autumn maples blazing above, and a stone
 * Buddha half-hidden in ivy. Rain turns the gravel to wet pearls.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { Euler, Group, Matrix4, PlaneGeometry, Vector3 } from 'three'
import { at, Batch } from './kit/batch'
import { hall } from './kit/buildings'
import { grass } from './kit/grass'
import { gravelBed } from './kit/gravel'
import { rise, warped } from './kit/noise'
import { buddha, fence, lantern, stone } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { terrain } from './kit/terrain'
import { broadTree } from './kit/trees'

export function buildRockGarden(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  const groundAt = (x: number, z: number) => {
    const far = rise(x, z, 16, 60)
    return far * (warped(x, z, 0.012, 30) * 26 - 6) + rise(x, z, 60, 300) * warped(x + 300, z, 0.004, 80) * 70
  }
  group.add(terrain({ height: groundAt, palette: { low: '#3d4a26', mid: '#57603a', high: '#7a7350', rock: '#6b665c' }, heightScale: 10, grain: 40 }))

  // Boulder groups (3-2-2 asymmetry), each sitting on a moss island.
  const groups: [number, number, number][][] = [
    [[-4.6, -5.2, 0.95], [-3.5, -5.9, 0.55], [-5.4, -4.2, 0.4]],
    [[3.9, -3.4, 0.75], [4.7, -2.7, 0.42]],
    [[5.8, 2.6, 0.5], [6.5, 3.2, 0.3]],
  ]
  const b = new Batch()
  const rocks: [number, number, number][] = [[0, 0, ctx.clear * 0.9]]
  groups.forEach((g, gi) => {
    for (const [x, z, s] of g) {
      stone(b, x, 0, z, s, gi * 3 + s * 10, 0.72, 'mossStone', rng.range(0, 6))
      rocks.push([x, z, s * 1.05])
    }
    const [cx, cz, cs] = g[0] as [number, number, number]
    const moss = new PlaneGeometry(cs * 3.6, cs * 2.8, 1, 1)
    moss.rotateX(-Math.PI / 2)
    b.add('moss', moss, at(cx + 0.3, 0.02, cz + 0.2, rng.range(0, 3)))
  })
  const gravel = gravelBed({ width: 18, depth: 13, rocks, spacing: 0.075 })
  gravel.position.set(0, 0.012, -1.5)
  group.add(gravel)

  // Weathered fence boundary and the temple veranda along the left.
  fence(b, [[-9, 5], [-9, -8], [9, -8], [9, 5]], 1.5, groundAt)
  hall(b, { x: -13.2, z: -2, ry: Math.PI / 2, w: 6, d: 2.6, floor: 0.75, h: 2.6, walls: { back: 'shoji', left: 'plaster', right: 'plaster' } })
  lantern(b, -7.6, -6.6, 0.3, 0.9)
  lantern(b, 7.4, -6.9, -0.2, 0.75)

  // Stone Buddha in the back corner, ivy climbing over it.
  const bpos = buddha(b, -7.4, 0, -7.1, 0.5, 1.1)
  for (let i = 0; i < 260; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = rng.range(0.25, 0.75)
    const h = rng.range(0, 1.3) * (1 - r * 0.6)
    const leaf = new PlaneGeometry(0.09, 0.1)
    const m = new Matrix4().makeRotationFromEuler(new Euler(rng.range(-1.2, 1.2), a, rng.range(-0.5, 0.5)))
    b.add('ivy', leaf, m.setPosition(bpos.x + Math.cos(a) * r * 0.9, Math.max(0.02, h), bpos.z + Math.sin(a) * r * 0.8))
  }

  // Autumn maples blazing above the fence, plus darker evergreens behind.
  const maples: [number, number, number, string][] = [[-6, -11, 7, 'mapleLeaf'], [1.5, -12.5, 8.5, 'mapleRed'], [7.5, -10.5, 6.5, 'mapleGold'], [12, -4, 7, 'mapleLeaf'], [-11, 8, 6, 'mapleRed']]
  for (const [x, z, h, leaf] of maples) broadTree(b, rng, x, groundAt(x, z), z, { height: h, leaf, spread: 0.6, puffs: 8 })
  for (let i = 0; i < 14; i++) {
    const a = rng.range(Math.PI * 1.1, Math.PI * 1.9)
    const r = rng.range(20, 34)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    broadTree(b, rng, x, groundAt(x, z), z, { height: rng.range(8, 13), leaf: i % 3 === 0 ? 'mapleLeaf' : 'darkLeaf', spread: 0.45, puffs: 5 })
  }

  for (const m of b.build(resolver(mats))) group.add(m)

  const blades = ctx.quality === 'high' ? 45000 : 12000
  group.add(grass({
    count: blades,
    inner: 9.5,
    outer: 30,
    height: [0.12, 0.32],
    base: '#2c3a18',
    tip: '#8a8a46',
    groundAt,
    accept: (x, z) => !(Math.abs(x) < 9.2 && z > -8.3 && z < 5.2),
    uTime: ctx.uniforms.uTime,
    uWind: ctx.uniforms.uWind,
  }, rng.fork('grass')))

  return {
    group,
    floorY: 0,
    groundAt: (x, z) => (Math.abs(x) < 9 && z > -8 && z < 5 ? 0.012 : groundAt(x, z)),
    fallSource: { centre: new Vector3(1, 0, -6), radius: 9, height: 7 },
    setClear: (r) => {
      const first = ((gravel.material as MeshStandardMaterial).userData.rocks as Vector4[])[0]
      if (first)
        first.z = r * 0.9
    },
    dispose: () => disposeGroup(group),
  }
}
