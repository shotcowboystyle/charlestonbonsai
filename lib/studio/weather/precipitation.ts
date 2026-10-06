/**
 * Camera-anchored precipitation (content.md §7, threejs-weather), driven on
 * the GPU: each drop or flake has seeded attributes and the vertex shader
 * computes its position from time, wrapped in a world-anchored tile carried
 * ahead of the camera, so the viewer never reaches an edge and nothing jumps
 * when the camera turns. Density is the instance count (a draw range), never
 * a new buffer. Rain slants with the square of its speed. Flakes and drops
 * inside an interior's box are discarded, so the tatami stays dry while the
 * weather stays visible through the windows.
 *
 * The lightning of the source is deliberately not ported.
 */
import type { Box3, Camera } from 'three'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, InstancedBufferAttribute, InstancedMesh, Points, ShaderMaterial, Vector3 } from 'three'

export interface Precipitation {
  rain: InstancedMesh
  snow: Points
  update: (o: { camera: Camera, time: number, rain: number, snow: number, tile: number, groundY: number, light: Color, gust: number }) => void
  setInterior: (box: Box3 | null) => void
  dispose: () => void
}

const COMMON = /* glsl */`
uniform vec3 uCenter;
uniform float uTile, uTop, uGround, uTime;
uniform vec3 uRoomMin, uRoomMax;
vec3 tilePos(vec3 seed, float fallSpeed, float phase) {
  vec3 p;
  p.x = uCenter.x + (fract((seed.x * uTile - uCenter.x) / uTile) - 0.5) * uTile;
  p.z = uCenter.z + (fract((seed.z * uTile - uCenter.z) / uTile) - 0.5) * uTile;
  float h = uTop - uGround;
  p.y = uTop - mod(uTime * fallSpeed + phase * h, h);
  return p;
}
float inRoom(vec3 p) {
  return step(uRoomMin.x, p.x) * step(p.x, uRoomMax.x) * step(uRoomMin.y, p.y) * step(p.y, uRoomMax.y) * step(uRoomMin.z, p.z) * step(p.z, uRoomMax.z);
}
`

const RAIN_VERT = /* glsl */`
${COMMON}
attribute vec4 aSeed;
uniform float uSlant;
varying float vFade;
varying float vAlong;
void main() {
  float speed = 3.6 + aSeed.w * 1.6;
  vec3 p = tilePos(aSeed.xyz, speed, aSeed.y * 7.3);
  vec3 vel = vec3(uSlant * speed * speed * 0.035, -speed, uSlant * speed * speed * 0.012);
  vec3 dir = normalize(vel);
  float len = 0.045 * speed / 4.0;
  vec3 toCam = normalize(cameraPosition - p);
  vec3 side = normalize(cross(dir, toCam));
  float dist = length(cameraPosition - p);
  float w = max(0.0007, dist * 0.0011);
  vec3 wp = p + dir * position.y * len + side * position.x * w;
  vFade = (1.0 - inRoom(p)) * smoothstep(uGround, uGround + 0.1, p.y) * (1.0 - smoothstep(uTile * 0.38, uTile * 0.5, length(p.xz - uCenter.xz)));
  vAlong = position.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`

const RAIN_FRAG = /* glsl */`
uniform vec3 uLight;
uniform float uOpacity;
varying float vFade;
varying float vAlong;
void main() {
  if (vFade < 0.01) discard;
  float a = (1.0 - abs(vAlong * 2.0 - 1.0)) * vFade * uOpacity;
  gl_FragColor = vec4(uLight, a);
}`

const SNOW_VERT = /* glsl */`
${COMMON}
attribute vec4 aSeed;
uniform float uGust, uPx;
varying float vFade;
void main() {
  float speed = 0.45 + aSeed.w * 0.35;
  vec3 p = tilePos(aSeed.xyz, speed, aSeed.y * 5.1);
  float ph = aSeed.x * 40.0;
  p.x += sin(uTime * (0.6 + aSeed.w) + ph) * 0.18 + uGust * (uTop - p.y) * 0.25;
  p.z += cos(uTime * (0.5 + aSeed.z) + ph) * 0.14;
  vFade = (1.0 - inRoom(p)) * (1.0 - smoothstep(uTile * 0.38, uTile * 0.5, length(p.xz - uCenter.xz)));
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = 0.009 + aSeed.z * 0.008;
  gl_PointSize = max(1.5, size * uPx / -mv.z);
}`

