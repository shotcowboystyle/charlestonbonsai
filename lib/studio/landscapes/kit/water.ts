/**
 * Water. Still pools borrow only the Fresnel and planar-reflection parts of
 * 3d-ultra-realistic-water: a half-resolution Reflector (grass and particles
 * excluded via layer 2), Schlick F0 = 0.02, a faint ripple, and rain rings
 * when wet. They never wave. Streams flow with scrolling derivative ripples;
 * waterfalls are scrolling sheets. The ocean lives in ocean.ts.
 */
import type { BufferGeometry, Camera, Scene, ShaderMaterial, WebGLRenderer } from 'three'
import { Color, DoubleSide, Matrix4, Mesh, MeshStandardMaterial, UniformsLib, UniformsUtils } from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { addNoise, addWorldVaryings, inject, NOISE_GLSL, patch } from '../../shader'
import { weatherUniforms } from '../../weather/cover'

export interface StillWaterOptions {
  /** Flat geometry in the XY plane (Reflector convention), rotated to lie flat. */
  geometry: BufferGeometry
  y: number
  deep: string
  /** 0 = black mirror, 1 = crystal clear over a visible bottom. */
  clarity: number
  /** Reflection buffer scale relative to 1024². */
  resolution: number
}

const STILL_VERT = /* glsl */`
uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec3 vWorld;
#include <fog_pars_vertex>
void main() {
  vUv = textureMatrix * vec4(position, 1.0);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`

const STILL_FRAG = /* glsl */`
uniform sampler2D tDiffuse;
uniform vec3 color;
uniform vec3 uDeep;
uniform float uClarity, uTime, uWet;
varying vec4 vUv;
varying vec3 vWorld;
#include <fog_pars_fragment>
${NOISE_GLSL}
float rings(vec2 p, float t) {
  vec2 cell = floor(p);
  vec2 f = fract(p) - 0.5;
  float h = sHash12(cell);
  float age = fract(t * 0.9 + h);
  float r = length(f - (vec2(sHash12(cell + 3.1), sHash12(cell + 7.7)) - 0.5) * 0.5);
  return smoothstep(0.03, 0.0, abs(r - age * 0.45)) * (1.0 - age);
}
void main() {
  vec2 p = vWorld.xz;
  float n1 = sNoise2(p * 1.7 + vec2(uTime * 0.05, uTime * 0.03));
  float n2 = sNoise2(p * 4.3 - vec2(uTime * 0.04, -uTime * 0.06));
  vec2 slope = vec2(n1 - 0.5, n2 - 0.5) * 0.012;
  float ring = uWet * (rings(p * 3.0, uTime) + rings(p * 3.0 + 17.0, uTime * 1.13));
  slope += vec2(dFdx(ring), dFdy(ring)) * 0.6;
  vec3 N = normalize(vec3(slope.x, 1.0, slope.y));
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec4 uv = vUv;
  uv.xy += slope * 2.5 * uv.w;
  vec3 refl = texture2DProj(tDiffuse, uv).rgb;
  vec3 col = mix(uDeep, refl, max(fres, 1.0 - uClarity) * 0.92 + 0.04);
  col += ring * 0.04;
  float alpha = mix(1.0 - uClarity * 0.8, 1.0, fres);
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`

export function stillWater(o: StillWaterOptions): Reflector {
  const size = Math.round(1024 * o.resolution)
  const shader = {
    name: 'StudioStillWater',
    uniforms: UniformsUtils.merge([UniformsLib.fog, {
      color: { value: new Color(1, 1, 1) },
      tDiffuse: { value: null },
      textureMatrix: { value: new Matrix4() },
      uDeep: { value: new Color(o.deep) },
      uClarity: { value: o.clarity },
      uTime: { value: 0 },
      uWet: { value: 0 },
    }]),
    vertexShader: STILL_VERT,
    fragmentShader: STILL_FRAG,
  }
  const water = new Reflector(o.geometry, { textureWidth: size, textureHeight: size, clipBias: 0.002, shader, multisample: 0 })
  const mat = water.material as ShaderMaterial
  mat.fog = true
  mat.transparent = o.clarity > 0.05
  // Shared clocks: these uniforms are plain objects, so pointing at the shared ones keeps them live.
  mat.uniforms.uTime = weatherUniforms.uTime
  mat.uniforms.uWet = weatherUniforms.uWet
  water.rotation.x = -Math.PI / 2
  water.position.y = o.y
  water.layers.set(3)
  const base = water.onBeforeRender.bind(water)
  water.onBeforeRender = (r: WebGLRenderer, s: Scene, c: Camera, ...rest: unknown[]) => {
    const rc = water.getReflectionCamera(c)
    rc.layers.disable(2)
    rc.layers.disable(3)
    ;(base as (...a: unknown[]) => void)(r, s, c, ...rest)
  }
  water.name = 'still-water'
  return water
}

/** Flowing stream surface: scrolling ripples along `flow`, glossy, slightly transparent. */
export function streamMaterial(deep: string, flow: [number, number], speed: number): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: deep, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.88 })
  patch(m, 'kit-stream', (sh) => {
    sh.uniforms.uTime = weatherUniforms.uTime
    sh.uniforms.uFlow = { value: [flow[0] * speed, flow[1] * speed] }
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform float uTime;\nuniform vec2 uFlow;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', /* glsl */`
      vec2 sp = vSWPos.xz;
      float sh1 = sNoise2(sp * vec2(3.0, 6.0) - uFlow * uTime * 3.0);
      float sh2 = sNoise2(sp * vec2(7.0, 11.0) - uFlow * uTime * 5.0 + 9.0);
      normal = sBump(normal, -vViewPosition, sh1 * 0.6 + sh2 * 0.4, 0.02);
    `)
  })
  return m
}

/** Falling sheet: bright streaks scrolling down a curved plane. */
export function waterfallMaterial(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: '#cfdcdc', roughness: 0.2, transparent: true, opacity: 0.85, side: DoubleSide, emissive: new Color('#6f8486'), emissiveIntensity: 0.25, depthWrite: false })
  patch(m, 'kit-waterfall', (sh) => {
    sh.uniforms.uTime = weatherUniforms.uTime
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform float uTime;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec2 fp = vec2(vSWPos.x * 7.0 + vSWPos.z * 7.0, vSWPos.y * 1.2 + uTime * 2.6);
      float streak = sNoise2(vec2(fp.x, fp.y)) * 0.6 + sNoise2(vec2(fp.x * 2.3, fp.y * 1.7 + 4.0)) * 0.4;
      diffuseColor.rgb *= 0.7 + streak * 0.55;
      diffuseColor.a *= smoothstep(0.15, 0.6, streak) * 0.85 + 0.15;
    `)
  })
  return m
}

export function sheetMesh(geo: BufferGeometry, mat: MeshStandardMaterial): Mesh {
  const mesh = new Mesh(geo, mat)
  mesh.renderOrder = 2
  mesh.receiveShadow = true
  return mesh
}
