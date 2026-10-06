/**
 * The contract every landscape implements. A landscape owns its `build`,
 * which returns a group to dispose on switch plus the facts the engine needs:
 * where the display floor is, whether it is an interior (camera clamp and
 * precipitation mask), what glows, and any per-frame animation.
 */
import type { Box3, Group, Material, PointLight, Vector3 } from 'three'
import type { Rng } from '../bonsai/rng'
import type { Aperture } from '../weather/shafts'
import type { KitMaterials } from './kit/materials'
import type { LandscapeMeta } from './meta'

export interface KitUniforms {
  uTime: { value: number }
  uWind: { value: number }
}

export interface LandscapeContext {
  rng: Rng
  quality: 'high' | 'low'
  mats: KitMaterials
  uniforms: KitUniforms
  /** Two pooled point lights (brazier, lantern) the landscape may claim. */
  lights: PointLight[]
  /** Keep props outside this radius so the display has room. */
  clear: number
  reducedMotion: boolean
}

export interface InteriorSpec {
  /** Room volume: precipitation is discarded inside it, the camera kept within. */
  box: Box3
  /** Max orbit radius that keeps the camera inside the walls. */
  radius: number
  ceil: number
  /** Floor for the key light's elevation so window light lands on the floor (radians). */
  minSunEl?: number
}

export interface LandscapeInstance {
  group: Group
  /** Height of the floor the display stands on, at the origin. */
  floorY: number
  /** Ground height for scatter and puddles outside. */
  groundAt: (x: number, z: number) => number
  interior?: InteriorSpec
  /** Windows and doors (from kit room()), for authored light shafts. */
  apertures?: Aperture[]
  /** Multiplier on the atmosphere's fog density (a sea view needs to carry further). */
  fogScale?: number
  /** Preferred resting view for this setting (radians); the reset target. */
  view?: { az?: number, el?: number }
  /** A covered volume (a cavern, an eave) where rain and snow must not fall, without the interior camera rules. */
  shelter?: Box3
  /** Objects hidden from the still-water reflection pass (grass, particles). */
  noReflect?: Material[]
  /** Spawn area for falling petals and leaves: centre and radius. */
  fallSource?: { centre: Vector3, radius: number, height: number }
  /** World points that emit motes: brazier embers, incense smoke, waterfall spray. */
  emitters?: Partial<Record<'embers' | 'incense' | 'spray', Vector3>>
  update?: (dt: number, time: number) => void
  /** Called when the display footprint changes (e.g. rake rings around it). */
  setClear?: (radius: number) => void
  dispose: () => void
}

export interface LandscapeEntry extends LandscapeMeta {
  build: (ctx: LandscapeContext) => LandscapeInstance
}
