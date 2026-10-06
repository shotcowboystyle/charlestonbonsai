/**
 * Landscape registry: display data from meta.ts joined to each build. Adding
 * a landscape is adding a meta entry and a builder; nothing else branches.
 */
import type { LandscapeId } from './meta'
import type { LandscapeContext, LandscapeEntry, LandscapeInstance } from './types'
import { buildAlpineValley } from './alpine-valley'
import { buildCoastalCliff } from './coastal-cliff'
import { buildKoiPond } from './koi-pond'
import { LANDSCAPE_META } from './meta'
import { buildMonasteryCourtyard } from './monastery-courtyard'
import { buildMountainDojo } from './mountain-dojo'
import { buildRockGarden } from './rock-garden'
import { buildSacredSpring } from './sacred-spring'
import { buildSpringBlossom } from './spring-blossom'
import { buildTeahouse } from './teahouse'
import { buildWaterPavilion } from './water-pavilion'
import { buildWaterfallGrotto } from './waterfall-grotto'
import { buildWinterDojo } from './winter-dojo'

export type { LandscapeContext, LandscapeEntry, LandscapeInstance } from './types'

const BUILDERS: Record<LandscapeId, (ctx: LandscapeContext) => LandscapeInstance> = {
  'rock-garden': buildRockGarden,
  'mountain-dojo': buildMountainDojo,
  'winter-dojo': buildWinterDojo,
  'monastery-courtyard': buildMonasteryCourtyard,
  'koi-pond': buildKoiPond,
  'waterfall-grotto': buildWaterfallGrotto,
  'coastal-cliff': buildCoastalCliff,
  'teahouse': buildTeahouse,
  'sacred-spring': buildSacredSpring,
  'spring-blossom': buildSpringBlossom,
  'water-pavilion': buildWaterPavilion,
  'alpine-valley': buildAlpineValley,
}

export const LANDSCAPES: readonly LandscapeEntry[] = LANDSCAPE_META.map(m => ({ ...m, build: BUILDERS[m.id] }))

export function landscapeById(id: LandscapeId): LandscapeEntry {
  const l = LANDSCAPES.find(x => x.id === id)
  if (!l)
    throw new RangeError(`Unknown landscape: ${id}`)
  return l
}
