import type { BufferAttribute } from 'three'
/**
 * `buildBonsai`: a pure, deterministic generator. The same
 * `style|species|size` always yields the same tree, which is what makes deep
 * links, screenshots and the build-matrix test reproducible.
 *
 * Reveal strategy (content.md §1/§2 adapted to trees):
 * - pot, soil and rock rise behind one clipping plane with a section cap;
 * - wood grows along its own growth path (growth-material.ts);
 * - foliage pads and moss scale in with the staggered envelope;
 * - training wire coils on and strips off in the Harigane stage.
 */
import type { TimelineState } from '../timeline'
import type { PadInfo } from './foliage'
import type { BonsaiUniforms } from './growth-material'
import type { RockSpec } from './rock'
import type { SizeId } from './sizes'
import type { PadSeed } from './skeleton'
import type { SpeciesId } from './species'
import type { StyleId } from './styles'
import type { GrowCtx } from './trunk'
import { Box3, Group, Mesh, Plane, Vector3 } from 'three'
import { buildBranches } from './branches'
import { capMaterial, potMaterial } from './ceramic'
import { buildFoliage } from './foliage'
import { barkMaterial, createBonsaiUniforms, growthDepthMaterial } from './growth-material'
import { buildMoss, soilMaterial } from './moss'
import { capGeometry, innerFrac, potBands, potGeometry, potSpec, soilGeometry } from './pot'
import { createRng, seedFor } from './rng'
import { makeRockSpec, rockBands, rockGeometry, rockRadius, stoneMaterial } from './rock'
import { sizeById, sizeHeightM } from './sizes'
import { assignGrowth, polylineLength } from './skeleton'
import { speciesById } from './species'
import { styleById } from './styles'
import { buildTrunks } from './trunk'
import { sweepLimbs } from './tube'
import { buildWire } from './wire'

export interface BonsaiOptions {
  style: StyleId
  species: SpeciesId
  size: SizeId
  seed?: number
  /** Leaf instance cap; cut hard on small screens. */
  leafBudget?: number
}

export type Band = [number, number, number, number]

export interface BonsaiMeta {
  seed: number
  height: number
  bounds: Box3
  potBottom: number
  potTop: number
  soilY: number
  footprint: { w: number, d: number }
  growthLength: number
  capBands: Band[]
  planeRange: [number, number]
  wireBounds: Box3 | null
  pads: PadInfo[]
  stats: { limbs: number, vertices: number, triangles: number, leaves: number, wireMembers: number }
}

export interface BonsaiBuild {
  group: Group
  meta: BonsaiMeta
  uniforms: BonsaiUniforms
  clip: Plane
  applyTimeline: (s: TimelineState) => void
  dispose: () => void
}

const SPREAD: Partial<Record<StyleId, number>> = { 'kengai': 0.3, 'han-kengai': 0.32, 'yose-ue': 0.62, 'ikadabuki': 0.6, 'bunjingi': 0.3, 'hokidachi': 0.5 }

function padDelays(seeds: PadSeed[], order: (i: number) => number): PadInfo[] {
  const ranked = seeds.map((p, i) => ({ i, key: order(p.limb) * 10 + p.c[1] })).sort((a, b) => a.key - b.key)
  const delay = Array.from<number>({ length: seeds.length }).fill(0)
  ranked.forEach((r, k) => {
    delay[r.i] = seeds.length > 1 ? (k / (seeds.length - 1)) * 0.5 : 0
  })
  return seeds.map((p, i) => ({ c: p.c, r: p.r, flat: p.flat, delay: delay[i] as number }))
}

