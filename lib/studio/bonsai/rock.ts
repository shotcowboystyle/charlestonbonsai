/**
 * Stones for Sekijoju (root over rock) and Ishitsuki (rock planting). The
 * rock is a lathe whose radius is an analytic function of height and angle,
 * so roots can be draped over its surface exactly rather than raycast.
 */
import type { Plane } from 'three'
import type { Rng } from './rng'
import type { V3 } from './skeleton'
import { BufferAttribute, BufferGeometry, MeshStandardMaterial } from 'three'
import { addNoise, addWorldVaryings, inject, patch } from '../shader'
import { applyWeather } from '../weather/cover'

export interface RockSpec {
  /** Centre of the rock's footprint. */
  base: V3
  height: number
  radius: number
  /** Craggy amplitude of the surface noise. */
  crag: number
  phases: number[]
}

export function makeRockSpec(rng: Rng, base: V3, height: number, radius: number, crag: number): RockSpec {
  return { base, height, radius, crag, phases: Array.from({ length: 6 }, () => rng.range(0, Math.PI * 2)) }
}

/** Surface radius at height `y` above the rock base and angle `th`. */
export function rockRadius(r: RockSpec, y: number, th: number): number {
  const h = Math.min(1, Math.max(0, y / r.height))
  const p = r.phases
  const profile = (1.0 - 0.22 * h) * Math.sqrt(Math.max(0, 1 - h ** 3.2)) * (1 + 0.12 * Math.sin(h * 5 + (p[5] ?? 0)))
  const n = Math.sin(th * 2 + (p[0] ?? 0)) * 0.5
    + Math.sin(th * 3 + h * 4 + (p[1] ?? 0)) * 0.3
    + Math.sin(th * 7 + h * 9 + (p[2] ?? 0)) * 0.12
    + Math.sin(h * 11 + th + (p[3] ?? 0)) * 0.08
  return r.radius * Math.max(0.05, profile) * (1 + r.crag * n)
}

/** Point on the rock surface. */
export function rockPoint(r: RockSpec, y: number, th: number, lift = 0): V3 {
  const rr = rockRadius(r, y, th) + lift
  return [r.base[0] + Math.cos(th) * rr, r.base[1] + y, r.base[2] + Math.sin(th) * rr]
}

export function rockGeometry(r: RockSpec, rings = 28, segs = 40): BufferGeometry {
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= rings; i++) {
    const y = (i / rings) * r.height
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2
      const p = rockPoint(r, y, th)
      pos.push(p[0], p[1], p[2])
    }
  }
  const apex = pos.length / 3
  pos.push(r.base[0], r.base[1] + r.height, r.base[2])
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j
      const b = a + segs + 1
      idx.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const top = rings * (segs + 1)
  for (let j = 0; j < segs; j++) idx.push(top + j, apex, top + j + 1)
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * Weathered stone: layered strata, lichen speckle and a derivative bump.
 * `scale` is the rock size so strata read at the right size on a 5 cm tree.
 */
export function stoneMaterial(color: string, dark: string, scale: number, clip?: Plane): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color, roughness: 0.88, metalness: 0 })
  if (clip) {
    m.clippingPlanes = [clip]
    m.clipShadows = true
  }
  const uni = { uStoneDark: { value: m.color.clone().set(dark) }, uStoneScale: { value: 1 / Math.max(0.01, scale) } }
  patch(m, 'stone', (sh) => {
    Object.assign(sh.uniforms, uni)
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform vec3 uStoneDark;\nuniform float uStoneScale;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', `
      vec3 sp = vSWPos * uStoneScale;
      float strata = sNoise2(vec2(sp.y * 7.0 + sFbm3(sp * 2.0) * 1.6, 0.5));
      float grain = sFbm3(sp * 9.0);
      float lichen = smoothstep(0.62, 0.7, sFbm3(sp * 4.0 + 7.0)) * sFootprint3(sp * 4.0, 0.2, 0.6);
      diffuseColor.rgb = mix(diffuseColor.rgb, uStoneDark, strata * 0.5 + grain * 0.35);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.45, 0.30), lichen * 0.35);
      float stoneH = grain * 0.7 + strata * 0.3;
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', `
      normal = sBump(normal, -vViewPosition, stoneH, 0.012 / uStoneScale);
    `)
  })
  applyWeather(m, { patchScale: 6 / Math.max(0.05, scale) })
  return m
}

/** Band table for the section cap through a rock: [yMin, yMax, halfWidth, sides]. */
export function rockBands(r: RockSpec, step: number): [number, number, number, number][] {
  const out: [number, number, number, number][] = []
  for (let y = 0; y < r.height; y += step) {
    let hw = 0
    for (let k = 0; k < 16; k++) hw = Math.max(hw, rockRadius(r, y + step, (k / 16) * Math.PI * 2))
    out.push([r.base[1] + y, r.base[1] + y + step, hw * 0.97, 24])
  }
  return out
}
