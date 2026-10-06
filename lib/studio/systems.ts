/**
 * Ambient systems layered on the world: precipitation, splash rings, mist,
 * sky rays, falling petals and leaves, motes, and procedural audio. Each
 * follows the current landscape and atmosphere; none is driven by the
 * timeline, so scrubbing never disturbs them.
 */
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { LookController } from './look'
import type { Leaves, Motes } from './particles'
import type { SkyRig } from './sky'
import type { World } from './world'
import { Color, Vector3 } from 'three'
import { AmbienceEngine } from './audio'
import { createLeaves, createMotes } from './particles'
import { createRays } from './rays'
import { createMist } from './weather/mist'
import { createPrecipitation } from './weather/precipitation'
import { createSplashes } from './weather/puddles'
import { createShafts } from './weather/shafts'

export interface SystemsContext {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  world: World
  look: LookController
  sky: SkyRig
  quality: 'high' | 'low'
  reducedMotion: boolean
}

export interface AudioControls {
  enabled: () => boolean
  setEnabled: (on: boolean) => void
}

export function createSystems(c: SystemsContext) {
  const precip = createPrecipitation(c.quality, c.renderer.getPixelRatio())
  const splashes = createSplashes(c.quality)
  const mist = createMist(c.quality)
  const shafts = createShafts()
  const rays = c.quality === 'high' ? createRays(c.renderer) : null
  const audio = new AmbienceEngine()
  c.scene.add(precip.rain, precip.snow, splashes.mesh, mist.group, shafts.group)
  let leaves: Leaves | null = null
  let motes: Motes | null = null
  let dust: Motes | null = null
  let atmoId = ''
  let lastRadius = -1
  const light = new Color()
  const sun = new Color()
  const amb = new Color()
  const origin = new Vector3()
  const box = new Vector3()
  const calm = c.reducedMotion ? 0.3 : 1

  function remix(): void {
    const meta = c.world.entry
    if (!meta)
      return
    audio.mix(meta.ambience, c.look.fader.to.rain, c.look.fader.to.snow)
  }

  function placeSplashes(radius: number): void {
    const land = c.world.land
    if (!land)
      return
    const room = land.interior?.box
    splashes.place(land.groundAt, c.look.focus, Math.max(1.4, radius * 2), 1, room ? (x, z) => x < room.min.x - 0.3 || x > room.max.x + 0.3 || z < room.min.z - 0.3 || z > room.max.z + 0.3 : undefined)
  }

  return {
    stage(si: number): void {
      if (si > 0)
        audio.bell(si, si === 6)
    },
    landscape(): void {
      const entry = c.world.entry
      const land = c.world.land
      for (const sys of [leaves, motes, dust]) {
        if (sys) {
          c.scene.remove('mesh' in sys ? sys.mesh : sys.points)
          sys.dispose()
        }
      }
      leaves = null
      motes = null
      dust = null
      if (!entry || !land)
        return
      if (entry.falling !== 'none' && land.fallSource) {
        leaves = createLeaves(entry.falling, land.fallSource, c.quality)
        c.scene.add(leaves.mesh)
      }
      if (entry.motes !== 'none') {
        motes = createMotes(entry.motes, c.quality, c.renderer.getPixelRatio())
        c.scene.add(motes.points)
      }
      // Interiors always carry dust in the window light (3d-wood-lighting-scorecard).
      if (entry.interior && entry.motes !== 'dust') {
        dust = createMotes('dust', c.quality, c.renderer.getPixelRatio())
        c.scene.add(dust.points)
      }
      precip.setInterior(land.interior?.box ?? land.shelter ?? null)
      lastRadius = -1
      remix()
    },
    update(_dt: number, t: number): void {
      const L = c.look.current
      const land = c.world.land
      if (c.look.id !== atmoId) {
        atmoId = c.look.id
        remix()
      }
      const radius = c.camera.position.distanceTo(c.look.focus)
      if (Math.abs(radius - lastRadius) > lastRadius * 0.3) {
        lastRadius = radius
        placeSplashes(radius)
      }
      light.setRGB(...L.fogColor).lerp(new Color(...L.keyColor), 0.3).multiplyScalar(0.9 + L.exposure * 0.2)
      const tile = Math.min(28, Math.max(5, radius * 7))
      precip.update({ camera: c.camera, time: t, rain: L.rain * calm, snow: L.snow * calm, tile, groundY: land?.floorY ?? 0, light, gust: Math.min(0.35, 0.1 + Math.sin(t * 0.05) * 0.1) * L.snow })
      splashes.update(t, c.look.wet * calm * (land?.interior ? 0.6 : 1), light)
      sun.setRGB(...L.keyColor).multiplyScalar(L.keyI * 0.35)
      amb.setRGB(...L.hemiSky).multiplyScalar(L.hemiI * 0.5)
      mist.update({ time: t, density: land?.interior ? 0 : L.mist, fog: new Color(...L.fogColor), sun, sunDir: c.look.sunDir, floorY: land?.floorY ?? 0 })
      leaves?.update(t, 0.35 + L.rain * 0.3, sun, amb)
      shafts.update(land?.apertures ?? [], c.look.sunDir, new Color(...L.keyColor), (0.4 + L.rays * 0.6) * Math.min(1.2, L.keyI / 2.2), t, c.camera.position)
      if (motes) {
        const em = land?.emitters
        const entry = c.world.entry
        const pt = entry?.motes === 'embers' ? em?.embers : entry?.motes === 'incense' ? em?.incense : entry?.motes === 'spray' ? em?.spray : undefined
        origin.copy(pt ?? c.look.focus)
        const s = Math.max(1, radius * 1.4)
        box.set(s, entry?.motes === 'dust' ? s * 0.8 : 1.4, s)
        motes.update(t, origin, box, 0.4 + L.rays * 0.6 + L.glow * 0.3)
      }
      if (dust) {
        const s = Math.max(1.5, radius * 1.4)
        dust.update(t, c.look.focus, box.set(s, s * 0.8, s), 0.5 + L.rays * 0.5)
      }
    },
    /** Called after the main pass: sky rays composite over the frame. */
    render(): void {
      const L = c.look.current
      rays?.render({ scene: c.scene, camera: c.camera, sky: c.sky, sunDir: c.look.sunDir, intensity: L.rays * (c.world.land?.interior ? 1.4 : 1) * (1 - L.rain), tint: new Color(...L.keyColor) })
    },
    resize(w: number, h: number): void {
      rays?.setSize(w * c.renderer.getPixelRatio(), h * c.renderer.getPixelRatio())
    },
    audio: {
      enabled: () => audio.on,
      setEnabled: (v: boolean) => {
        audio.setEnabled(v)
        if (v)
          remix()
      },
    } as AudioControls,
    dispose(): void {
      precip.dispose()
      splashes.dispose()
      mist.dispose()
      shafts.dispose()
      rays?.dispose()
      leaves?.dispose()
      motes?.dispose()
      dust?.dispose()
      audio.dispose()
    },
  }
}
