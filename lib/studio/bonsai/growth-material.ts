import type { Shader } from '../shader'
/**
 * Materials that grow. All are stock three.js materials patched in
 * `onBeforeCompile` so lighting, shadows and fog stay standard:
 *
 * - Wood reveals along its growth path: vertices past the front collapse to
 *   the front point, those just behind it taper (the closing tip replaces the
 *   §1 section cap for wood), and fragments beyond the front are discarded.
 * - Foliage pads scale in about their own centres with the §2 envelope.
 *
 * Shadow casters get matching depth materials, or a fully grown tree would
 * cast its shadow from frame one.
 */
import type { SpeciesDef } from './species'
import { Color, DoubleSide, MeshDepthMaterial, MeshStandardMaterial, ShaderChunk, Vector4 } from 'three'
import { addNoise, declare, inject, patch } from '../shader'
import { applyWeather } from '../weather/cover'

export interface BonsaiUniforms {
  uGrowth: { value: number }
  uTip: { value: number }
  uFoliage: { value: number }
  uWireGrow: { value: number }
  uWireOut: { value: number }
  uMoss: { value: number }
  /** [spring, summer, fall, winter] weights. */
  uSeason: { value: Vector4 }
  /** Fraction of deciduous leaves dropped (winter). */
  uThin: { value: number }
  /** Fraction of blossoms and of fruit hidden for the season. */
  uBloomHide: { value: number }
  uFruitHide: { value: number }
  uSway: { value: number }
  uTime: { value: number }
  uDew: { value: number }
}

export function createBonsaiUniforms(): BonsaiUniforms {
  return {
    uGrowth: { value: 4 },
    uTip: { value: 0.07 },
    uFoliage: { value: 1 },
    uWireGrow: { value: 0 },
    uWireOut: { value: 1 },
    uMoss: { value: 1 },
    uSeason: { value: new Vector4(0, 1, 0, 0) },
    uThin: { value: 0 },
    uBloomHide: { value: 0 },
    uFruitHide: { value: 0 },
    uSway: { value: 0 },
    uTime: { value: 0 },
    uDew: { value: 0 },
  }
}

const GROW_DECL = 'attribute vec3 aAxis;\nattribute float aGrowth;\nattribute vec4 aDir;\nattribute float aDead;\nuniform float uGrowth, uTip;\nvarying float vGrowth;\nvarying float vDead;\nvarying vec2 vBark;'

function growVertex(sh: Shader, uni: BonsaiUniforms): void {
  sh.uniforms.uGrowth = uni.uGrowth
  sh.uniforms.uTip = uni.uTip
  sh.vertexShader = declare(sh.vertexShader, 'aGrowth', GROW_DECL)
  sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', /* glsl */`
    vec3 transformed = position;
    {
      float ahead = aGrowth - uGrowth;
      vec3 ax = aAxis;
      float f = 0.0;
      if (ahead > 0.0) ax -= aDir.xyz * min(ahead, aDir.w);
      else f = sqrt(clamp(-ahead / uTip, 0.0, 1.0));
      transformed = ax + (position - aAxis) * f;
    }
    vGrowth = aGrowth;
    vDead = aDead;
    vBark = vec2(uv.x * 6.2832 * length(position - aAxis), uv.y);
  `)
  sh.fragmentShader = declare(sh.fragmentShader, 'vGrowth', 'uniform float uGrowth;\nvarying float vGrowth;\nvarying float vDead;\nvarying vec2 vBark;')
  sh.fragmentShader = inject(sh.fragmentShader, 'clipping_planes_fragment', 'if (vGrowth > uGrowth + 0.0005) discard;')
}

const BARK_KIND: Record<SpeciesDef['bark']['kind'], number> = { smooth: 0, plates: 1, fissured: 2, flaky: 3, stringy: 4, mottled: 5 }

/** Bark and deadwood in one material: the whole tree's wood is one draw call. */
export function barkMaterial(species: SpeciesDef, trunkR: number, H: number, uni: BonsaiUniforms): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.92, metalness: 0 })
  const local = {
    uBarkA: { value: new Color(species.bark.color) },
    uBarkB: { value: new Color(species.bark.dark) },
    uBarkKind: { value: BARK_KIND[species.bark.kind] },
    uBarkFreq: { value: 1 / Math.max(0.0008, trunkR * 0.45 * species.bark.scale) },
  }
  patch(m, 'bonsai-bark', (sh) => {
    Object.assign(sh.uniforms, local)
    growVertex(sh, uni)
    addNoise(sh)
    sh.fragmentShader = `uniform vec3 uBarkA, uBarkB;\nuniform float uBarkKind, uBarkFreq;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec2 bp = vBark * uBarkFreq;
      float fp = sFootprint2(bp, 0.5, 2.0);
      float pat = 0.0;
      if (uBarkKind < 0.5) pat = sFbm2(bp * vec2(0.6, 0.25)) * 0.5 + smoothstep(0.82, 0.9, sNoise2(bp * vec2(3.0, 9.0))) * 0.4 * fp;
      else if (uBarkKind < 1.5) { float c = abs(sNoise2(bp * vec2(1.4, 0.7)) - 0.5); pat = 1.0 - smoothstep(0.02, 0.09, c) * 0.9 + sFbm2(bp * 3.0) * 0.25; }
      else if (uBarkKind < 2.5) pat = smoothstep(0.35, 0.75, sFbm2(bp * vec2(3.2, 0.35))) + sNoise2(bp * 6.0) * 0.15 * fp;
      else if (uBarkKind < 3.5) pat = smoothstep(0.5, 0.58, sNoise2(bp * vec2(2.6, 1.7))) * 0.55 + sFbm2(bp * 3.0) * 0.45;
      else if (uBarkKind < 4.5) pat = smoothstep(0.3, 0.8, sNoise2(vec2(bp.x * 5.0, bp.y * 0.3))) * 0.8 + sNoise2(bp * 7.0) * 0.2 * fp;
      else pat = smoothstep(0.42, 0.58, sFbm2(bp * 2.2)) * 0.6 + sFbm2(bp * 5.0) * 0.4;
      vec3 bark = mix(uBarkA, uBarkB, clamp(pat, 0.0, 1.0));
      float grain = sNoise2(vec2(bp.x * 9.0, bp.y * 0.7)) * fp;
      float check = smoothstep(0.03, 0.0, abs(sNoise2(vec2(bp.x * 2.5, bp.y * 0.25)) - 0.5)) * fp;
      vec3 deadC = mix(vec3(0.66, 0.64, 0.6), vec3(0.34, 0.32, 0.29), grain * 0.6 + sFbm2(bp * 1.5) * 0.4);
      deadC = mix(deadC, vec3(0.12, 0.1, 0.09), check * 0.7);
      float dead = smoothstep(0.35, 0.65, vDead);
      diffuseColor.rgb *= mix(bark, deadC, dead);
      float barkH = mix(pat, grain * 0.6 - check * 0.8, dead);
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'roughnessmap_fragment', '', 'roughnessFactor = mix(roughnessFactor, 0.62, dead);')
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', 'normal = sBump(normal, -vViewPosition, barkH, 0.35 / uBarkFreq);')
  })
  applyWeather(m, { patchScale: 4 / Math.max(0.05, H), darken: 0.35 })
  return m
}