const SNOW_FRAG = /* glsl */`
uniform vec3 uLight;
uniform float uOpacity;
varying float vFade;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = (1.0 - smoothstep(0.35, 1.0, d)) * vFade * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uLight, a);
}`

function seeds(n: number, seed: number): Float32Array {
  const a = new Float32Array(n * 4)
  let s = seed
  for (let i = 0; i < a.length; i++) {
    s = (s * 16807) % 2147483647
    a[i] = s / 2147483647
  }
  return a
}

export function createPrecipitation(quality: 'high' | 'low', pixelRatio: number): Precipitation {
  const nRain = quality === 'high' ? 9000 : 3000
  const nSnow = quality === 'high' ? 7000 : 2500
  const shared = {
    uCenter: { value: new Vector3() },
    uTile: { value: 20 },
    uTop: { value: 8 },
    uGround: { value: 0 },
    uTime: { value: 0 },
    uRoomMin: { value: new Vector3(1e6, 1e6, 1e6) },
    uRoomMax: { value: new Vector3(-1e6, -1e6, -1e6) },
    uLight: { value: new Color(0.8, 0.82, 0.85) },
  }
  const quad = new BufferGeometry()
  quad.setAttribute('position', new BufferAttribute(new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]), 3))
  quad.setIndex([0, 1, 2, 2, 1, 3])
  quad.setAttribute('aSeed', new InstancedBufferAttribute(seeds(nRain, 7), 4))
  const rainMat = new ShaderMaterial({ uniforms: { ...shared, uSlant: { value: 0.6 }, uOpacity: { value: 0.45 } }, vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG, transparent: true, depthWrite: false })
  const rain = new InstancedMesh(quad, rainMat, nRain)
  rain.frustumCulled = false
  rain.layers.set(2)
  rain.renderOrder = 6
  rain.count = 0

  const pg = new BufferGeometry()
  pg.setAttribute('position', new BufferAttribute(new Float32Array(nSnow * 3), 3))
  pg.setAttribute('aSeed', new BufferAttribute(seeds(nSnow, 11), 4))
  const snowMat = new ShaderMaterial({ uniforms: { ...shared, uGust: { value: 0 }, uPx: { value: 900 * pixelRatio }, uOpacity: { value: 0.9 } }, vertexShader: SNOW_VERT, fragmentShader: SNOW_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending })
  const snow = new Points(pg, snowMat)
  snow.frustumCulled = false
  snow.layers.set(2)
  snow.renderOrder = 6
  pg.setDrawRange(0, 0)

  const fwd = new Vector3()
  return {
    rain,
    snow,
    update(o) {
      o.camera.getWorldDirection(fwd)
      fwd.y = 0
      if (fwd.lengthSq() < 1e-6)
        fwd.set(0, 0, -1)
      fwd.normalize()
      shared.uTile.value = o.tile
      shared.uCenter.value.copy(o.camera.position).addScaledVector(fwd, o.tile * 0.32)
      shared.uGround.value = o.groundY
      shared.uTop.value = Math.max(o.camera.position.y, o.groundY) + o.tile * 0.4
      shared.uTime.value = o.time
      shared.uLight.value.copy(o.light)
      rain.count = Math.round(nRain * Math.min(1, o.rain))
      rain.visible = rain.count > 0
      pg.setDrawRange(0, Math.round(nSnow * Math.min(1, o.snow)))
      snow.visible = o.snow > 0.005
      snowMat.uniforms.uGust!.value = o.gust
    },
    setInterior(box) {
      if (box) {
        shared.uRoomMin.value.copy(box.min).addScalar(-0.05)
        shared.uRoomMax.value.copy(box.max).addScalar(0.4)
      }
      else {
        shared.uRoomMin.value.set(1e6, 1e6, 1e6)
        shared.uRoomMax.value.set(-1e6, -1e6, -1e6)
      }
    },
    dispose() {
      quad.dispose()
      pg.dispose()
      rainMat.dispose()
      snowMat.dispose()
    },
  }
}
