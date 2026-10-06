/**
 * Owns what is in the world: the current landscape, the display, and the
 * bonsai on it. Switching any of them disposes the previous geometry and
 * materials — a swap that leaks eventually crashes a long-lived page.
 */
import type { Mesh, Object3D, PointLight, Scene } from 'three'
import type { BonsaiBuild } from './bonsai/build'
import type { SizeId } from './bonsai/sizes'
import type { SpeciesId } from './bonsai/species'
import type { StyleId } from './bonsai/styles'
import type { Framing } from './camera'
import type { Display } from './landscapes/kit/display'
import type { LandscapeId, Season } from './landscapes/meta'
import type { KitUniforms, LandscapeEntry, LandscapeInstance } from './landscapes/types'
import { Box3, Vector3 } from 'three'
import { buildBonsai } from './bonsai/build'
import { createRng, hashString } from './bonsai/rng'
import { seasonalDisplay, speciesById } from './bonsai/species'
import { computeFraming } from './camera'
import { landscapeById } from './landscapes/index'
import { buildDisplay } from './landscapes/kit/display'
import { KitMaterials } from './landscapes/kit/materials'
import { disposeGroup } from './landscapes/kit/resolve'

const SEASON_W: Record<Season, [number, number, number, number]> = {
  spring: [1, 0, 0, 0],
  summer: [0, 1, 0, 0],
  fall: [0, 0, 1, 0],
  winter: [0, 0, 0, 1],
}

export interface WorldOptions {
  scene: Scene
  quality: 'high' | 'low'
  uniforms: KitUniforms
  lights: PointLight[]
  reducedMotion: boolean
}

export class World {
  entry: LandscapeEntry | null = null
  land: LandscapeInstance | null = null
  mats: KitMaterials | null = null
  displayMats: KitMaterials | null = null
  display: Display | null = null
  bonsai: BonsaiBuild | null = null
  tree: { style: StyleId, species: SpeciesId, size: SizeId } | null = null

  constructor(private o: WorldOptions) {}

  setLandscape(id: LandscapeId): void {
    this.disposeLandscape()
    const entry = landscapeById(id)
    const mats = new KitMaterials(!entry.interior)
    for (const l of this.o.lights) {
      l.userData.base = 0
      l.intensity = 0
    }
    const land = entry.build({
      rng: createRng(hashString(id)),
      quality: this.o.quality,
      mats,
      uniforms: this.o.uniforms,
      lights: this.o.lights,
      clear: this.display?.radius ?? 0.4,
      reducedMotion: this.o.reducedMotion,
    })
    this.entry = entry
    this.land = land
    this.mats = mats
    land.group.name = `landscape:${id}`
    dither(land.group)
    this.o.scene.add(land.group)
    this.placeDisplay()
    this.applySeason()
  }

  setTree(style: StyleId, species: SpeciesId, size: SizeId, leafBudget: number): void {
    this.bonsai?.dispose()
    this.bonsai = buildBonsai({ style, species, size, leafBudget })
    this.tree = { style, species, size }
    dither(this.bonsai.group)
    this.o.scene.add(this.bonsai.group)
    this.placeDisplay()
    this.applySeason()
  }

  private placeDisplay(): void {
    if (!this.entry || !this.land || !this.bonsai)
      return
    if (this.display)
      disposeGroup(this.display.group)
    this.displayMats?.dispose()
    this.displayMats = new KitMaterials(!this.entry.interior)
    this.display = buildDisplay(this.entry.display, this.bonsai.meta, this.displayMats, this.land.floorY)
    dither(this.display.group)
    this.o.scene.add(this.display.group)
    this.bonsai.group.position.set(0, this.land.floorY + this.display.top, 0)
    this.land.setClear?.(this.display.radius)
  }

  private applySeason(): void {
    if (!this.entry || !this.bonsai || !this.tree)
      return
    const [sp, su, fa, wi] = SEASON_W[this.entry.season]
    const u = this.bonsai.uniforms
    u.uSeason.value.set(sp, su, fa, wi)
    const d = seasonalDisplay(speciesById(this.tree.species), { spring: sp, summer: su, fall: fa, winter: wi })
    u.uThin.value = d.thin
    u.uBloomHide.value = d.bloomHide
    u.uFruitHide.value = d.fruitHide
  }

  /** Subject box in world space: tree, pot and the display top. */
  subjectBox(): Box3 {
    const box = new Box3()
    if (!this.bonsai)
      return box.set(new Vector3(-0.1, 0, -0.1), new Vector3(0.1, 0.2, 0.1))
    box.copy(this.bonsai.meta.bounds).translate(this.bonsai.group.position)
    if (this.display) {
      const y = this.bonsai.group.position.y
      box.expandByPoint(new Vector3(0, y - Math.min(0.04, this.display.top * 0.3), 0))
    }
    return box
  }

  framing(): Framing {
    const room = this.land?.interior
    return computeFraming(this.subjectBox(), room ? { radius: room.radius, ceil: room.ceil } : undefined, this.land?.floorY ?? 0)
  }

  disposeLandscape(): void {
    if (this.land) {
      this.land.dispose()
      disposeGroup(this.land.group)
    }
    this.mats?.dispose()
    this.land = null
    this.mats = null
  }

  dispose(): void {
    this.disposeLandscape()
    if (this.display)
      disposeGroup(this.display.group)
    this.displayMats?.dispose()
    this.bonsai?.dispose()
    this.display = null
    this.bonsai = null
  }
}

/** Dither lit materials so dark walls and skies never band in 8-bit output. */
function dither(root: Object3D): void {
  root.traverse((o) => {
    const m = (o as Mesh).material
    for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
      if ('dithering' in mat)
        mat.dithering = true
    }
  })
}
