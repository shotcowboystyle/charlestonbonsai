/**
 * Resolves batch keys to materials: the shared kit set, the canopy palette,
 * then any landscape-specific extras. Everything resolved is owned by the
 * landscape's KitMaterials and disposed with it.
 */
import type { Material, Mesh, Object3D } from 'three'
import type { KitMaterials, MatKey } from './materials'
import { canopyMaterial } from './trees'

const CANOPY: Record<string, string> = {
  mapleLeaf: '#c9561f',
  mapleRed: '#a8261b',
  mapleGold: '#d18f2a',
  cherryLeaf: '#efc2cf',
  cherryWhite: '#f4e8ea',
  plumLeaf: '#f3efe6',
  sugiLeaf: '#24361f',
  pineLeaf: '#2c4428',
  bambooLeaf: '#5d7a32',
  greenLeaf: '#3e5f2a',
  darkLeaf: '#29401f',
  frostGrass: '#9a9270',
  snowPine: '#c4ccc8',
  snowSugi: '#aeb8b3',
}

export function resolver(mats: KitMaterials, extra: Record<string, () => Material> = {}, exposure = 1): (key: string) => Material {
  return (key: string) => {
    const make = extra[key]
    if (make)
      return mats.own(key, make)
    const canopy = CANOPY[key]
    if (canopy)
      return mats.own(key, () => canopyMaterial(canopy, exposure))
    return mats.get(key as MatKey)
  }
}

/** Dispose every geometry and material under a root. Safe to call twice. */
export function disposeGroup(root: Object3D): void {
  root.traverse((o) => {
    const m = o as Mesh
    if (!m.geometry)
      return
    m.geometry.dispose()
    const mats = Array.isArray(m.material) ? m.material : [m.material]
    for (const mat of mats) mat?.dispose()
    m.customDepthMaterial?.dispose()
  })
  root.removeFromParent()
}