export function buildBonsai(opts: BonsaiOptions): BonsaiBuild {
  const style = styleById(opts.style)
  const species = speciesById(opts.species)
  const sizeId = style.snapSize ?? opts.size
  const H = sizeHeightM(sizeId)
  const seed = opts.seed ?? seedFor(style.id, species.id, sizeId)
  const rng = createRng(seed)
  const multi = style.id === 'yose-ue' || style.id === 'ikadabuki' ? 1 : 0
  const depth = Math.max(1, sizeById(sizeId).ramification - (style.simplify ?? 0) - multi)
  const pot = potSpec(style.pot, H, H * (SPREAD[style.id] ?? 0.45))
  const f = style.pot === 'slab' ? 0.86 : innerFrac(style.pot)
  const mound = style.pot === 'slab' ? pot.h * 0.9 : pot.h * 0.06

  let rock: RockSpec | undefined
  if (style.id === 'sekijoju')
    rock = makeRockSpec(rng.fork('rock'), [0, pot.soilY - 0.03 * H, 0], 0.34 * H, 0.17 * H, 0.14)
  else if (style.id === 'ishitsuki')
    rock = makeRockSpec(rng.fork('rock'), [0, pot.rimY - 0.01 * H, -pot.d * 0.1], 0.6 * H, 0.19 * H, 0.22)

  const soilAt = (x: number, z: number) => {
    const rr = Math.min(1, Math.hypot(x / (pot.w * f), z / (pot.d * f)))
    return pot.soilY + mound * (1 - rr * rr)
  }

  const inside = (x: number, z: number) => (Math.abs(x) / (pot.w * f)) ** pot.n + (Math.abs(z) / (pot.d * f)) ** pot.n
  const edge = (x: number, z: number, dx: number, dz: number) => {
    let k = 0
    const step = Math.min(pot.w, pot.d) * f * 0.02
    while (k < pot.w * 3 && inside(x + dx * k, z + dz * k) < 0.92) k += step
    return k
  }
  const ctx: GrowCtx = { rng: rng.fork('tree'), H, style: style.id, species, depth, pot, rock, soilAt, edge, limbs: [], pads: [], guys: [] }
  const plans = buildTrunks(ctx)
  buildBranches(ctx, plans)
  assignGrowth(ctx.limbs)

  const uniforms = createBonsaiUniforms()
  const clip = new Plane(new Vector3(0, -1, 0), 1e3)
  const group = new Group()
  group.name = 'bonsai'

  const trunkR = Math.max(...plans.map(p => ctx.limbs[p.limb]?.radii[0] ?? 0.001), 0.001)
  const { geometry: woodGeo, stats } = sweepLimbsSafe(ctx)
  const wood = new Mesh(woodGeo, barkMaterial(species, trunkR, H, uniforms))
  wood.castShadow = true
  wood.receiveShadow = true
  wood.customDepthMaterial = growthDepthMaterial(uniforms)
  wood.name = 'wood'
  group.add(wood)

  const pads = padDelays(ctx.pads, i => ctx.limbs[i]?.order ?? 0)
  const foliage = buildFoliage(pads, species, H, rng.fork('leaves'), uniforms, opts.leafBudget ?? 9000)
  for (const m of foliage.meshes) group.add(m)

  const wire = buildWire(ctx.limbs, ctx.guys, species.wire, uniforms)
  if (wire)
    group.add(wire.mesh)

  const potMesh = new Mesh(potGeometry(pot), style.pot === 'slab' ? stoneMaterial('#56524c', '#2e2b28', pot.w, clip) : potMaterial(species.glaze, clip, pot.w))
  potMesh.castShadow = true
  potMesh.receiveShadow = true
  group.add(potMesh)

  const soil = new Mesh(soilGeometry(pot, mound), soilMaterial(uniforms, clip, H))
  soil.receiveShadow = true
  group.add(soil)

  let rockTop = 0
  const capBands: Band[] = potBands(pot, Math.max(0.0015, pot.h / 40))
  if (rock) {
    const rm = new Mesh(rockGeometry(rock), stoneMaterial('#7a756c', '#3b3834', rock.height, clip))
    rm.castShadow = true
    rm.receiveShadow = true
    group.add(rm)
    rockTop = rock.base[1] + rock.height
    capBands.push(...rockBands(rock, rock.height / 30).filter(b => b[0] > pot.soilY + mound))
  }
  for (const m of buildMoss(pot, soilAt, trunkR, uniforms, rng.fork('moss'), H)) group.add(m)

  const cap = new Mesh(capGeometry(pot.d / pot.w, pot.n), capMaterial(species.glaze ?? '#5a3f31', pot.wall / pot.w * 1.6))
  cap.visible = false
  group.add(cap)
  const rockCap = rock ? new Mesh(capGeometry(1, 2, 48), capMaterial('#4a4640', 0)) : null
  if (rockCap) {
    rockCap.visible = false
    group.add(rockCap)
  }

  const bounds = new Box3().setFromObject(potMesh)
  if (woodGeo.boundingBox)
    bounds.union(woodGeo.boundingBox)
  for (const p of pads) bounds.expandByPoint(new Vector3(p.c[0] - p.r, p.c[1] - p.r * p.flat, p.c[2] - p.r)).expandByPoint(new Vector3(p.c[0] + p.r, p.c[1] + p.r * p.flat, p.c[2] + p.r))
  const wireBounds = wire ? new Box3().setFromObject(wire.mesh) : null
  const planeRange: [number, number] = [-0.0005, Math.max(pot.soilY + mound, rockTop) + H * 0.005]

  const applyTimeline = (s: TimelineState) => {
    const h = planeRange[0] + (planeRange[1] - planeRange[0]) * s.plane
    clip.constant = s.plane >= 1 ? 1e3 : group.position.y + h
    cap.visible = false
    if (rockCap)
      rockCap.visible = false
    if (s.plane > 0 && s.plane < 1) {
      const band = capBands.find(b => h >= b[0] && h <= b[1])
      if (band && band[2] > 0) {
        const isRock = rock && rockCap && h > pot.soilY + mound
        if (isRock && rock && rockCap) {
          const y = h - rock.base[1]
          const pos = rockCap.geometry.getAttribute('position') as BufferAttribute
          for (let j = 1; j < pos.count; j++) {
            const th = ((j - 1) / (pos.count - 1)) * Math.PI * 2
            const r = rockRadius(rock, y, th) * 0.985
            pos.setXYZ(j, Math.cos(th) * r, 0, Math.sin(th) * r)
          }
          pos.needsUpdate = true
          rockCap.geometry.computeBoundingSphere()
          rockCap.position.set(rock.base[0], h - 0.0002, rock.base[2])
          rockCap.visible = true
        }
        else {
          cap.scale.set(band[2], 1, band[2])
          cap.position.y = h - 0.0002
          cap.visible = true
        }
      }
    }
    uniforms.uGrowth.value = s.growth
    uniforms.uFoliage.value = s.foliage
    uniforms.uWireGrow.value = s.wireGrow
    uniforms.uWireOut.value = s.wireVisible ? s.wireOut : 1
    uniforms.uMoss.value = s.moss
    if (wire)
      wire.mesh.visible = s.wireVisible
  }

  const dispose = () => {
    group.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh)
        return
      m.geometry.dispose()
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      for (const mat of mats) mat.dispose()
      m.customDepthMaterial?.dispose()
    })
    group.removeFromParent()
  }

  return {
    group,
    uniforms,
    clip,
    applyTimeline,
    dispose,
    meta: {
      seed,
      height: H,
      bounds,
      potBottom: 0,
      potTop: pot.rimY,
      soilY: pot.soilY,
      footprint: { w: pot.w, d: pot.d },
      growthLength: 4,
      capBands,
      planeRange,
      wireBounds,
      pads,
      stats: { limbs: ctx.limbs.length, vertices: stats.vertices, triangles: stats.triangles, leaves: foliage.leaves, wireMembers: wire?.members ?? 0 },
    },
  }
}

function sweepLimbsSafe(ctx: GrowCtx) {
  const trunkR = Math.max(...ctx.limbs.filter(l => l.order === 0).map(l => l.radii[0] ?? 0), 0.001)
  const total = ctx.limbs.reduce((a, l) => a + polylineLength(l.pts), 0)
  if (!(total > 0))
    throw new Error('bonsai skeleton is empty')
  return sweepLimbs(ctx.limbs, trunkR)
}
