/**
 * Koi gliding beneath lily pads. One InstancedMesh; each fish swims its own
 * ellipse in the vertex shader (centre, radii, speed and phase packed in
 * instance attributes) with a travelling tail wave, so the CPU does nothing.
 */
import type { Rng } from '../../bonsai/rng'
import { CircleGeometry, Color, InstancedBufferAttribute, InstancedMesh, LatheGeometry, Matrix4, MeshStandardMaterial, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { declare, patch } from '../../shader'
import { weatherUniforms } from '../../weather/cover'

function fishGeometry() {
  const body = new LatheGeometry([0, 0.03, 0.055, 0.06, 0.05, 0.03, 0.012, 0].map((r, i) => new Vector2(r, i * 0.07)), 10)
  body.rotateZ(-Math.PI / 2)
  body.scale(1, 0.75, 1)
  body.translate(-0.25, 0, 0)
  const tail = new CircleGeometry(0.08, 6, -0.6, 1.2)
  tail.rotateX(-Math.PI / 2)
  tail.translate(-0.3, 0, 0)
  for (const g of [body, tail]) g.deleteAttribute('uv')
  const merged = mergeGeometries([body.toNonIndexed(), tail.toNonIndexed()])
  if (!merged)
    throw new Error('koi merge failed')
  merged.computeVertexNormals()
  return merged
}

export function koi(rng: Rng, count: number, centre: [number, number], radius: number, depth: number): InstancedMesh {
  const geo = fishGeometry()
  const mat = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 })
  patch(mat, 'kit-koi', (sh) => {
    sh.uniforms.uTime = weatherUniforms.uTime
    sh.vertexShader = declare(sh.vertexShader, 'aSwim', 'uniform float uTime;\nattribute vec4 aSwim;\nattribute vec4 aPath;')
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', /* glsl */`
      vec3 transformed = position * aPath.w;
      float ph = aSwim.z + uTime * aSwim.w;
      float wag = sin(uTime * 5.0 * aSwim.w * 6.0 + position.x * 10.0) * 0.06 * smoothstep(0.0, -0.3, position.x);
      transformed.z += wag;
      float ang = -ph + 1.5708;
      float ca = cos(ang), sa = sin(ang);
      transformed.xz = vec2(transformed.x * ca - transformed.z * sa, transformed.x * sa + transformed.z * ca);
      transformed += vec3(aPath.x + cos(ph) * aSwim.x, aPath.z + sin(ph * 2.0) * 0.02, aPath.y + sin(ph) * aSwim.y);
    `)
  })
  const mesh = new InstancedMesh(geo, mat, count)
  const swim = new Float32Array(count * 4)
  const path = new Float32Array(count * 4)
  const palette = ['#e8a33a', '#f1efe8', '#e9eae3', '#d65a24', '#f0c35a']
  const m = new Matrix4()
  for (let i = 0; i < count; i++) {
    const r = rng.range(0.3, radius)
    const s = rng.range(0.7, 1.3)
    swim.set([r, r * rng.range(0.5, 0.9), rng.range(0, 6.28), rng.range(0.08, 0.18) * (rng.next() < 0.5 ? 1 : -1)], i * 4)
    path.set([centre[0] + rng.gauss() * radius * 0.2, centre[1] + rng.gauss() * radius * 0.2, depth - rng.range(0, 0.15), s], i * 4)
    mesh.setMatrixAt(i, m.identity())
    mesh.setColorAt(i, new Color(rng.pick(palette)))
  }
  geo.setAttribute('aSwim', new InstancedBufferAttribute(swim, 4))
  geo.setAttribute('aPath', new InstancedBufferAttribute(path, 4))
  mesh.frustumCulled = false
  mesh.name = 'koi'
  return mesh
}

/** Lily pads with a notch, and a few blossoms. Returns a matrix list for a Batch. */
export function lilyPads(rng: Rng, count: number, centre: [number, number], radius: number, y: number): { pads: Matrix4[], flowers: Matrix4[] } {
  const pads: Matrix4[] = []
  const flowers: Matrix4[] = []
  for (let i = 0; i < count; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = Math.sqrt(rng.next()) * radius
    const s = rng.range(0.12, 0.3)
    const x = centre[0] + Math.cos(a) * r
    const z = centre[1] + Math.sin(a) * r
    pads.push(new Matrix4().makeRotationY(rng.range(0, 6.28)).multiply(new Matrix4().makeScale(s, s, s)).setPosition(x, y + 0.004, z))
    if (rng.next() < 0.18)
      flowers.push(new Matrix4().makeScale(0.06, 0.06, 0.06).setPosition(x + s * 0.2, y + 0.03, z))
  }
  return { pads, flowers }
}

/** A notched lily pad disc lying flat. */
export function lilyPadGeometry() {
  const g = new CircleGeometry(1, 18, 0.25, Math.PI * 2 - 0.5)
  g.rotateX(-Math.PI / 2)
  return g
}