/** Depth material for anything using the growth vertex patch. */
export function growthDepthMaterial(uni: BonsaiUniforms): MeshDepthMaterial {
  const d = new MeshDepthMaterial()
  patch(d, 'bonsai-grow-depth', (sh) => {
    growVertex(sh, uni)
  })
  return d
}

const PAD_DECL = 'attribute vec4 aPad;\nattribute float aRand;\nuniform float uFoliage, uThin, uSway, uTime, uThinnable;\nvarying float vRand;'

/** Pad envelope applied after instancing, about the pad centre in tree space. */
function padVertex(sh: Shader, uni: BonsaiUniforms, thinnable: number): void {
  Object.assign(sh.uniforms, { uFoliage: uni.uFoliage, uThin: uni.uThin, uSway: uni.uSway, uTime: uni.uTime, uThinnable: { value: thinnable } })
  sh.vertexShader = declare(sh.vertexShader, 'aPad', `${PAD_DECL}
    vec3 padEnv(vec3 p) {
      float d = aPad.w;
      float g = d >= 1.0 ? 0.0 : clamp((uFoliage - d) / (1.0 - d), 0.0, 1.0);
      float s = 1.0 - pow(1.0 - g, 2.6);
      if (aRand < uThin * uThinnable) s = 0.0;
      vec3 sway = vec3(sin(uTime * 1.3 + aRand * 40.0), 0.0, cos(uTime * 1.1 + aRand * 31.0)) * uSway * s;
      return aPad.xyz + (p - aPad.xyz) * s + sway;
    }`)
  const hook = (src: string, v: string) => src.replace(`${v} = instanceMatrix * ${v};`, `${v} = instanceMatrix * ${v};\n${v}.xyz = padEnv(${v}.xyz);`)
  sh.vertexShader = sh.vertexShader
    .replace('#include <project_vertex>', hook(ShaderChunk.project_vertex, 'mvPosition'))
    .replace('#include <worldpos_vertex>', hook(ShaderChunk.worldpos_vertex, 'worldPosition'))
  sh.vertexShader = inject(sh.vertexShader, 'begin_vertex', '', 'vRand = aRand;')
}

export interface FoliageColors {
  spring: string
  summer: string
  fall: string
  winter: string
}

/** Instanced leaves, needles or blossoms. Seasonal colour is mixed in the shader. */
export function foliageMaterial(colors: FoliageColors, uni: BonsaiUniforms, H: number, thinnable: boolean, sheen = 0.5): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.62 - sheen * 0.2, metalness: 0, side: DoubleSide })
  const local = {
    uLeafSpring: { value: new Color(colors.spring) },
    uLeafSummer: { value: new Color(colors.summer) },
    uLeafFall: { value: new Color(colors.fall) },
    uLeafWinter: { value: new Color(colors.winter) },
  }
  patch(m, 'bonsai-foliage', (sh) => {
    Object.assign(sh.uniforms, local, { uSeason: uni.uSeason, uDew: uni.uDew })
    padVertex(sh, uni, thinnable ? 1 : 0)
    sh.fragmentShader = declare(sh.fragmentShader, 'uLeafSpring', 'uniform vec3 uLeafSpring, uLeafSummer, uLeafFall, uLeafWinter;\nuniform vec4 uSeason;\nuniform float uDew;\nvarying float vRand;')
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec3 leaf = uLeafSpring * uSeason.x + uLeafSummer * uSeason.y + uLeafFall * uSeason.z + uLeafWinter * uSeason.w;
      leaf *= 0.86 + vRand * 0.28;
      diffuseColor.rgb *= leaf;
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'roughnessmap_fragment', '', 'roughnessFactor = mix(roughnessFactor, 0.28, uDew * 0.6);')
  })
  applyWeather(m, { patchScale: 6 / Math.max(0.05, H), darken: 0.2 })
  return m
}

export function foliageDepthMaterial(uni: BonsaiUniforms, thinnable: boolean): MeshDepthMaterial {
  const d = new MeshDepthMaterial()
  patch(d, 'bonsai-foliage-depth', sh => padVertex(sh, uni, thinnable ? 1 : 0))
  return d
}
