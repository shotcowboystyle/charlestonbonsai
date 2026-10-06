/**
 * Occlusion-aware sky rays (3d-sky-rays). A quarter-resolution mask holds
 * open sky (its luminance above a threshold, nothing below the horizon) with
 * every opaque object drawn black over it, so rooflines, canopies, bamboo
 * and window frames cut the shafts. A radial march toward the projected sun
 * accumulates decaying samples, normalised by the weight sum, with static
 * jitter (no shimmer). The result is added over the frame. It fades as the
 * sun leaves the screen, is skipped entirely when its contribution is zero,
 * and is disabled on low-power profiles.
 *
 * Approximation, stated: compositing happens after tone mapping, at a small
 * gain, rather than in a linear HDR buffer.
 */
import type { Camera, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { SkyRig } from './sky'
import { AdditiveBlending, Color, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene as S, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget } from 'three'

const QUAD_VERT = 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'

const RAYS_FRAG = /* glsl */`
uniform sampler2D uMask;
uniform vec2 uSun;
uniform float uDensity, uDecay, uAspect;
varying vec2 vUv;
void main() {
  vec2 st = (vUv - uSun) * uDensity / 40.0;
  float jitter = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
  vec2 s = vUv - st * jitter;
  float sum = 0.0, wsum = 0.0, w = 1.0;
  for (int i = 0; i < 40; i++) {
    s -= st;
    if (s.x >= 0.0 && s.y >= 0.0 && s.x <= 1.0 && s.y <= 1.0) sum += min(texture2D(uMask, s).r, 2.5) * w;
    wsum += w;
    w *= uDecay;
  }
  float fall = exp(-length((vUv - uSun) * vec2(uAspect, 1.0)) * 1.4);
  gl_FragColor = vec4(vec3(sum / max(wsum, 1e-4) * fall), 1.0);
}`

const COMP_FRAG = /* glsl */`
uniform sampler2D uRays;
uniform vec3 uTint;
uniform float uGain;
varying vec2 vUv;
void main() {
  vec3 r = texture2D(uRays, vUv).rgb;
  gl_FragColor = vec4(r * uTint * uGain, 1.0);
}`

export interface Rays {
  render: (o: { scene: Scene, camera: PerspectiveCamera, sky: SkyRig, sunDir: Vector3, intensity: number, tint: Color }) => void
  setSize: (w: number, h: number) => void
  dispose: () => void
}

export function createRays(renderer: WebGLRenderer): Rays {
  const mask = new WebGLRenderTarget(4, 4)
  const rays = new WebGLRenderTarget(4, 4)
  const black = new MeshBasicMaterial({ color: 0x000000, fog: false })
  const ortho = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quad = new PlaneGeometry(2, 2)
  const raysMat = new ShaderMaterial({ uniforms: { uMask: { value: mask.texture }, uSun: { value: new Vector2() }, uDensity: { value: 0.85 }, uDecay: { value: 0.965 }, uAspect: { value: 1 } }, vertexShader: QUAD_VERT, fragmentShader: RAYS_FRAG, depthTest: false, depthWrite: false })
  const compMat = new ShaderMaterial({ uniforms: { uRays: { value: rays.texture }, uTint: { value: new Color() }, uGain: { value: 0 } }, vertexShader: QUAD_VERT, fragmentShader: COMP_FRAG, depthTest: false, depthWrite: false, transparent: true, blending: AdditiveBlending })
  const raysScene = new S()
  raysScene.add(new Mesh(quad, raysMat))
  const compScene = new S()
  compScene.add(new Mesh(quad, compMat))
  const sunNdc = new Vector3()
  const fwd = new Vector3()
  let aspect = 1

  function pass(scene: Scene, cam: Camera, target: WebGLRenderTarget | null, clear: boolean): void {
    renderer.setRenderTarget(target)
    if (clear)
      renderer.clear()
    renderer.render(scene, cam)
  }

  return {
    setSize(w, h) {
      mask.setSize(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4)))
      rays.setSize(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4)))
      aspect = w / Math.max(1, h)
    },
    render({ scene, camera, sky, sunDir, intensity, tint }) {
      camera.getWorldDirection(fwd)
      const facing = fwd.dot(sunDir)
      if (intensity < 0.02 || facing < 0.05)
        return
      sunNdc.copy(camera.position).addScaledVector(sunDir, camera.far * 0.4).project(camera)
      const sx = sunNdc.x * 0.5 + 0.5
      const sy = sunNdc.y * 0.5 + 0.5
      const off = Math.max(0, Math.max(Math.abs(sx - 0.5), Math.abs(sy - 0.5)) - 0.5)
      const gain = intensity * Math.max(0, 1 - off / 0.45) * Math.min(1, facing * 3)
      if (gain < 0.02)
        return
      const prev = { auto: renderer.autoClear, shadow: renderer.shadowMap.autoUpdate, layers: camera.layers.mask, over: scene.overrideMaterial, clear: renderer.getClearColor(new Color()), alpha: renderer.getClearAlpha() }
      renderer.autoClear = false
      renderer.shadowMap.autoUpdate = false
      renderer.setClearColor(0x000000, 1)
      sky.material.uniforms.uMask!.value = 1
      pass(sky.envScene, camera, mask, true)
      sky.material.uniforms.uMask!.value = 0
      camera.layers.disable(2)
      camera.layers.disable(3)
      sky.group.visible = false
      scene.overrideMaterial = black
      pass(scene, camera, mask, false)
      scene.overrideMaterial = prev.over
      sky.group.visible = true
      camera.layers.mask = prev.layers
      raysMat.uniforms.uSun!.value.set(sx, sy)
      raysMat.uniforms.uAspect!.value = aspect
      pass(raysScene, ortho, rays, true)
      compMat.uniforms.uTint!.value.copy(tint)
      compMat.uniforms.uGain!.value = gain * 0.55
      pass(compScene, ortho, null, false)
      renderer.setClearColor(prev.clear, prev.alpha)
      renderer.autoClear = prev.auto
      renderer.shadowMap.autoUpdate = prev.shadow
    },
    dispose() {
      mask.dispose()
      rays.dispose()
      black.dispose()
      quad.dispose()
      raysMat.dispose()
      compMat.dispose()
    },
  }
}
