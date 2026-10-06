/**
 * Falling petals and leaves (3d-falling-leaves, falling-leaves) and small
 * atmospheric motes (ambient-section-particles).
 *
 * Leaves are instanced two-sided quads, never point sprites, so they turn
 * through face, edge and back. Each has seeded tumble, roll, fall and slip;
 * the sideways slip is coupled to the tumble (fastest edge-on) in closed
 * form, with a shared wind. Backs are paler. Resets happen at the top and
 * bottom of the volume where the leaf has shrunk to nothing.
 *
 * Motes — dust in light, incense wisps, brazier embers, waterfall spray —
 * are additive points kept sparse and slow.
 */
import type { FallingKind, MoteKind } from './landscapes/meta'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, InstancedBufferAttribute, InstancedMesh, Points, ShaderMaterial, Vector3 } from 'three'
import { fan, ovalOutline, palmateLeaf } from './bonsai/leaves'

const LEAF_VERT = /* glsl */`
attribute vec4 aA;
attribute vec4 aB;
uniform float uTime, uWind;
uniform vec3 uCentre;
uniform float uRadius, uHeight, uSize;
varying float vBack;
varying float vTint;
varying vec3 vN;
mat3 rotAxis(vec3 a, float t) {
  float c = cos(t), s = sin(t), k = 1.0 - c;
  return mat3(c + a.x*a.x*k, a.y*a.x*k + a.z*s, a.z*a.x*k - a.y*s,
              a.x*a.y*k - a.z*s, c + a.y*a.y*k, a.z*a.y*k + a.x*s,
              a.x*a.z*k + a.y*s, a.y*a.z*k - a.x*s, c + a.z*a.z*k);
}
void main() {
  float fall = 0.35 + aA.w * 0.45;
  float omega = (1.4 + aB.x * 2.2) * (aB.y > 0.5 ? 1.0 : -1.0);
  float ang = aB.z * 6.2832 + omega * uTime;
  float cyc = mod(uTime * fall / uHeight + aA.z, 1.0);
  float y = uCentre.y + uHeight * (1.0 - cyc);
  float slip = 0.22 + aB.w * 0.3;
  vec2 dir = normalize(vec2(cos(aB.z * 9.0), sin(aB.z * 9.0)));
  vec2 side = dir * (-(slip / omega) * cos(ang));
  vec2 drift = vec2(uWind, uWind * 0.35) * cyc * uHeight * 0.6;
  vec2 xz = uCentre.xz + (aA.xy - 0.5) * 2.0 * uRadius + side + drift;
  float fade = smoothstep(0.0, 0.06, cyc) * (1.0 - smoothstep(0.92, 1.0, cyc));
  vec3 axis = normalize(vec3(dir.x, 0.35, dir.y));
  mat3 R = rotAxis(axis, ang) * rotAxis(vec3(0.0, 1.0, 0.0), aB.z * 6.2832 + uTime * 0.3 * aB.x);
  vec3 lp = R * (position * uSize * (0.7 + aA.w * 0.6) * fade);
  vN = normalize(R * vec3(0.0, 0.0, 1.0));
  vTint = aB.w;
  vec4 mv = viewMatrix * vec4(lp + vec3(xz.x, y, xz.y), 1.0);
  vBack = dot(normalize(mat3(viewMatrix) * vN), normalize(-mv.xyz)) < 0.0 ? 1.0 : 0.0;
  gl_Position = projectionMatrix * mv;
}`

