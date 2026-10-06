/**
 * Authored light shafts through interior windows (3d-wood-lighting-scorecard,
 * 3d-sky-rays for interiors). Each window that faces the key light gets two
 * crossed additive planes running from the opening along the light direction
 * to the floor. The beam is modulated by slow fbm along its length, fades at
 * both ends and by world height (`smoothstep(0.02, 0.34, y)`) so it never
 * lays a milky wedge over the floor or the timber it crosses, and its gain is
 * kept low (0.2 of the key) so the blacks survive.
 */
import type { Vector3 } from 'three'
import { AdditiveBlending, Color, DoubleSide, Group, Matrix4, Mesh, PlaneGeometry, ShaderMaterial, Vector3 as V } from 'three'
import { NOISE_GLSL } from '../shader'

export interface Aperture {
  centre: Vector3
  normal: Vector3
  w: number
  h: number
  kind: 'window' | 'door' | 'shoji'
}

const VERT = /* glsl */`
varying vec2 vUv;
varying vec3 vW;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`

const FRAG = /* glsl */`
uniform vec3 uColor;
uniform float uGain, uTime;
varying vec2 vUv;
varying vec3 vW;
${NOISE_GLSL}
void main() {
  float across = clamp(abs(vUv.x - 0.5) * 2.0, 0.0, 1.0);
  float side = pow(clamp(1.0 - across, 0.0, 1.0), 2.2);
  float along = vUv.y;
  float ends = smoothstep(0.0, 0.08, 1.0 - along) * smoothstep(0.0, 0.22, along);
  float mod1 = 0.55 + 0.45 * sFbm2(vec2(vUv.x * 3.0, along * 2.0 - uTime * 0.03));
  float foot = smoothstep(0.02, 0.34, vW.y);
  float a = side * ends * mod1 * foot * uGain;
  gl_FragColor = vec4(uColor * a, 1.0);
}`

export interface Shafts {
  group: Group
  update: (apertures: Aperture[], sunDir: Vector3, color: Color, gain: number, time: number, eye: Vector3) => void
  dispose: () => void
}

export function createShafts(): Shafts {
  const group = new Group()
  group.name = 'shafts'
  const geo = new PlaneGeometry(1, 1)
  geo.translate(0, 0.5, 0)
  const mat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color() }, uGain: { value: 0 }, uTime: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  })
  const pool: Mesh[] = []
  const m = new Matrix4()
  const along = new V()
  const across = new V()
  const width = new V()
  return {
    group,
    update(apertures, sunDir, color, gain, time, eye) {
      mat.uniforms.uColor!.value.copy(color)
      mat.uniforms.uGain!.value = gain * 0.2
      mat.uniforms.uTime!.value = time
      let k = 0
      for (const ap of apertures) {
        if (ap.kind !== 'window' || sunDir.y < 0.05 || ap.normal.dot(sunDir) < 0.08)
          continue
        // The beam travels into the room, opposite the direction toward the sun, and
        // turns about its own axis to face the eye so it reads as a volume, not a blade.
        along.copy(sunDir).negate()
        const length = Math.min(9, (ap.centre.y + ap.h * 0.5) / Math.max(0.1, -along.y)) * 1.05
        const mid = ap.centre.clone().addScaledVector(along, length * 0.5)
        across.subVectors(eye, mid).normalize()
        width.crossVectors(along, across).normalize().multiplyScalar(Math.max(ap.w, ap.h) * 1.3)
        const normal = new V().crossVectors(width, along).normalize()
        const mesh = pool[k] ?? new Mesh(geo, mat)
        if (!pool[k]) {
          mesh.renderOrder = 7
          mesh.frustumCulled = false
          mesh.layers.set(2)
          mesh.matrixAutoUpdate = false
          pool.push(mesh)
          group.add(mesh)
        }
        m.makeBasis(width, along.clone().multiplyScalar(length), normal)
        m.setPosition(ap.centre.clone().addScaledVector(ap.normal, -0.05))
        mesh.matrix.copy(m)
        mesh.matrixWorldNeedsUpdate = true
        mesh.visible = true
        k++
      }
      for (let i = k; i < pool.length; i++) (pool[i] as Mesh).visible = false
    },
    dispose() {
      geo.dispose()
      mat.dispose()
    },
  }
}
