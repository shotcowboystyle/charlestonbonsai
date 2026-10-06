/**
 * Camera-correct sky (3d-sky-background): an inward dome that follows the
 * camera, coloured from the view direction through six stops, with the sun
 * or moon disk drawn along the same direction as the key light. The halo
 * uses the webgl-laser falloff — a gaussian core, a 1.45-power glow and a
 * wide scatter term broken up by slow smoke — applied to angular distance.
 * Stars are confined to the elevation band the camera can actually see.
 * The same sky material renders into a PMREM so reflections match the sky.
 */
import type { WebGLRenderer } from 'three'
import type { RGB } from './crossfade'
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Group, Mesh, PMREMGenerator, Points, PointsMaterial, Scene, ShaderMaterial, SphereGeometry, Vector3 } from 'three'
import { NOISE_GLSL } from './shader'

export interface SkyRig {
  group: Group
  material: ShaderMaterial
  /** The sky alone, for the PMREM and the ray mask. */
  envScene: Scene
  setLook: (stops: RGB[], dir: Vector3, disk: RGB, size: number, halo: number, visible: number, stars: number) => void
  follow: (pos: Vector3, radius: number) => void
  environment: (renderer: WebGLRenderer) => void
  envTexture: () => import('three').Texture | null
  setTime: (t: number) => void
  dispose: () => void
}

const VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`

const FRAG = /* glsl */`
uniform vec3 uStops[6];
uniform vec3 uSunDir, uDisk;
uniform float uSize, uHalo, uVisible, uTime, uMask;
varying vec3 vDir;
${NOISE_GLSL}
vec3 ramp(float t) {
  float s[6] = float[6](0.0, 0.3, 0.52, 0.68, 0.84, 1.0);
  vec3 c = uStops[0];
  for (int i = 1; i < 6; i++) c = mix(c, uStops[i], smoothstep(s[i - 1], s[i], t));
  return c;
}
void main() {
  vec3 d = normalize(vDir);
  float el = asin(clamp(d.y, -1.0, 1.0));
  float t = el > 0.0 ? 0.84 * (1.0 - pow(el / 1.5708, 0.45)) : 0.84 + 0.16 * clamp(-el / 0.12, 0.0, 1.0);
  vec3 col = ramp(t);
  float cosA = dot(d, normalize(uSunDir));
  float ang = acos(clamp(cosA, -1.0, 1.0));
  float core = exp(-pow(ang / uSize, 8.0));
  float glow = exp(-pow(ang / (uSize * 3.2), 1.45));
  float scatter = exp(-pow(ang / min(uSize * 18.0, 0.42), 1.25));
  float smoke = smoothstep(0.3, 0.86, sFbm2(d.xz / max(0.2, d.y + 0.35) * 2.2 + vec2(uTime * 0.004, 0.0)));
  // A little surface on large disks reads as the moon rather than a lamp.
  vec3 diskC = uDisk * (1.0 - 0.18 * smoothstep(0.45, 0.7, sFbm2(d.xz * 160.0 / max(uSize, 0.01) * 0.02)) * step(0.05, uSize));
  col += uVisible * (diskC * core * 2.4 + uDisk * glow * 0.55 * uHalo + uDisk * scatter * (0.12 + smoke * 0.1) * uHalo);
  // Horizon haze brightens toward the sun.
  col += uVisible * uDisk * 0.12 * uHalo * pow(max(0.0, cosA), 3.0) * (1.0 - smoothstep(0.0, 0.35, abs(el)));
  if (uMask > 0.5) {
    // Ray mask: bright open sky only, nothing below the horizon.
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(vec3(max(0.0, lum - 0.18) * smoothstep(-0.01, 0.04, el)), 1.0);
    return;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

function starField(count: number, size: number, seed: number): Points {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  let s = seed
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  for (let i = 0; i < count; i++) {
    const az = rnd() * Math.PI * 2
    const el = Math.asin(0.02 + rnd() * 0.96) * (0.4 + 0.6 * rnd())
    pos.set([Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)], i * 3)
    const w = 0.75 + rnd() * 0.25
    col.set([w, w * (0.92 + rnd() * 0.08), w * (0.85 + rnd() * 0.15)], i * 3)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('color', new BufferAttribute(col, 3))
  const m = new PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false, blending: AdditiveBlending, opacity: 0 })
  const p = new Points(g, m)
  p.frustumCulled = false
  p.renderOrder = -9
  return p
}

export function createSky(dpr: number, quality: 'high' | 'low'): SkyRig {
  const uniforms = {
    uStops: { value: Array.from({ length: 6 }, () => new Vector3()) },
    uSunDir: { value: new Vector3(0, 0.2, 1) },
    uDisk: { value: new Vector3(1, 1, 1) },
    uSize: { value: 0.03 },
    uHalo: { value: 0.5 },
    uVisible: { value: 1 },
    uTime: { value: 0 },
    uMask: { value: 0 },
  }
  const material = new ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, side: BackSide, depthWrite: false, depthTest: true, fog: false })
  const dome = new Mesh(new SphereGeometry(1, 48, 24), material)
  dome.renderOrder = -10
  dome.frustumCulled = false
  const group = new Group()
  group.name = 'sky'
  group.add(dome)
  const n = quality === 'high' ? 1 : 0.4
  const stars = [starField(Math.round(9000 * n), 1.2 * dpr, 7), starField(Math.round(2400 * n), 2.0 * dpr, 11), starField(Math.round(300 * n), 3.0 * dpr, 13)]
  for (const s of stars) group.add(s)

  const envScene = new Scene()
  const envDome = new Mesh(new SphereGeometry(10, 32, 16), material)
  envScene.add(envDome)
  let pmrem: PMREMGenerator | null = null
  let envRT: import('three').WebGLRenderTarget | null = null

  return {
    group,
    material,
    envScene,
    setLook(stops, dir, disk, size, halo, visible, starOpacity) {
      stops.forEach((c, i) => uniforms.uStops.value[i]?.set(c[0], c[1], c[2]))
      uniforms.uSunDir.value.copy(dir)
      uniforms.uDisk.value.set(disk[0], disk[1], disk[2])
      uniforms.uSize.value = size
      uniforms.uHalo.value = halo
      uniforms.uVisible.value = visible
      for (const s of stars) {
        const m = s.material as PointsMaterial
        m.opacity = starOpacity
        s.visible = starOpacity > 0.01
      }
    },
    follow(pos, radius) {
      group.position.copy(pos)
      dome.scale.setScalar(radius)
      for (const s of stars) s.scale.setScalar(radius * 0.98)
    },
    environment(renderer) {
      pmrem ??= new PMREMGenerator(renderer)
      const next = pmrem.fromScene(envScene, 0.04, 0.1, 100)
      envRT?.dispose()
      envRT = next
    },
    envTexture: () => envRT?.texture ?? null,
    setTime(t) {
      uniforms.uTime.value = t
    },
    dispose() {
      dome.geometry.dispose()
      envDome.geometry.dispose()
      material.dispose()
      for (const s of stars) {
        s.geometry.dispose()
        ;(s.material as PointsMaterial).dispose()
      }
      envRT?.dispose()
      pmrem?.dispose()
    },
  }
}
