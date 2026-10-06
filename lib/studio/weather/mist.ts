/**
 * Ground-hugging mist: a stack of thin horizontal layers whose opacity comes
 * from slowly drifting noise, tinted by the fog colour and brightened toward
 * the sun. Each layer is faint so intersections with props never read as a
 * hard line; together they pool in the low ground like morning mist.
 */
import type { Color, Vector3 } from 'three'
import { Color as C, CircleGeometry, Group, Mesh, ShaderMaterial, Vector3 as V } from 'three'
import { NOISE_GLSL } from '../shader'

const VERT = /* glsl */`
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`

const FRAG = /* glsl */`
uniform vec3 uColor, uSun, uSunDir;
uniform float uDensity, uTime, uLayer, uRadius;
varying vec3 vW;
${NOISE_GLSL}
void main() {
  vec2 p = vW.xz * 0.09 + vec2(uTime * 0.012 * (1.0 + uLayer), uTime * 0.007) + uLayer * 3.7;
  float n = sFbm2(p);
  float wisp = smoothstep(0.35, 0.8, n);
  float r = length(vW.xz) / uRadius;
  float edge = 1.0 - smoothstep(0.55, 1.0, r);
  vec3 v = normalize(vW - cameraPosition);
  float toward = pow(max(0.0, dot(v, normalize(uSunDir))), 6.0);
  vec3 col = uColor + uSun * toward * 0.6;
  float a = wisp * edge * uDensity * (1.0 - uLayer * 0.12);
  // Fade layers the camera is inside so the lens never fills with a flat sheet.
  a *= smoothstep(0.02, 0.4, abs(cameraPosition.y - vW.y) / max(0.2, length(cameraPosition.xz - vW.xz) * 0.15 + 0.1));
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export interface Mist {
  group: Group
  update: (o: { time: number, density: number, fog: Color, sun: Color, sunDir: Vector3, floorY: number }) => void
  dispose: () => void
}

export function createMist(quality: 'high' | 'low'): Mist {
  const group = new Group()
  group.name = 'mist'
  const layers = quality === 'high' ? 4 : 3
  const radius = 70
  const geo = new CircleGeometry(radius, 48)
  geo.rotateX(-Math.PI / 2)
  const mats: ShaderMaterial[] = []
  const shared = { uColor: { value: new C() }, uSun: { value: new C() }, uSunDir: { value: new V(0, 0.2, 1) }, uTime: { value: 0 }, uRadius: { value: radius } }
  for (let i = 0; i < layers; i++) {
    const m = new ShaderMaterial({
      uniforms: { ...shared, uDensity: { value: 0 }, uLayer: { value: i } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
    })
    const mesh = new Mesh(geo, m)
    mesh.position.y = 0.06 + i * i * 0.14
    mesh.renderOrder = 4
    mesh.layers.set(2)
    mesh.frustumCulled = false
    group.add(mesh)
    mats.push(m)
  }
  return {
    group,
    update(o) {
      shared.uTime.value = o.time
      shared.uColor.value.copy(o.fog)
      shared.uSun.value.copy(o.sun)
      shared.uSunDir.value.copy(o.sunDir)
      group.position.y = o.floorY
      for (const m of mats) m.uniforms.uDensity!.value = o.density * 0.22
      group.visible = o.density > 0.05
    },
    dispose() {
      geo.dispose()
      for (const m of mats) m.dispose()
    },
  }
}
