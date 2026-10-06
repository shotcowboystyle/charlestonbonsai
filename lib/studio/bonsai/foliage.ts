import type { BufferGeometry, MeshStandardMaterial } from 'three'
/**
 * Foliage pads: one InstancedMesh per foliage geometry (leaf, bloom, fruit),
 * never one mesh per leaf. Each instance carries its pad centre and arrival
 * delay (`aPad`) so the shader can scale whole pads in with the §2 envelope.
 */
import type { BonsaiUniforms } from './growth-material'
import type { Rng } from './rng'
import type { V3 } from './skeleton'
import type { SpeciesDef } from './species'
import { Color, InstancedBufferAttribute, InstancedMesh, Matrix4, Vector3 } from 'three'
import { foliageDepthMaterial, foliageMaterial } from './growth-material'
import { bloomGeometry, fruitGeometry, leafGeometry } from './leaves'

export interface PadInfo {
  c: V3
  r: number
  flat: number
  /** Arrival delay in [0, 0.5): inner, lower pads arrive first. */
  delay: number
}

export interface FoliageResult {
  meshes: InstancedMesh[]
  leaves: number
}

/** Leaves on a small tree are relatively large: real miniatures cannot shrink them in proportion. */
export function leafLength(species: SpeciesDef, H: number): number {
  return species.leafLen * Math.min(1.5, Math.max(0.3, (H / 0.6) ** 0.45))
}

const UP = new Vector3(0, 1, 0)

type Orient = 'leaf' | 'needle' | 'bloom' | 'fruit'

function orientFor(kind: SpeciesDef['leaf']): Orient {
  return kind === 'needles' || kind === 'needles5' || kind === 'tuft' ? 'needle' : 'leaf'
}

interface Layer {
  geometry: BufferGeometry
  material: MeshStandardMaterial
  orient: Orient
  /** Instances per leaf placed. */
  ratio: number
  scale: number
  shell: [number, number]
  /** Min/max of the direction's y component: blooms sit on top, fruit hangs. */
  dy: [number, number]
  thinnable: boolean
  uni: BonsaiUniforms
}

function place(layer: Layer, pads: PadInfo[], perPad: number[], rng: Rng): InstancedMesh {
  const total = perPad.reduce((a, n) => a + Math.max(0, Math.round(n * layer.ratio)), 0)
  const mesh = new InstancedMesh(layer.geometry, layer.material, Math.max(1, total))
  const padAttr = new Float32Array(Math.max(1, total) * 4)
  const randAttr = new Float32Array(Math.max(1, total))
  const m = new Matrix4()
  const X = new Vector3()
  const Y = new Vector3()
  const Z = new Vector3()
  const dir = new Vector3()
  const pos = new Vector3()
  const col = new Color()
  let k = 0
  pads.forEach((pad, pi) => {
    const n = Math.round((perPad[pi] ?? 0) * layer.ratio)
    for (let i = 0; i < n; i++) {
      const th = rng.range(0, Math.PI * 2)
      const dy = rng.range(layer.dy[0], layer.dy[1])
      const h = Math.sqrt(1 - dy * dy)
      dir.set(Math.cos(th) * h, dy, Math.sin(th) * h)
      const shell = rng.range(layer.shell[0], layer.shell[1])
      pos.set(pad.c[0] + dir.x * pad.r * shell, pad.c[1] + dir.y * pad.r * pad.flat * 1.3 * shell, pad.c[2] + dir.z * pad.r * shell)
      if (layer.orient === 'needle') {
        Y.copy(UP).multiplyScalar(0.75).addScaledVector(dir, 0.7).normalize()
        Z.set(-Y.z, 0, Y.x)
        if (Z.lengthSq() < 1e-4)
          Z.set(1, 0, 0)
        Z.normalize()
      }
      else {
        Z.copy(UP).multiplyScalar(layer.orient === 'bloom' ? 0.5 : 0.8).addScaledVector(dir, 0.55)
        Z.x += rng.gauss() * 0.25
        Z.z += rng.gauss() * 0.25
        Z.normalize()
        Y.set(dir.x, 0.15, dir.z).addScaledVector(Z, -Z.dot(dir)).normalize()
        if (Y.lengthSq() < 1e-4)
          Y.set(1, 0, 0)
      }
      X.crossVectors(Y, Z).normalize()
      Z.crossVectors(X, Y).normalize()
      const s = layer.scale * rng.range(0.8, 1.2)
      m.makeBasis(X.multiplyScalar(s), Y.multiplyScalar(s), Z.multiplyScalar(s))
      m.setPosition(pos)
      mesh.setMatrixAt(k, m)
      const ao = 0.58 + 0.42 * Math.min(1, Math.max(0, 0.5 + 0.5 * dir.y)) * (0.6 + 0.4 * shell)
      col.setScalar(ao)
      mesh.setColorAt(k, col)
      padAttr.set([pad.c[0], pad.c[1], pad.c[2], pad.delay], k * 4)
      randAttr[k] = rng.next()
      k++
    }
  })
  mesh.count = k
  layer.geometry.setAttribute('aPad', new InstancedBufferAttribute(padAttr, 4))
  layer.geometry.setAttribute('aRand', new InstancedBufferAttribute(randAttr, 1))
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.customDepthMaterial = foliageDepthMaterial(layer.uni, layer.thinnable)
  mesh.computeBoundingSphere()
  return mesh
}

