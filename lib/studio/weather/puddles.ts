/**
 * Splash rings: what makes rain read as falling rather than as a texture
 * (threejs-weather). Instanced flat rings around the subject, each cycling
 * on its own seeded clock — expand, fade, reappear nearby — entirely in the
 * vertex/fragment shaders. Puddles themselves are in the ground materials
 * (cover.ts `puddles`), darkening and going mirror-smooth in hollows.
 */
import type { Vector3 } from 'three'
import { Color, DoubleSide, InstancedBufferAttribute, InstancedMesh, PlaneGeometry, ShaderMaterial } from 'three'

const VERT = /* glsl */`
attribute vec4 aRing;
uniform float uTime, uRate, uScale;
varying vec2 vUv;
varying float vAge;
float h11(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  float t = uTime * uRate * (0.7 + aRing.w * 0.6) + aRing.w * 13.0;
  float cyc = floor(t);
  vAge = fract(t);
  vec2 jitter = (vec2(h11(cyc + aRing.w * 91.0), h11(cyc * 1.7 + aRing.w * 37.0)) - 0.5) * uScale * 0.6;
  float r = mix(0.2, 1.0, vAge) * uScale * 0.06 * (0.6 + aRing.w * 0.8);
  vUv = uv - 0.5;
  vec3 p = vec3(aRing.x + jitter.x, aRing.y + 0.003, aRing.z + jitter.y) + vec3(position.x, 0.0, -position.y) * r;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`

const FRAG = /* glsl */`
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying float vAge;
void main() {
  float d = length(vUv) * 2.0;
  float ring = smoothstep(0.08, 0.0, abs(d - 0.85)) + smoothstep(0.06, 0.0, abs(d - 0.55)) * 0.4;
  float a = ring * (1.0 - vAge) * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}`

export interface Splashes {
  mesh: InstancedMesh
  place: (groundAt: (x: number, z: number) => number, centre: Vector3, radius: number, scale: number, accept?: (x: number, z: number) => boolean) => void
  update: (time: number, rain: number, color: Color) => void
  dispose: () => void
}

export function createSplashes(quality: 'high' | 'low'): Splashes {
  const n = quality === 'high' ? 260 : 110
  const geo = new PlaneGeometry(1, 1)
  const ring = new Float32Array(n * 4)
  geo.setAttribute('aRing', new InstancedBufferAttribute(ring, 4))
  const mat = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRate: { value: 1.4 }, uScale: { value: 1 }, uColor: { value: new Color(0.85, 0.88, 0.9) }, uOpacity: { value: 0.5 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })
  const mesh = new InstancedMesh(geo, mat, n)
  mesh.frustumCulled = false
  mesh.layers.set(2)
  mesh.count = 0
  let s = 3
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return {
    mesh,
    place(groundAt, centre, radius, scale, accept) {
      for (let i = 0; i < n; i++) {
        let x = centre.x
        let z = centre.z
        for (let k = 0; k < 12; k++) {
          const a = rnd() * Math.PI * 2
          const r = Math.sqrt(rnd()) * radius
          x = centre.x + Math.cos(a) * r
          z = centre.z + Math.sin(a) * r
          if (!accept || accept(x, z))
            break
        }
        // Rings that found no open ground are parked far below the world.
        const y = accept && !accept(x, z) ? -1e4 : groundAt(x, z)
        ring.set([x, y, z, rnd()], i * 4)
      }
      ;(geo.getAttribute('aRing') as InstancedBufferAttribute).needsUpdate = true
      mat.uniforms.uScale!.value = scale
    },
    update(time, rain, color) {
      mat.uniforms.uTime!.value = time
      mat.uniforms.uColor!.value.copy(color)
      mesh.count = Math.round(n * Math.min(1, rain))
      mesh.visible = mesh.count > 0
    },
    dispose() {
      geo.dispose()
      mat.dispose()
    },
  }
}
