/**
 * Settled snow and wetness. Both are slow ground states that accumulate on
 * asymmetric clocks (crossfade.ts `stepAccumulator`) and reach materials as
 * shared uniforms mixed *inside* the shader by world normal — a material
 * colour only multiplies and could never whiten a surface.
 */
import type { Material } from 'three'
import { Color } from 'three'
import { addNoise, addWorldVaryings, declare, inject, patch } from '../shader'

export interface WeatherUniforms {
  uSnow: { value: number }
  uWet: { value: number }
  uSnowColor: { value: Color }
  uTime: { value: number }
}

/** One set per engine; `resetWeatherUniforms` runs when an engine starts. */
export const weatherUniforms: WeatherUniforms = {
  uSnow: { value: 0 },
  uWet: { value: 0 },
  uSnowColor: { value: new Color(0.92, 0.94, 0.98) },
  uTime: { value: 0 },
}

export function resetWeatherUniforms(): void {
  weatherUniforms.uSnow.value = 0
  weatherUniforms.uWet.value = 0
  weatherUniforms.uTime.value = 0
}

export interface WeatherOptions {
  /** 0 for sheltered (indoor) surfaces, 1 fully exposed. */
  exposure?: number
  /** Noise frequency of snow patches, per metre. Small subjects need finer patches. */
  patchScale?: number
  /** Ground: puddles collect in hollows when wet. */
  puddles?: boolean
  /** How much wetness darkens the albedo. */
  darken?: number
}

const DECL = /* glsl */`
uniform float uSnow, uWet, uSnowExp, uSnowScale, uWetDarken;
uniform vec3 uSnowColor;
`

export function applyWeather<M extends Material>(mat: M, opts: WeatherOptions = {}): M {
  const exposure = opts.exposure ?? 1
  if (exposure <= 0)
    return mat
  const local = {
    uSnowExp: { value: exposure },
    uSnowScale: { value: opts.patchScale ?? 3 },
    uWetDarken: { value: opts.darken ?? 0.42 },
  }
  const puddles = Boolean(opts.puddles)
  return patch(mat, puddles ? 'weather-puddles' : 'weather', (sh) => {
    Object.assign(sh.uniforms, weatherUniforms, local)
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = declare(sh.fragmentShader, 'uSnowExp', DECL)
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', `
      float swUp = normalize(vSWNrm).y;
      float swN = sFbm2(vSWPos.xz * uSnowScale);
      float swSnow = uSnow * uSnowExp * smoothstep(0.2, 0.75, swUp);
      swSnow *= smoothstep(0.0, 0.35, swN - (1.0 - uSnow) * 0.55 + 0.05);
      float swWet = uWet * uSnowExp * (1.0 - swSnow);
      float swPud = 0.0;
      ${puddles
        ? `swPud = smoothstep(0.52, 0.6, sFbm2(vSWPos.xz * 0.45 + 3.1) + uWet * 0.12) * uWet * smoothstep(0.9, 0.98, swUp);`
        : ''}
      diffuseColor.rgb *= 1.0 - uWetDarken * swWet;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.35 + vec3(0.01, 0.012, 0.014), swPud);
      diffuseColor.rgb = mix(diffuseColor.rgb, uSnowColor, swSnow);
    `)
    if (sh.fragmentShader.includes('#include <roughnessmap_fragment>')) {
      sh.fragmentShader = inject(sh.fragmentShader, 'roughnessmap_fragment', '', `
        roughnessFactor = mix(roughnessFactor, 0.2, swWet * 0.7);
        roughnessFactor = mix(roughnessFactor, 0.03, swPud);
        roughnessFactor = mix(roughnessFactor, 0.82, swSnow);
      `)
    }
  })
}
