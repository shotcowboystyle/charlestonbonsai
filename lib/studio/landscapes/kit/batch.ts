/**
 * Merge by material, not by part (threejs-towers): props append transformed
 * geometry under a material key and `build()` emits one mesh per key, so a
 * whole landscape draws in a few dozen calls. Every part gets an `aGrain`
 * attribute (its long axis in world space plus a per-part seed) that the
 * timber shader uses to run grain along each board.
 */
import type { BufferGeometry, Material } from 'three'
import { BufferAttribute, Matrix3, Matrix4, Mesh, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export interface BatchMeshOptions {
  castShadow?: boolean
  receiveShadow?: boolean
}

let serial = 0

export class Batch {
  private parts = new Map<string, BufferGeometry[]>()

  /** Takes ownership of `geo`. */
  add(key: string, geo: BufferGeometry, matrix?: Matrix4): this {
    geo.computeBoundingBox()
    const size = new Vector3()
    geo.boundingBox?.getSize(size)
    const axis = size.x >= size.y && size.x >= size.z ? new Vector3(1, 0, 0) : size.y >= size.z ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1)
    if (matrix) {
      geo.applyMatrix4(matrix)
      axis.applyMatrix3(new Matrix3().setFromMatrix4(matrix)).normalize()
    }
    if (!geo.getAttribute('normal'))
      geo.computeVertexNormals()
    const n = geo.getAttribute('position').count
    if (!geo.getAttribute('uv'))
      geo.setAttribute('uv', new BufferAttribute(new Float32Array(n * 2), 2))
    if (!geo.index) {
      const idx = new Uint32Array(n)
      for (let i = 0; i < n; i++) idx[i] = i
      geo.setIndex(new BufferAttribute(idx, 1))
    }
    for (const name of Object.keys(geo.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv' && name !== 'color')
        geo.deleteAttribute(name)
    }
    const seed = (serial++ % 997) * 0.731
    const grain = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) grain.set([axis.x, axis.y, axis.z, seed], i * 4)
    geo.setAttribute('aGrain', new BufferAttribute(grain, 4))
    const list = this.parts.get(key) ?? []
    list.push(geo)
    this.parts.set(key, list)
    return this
  }

  build(resolve: (key: string) => Material, opts: BatchMeshOptions = {}): Mesh[] {
    const out: Mesh[] = []
    for (const [key, list] of this.parts) {
      const mat = resolve(key)
      if (!mat)
        throw new Error(`Batch: no material for "${key}"`)
      const merged = mergeGeometries(list, false)
      for (const g of list) g.dispose()
      if (!merged)
        throw new Error(`Batch: merge failed for "${key}"`)
      merged.computeBoundingSphere()
      const mesh = new Mesh(merged, mat)
      mesh.name = key
      mesh.castShadow = opts.castShadow ?? true
      mesh.receiveShadow = opts.receiveShadow ?? true
      out.push(mesh)
    }
    this.parts.clear()
    return out
  }
}

export const M4 = () => new Matrix4()

/** Compose a matrix from position, Y rotation and optional X/Z rotations. */
export function at(x: number, y: number, z: number, ry = 0, rx = 0, rz = 0): Matrix4 {
  const m = new Matrix4().makeRotationY(ry)
  if (rx || rz)
    m.multiply(new Matrix4().makeRotationX(rx)).multiply(new Matrix4().makeRotationZ(rz))
  m.setPosition(x, y, z)
  return m
}
