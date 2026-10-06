/**
 * Polar-grid terrain (threejs-landscape): rings centred on the display get
 * further apart as they recede (`pow(t, 2.4)`), so near ground is dense and
 * the horizon still has relief. Colour comes from what the ground is doing —
 * slope goes to rock, hollows to the moist tone — not from a tiled texture.
 */
import { BufferAttribute, BufferGeometry, Color, Mesh, MeshStandardMaterial } from 'three'
import { addNoise, addWorldVaryings, inject, patch } from '../../shader'
import { applyWeather } from '../../weather/cover'
import { smoothstep } from './noise'

export interface TerrainOptions {
  height: (x: number, z: number) => number
  /** Moist hollows, open ground, dry ridges, rock faces. */
  palette: { low: string, mid: string, high: string, rock: string }
  r1?: number
  angular?: number
  radial?: number
  /** World height of "dry" ground used for the moisture term. */
  heightScale?: number
  puddles?: boolean
  /** Fine surface grain frequency (per metre) and strength. */
  grain?: number
}

export function terrainGeometry(o: TerrainOptions): BufferGeometry {
  const AN = o.angular ?? 200
  const RN = o.radial ?? 64
  const R0 = 0.25
  const R1 = o.r1 ?? 650
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const low = new Color(o.palette.low)
  const mid = new Color(o.palette.mid)
  const high = new Color(o.palette.high)
  const rock = new Color(o.palette.rock)
  const c = new Color()
  const hs = o.heightScale ?? 6
  pos.push(0, o.height(0, 0), 0)
  col.push(mid.r, mid.g, mid.b)
  for (let r = 0; r <= RN; r++) {
    const t = r / RN
    const rad = R0 + (R1 - R0) * t ** 2.4
    for (let a = 0; a < AN; a++) {
      const th = (a / AN) * Math.PI * 2
      const x = Math.cos(th) * rad
      const z = Math.sin(th) * rad
      const y = o.height(x, z)
      const e = Math.max(0.05, rad * 0.01)
      const hx = o.height(x + e, z) - o.height(x - e, z)
      const hz = o.height(x, z + e) - o.height(x, z - e)
      const ny = (2 * e) / Math.hypot(hx, 2 * e, hz)
      const slope = 1 - ny
      const moist = smoothstep(-hs * 0.3, hs * 0.5, -y + hs * 0.2)
      c.copy(high).lerp(mid, moist).lerp(low, moist * moist)
      c.lerp(rock, smoothstep(0.12, 0.45, slope))
      pos.push(x, y, z)
      col.push(c.r, c.g, c.b)
    }
  }
  for (let a = 0; a < AN; a++) idx.push(0, 1 + ((a + 1) % AN), 1 + a)
  for (let r = 0; r < RN; r++) {
    for (let a = 0; a < AN; a++) {
      const a1 = (a + 1) % AN
      const p0 = 1 + r * AN + a
      const p1 = 1 + r * AN + a1
      const q0 = 1 + (r + 1) * AN + a
      const q1 = 1 + (r + 1) * AN + a1
      idx.push(p0, p1, q1, p0, q1, q0)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function groundMaterial(opts: { puddles?: boolean, grain?: number, rough?: number, exposure?: number } = {}): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: 0xFFFFFF, vertexColors: true, roughness: opts.rough ?? 0.96 })
  patch(m, 'kit-ground', (sh) => {
    sh.uniforms.uGrain = { value: opts.grain ?? 60 }
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform float uGrain;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec2 gq = vSWPos.xz;
      float gBroad = sFbm2(gq * 0.15);
      float gFine = sNoise2(gq * uGrain) * sFootprint2(gq * uGrain, 0.25, 0.9);
      float gMid = sNoise2(gq * uGrain * 0.16);
      diffuseColor.rgb *= 0.82 + gBroad * 0.3 + (gFine - 0.5) * 0.18 + (gMid - 0.5) * 0.1;
      float groundH = gFine * 0.6 + gMid * 0.4;
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', 'normal = sBump(normal, -vViewPosition, groundH, 0.6 / uGrain);')
  })
  applyWeather(m, { puddles: opts.puddles ?? true, patchScale: 0.8, exposure: opts.exposure ?? 1 })
  return m
}

export function terrain(o: TerrainOptions): Mesh {
  const mesh = new Mesh(terrainGeometry(o), groundMaterial({ puddles: o.puddles, grain: o.grain }))
  mesh.receiveShadow = true
  mesh.name = 'terrain'
  return mesh
}
