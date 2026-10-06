/**
 * Procedural timber (3d-wood-material, condensed): one patched
 * MeshPhysicalMaterial whose rings, latewood, pores and fibres all come from
 * the same wandering field and feed colour, roughness and relief together,
 * each faded by its own screen footprint. The grain axis is per vertex
 * (`aGrain.xyz`, seed in `.w`) so merged boards still run along their length.
 */
import { Color, MeshPhysicalMaterial } from 'three'
import { addNoise, addWorldVaryings, declare, inject, patch } from '../../shader'
import { applyWeather } from '../../weather/cover'

export type WoodSpecies = 'hinoki' | 'sugi' | 'keyaki' | 'aged' | 'charred' | 'bamboo'
export type WoodFinish = 'raw' | 'oil' | 'urushi'

const SPECIES: Record<WoodSpecies, { pale: string, dark: string, rough: number, ring: number, offAxis: number }> = {
  hinoki: { pale: '#d8c096', dark: '#8a6b40', rough: 0.5, ring: 260, offAxis: 1.6 },
  sugi: { pale: '#c8a579', dark: '#8b6640', rough: 0.58, ring: 160, offAxis: 2.8 },
  keyaki: { pale: '#8a5f38', dark: '#3d2412', rough: 0.6, ring: 200, offAxis: 0.75 },
  aged: { pale: '#6a5440', dark: '#2c2017', rough: 0.72, ring: 150, offAxis: 1.4 },
  charred: { pale: '#1d1813', dark: '#0e0b08', rough: 0.95, ring: 90, offAxis: 0.55 },
  bamboo: { pale: '#b9a46a', dark: '#7d6a3c', rough: 0.45, ring: 40, offAxis: 6.0 },
}

export interface WoodOptions {
  species: WoodSpecies
  finish?: WoodFinish
  /** Lacquer colour for urushi. */
  lacquer?: string
  exposure?: number
}

export function woodMaterial(o: WoodOptions): MeshPhysicalMaterial {
  const sp = SPECIES[o.species]
  const finish = o.finish ?? 'raw'
  const m = new MeshPhysicalMaterial({
    color: 0xFFFFFF,
    roughness: Math.max(0.43, sp.rough),
    metalness: 0,
    ior: 1.43,
    specularIntensity: 0.72,
    clearcoat: finish === 'urushi' ? 0.42 : finish === 'oil' ? 0.1 : 0,
    clearcoatRoughness: finish === 'urushi' ? 0.4 : 0.55,
  })
  const local = {
    uWPale: { value: new Color(sp.pale) },
    uWDark: { value: new Color(sp.dark) },
    uWRing: { value: sp.ring },
    uWOff: { value: sp.offAxis },
    uWFinish: { value: finish === 'urushi' ? 2 : finish === 'oil' ? 1 : 0 },
    uWLacquer: { value: new Color(o.lacquer ?? '#a8321e') },
  }
  patch(m, 'kit-wood', (sh) => {
    Object.assign(sh.uniforms, local)
    addWorldVaryings(sh)
    addNoise(sh)
    sh.vertexShader = declare(sh.vertexShader, 'aGrain', 'attribute vec4 aGrain;\nvarying vec4 vGrain;')
    sh.vertexShader = inject(sh.vertexShader, 'begin_vertex', '', 'vGrain = aGrain;')
    sh.fragmentShader = declare(sh.fragmentShader, 'uWPale', 'uniform vec3 uWPale, uWDark, uWLacquer;\nuniform float uWRing, uWOff, uWFinish;\nvarying vec4 vGrain;')
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec3 gAx = normalize(vGrain.xyz + vec3(1e-4));
      vec3 gRef = abs(gAx.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
      vec3 gU = normalize(cross(gAx, gRef));
      vec3 gV = cross(gAx, gU);
      vec3 wp = vSWPos + vGrain.w * 7.113;
      float along = dot(wp, gAx);
      vec2 c2 = vec2(dot(wp, gU), dot(wp, gV));
      float drift = sNoise2(vec2(along * 1.3, vGrain.w)) * 0.05;
      float radius = length((c2 + vec2(-drift, uWOff * 0.02 + 0.0096)) * vec2(1.0, 0.56));
      float growth = radius * uWRing + (sFbm2(vec2(along * 4.0, c2.x * 30.0)) - 0.5) * 2.5;
      float phase = fract(growth);
      float annual = sHash12(vec2(floor(growth), vGrain.w));
      float gfp0 = 1.0 - smoothstep(0.16, 0.72, fwidth(growth));
      annual = mix(0.5, annual, gfp0);
      float lw = 0.065 + annual * 0.21;
      float late = smoothstep(0.94 - lw, 0.97 - lw, phase) * (1.0 - smoothstep(0.965, 1.0, phase));
      float gfp = 1.0 - smoothstep(0.16, 0.72, fwidth(growth));
      late = mix(0.18, late, gfp);
      float fx = c2.x * 96.0;
      float pores = smoothstep(0.59, 0.75, sNoise2(vec2(fx, along * 7.5))) * sFootprint2(vec2(fx, along * 7.5), 0.2, 0.7);
      float fib = sNoise2(vec2(c2.x * 230.0, along * 2.4)) * sFootprint2(vec2(c2.x * 230.0, along * 2.4), 0.2, 0.7);
      float broad = sFbm2(vec2(along * 2.0, c2.y * 9.0));
      float tone = 0.075 + late * 0.40 + pores * 0.25 - fib * 0.16 + (broad - 0.5) * 0.23;
      vec3 wc = mix(uWPale, uWDark, clamp(tone, 0.035, 0.83)) * (0.93 + annual * 0.095);
      if (uWFinish > 0.5) wc = pow(wc, vec3(1.16));
      if (uWFinish > 1.5) wc = mix(uWLacquer, uWLacquer * (0.8 + late * 0.25), 0.6);
      diffuseColor.rgb *= wc;
      float woodH = late * 0.5 - pores * 0.42 + fib * 0.09;
      float woodR = 0.91 + late * 0.13 + pores * 0.19 + (broad - 0.5) * 0.2;
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'roughnessmap_fragment', '', 'roughnessFactor = clamp(roughnessFactor * woodR * (uWFinish > 0.5 ? 0.88 : 1.0), 0.3, 1.0);')
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', 'normal = sBump(normal, -vViewPosition, woodH * (1.0 - smoothstep(0.05, 0.18, fwidth(c2.x * 96.0))), 0.0005);')
  })
  applyWeather(m, { exposure: o.exposure ?? 1, patchScale: 2 })
  return m
}