const LEAF_FRAG = /* glsl */`
uniform vec3 uColA, uColB, uSun, uAmb;
varying float vBack;
varying float vTint;
varying vec3 vN;
void main() {
  vec3 base = mix(uColA, uColB, vTint);
  base = mix(base, base * 0.75 + vec3(0.12), vBack * 0.6);
  float light = 0.55 + 0.45 * abs(vN.y);
  gl_FragColor = vec4(base * (uAmb + uSun * light), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const PALETTES: Record<Exclude<FallingKind, 'none'>, [string, string, number]> = {
  cherry: ['#f6cdd8', '#fbe9ee', 0.016],
  plum: ['#f7f3ea', '#efe6d6', 0.014],
  maple: ['#b8321c', '#e08a2a', 0.05],
}

export interface Leaves {
  mesh: InstancedMesh
  update: (time: number, wind: number, sun: Color, amb: Color) => void
  dispose: () => void
}

export function createLeaves(kind: Exclude<FallingKind, 'none'>, source: { centre: Vector3, radius: number, height: number }, quality: 'high' | 'low'): Leaves {
  const [a, b, size] = PALETTES[kind]
  const n = quality === 'high' ? 420 : 160
  const geo = kind === 'maple' ? palmateLeaf() : fan(ovalOutline(0.42, 8, 0.3), [0, 0.45])
  geo.translate(0, -0.45, 0)
  const A = new Float32Array(n * 4)
  const B = new Float32Array(n * 4)
  let s = 17
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  for (let i = 0; i < n * 4; i++) {
    A[i] = rnd()
    B[i] = rnd()
  }
  geo.setAttribute('aA', new InstancedBufferAttribute(A, 4))
  geo.setAttribute('aB', new InstancedBufferAttribute(B, 4))
  const mat = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 0.4 },
      uCentre: { value: source.centre.clone() },
      uRadius: { value: source.radius },
      uHeight: { value: source.height },
      uSize: { value: size },
      uColA: { value: new Color(a) },
      uColB: { value: new Color(b) },
      uSun: { value: new Color(1, 1, 1) },
      uAmb: { value: new Color(0.4, 0.4, 0.4) },
    },
    vertexShader: LEAF_VERT,
    fragmentShader: LEAF_FRAG,
    side: DoubleSide,
  })
  const mesh = new InstancedMesh(geo, mat, n)
  mesh.frustumCulled = false
  mesh.layers.set(2)
  return {
    mesh,
    update(time, wind, sun, amb) {
      mat.uniforms.uTime!.value = time
      mat.uniforms.uWind!.value = wind
      mat.uniforms.uSun!.value.copy(sun)
      mat.uniforms.uAmb!.value.copy(amb)
    },
    dispose() {
      geo.dispose()
      mat.dispose()
    },
  }
}

const MOTE_VERT = /* glsl */`
attribute vec4 aM;
uniform float uTime, uPx, uKind, uSize;
uniform vec3 uOrigin, uBox;
varying float vA;
void main() {
  vec3 p;
  float life = fract(uTime * (0.05 + aM.w * 0.08) + aM.z);
  if (uKind < 0.5) {
    p = uOrigin + (aM.xyz - 0.5) * uBox + vec3(sin(uTime * 0.2 + aM.x * 20.0), sin(uTime * 0.13 + aM.y * 17.0), cos(uTime * 0.17 + aM.z * 13.0)) * uBox * 0.04;
    vA = 0.6 + 0.4 * sin(uTime * 0.7 + aM.w * 30.0);
  } else {
    float rise = uKind < 1.5 ? 1.2 : (uKind < 2.5 ? 0.9 : -0.6);
    float spread = uKind < 1.5 ? 0.15 : (uKind < 2.5 ? 0.06 : 0.8);
    p = uOrigin + vec3((aM.x - 0.5) * spread * (1.0 + life * 3.0) + sin(life * 9.0 + aM.y * 6.0) * 0.08 * life, life * rise * uBox.y, (aM.y - 0.5) * spread * (1.0 + life * 3.0));
    vA = (1.0 - life) * smoothstep(0.0, 0.08, life);
  }
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, uSize * (0.5 + aM.w) * uPx / -mv.z);
}`

const MOTE_FRAG = /* glsl */`
uniform vec3 uColor;
uniform float uOpacity;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.2, 1.0, d)) * vA * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor * a, a);
}`

const MOTES: Record<Exclude<MoteKind, 'none'>, { kind: number, color: string, size: number, count: number, opacity: number }> = {
  dust: { kind: 0, color: '#fff1d6', size: 0.004, count: 600, opacity: 0.55 },
  incense: { kind: 1, color: '#bfb8ac', size: 0.06, count: 160, opacity: 0.18 },
  embers: { kind: 2, color: '#ff7a2e', size: 0.012, count: 140, opacity: 0.9 },
  spray: { kind: 3, color: '#dfe8ea', size: 0.03, count: 500, opacity: 0.35 },
}

export interface Motes {
  points: Points
  update: (time: number, origin: Vector3, box: Vector3, light: number) => void
  dispose: () => void
}

export function createMotes(kind: Exclude<MoteKind, 'none'>, quality: 'high' | 'low', pixelRatio: number): Motes {
  const m = MOTES[kind]
  const n = Math.round(m.count * (quality === 'high' ? 1 : 0.4))
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3))
  const at = new Float32Array(n * 4)
  let s = 29 + m.kind
  for (let i = 0; i < at.length; i++) {
    s = (s * 16807) % 2147483647
    at[i] = s / 2147483647
  }
  geo.setAttribute('aM', new BufferAttribute(at, 4))
  const mat = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: 900 * pixelRatio }, uKind: { value: m.kind }, uSize: { value: m.size }, uOrigin: { value: new Vector3() }, uBox: { value: new Vector3() }, uColor: { value: new Color(m.color) }, uOpacity: { value: m.opacity } },
    vertexShader: MOTE_VERT,
    fragmentShader: MOTE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const points = new Points(geo, mat)
  points.frustumCulled = false
  points.layers.set(2)
  return {
    points,
    update(time, origin, box, light) {
      mat.uniforms.uTime!.value = time
      ;(mat.uniforms.uOrigin!.value as Vector3).copy(origin)
      ;(mat.uniforms.uBox!.value as Vector3).copy(box)
      mat.uniforms.uOpacity!.value = m.opacity * light
    },
    dispose() {
      geo.dispose()
      mat.dispose()
    },
  }
}
