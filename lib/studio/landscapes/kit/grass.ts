/**
 * GPU grass (content.md §9, threejs-landscape): one InstancedMesh of a
 * five-segment ribbon shaped entirely in the vertex shader — taper, rest
 * bend, two-scale wind, height loss as it bends, and a normal recomputed from
 * the bend. Blade colour is mixed in the shader from uniforms, so snow,
 * frost and season reach it (a material colour could only darken it).
 */
import type { Rng } from '../../bonsai/rng'
import { BufferAttribute, BufferGeometry, Color, DoubleSide, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshLambertMaterial, Quaternion, Vector3 } from 'three'
import { declare, inject, patch } from '../../shader'
import { weatherUniforms } from '../../weather/cover'

export interface GrassOptions {
  count: number
  inner: number
  outer: number
  height: [number, number]
  base: string
  tip: string
  /** Extra frost/dryness mixed toward the tip (autumn grasses bowed with frost). */
  frost?: number
  groundAt: (x: number, z: number) => number
  accept?: (x: number, z: number) => boolean
  uTime: { value: number }
  uWind: { value: number }
}

export function grass(o: GrassOptions, rng: Rng): InstancedMesh {
  const SEG = 5
  const pos: number[] = []
  const idx: number[] = []
  for (let s = 0; s < SEG; s++) {
    const t = s / SEG
    pos.push(-0.5, t, 0, 0.5, t, 0)
  }
  pos.push(0, 1, 0)
  for (let s = 0; s < SEG - 1; s++) {
    const a = s * 2
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  idx.push((SEG - 1) * 2, (SEG - 1) * 2 + 1, SEG * 2)
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  geo.setIndex(idx)

  const mat = new MeshLambertMaterial({ color: 0xFFFFFF, side: DoubleSide })
  const local = {
    uGBase: { value: new Color(o.base) },
    uGTip: { value: new Color(o.tip) },
    uFrost: { value: o.frost ?? 0 },
  }
  patch(mat, 'kit-grass', (sh) => {
    Object.assign(sh.uniforms, local, { uTime: o.uTime, uWindAmp: o.uWind, uSnow: weatherUniforms.uSnow })
    sh.vertexShader = declare(sh.vertexShader, 'aParams', 'uniform float uTime, uWindAmp;\nattribute vec4 aParams;\nvarying float vT;\nvarying float vTint;')
    // Blade model: a cantilever whose tip deflection is the sum of a resting
    // lean and a gusting wind field; the base stays planted (deflection grows
    // with height^1.5) and the blade shortens as it bows.
    sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', /* glsl */`
      float along = position.y;
      float bladeH = aParams.x;
      float seed = aParams.y;
      vec2 facing = vec2(cos(aParams.z), sin(aParams.z));
      vT = along;
      vTint = aParams.w;
      vec3 anchor = instanceMatrix[3].xyz;
      float gust = 0.5 + 0.5 * sin(uTime * 0.37 + dot(anchor.xz, vec2(0.071, 0.053)));
      float flutter = 0.5 + 0.5 * sin(uTime * 1.9 + seed + dot(anchor.xz, vec2(0.57, 0.43)));
      vec2 wind = vec2(0.78, 0.62) * uWindAmp * mix(0.3, 1.0, gust) * mix(0.45, 1.0, flutter);
      float lean = 0.22 + 0.18 * fract(seed * 0.159);
      float profile = along * sqrt(along);
      vec2 deflect = (wind + facing * lean) * profile;
      vec3 objectNormal = normalize(vec3(-facing.y, 0.62 * along, facing.x) + vec3(deflect.x, 0.0, deflect.y) * 0.45);
    `).replace('#include <begin_vertex>', /* glsl */`
      float halfWidth = bladeH * 0.03 * max(0.03, 1.0 - along * 0.92);
      vec2 side = facing * position.x * 2.0 * halfWidth;
      float bow = 1.0 - 0.22 * dot(deflect, deflect);
      vec3 transformed = vec3(side.x + deflect.x * bladeH, along * bladeH * bow, side.y + deflect.y * bladeH);
    `)
    sh.fragmentShader = declare(sh.fragmentShader, 'uGBase', 'uniform vec3 uGBase, uGTip;\nuniform float uFrost, uSnow;\nvarying float vT;\nvarying float vTint;')
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec3 gb = uGBase * (0.75 + vTint * 0.5);
      vec3 gt = mix(uGTip * (0.78 + vTint * 0.45), vec3(0.82, 0.84, 0.86), uFrost * smoothstep(0.4, 1.0, vT));
      gb = mix(gb, vec3(0.62, 0.66, 0.72), uSnow * 0.85);
      gt = mix(gt, vec3(0.9, 0.93, 0.98), uSnow);
      diffuseColor.rgb *= mix(gb, gt, pow(vT, 0.8));
    `)
  })

  const mesh = new InstancedMesh(geo, mat, o.count)
  const par = new Float32Array(o.count * 4)
  const m = new Matrix4()
  const q = new Quaternion()
  const one = new Vector3(1, 1, 1)
  const v = new Vector3()
  let n = 0
  let guard = 0
  while (n < o.count && guard < o.count * 6) {
    guard++
    const t = rng.next()
    const r = o.inner + (o.outer - o.inner) * t ** 1.6
    const th = rng.range(0, Math.PI * 2)
    const x = Math.cos(th) * r
    const z = Math.sin(th) * r
    if (o.accept && !o.accept(x, z))
      continue
    v.set(x, o.groundAt(x, z) - 0.01, z)
    m.compose(v, q, one)
    mesh.setMatrixAt(n, m)
    par.set([rng.range(o.height[0], o.height[1]), rng.range(0, 6.283), rng.range(0, 6.283), rng.next()], n * 4)
    n++
  }
  mesh.count = n
  geo.setAttribute('aParams', new InstancedBufferAttribute(par, 4))
  mesh.frustumCulled = false
  mesh.castShadow = false
  mesh.receiveShadow = true
  mesh.name = 'grass'
  mesh.layers.set(2)
  return mesh
}
