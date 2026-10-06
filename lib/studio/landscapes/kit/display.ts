/**
 * The display the bonsai sits on: a wooden stand, a stone slab, a low table
 * or a natural stone seat, sized to the pot and tree. Cascades get a stand
 * tall enough for the trunk to fall past its edge.
 */
import type { Material } from 'three'
import type { BonsaiMeta } from '../../bonsai/build'
import type { DisplayKind } from '../meta'
import type { KitMaterials } from './materials'
import { CircleGeometry, Group, Mesh, ShaderMaterial, Vector3 } from 'three'
import { stoneMaterial } from '../../bonsai/rock'
import { at, Batch } from './batch'
import { beam, boulder } from './shapes'

export interface Display {
  group: Group
  /** World y of the display top relative to the floor. */
  top: number
  /** Half-extent of the display footprint. */
  radius: number
}

export function buildDisplay(kind: DisplayKind, meta: BonsaiMeta, mats: KitMaterials, floorY: number): Display {
  const H = meta.height
  const fw = meta.footprint.w
  const fd = meta.footprint.d
  // Only a real cascade counts: float noise at the pot's foot must not reshape every stand.
  const drop = -meta.bounds.min.y > meta.height * 0.02 ? -meta.bounds.min.y : 0
  const b = new Batch()
  // A cascade needs a narrow top so the trunk falls clear of the stand.
  const tw = Math.max(fw * (drop > 0 ? 1.08 : 1.3), 0.05)
  const td = Math.max(fd * (drop > 0 ? 1.1 : 1.35), 0.05)
  let top: number
  if (kind === 'stand' || kind === 'table') {
    const base = kind === 'stand' ? Math.min(0.42, 0.05 + H * 0.22) : Math.min(0.5, 0.12 + H * 0.3)
    top = Math.max(base, drop > 0 ? drop + H * 0.06 + 0.02 : 0)
    const slab = Math.max(0.012, Math.min(0.06, tw * 0.09))
    const leg = Math.max(0.01, Math.min(0.07, tw * 0.1))
    const wood = kind === 'stand' ? 'keyaki' : 'aged'
    b.add(wood, beam(tw * 2, slab, td * 2), at(0, top - slab / 2, 0))
    b.add(wood, beam(tw * 1.9, slab * 0.9, td * 1.9), at(0, top - slab * 1.4, 0))
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) b.add(wood, beam(leg, top - slab, leg * 1.1), at(sx * (tw - leg * 1.1), (top - slab) / 2, sz * (td - leg * 1.1)))
    }
    if (top > 0.25) {
      for (const sz of [-1, 1]) b.add(wood, beam(tw * 1.8, leg * 0.6, leg * 0.6), at(0, top * 0.18, sz * (td - leg * 1.1)))
    }
  }
  else if (kind === 'slab') {
    top = Math.max(Math.min(0.2, 0.04 + H * 0.08), drop > 0 ? drop + H * 0.06 + 0.02 : 0)
    if (top > 0.25) {
      b.add('stone', beam(tw * 1.5, top - 0.06, td * 1.5), at(0, (top - 0.06) / 2, 0))
      b.add('paleStone', beam(tw * 2.2, 0.06, td * 2.1), at(0, top - 0.03, 0))
    }
    else {
      b.add('slabStone', beam(tw * 1.75, top, td * 1.7), at(0, top / 2, 0))
    }
  }
  else {
    // A natural stone seat: a wide boulder with its crown planed flat where the pot sits.
    top = Math.max(Math.min(0.42, 0.14 + H * 0.12), drop > 0 ? drop + H * 0.06 + 0.02 : 0)
    const g = boulder(7, 1, 0.8, 3)
    g.computeBoundingBox()
    const bb = g.boundingBox!
    const sy = (top * 1.25) / Math.max(1e-3, bb.max.y - bb.min.y)
    const w = Math.max(tw * 1.5, top * 0.9)
    g.scale(w, sy, Math.max(td * 1.6, top * 0.8))
    g.computeBoundingBox()
    const c = g.boundingBox!.getCenter(new Vector3())
    // Noise makes the stone lopsided: centre its footprint under the pot.
    g.translate(-c.x, -g.boundingBox!.min.y - top * 0.12, -c.z)
    const p = g.getAttribute('position')
    for (let i = 0; i < p.count; i++) p.setY(i, Math.min(p.getY(i), top))
    g.computeVertexNormals()
    b.add('mossStone', g, at(0, 0, 0))
  }
  const group = new Group()
  group.name = 'display'
  group.add(contactPool(Math.max(tw, td) * 2.4))
  const slab = () => stoneMaterial('#5e5951', '#2c2a26', Math.max(0.05, tw * 2.5))
  for (const m of b.build(k => (k === 'slabStone' ? mats.own('slabStone', slab) : mats.get(k as never) as Material))) group.add(m)
  group.position.y = floorY
  return { group, top, radius: Math.max(tw, td) * 1.6 }
}

/** Baked contact pool: the shadow map alone leaves a light seam where the display meets the floor. */
function contactPool(r: number): Mesh {
  const g = new CircleGeometry(r, 40)
  g.rotateX(-Math.PI / 2)
  const m = new ShaderMaterial({
    vertexShader: 'varying vec2 vP;\nvoid main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uR;\nvarying vec2 vP;\nvoid main() { float d = length(vP) / uR; float a = 0.62 * (1.0 - smoothstep(0.18, 1.0, d)); gl_FragColor = vec4(0.0, 0.0, 0.0, a * a); }`,
    uniforms: { uR: { value: r } },
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  })
  const mesh = new Mesh(g, m)
  mesh.position.y = 0.004
  mesh.renderOrder = 1
  mesh.name = 'contact'
  return mesh
}
