/**
 * Soft halos around lanterns and braziers, using only the webgl-laser halo
 * and smoky falloff maths (gaussian core, 1.45-power glow, wide scatter
 * broken by slow smoke) on a camera-facing quad. No beam, no full-screen
 * effect. Brightness follows the atmosphere's glow uniform.
 */
import type { Vector3 } from 'three'
import { AdditiveBlending, Color, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import { NOISE_GLSL } from '../../shader'
import { weatherUniforms } from '../../weather/cover'

export const glowUniform = { value: 1 }

const VERT = /* glsl */`
varying vec2 vUv;
uniform float uSize;
void main() {
  vUv = uv - 0.5;
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * uSize;
  gl_Position = projectionMatrix * mv;
}`

const FRAG = /* glsl */`
uniform vec3 uColor;
uniform float uGlow, uTime, uStrength;
varying vec2 vUv;
${NOISE_GLSL}
void main() {
  float d = length(vUv) * 2.0;
  float core = exp(-pow(d / 0.06, 2.0));
  float glow = exp(-pow(d / 0.22, 1.45));
  float scatter = exp(-pow(d / 0.6, 1.25));
  float smoke = smoothstep(0.3, 0.86, sFbm2(vUv * 3.1 + vec2(0.0, -uTime * 0.035)));
  float pulse = 0.94 + 0.06 * sin(uTime * 1.15);
  vec3 c = uColor * (core * 1.2 + glow * 0.46 * pulse + scatter * smoke * 0.3);
  gl_FragColor = vec4(c * uGlow * uStrength * (1.0 - smoothstep(0.85, 1.0, d)), 1.0);
}`

export function halo(at: Vector3, color: string, size: number, strength = 1): Mesh {
  const mat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uGlow: glowUniform, uTime: weatherUniforms.uTime, uSize: { value: size }, uStrength: { value: strength } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  })
  const m = new Mesh(new PlaneGeometry(1, 1), mat)
  m.position.copy(at)
  m.renderOrder = 5
  m.frustumCulled = false
  m.layers.set(2)
  m.name = 'halo'
  return m
}
