/**
 * Koke stage: the soil surface (granular akadama that greens over as moss
 * spreads) plus instanced moss cushions and top-dressing pebbles that scale
 * in with the same staggered envelope as the foliage pads.
 */
import type { Plane } from 'three'
import type { BonsaiUniforms } from './growth-material'
import type { PotSpec } from './pot'
import type { Rng } from './rng'
import { Color, FrontSide, IcosahedronGeometry, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { addNoise, addWorldVaryings, inject, patch } from '../shader'
import { applyWeather } from '../weather/cover'
import { foliageMaterial } from './growth-material'
import { innerFrac, planPoint } from './pot'

export function soilMaterial(uni: BonsaiUniforms, clip: Plane, H: number): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, metalness: 0 })
  m.clippingPlanes = [clip]
  m.clipShadows = true
  patch(m, 'bonsai-soil', (sh) => {
    sh.uniforms.uMoss = uni.uMoss
    sh.uniforms.uMossFreq = { value: 6 / Math.max(0.04, H) }
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform float uMoss, uMossFreq;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec2 gp = vSWPos.xz * 380.0;
      float gr = sNoise2(gp) * sFootprint2(gp, 0.3, 1.0);
      vec3 soil = mix(vec3(0.30, 0.17, 0.09), vec3(0.52, 0.33, 0.18), smoothstep(0.35, 0.75, gr));
      float cover = sFbm2(vSWPos.xz * uMossFreq);
      float moss = smoothstep(0.0, 0.08, cover - (1.0 - uMoss) * 0.95 + 0.02);
      vec3 mossC = mix(vec3(0.16, 0.25, 0.07), vec3(0.32, 0.42, 0.13), sNoise2(vSWPos.xz * uMossFreq * 9.0));
      diffuseColor.rgb *= mix(soil, mossC, moss * uMoss);
      float soilH = mix(gr, 0.5 + sNoise2(vSWPos.xz * uMossFreq * 14.0) * 0.5, moss);
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', 'normal = sBump(normal, -vViewPosition, soilH, 0.0015);')
  })
  applyWeather(m, { patchScale: 8 / Math.max(0.04, H) })
  return m
}

export function buildMoss(spec: PotSpec, soilAt: (x: number, z: number) => number, trunkR: number, uni: BonsaiUniforms, rng: Rng, H: number): InstancedMesh[] {
  const f = spec.kind === 'slab' ? 0.8 : innerFrac(spec.kind) * 0.94
  const area = Math.PI * spec.w * spec.d * f * f
  const mossUni = { ...uni, uFoliage: uni.uMoss, uThin: { value: 0 } }
  const make = (count: number, color: string, size: number, flat: number, rough: number) => {
    const geo = new IcosahedronGeometry(0.5, 1)
    geo.scale(1, flat, 1)
    geo.translate(0, flat * 0.2, 0)
    const mat = foliageMaterial({ spring: color, summer: color, fall: color, winter: color }, mossUni, H, false, 0)
    mat.roughness = rough
    mat.side = FrontSide
    const mesh = new InstancedMesh(geo, mat, count)
    const pad = new Float32Array(count * 4)
    const rnd = new Float32Array(count)
    const m = new Matrix4()
    const q = new Quaternion()
    const s = new Vector3()
    const p = new Vector3()
    const c = new Color()
    let k = 0
    for (let i = 0; i < count * 4 && k < count; i++) {
      const th = rng.range(0, Math.PI * 2)
      const rr = Math.sqrt(rng.next())
      const [x, z] = planPoint(th, spec.w * f * rr, spec.d * f * rr, spec.n)
      if (Math.hypot(x, z) < trunkR * 1.6)
        continue
      const sz = size * rng.range(0.6, 1.4)
      p.set(x, soilAt(x, z) - sz * flat * 0.15, z)
      q.setFromAxisAngle(new Vector3(0, 1, 0), rng.range(0, 6.28))
      s.set(sz, sz, sz * rng.range(0.7, 1.3))
      m.compose(p, q, s)
      mesh.setMatrixAt(k, m)
      mesh.setColorAt(k, c.setScalar(rng.range(0.75, 1.1)))
      pad.set([x, p.y, z, rng.range(0, 0.6)], k * 4)
      rnd[k] = rng.next()
      k++
    }
    mesh.count = k
    geo.setAttribute('aPad', new InstancedBufferAttribute(pad, 4))
    geo.setAttribute('aRand', new InstancedBufferAttribute(rnd, 1))
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    return mesh
  }
  const cushion = Math.max(0.004, Math.min(0.05, Math.sqrt(area) * 0.11))
  const nCushion = Math.round(Math.min(140, Math.max(14, area / (cushion * cushion) * 0.35)))
  return [
    make(nCushion, '#4d6a27', cushion, 0.42, 0.9),
    make(Math.round(nCushion * 0.35), '#8d8a80', cushion * 0.45, 0.6, 0.7),
  ]
}
