/**
 * Shared GLSL and a small combinator for chaining `onBeforeCompile` patches.
 * Several systems (growth, weather, wood) patch the same stock materials;
 * `patch()` composes them and keeps one stable program cache key per recipe,
 * so identical recipes share a compiled program.
 */
import type { Material, WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three'

export type Shader = WebGLProgramParametersWithUniforms
export type ShaderPatch = (sh: Shader) => void

interface Patched {
  __patches?: { key: string, fn: ShaderPatch }[]
}

/** Append a patch to a material. `key` must identify the shader code, not uniform values. */
export function patch<M extends Material>(mat: M, key: string, fn: ShaderPatch): M {
  const m = mat as M & Patched
  const list = m.__patches ?? (m.__patches = [])
  list.push({ key, fn })
  mat.onBeforeCompile = (sh: Shader, _r: WebGLRenderer) => {
    for (const p of list) p.fn(sh)
  }
  const cacheKey = `${mat.type}:${list.map(p => p.key).join('+')}`
  mat.customProgramCacheKey = () => cacheKey
  mat.needsUpdate = true
  return mat
}

/**
 * Insert code around `#include <chunk>`. `after` code is appended in call
 * order (a marker tracks the end), so a later patch — weather — always runs
 * after an earlier one that set the base colour. Throws if the chunk is
 * missing, so a renamed chunk in a three.js upgrade fails loudly.
 */
export function inject(src: string, chunk: string, before: string, after = ''): string {
  const tag = `#include <${chunk}>`
  const mark = `//@after:${chunk}`
  if (!src.includes(tag))
    throw new Error(`Shader chunk <${chunk}> not found; check three's ShaderChunk names`)
  let out = src.includes(mark) ? src : src.replace(tag, `${tag}\n${mark}`)
  if (before)
    out = out.replace(tag, `${before}\n${tag}`)
  if (after)
    out = out.replace(mark, `${after}\n${mark}`)
  return out
}

/** Insert declarations once, after the first line (`#define` / precision header handled by three). */
export function declare(src: string, marker: string, decl: string): string {
  if (src.includes(marker))
    return src
  return `${decl}\n${src}`
}

/**
 * World position and normal varyings, shared by the weather and grain
 * patches. Instancing is honoured; batching is not used in the studio.
 */
export const WORLD_VARYINGS = 'varying vec3 vSWPos;\nvarying vec3 vSWNrm;'

export function addWorldVaryings(sh: Shader): void {
  if (sh.vertexShader.includes('vSWPos'))
    return
  sh.vertexShader = declare(sh.vertexShader, 'vSWPos', WORLD_VARYINGS)
  sh.vertexShader = inject(sh.vertexShader, 'fog_vertex', '', `
    {
      vec4 sw = vec4(transformed, 1.0);
      vec3 sn = objectNormal;
      #ifdef USE_INSTANCING
        sw = instanceMatrix * sw;
        sn = mat3(instanceMatrix) * sn;
      #endif
      sw = modelMatrix * sw;
      vSWPos = sw.xyz;
      vSWNrm = normalize(mat3(modelMatrix) * sn);
    }`)
  sh.fragmentShader = declare(sh.fragmentShader, 'vSWPos', WORLD_VARYINGS)
}

/** Value noise and fbm, cheap enough for every material in the scene. */
export const NOISE_GLSL = /* glsl */`
#ifndef STUDIO_NOISE
#define STUDIO_NOISE
float sHash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float sHash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float sNoise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(sHash12(i), sHash12(i + vec2(1, 0)), u.x),
             mix(sHash12(i + vec2(0, 1)), sHash12(i + vec2(1, 1)), u.x), u.y);
}
float sNoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(sHash13(i), sHash13(i + vec3(1, 0, 0)), u.x),
                mix(sHash13(i + vec3(0, 1, 0)), sHash13(i + vec3(1, 1, 0)), u.x), u.y);
  float b = mix(mix(sHash13(i + vec3(0, 0, 1)), sHash13(i + vec3(1, 0, 1)), u.x),
                mix(sHash13(i + vec3(0, 1, 1)), sHash13(i + vec3(1, 1, 1)), u.x), u.y);
  return mix(a, b, u.z);
}
float sFbm2(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * sNoise2(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
float sFbm3(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * sNoise3(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return s;
}
/* Fade a high-frequency layer out by its own screen footprint, so detail
   never shimmers at distance (3d-wood-material). */
float sFootprint(float coord, float a, float b) {
  return 1.0 - smoothstep(a, b, fwidth(coord));
}
float sFootprint3(vec3 coord, float a, float b) {
  vec3 w = fwidth(coord);
  return 1.0 - smoothstep(a, b, max(w.x, max(w.y, w.z)));
}
float sFootprint2(vec2 coord, float a, float b) {
  vec2 w = fwidth(coord);
  return 1.0 - smoothstep(a, b, max(w.x, w.y));
}
/* Derivative bump: perturb the view-space normal by a scalar height field. */
vec3 sBump(vec3 n, vec3 viewPos, float h, float strength) {
  vec3 dpx = dFdx(viewPos), dpy = dFdy(viewPos);
  float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpy, n), r2 = cross(n, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2) * strength;
  float lim = 0.38 * abs(det);
  float gl = length(grad);
  if (gl > lim) grad *= lim / gl;
  return normalize(abs(det) * n - grad);
}
#endif
`

export function addNoise(sh: Shader): void {
  sh.fragmentShader = declare(sh.fragmentShader, 'STUDIO_NOISE', NOISE_GLSL)
}
