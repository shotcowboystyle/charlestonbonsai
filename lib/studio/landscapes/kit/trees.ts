import type { Rng } from '../../bonsai/rng'
/**
 * Background trees. They frame the subject and must stay quiet behind it
 * (threejs-landscape): tapered trunks and limbs plus canopy "puffs" whose
 * leafy breakup comes from a shared shader, all merged into the batch.
 */
import type { Batch } from './batch'
import { CylinderGeometry, IcosahedronGeometry, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { addNoise, addWorldVaryings, inject, patch } from '../../shader'
import { applyWeather } from '../../weather/cover'

/** Leafy canopy material: high-frequency breakup, crevice darkening, snow on top. */
export function canopyMaterial(color: string, exposure = 1, scale = 4): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color, roughness: 0.78, metalness: 0 })
  patch(m, 'kit-canopy', (sh) => {
    sh.uniforms.uLeafScale = { value: scale }
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform float uLeafScale;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec3 lp = vSWPos * uLeafScale;
      float leaves = sNoise3(lp * 3.0) * 0.6 + sNoise3(lp * 7.0) * 0.4;
      float clump = sFbm3(lp * 0.6);
      diffuseColor.rgb *= (0.55 + leaves * 0.5) * (0.75 + clump * 0.5);
      float canopyH = leaves;
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', 'normal = sBump(normal, -vViewPosition, canopyH, 0.35 / uLeafScale);')
  })
  applyWeather(m, { exposure, patchScale: 1.5, darken: 0.25 })
  return m
}

const mtx = new Matrix4()
const q = new Quaternion()
const UP = new Vector3(0, 1, 0)

function limb(b: Batch, key: string, from: Vector3, to: Vector3, r0: number, r1: number): void {
  const d = new Vector3().subVectors(to, from)
  const L = d.length()
  const g = new CylinderGeometry(r1, r0, L, 7, 1)
  q.setFromUnitVectors(UP, d.normalize())
  mtx.compose(from.clone().addScaledVector(d, L / 2), q, new Vector3(1, 1, 1))
  b.add(key, g, mtx)
}

function puff(b: Batch, key: string, c: Vector3, r: number, flat: number, rng: Rng): void {
  const g = new IcosahedronGeometry(1, 2)
  const p = g.getAttribute('position')
  const ph = rng.range(0, 10)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const k = 1 + 0.18 * Math.sin(x * 3.1 + ph) * Math.sin(z * 2.7 + y * 2 + ph)
    p.setXYZ(i, x * k, y * k, z * k)
  }
  g.computeVertexNormals()
  q.setFromAxisAngle(UP, rng.range(0, 6.28))
  mtx.compose(c, q, new Vector3(r, r * flat, r))
  b.add(key, g, mtx)
}

export interface TreeOptions {
  height: number
  bark?: string
  leaf: string
  /** Canopy spread relative to height. */
  spread?: number
  puffs?: number
  flat?: number
}

/** A broad deciduous tree: maple, cherry, plum, overhanging canopy. */
export function broadTree(b: Batch, rng: Rng, x: number, y: number, z: number, o: TreeOptions): void {
  const bark = o.bark ?? 'aged'
  const H = o.height
  const base = new Vector3(x, y - 0.1, z)
  const lean = new Vector3(rng.range(-0.15, 0.15), 1, rng.range(-0.15, 0.15)).normalize()
  const fork = base.clone().addScaledVector(lean, H * 0.38)
  limb(b, bark, base, fork, H * 0.035, H * 0.026)
  const spread = (o.spread ?? 0.55) * H
  const n = o.puffs ?? 7
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.range(-0.3, 0.3)
    const up = rng.range(0.45, 0.95)
    const tip = new Vector3(x + Math.cos(a) * spread * rng.range(0.4, 0.9), y + H * up, z + Math.sin(a) * spread * rng.range(0.4, 0.9))
    limb(b, bark, fork, tip, H * 0.018, H * 0.006)
    puff(b, o.leaf, tip.clone().add(new Vector3(0, H * 0.05, 0)), spread * rng.range(0.32, 0.5), o.flat ?? 0.62, rng)
  }
  puff(b, o.leaf, new Vector3(x, y + H * 0.88, z), spread * 0.55, o.flat ?? 0.62, rng)
}

/** Cryptomeria: tall straight red trunk, narrow cone of dark tiers. */
export function cryptomeria(b: Batch, rng: Rng, x: number, y: number, z: number, H: number, leaf = 'sugiLeaf'): void {
  limb(b, 'sugi', new Vector3(x, y - 0.3, z), new Vector3(x, y + H, z), H * 0.03, H * 0.006)
  const tiers = 7
  for (let i = 0; i < tiers; i++) {
    const f = 0.35 + (i / tiers) * 0.62
    const r = H * 0.16 * (1 - f) + H * 0.025
    puff(b, leaf, new Vector3(x + rng.gauss() * 0.2, y + H * f, z + rng.gauss() * 0.2), r, 0.55, rng)
  }
}

/** Garden pine with flat cloud pads on layered limbs (niwaki). */
export function gardenPine(b: Batch, rng: Rng, x: number, y: number, z: number, H: number, leaf = 'pineLeaf'): void {
  const base = new Vector3(x, y - 0.1, z)
  const top = new Vector3(x + rng.range(-0.6, 0.6), y + H * 0.85, z + rng.range(-0.6, 0.6))
  limb(b, 'aged', base, top, H * 0.04, H * 0.012)
  const pads = 6
  for (let i = 0; i < pads; i++) {
    const f = 0.35 + (i / pads) * 0.6
    const a = i * 2.3
    const from = base.clone().lerp(top, f)
    const tip = from.clone().add(new Vector3(Math.cos(a) * H * 0.3 * (1.1 - f), H * 0.03, Math.sin(a) * H * 0.3 * (1.1 - f)))
    limb(b, 'aged', from, tip, H * 0.012, H * 0.006)
    puff(b, leaf, tip, H * 0.17 * (1.15 - f), 0.32, rng)
  }
  puff(b, leaf, top, H * 0.14, 0.4, rng)
}

/** A grove of bamboo culms with nodes and leafy crowns. */
export function bambooGrove(b: Batch, rng: Rng, cx: number, cz: number, radius: number, count: number, groundAt: (x: number, z: number) => number, clear = 0): void {
  for (let i = 0; i < count; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = Math.sqrt(rng.next()) * radius
    const x = cx + Math.cos(a) * r
    const z = cz + Math.sin(a) * r
    if (Math.hypot(x, z) < clear)
      continue
    const H = rng.range(6, 11)
    const R = rng.range(0.035, 0.06)
    const y = groundAt(x, z)
    const lean = new Vector3(rng.range(-0.06, 0.06), 1, rng.range(-0.06, 0.06)).normalize()
    const top = new Vector3(x, y, z).addScaledVector(lean, H)
    limb(b, 'bamboo', new Vector3(x, y - 0.1, z), top, R, R * 0.7)
    for (let k = 1; k < 8; k++) {
      const p = new Vector3(x, y, z).addScaledVector(lean, (H * k) / 8)
      const g = new CylinderGeometry(R * 1.12, R * 1.12, 0.025, 8)
      mtx.makeTranslation(p.x, p.y, p.z)
      b.add('bamboo', g, mtx)
    }
    puff(b, 'bambooLeaf', top.clone().addScaledVector(lean, -H * 0.12), rng.range(0.9, 1.6), 1.4, rng)
  }
}
