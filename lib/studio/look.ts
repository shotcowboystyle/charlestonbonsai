/**
 * Applies the crossfaded atmosphere to the scene: key, fill, rim and
 * hemisphere lights, fog, sky, exposure, emissive glow and environment.
 * Settled snow and wetness accumulate on their own slow clocks and reach the
 * lighting through a throttled `refresh()` rather than every frame.
 */
import type { DirectionalLight, FogExp2, HemisphereLight, PointLight, Scene, WebGLRenderer } from 'three'
import type { AtmoId, AtmoLook } from './atmospheres'
import type { GlowEntry } from './landscapes/kit/materials'
import type { SkyRig } from './sky'
import { Color, Vector3 } from 'three'
import { atmoById, atmoLook } from './atmospheres'
import { Crossfader, stepAccumulator } from './crossfade'
import { glowUniform } from './landscapes/kit/glow'
import { weatherUniforms } from './weather/cover'

export interface LookRig {
  scene: Scene
  renderer: WebGLRenderer
  hemi: HemisphereLight
  key: DirectionalLight
  fill: DirectionalLight
  rim: DirectionalLight
  sky: SkyRig
  points: PointLight[]
}

const SNOW_UP = 7
const SNOW_DOWN = 2.5
const WET_UP = 5
const WET_DOWN = 3

export class LookController {
  fader: Crossfader<AtmoLook>
  current: AtmoLook
  snow = 0
  wet = 0
  id: AtmoId
  glow: GlowEntry[] = []
  /** Shadow frustum centre and half-size, from the subject framing. */
  focus = new Vector3()
  extent = 2
  sunDir = new Vector3()
  interior = false
  fogScale = 1
  /** Interiors raise a low sun so window light reaches the floor. */
  minSunEl = -1
  private applied = { snow: -1, wet: -1, mix: -1 }
  private sinceEnv = 1e3
  private tmp = new Color()

  constructor(private rig: LookRig, id: AtmoId) {
    this.id = id
    this.current = atmoLook(atmoById(id))
    this.fader = new Crossfader(this.current, 1.6)
  }

  set(id: AtmoId, instant: boolean): void {
    this.id = id
    const next = atmoLook(atmoById(id))
    this.fader.set(next, instant)
    if (instant) {
      this.snow = next.snow
      this.wet = next.rain
    }
    this.current = this.fader.current()
    this.apply()
  }

  /** Advance fades and accumulation; re-light when something visible changed. Returns true when the light moved. */
  step(dt: number): boolean {
    const fading = this.fader.step(dt)
    const to = this.fader.to
    this.snow = stepAccumulator(this.snow, to.snow, dt, SNOW_UP, SNOW_DOWN)
    this.wet = stepAccumulator(this.wet, to.rain, dt, WET_UP, WET_DOWN)
    weatherUniforms.uSnow.value = this.snow
    weatherUniforms.uWet.value = this.wet
    this.sinceEnv += dt
    if (fading) {
      if (this.fader.mix >= 1)
        this.sinceEnv = 1e3
      this.current = this.fader.current()
      this.apply()
      return true
    }
    if (Math.abs(this.snow - this.applied.snow) > 0.02 || Math.abs(this.wet - this.applied.wet) > 0.02)
      this.refresh()
    return false
  }

  /** Re-apply the current mix without advancing it (slow external values). */
  refresh(): void {
    this.apply()
  }

  apply(): void {
    const L = this.current
    const r = this.rig
    const el = Math.max(L.sunEl, this.minSunEl)
    const ce = Math.cos(el)
    this.sunDir.set(ce * Math.sin(L.sunAz), Math.sin(el), ce * Math.cos(L.sunAz)).normalize()
    const ext = this.extent * (1 + 0.8 * ce)
    const dist = Math.max(ext * 3, 4)
    r.key.position.copy(this.focus).addScaledVector(this.sunDir, dist)
    r.key.target.position.copy(this.focus)
    r.key.target.updateMatrixWorld()
    r.key.color.setRGB(...L.keyColor)
    r.key.intensity = L.keyI
    const sc = r.key.shadow.camera
    sc.left = -ext
    sc.right = ext
    sc.top = ext
    sc.bottom = -ext
    sc.near = 0.01
    sc.far = dist * 2.2
    sc.updateProjectionMatrix()
    r.key.shadow.bias = -0.0006
    r.key.shadow.normalBias = ext * 0.009
    r.fill.color.setRGB(...L.fillColor)
    r.fill.intensity = L.fillI * (this.interior ? 0.35 : 1)
    r.fill.position.copy(this.focus).add(new Vector3(-this.sunDir.x, 0.6, -this.sunDir.z).multiplyScalar(dist))
    r.rim.color.setRGB(...L.rimColor)
    r.rim.intensity = L.rimI * (this.interior ? 0.5 : 1)
    r.rim.position.copy(this.focus).add(new Vector3(-this.sunDir.z, 0.35, this.sunDir.x).multiplyScalar(-dist))
    r.hemi.color.setRGB(...L.hemiSky)
    r.hemi.groundColor.setRGB(...L.hemiGround).lerp(this.tmp.setRGB(0.85, 0.87, 0.9), this.snow * 0.45)
    r.hemi.intensity = L.hemiI * (this.interior ? 0.22 : 1)
    const fog = r.scene.fog as FogExp2
    fog.color.setRGB(...L.fogColor)
    fog.density = L.fogDensity * this.fogScale * (1 + this.wet * 0.15)
    r.renderer.toneMappingExposure = L.exposure
    r.sky.setLook(L.sky, this.sunDir, L.diskColor, L.diskSize, L.halo, L.disk, L.stars)
    for (const g of this.glow) g.mat.emissiveIntensity = g.base * ((g.floor ?? 0) + L.glow * (1 - (g.floor ?? 0)))
    glowUniform.value = L.glow
    for (const p of r.points) p.intensity = (p.userData.base as number ?? 0) * L.glow
    r.scene.environmentIntensity = this.interior ? 0.12 : 0.7
    this.applied = { snow: this.snow, wet: this.wet, mix: this.fader.mix }
    if (this.sinceEnv > 0.25) {
      r.sky.environment(r.renderer)
      r.scene.environment = r.sky.envTexture()
      this.sinceEnv = 0
    }
  }
}