export function buildFoliage(pads: PadInfo[], species: SpeciesDef, H: number, rng: Rng, uni: BonsaiUniforms, budget: number): FoliageResult {
  const l = leafLength(species, H)
  const orient = orientFor(species.leaf)
  const dens = Math.min(1.6, Math.max(0.45, species.density / 2500))
  const leafArea = orient === 'needle' ? 0.5 * l * l : species.leaf === 'scale' || species.leaf === 'fan' || species.leaf === 'compound' ? 0.55 * l * l : 0.34 * l * l
  let perPad = pads.map(p => Math.max(10, (2 * Math.PI * p.r * p.r * (0.55 + p.flat) * 2.4 * dens) / leafArea))
  const total = perPad.reduce((a, b) => a + b, 0)
  if (total > budget)
    perPad = perPad.map(n => Math.max(6, (n * budget) / total))

  const deciduous = species.habit === 'deciduous'
  const layers: Layer[] = [{
    geometry: leafGeometry(species.leaf),
    material: foliageMaterial({ spring: species.springColor, summer: species.leafColor, fall: species.autumnColor, winter: species.winterColor }, uni, H, deciduous, species.leaf === 'glossy' ? 0.9 : 0.4),
    orient,
    ratio: 1,
    scale: l,
    shell: [0.3, 1.02],
    dy: [-0.6, 1],
    thinnable: deciduous,
    uni,
  }]
  if (species.bloom) {
    const b = species.bloom
    const bu = { ...uni, uThin: uni.uBloomHide }
    const mat = foliageMaterial({ spring: '#ffffff', summer: '#ffffff', fall: '#ffffff', winter: '#ffffff' }, bu, H, true, 0.2)
    mat.vertexColors = true
    layers.push({ geometry: bloomGeometry(b.kind, b.color, b.center), material: mat, orient: 'bloom', ratio: b.amount * 0.45, scale: l * (b.kind === 'flower' ? 1.25 : b.kind === 'bract' ? 1.05 : 0.85), shell: [0.88, 1.06], dy: [-0.1, 1], thinnable: true, uni: bu })
  }
  if (species.fruit) {
    const fu = { ...uni, uThin: uni.uFruitHide }
    const mat = foliageMaterial({ spring: species.fruit.color, summer: species.fruit.color, fall: species.fruit.color, winter: species.fruit.color }, fu, H, true, 0.8)
    layers.push({ geometry: fruitGeometry(), material: mat, orient: 'fruit', ratio: species.fruit.amount * 0.5, scale: l * 0.5, shell: [0.8, 0.98], dy: [-0.7, 0.3], thinnable: true, uni: fu })
  }
  const meshes = layers.map(layer => place(layer, pads, perPad, rng))
  return { meshes, leaves: meshes.reduce((a, mm) => a + mm.count, 0) }
}
