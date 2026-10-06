/**
 * Pot ceramics (webgl-3d-object): glazed stoneware with pooling, breaking
 * edges and a fine crackle under a clearcoat, or unglazed clay with iron
 * speckle — traditional for conifers. Plus the section-cap material, which
 * paints the clay wall ring around a soil core so the rising cut reads solid.
 */
import type { Plane } from 'three'
import { Color, MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import { addNoise, addWorldVaryings, inject, patch } from '../shader'
import { applyWeather } from '../weather/cover'

export function potMaterial(glaze: string | null, clip: Plane, size: number): MeshStandardMaterial {
  const glazed = glaze !== null
  const m = glazed
    ? new MeshPhysicalMaterial({ color: glaze, roughness: 0.34, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.18 })
    : new MeshStandardMaterial({ color: '#5a3f31', roughness: 0.86, metalness: 0 })
  m.clippingPlanes = [clip]
  m.clipShadows = true
  const local = { uPotFreq: { value: 1 / Math.max(0.01, size) }, uGlazed: { value: glazed ? 1 : 0 } }
  patch(m, 'bonsai-ceramic', (sh) => {
    Object.assign(sh.uniforms, local)
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform float uPotFreq, uGlazed;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec3 pp = vSWPos * uPotFreq;
      float pool = sFbm3(pp * vec3(3.0, 1.2, 3.0));
      float crack = 1.0 - smoothstep(0.0, 0.035, abs(sNoise3(pp * 26.0) - 0.5)) * sFootprint3(pp * 26.0, 0.3, 1.0);
      float speck = smoothstep(0.78, 0.84, sNoise3(pp * 60.0)) * sFootprint3(pp * 60.0, 0.3, 1.0);
      if (uGlazed > 0.5) {
        diffuseColor.rgb *= mix(0.78, 1.12, pool);
        diffuseColor.rgb *= 1.0 - (1.0 - crack) * 0.28;
      } else {
        diffuseColor.rgb *= mix(0.85, 1.1, pool);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.08, 0.06), speck * 0.7);
      }
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'roughnessmap_fragment', '', 'roughnessFactor = clamp(roughnessFactor + (pool - 0.5) * 0.12, 0.05, 1.0);')
  })
  applyWeather(m, { patchScale: 10 / Math.max(0.02, size), darken: glazed ? 0.15 : 0.4 })
  return m
}

/** Cut-face cap: clay ring outside, soil core inside. Never clipped itself. */
export function capMaterial(clay: string, wallFrac: number): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1 })
  const local = { uClay: { value: new Color(clay) }, uWallFrac: { value: wallFrac } }
  patch(m, 'bonsai-cap', (sh) => {
    Object.assign(sh.uniforms, local)
    sh.vertexShader = `attribute float aRim;\nvarying float vRim;\n${sh.vertexShader}`
    sh.vertexShader = inject(sh.vertexShader, 'begin_vertex', '', 'vRim = aRim;')
    sh.fragmentShader = `uniform vec3 uClay;\nuniform float uWallFrac;\nvarying float vRim;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', 'diffuseColor.rgb *= vRim > 1.0 - uWallFrac ? uClay : vec3(0.22, 0.13, 0.07);')
  })
  return m
}
