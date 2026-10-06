/**
 * Training wire, the bonsai version of §2 scaffolding: copper or aluminium
 * coils spiral onto each wired limb member by member as the Harigane stage
 * opens, then strip off from the base in its closing envelope. Guy wires
 * anchor Shakan and Kengai to the pot.
 *
 * `aWire.x` is the member's stagger delay, `aWire.y` the fraction along it.
 */
import type { BonsaiUniforms } from './growth-material'
import type { Limb, V3 } from './skeleton'
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { inject, patch } from '../shader'
import { radiusAt } from './skeleton'

interface Builder {
  pos: number[]
  nrm: number[]
  wire: number[]
  idx: number[]
}

/** Sweep a thin tube through `path`, tagging each ring with (delay, along). */
function tube(b: Builder, path: Vector3[], r: number, delay: number, sides = 5): void {
  const T = new Vector3()
  const N = new Vector3()
  const B = new Vector3()
  const start = b.pos.length / 3
  for (let i = 0; i < path.length; i++) {
    const p = path[i] as Vector3
    const a = path[Math.max(0, i - 1)] as Vector3
    const c = path[Math.min(path.length - 1, i + 1)] as Vector3
    T.subVectors(c, a).normalize()
    N.set(0, 1, 0).cross(T)
    if (N.lengthSq() < 1e-6)
      N.set(1, 0, 0).cross(T)
    N.normalize()
    B.crossVectors(T, N)
    for (let j = 0; j <= sides; j++) {
      const th = (j / sides) * Math.PI * 2
      const nx = N.x * Math.cos(th) + B.x * Math.sin(th)
      const ny = N.y * Math.cos(th) + B.y * Math.sin(th)
      const nz = N.z * Math.cos(th) + B.z * Math.sin(th)
      b.pos.push(p.x + nx * r, p.y + ny * r, p.z + nz * r)
      b.nrm.push(nx, ny, nz)
      b.wire.push(delay, i / Math.max(1, path.length - 1))
    }
  }
  for (let i = 0; i < path.length - 1; i++) {
    const a = start + i * (sides + 1)
    const c = a + sides + 1
    for (let j = 0; j < sides; j++) b.idx.push(a + j, a + j + 1, c + j, a + j + 1, c + j + 1, c + j)
  }
}

export function buildWire(limbs: Limb[], guys: [V3, V3][], metal: 'copper' | 'aluminium', uni: BonsaiUniforms): { mesh: Mesh, members: number } | null {
  const b: Builder = { pos: [], nrm: [], wire: [], idx: [] }
  let member = 0
  const helixPt = new Vector3()
  const T = new Vector3()
  const N = new Vector3()
  const B = new Vector3()
  for (const limb of limbs) {
    if (!limb.wire || limb.dead || limb.pts.length < 2)
      continue
    const curve = new CatmullRomCurve3(limb.pts.map(p => new Vector3(p[0], p[1], p[2])), false, 'centripetal')
    const L = curve.getLength()
    const r0 = limb.radii[0] ?? 0.001
    const wr = Math.min(0.006, Math.max(0.00035, r0 * 0.2))
    const u0 = limb.order === 0 ? 0.04 : 0.02
    const u1 = 0.86
    const pitch = Math.max(r0 * 2.4, wr * 8)
    const turns = Math.max(2, ((u1 - u0) * L) / pitch)
    const steps = Math.ceil(turns * 10)
    const path: Vector3[] = []
    N.set(0, 0, 0)
    for (let i = 0; i <= steps; i++) {
      const f = i / steps
      const u = u0 + (u1 - u0) * f
      curve.getPointAt(u, helixPt)
      curve.getTangentAt(u, T)
      if (N.lengthSq() === 0) {
        N.set(0, 1, 0).cross(T)
        if (N.lengthSq() < 1e-6)
          N.set(1, 0, 0).cross(T)
      }
      N.addScaledVector(T, -N.dot(T)).normalize()
      B.crossVectors(T, N)
      const a = f * turns * Math.PI * 2
      const rr = radiusAt(limb, u) + wr * 0.9
      path.push(helixPt.clone().addScaledVector(N, Math.cos(a) * rr).addScaledVector(B, Math.sin(a) * rr))
    }
    tube(b, path, wr, ((member % 7) / 7) * 0.4)
    member++
  }
  for (const [a, c] of guys) {
    const pa = new Vector3(...a)
    const pc = new Vector3(...c)
    const path = Array.from({ length: 12 }, (_, i) => pa.clone().lerp(pc, i / 11))
    tube(b, path, Math.max(0.0003, pa.distanceTo(pc) * 0.004), 0.45, 4)
    member++
  }
  if (member === 0)
    return null
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(b.pos), 3))
  g.setAttribute('normal', new BufferAttribute(new Float32Array(b.nrm), 3))
  g.setAttribute('aWire', new BufferAttribute(new Float32Array(b.wire), 2))
  g.setIndex(b.idx)
  const mat = new MeshStandardMaterial({
    color: metal === 'copper' ? '#b06a3b' : '#b9bcbf',
    metalness: 1,
    roughness: metal === 'copper' ? 0.38 : 0.45,
  })
  patch(mat, 'bonsai-wire', (sh) => {
    sh.uniforms.uWireGrow = uni.uWireGrow
    sh.uniforms.uWireOut = uni.uWireOut
    sh.vertexShader = `attribute vec2 aWire;\nvarying vec2 vWire;\n${sh.vertexShader}`
    sh.vertexShader = inject(sh.vertexShader, 'begin_vertex', '', 'vWire = aWire;')
    sh.fragmentShader = `uniform float uWireGrow, uWireOut;\nvarying vec2 vWire;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'clipping_planes_fragment', /* glsl */`
      float wg = clamp((uWireGrow - vWire.x) / (1.0 - vWire.x), 0.0, 1.0);
      float reach = 1.0 - pow(1.0 - wg, 2.6);
      if (vWire.y > reach || vWire.y < uWireOut * 1.001) discard;
    `)
  })
  const mesh = new Mesh(g, mat)
  mesh.castShadow = false
  mesh.receiveShadow = true
  return { mesh, members: member }
}
