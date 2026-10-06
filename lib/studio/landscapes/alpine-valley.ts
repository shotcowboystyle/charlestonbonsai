import type { BufferAttribute } from 'three'
/**
 * High Alpine Temple Valley: a small weathered temple in a high valley,
 * ringed by snow-capped peaks, red shrine markers dotting the path and the
 * slopes, frosted alpine grass and golden larches. Thin air: the far terrain
 * takes only a fraction of the fog, so the peaks stay readable at distance.
 */
import type { LandscapeContext, LandscapeInstance } from './types'
import { Color, Group, Mesh, ShaderChunk, Vector3 } from 'three'
import { patch } from '../shader'
import { at, Batch } from './kit/batch'
import { hall } from './kit/buildings'
import { halo } from './kit/glow'
import { grass } from './kit/grass'
import { ridged, rise, smoothstep, warped } from './kit/noise'
import { lantern, marker, stone } from './kit/props'
import { disposeGroup, resolver } from './kit/resolve'
import { boulder } from './kit/shapes'
import { groundMaterial, terrainGeometry } from './kit/terrain'
import { broadTree, gardenPine } from './kit/trees'

const SNOW_LO = 34
const SNOW_HI = 75

function heightAt(x: number, z: number): number {
  const valley = rise(x, z, 14, 60) * warped(x, z, 0.014, 24) * 9
  const foot = rise(x, z, 60, 180) * warped(x + 30, z - 20, 0.006, 60) * 70
  const peaks = rise(x, z, 140, 320) * ridged(x * 0.0045 + 3.1, z * 0.0045 - 1.7, 5) * 420
  return valley + foot + peaks
}

/** Terrain whose colour whitens above the snow line, and that fogs thinly. */
function alpineTerrain(): Mesh {
  const geo = terrainGeometry({ height: heightAt, palette: { low: '#5d5a3a', mid: '#6f6a45', high: '#8a8460', rock: '#5f5c58' }, heightScale: 10, grain: 35 })
  const pos = geo.getAttribute('position') as BufferAttribute
  const col = geo.getAttribute('color') as BufferAttribute
  const snow = new Color('#eef1f5')
  const c = new Color()
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const k = smoothstep(SNOW_LO, SNOW_HI, y + Math.sin(pos.getX(i) * 0.05) * Math.cos(pos.getZ(i) * 0.04) * 25)
    c.setRGB(col.getX(i), col.getY(i), col.getZ(i)).lerp(snow, k)
    col.setXYZ(i, c.r, c.g, c.b)
  }
  col.needsUpdate = true
  const mat = groundMaterial({ grain: 35 })
  patch(mat, 'alpine-thin-air', (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', ShaderChunk.fog_fragment.replace(/vFogDepth/g, 'min(vFogDepth, 20.0 + (vFogDepth - 20.0) * 0.04)'))
  })
  const mesh = new Mesh(geo, mat)
  mesh.receiveShadow = true
  mesh.name = 'terrain'
  return mesh
}

export function buildAlpineValley(ctx: LandscapeContext): LandscapeInstance {
  const { rng, mats } = ctx
  const group = new Group()
  group.add(alpineTerrain())
  const groundAt = heightAt

  const b = new Batch()
  // The small temple at the head of the path.
  const TX = -6.5
  const TZ = -10
  const ty = groundAt(TX, TZ)
  b.add('stone', boulder(11, 1, 1, 2).scale(3.6, 0.5, 3), at(TX, ty - 0.25, TZ, 0.4))
  hall(b, { x: TX, z: TZ, ry: 0.4, w: 2.1, d: 1.6, floor: ty + 0.55, h: 2.2, walls: { back: 'plaster', left: 'shoji', right: 'shoji' }, timber: 'aged' })
  const lamp = lantern(b, TX + 2.6, TZ + 2.4, 0.4, 0.7, groundAt(TX + 2.6, TZ + 2.4))
  group.add(halo(lamp, '#ffb35c', 1.1, 0.8))
  const l = ctx.lights[0]
  if (l) {
    l.position.copy(lamp)
    l.color.set('#ffae5a')
    l.distance = 6
    l.userData.base = 1.3
  }

  // Stepping stones and red markers along the path to the temple, more on the slopes.
  for (let i = 0; i < 9; i++) {
    const u = i / 8
    const x = 1.6 + (TX + 2 - 1.6) * u + Math.sin(u * 5) * 0.6
    const z = -1.8 + (TZ + 2.2 + 1.8) * u
    const s = boulder(30 + i, 0.32, 0.25, 2)
    b.add('paleStone', s, at(x, groundAt(x, z) - 0.03, z, rng.range(0, 6)))
    if (i % 2 === 1)
      marker(b, x + 0.75, groundAt(x + 0.75, z), z, rng.range(-0.3, 0.3), 0.9)
  }
  for (let i = 0; i < 9; i++) {
    const a = rng.range(Math.PI * 0.75, Math.PI * 2.25)
    const r = rng.range(12, 38)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    marker(b, x, groundAt(x, z), z, rng.range(0, 6), 1.1)
  }

  // Golden larches, a few pines, and scattered rocks.
  for (let i = 0; i < 34; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = rng.range(10, 60)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (Math.abs(x - TX) < 4 && Math.abs(z - TZ) < 4)
      continue
    if (i % 3 === 0)
      gardenPine(b, rng, x, groundAt(x, z), z, rng.range(3, 6))
    else broadTree(b, rng, x, groundAt(x, z), z, { height: rng.range(4, 8), leaf: 'mapleGold', spread: 0.32, puffs: 4, flat: 1.4 })
  }
  for (let i = 0; i < 30; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = rng.range(3, 30)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    stone(b, x, groundAt(x, z) - 0.05, z, rng.range(0.15, 0.7), 200 + i, 0.6, i % 2 ? 'stone' : 'darkStone', rng.range(0, 6))
  }

  for (const m of b.build(resolver(mats))) group.add(m)

  group.add(grass({
    count: ctx.quality === 'high' ? 30000 : 8000,
    inner: 1.6,
    outer: 26,
    height: [0.06, 0.2],
    base: '#4a4a2c',
    tip: '#b4ab7c',
    frost: 0.6,
    groundAt,
    uTime: ctx.uniforms.uTime,
    uWind: ctx.uniforms.uWind,
  }, rng.fork('grass')))

  return {
    group,
    floorY: groundAt(0, 0),
    groundAt,
    fallSource: { centre: new Vector3(0, 0, -6), radius: 10, height: 6 },
    // Low and level so the snow-capped ridges rise behind the display.
    view: { az: 0.42, el: 0.02 },
    fogScale: 0.4,
    dispose: () => disposeGroup(group),
  }
}
