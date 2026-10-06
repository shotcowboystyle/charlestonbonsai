/**
 * Shared material set for one landscape build. Materials are created on
 * first use and disposed with the landscape. Glowing materials register
 * their base emissive so the atmosphere's `glow` can drive them.
 */
import type { Material } from 'three'
import type { WoodFinish, WoodSpecies } from './wood'
import { Color, DoubleSide, MeshStandardMaterial } from 'three'
import { stoneMaterial } from '../../bonsai/rock'
import { addNoise, addWorldVaryings, inject, patch } from '../../shader'
import { applyWeather } from '../../weather/cover'
import { paperMaterial } from './paper'
import { woodMaterial } from './wood'

export type MatKey
  = | 'stone' | 'darkStone' | 'mossStone' | 'paleStone' | 'plaster' | 'darkWall' | 'tatami' | 'paper'
    | 'lacquer' | 'hinoki' | 'sugi' | 'aged' | 'charred' | 'keyaki' | 'bronze' | 'roof' | 'bamboo'
    | 'lanternGlow' | 'emberGlow' | 'windowGlow' | 'scroll' | 'red' | 'gold' | 'white' | 'moss' | 'fern' | 'ivy' | 'thatch' | 'soil'

export interface GlowEntry {
  mat: MeshStandardMaterial
  base: number
  /** Share of the glow that stays on in daylight (backlit paper). */
  floor?: number
}

/** Moss creeping over upward faces of an otherwise ordinary material. */
function mossy(m: MeshStandardMaterial, amount: number, scale: number): MeshStandardMaterial {
  return patch(m, 'kit-mossy', (sh) => {
    sh.uniforms.uMossAmt = { value: amount }
    sh.uniforms.uMossScale = { value: scale }
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform float uMossAmt, uMossScale;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      float mUp = smoothstep(0.15, 0.75, normalize(vSWNrm).y);
      float mN = sFbm3(vSWPos * uMossScale);
      float mossK = smoothstep(0.45, 0.6, mN * mUp + uMossAmt * 0.35) * uMossAmt;
      diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.12, 0.2, 0.05), vec3(0.28, 0.36, 0.1), sNoise2(vSWPos.xz * uMossScale * 8.0)), mossK);
    `)
  })
}

function tatami(): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: '#c9b98a', roughness: 0.82 })
  patch(m, 'kit-tatami', (sh) => {
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      // Woven igusa rush: ~3 mm strands, real size, so a small tree reads small beside them.
      vec2 tp = vSWPos.xz;
      float strand = sin(tp.x * 2094.0) * 0.5 + 0.5;
      float fp = sFootprint2(tp * 333.0, 0.15, 0.6);
      float weft = step(0.5, fract(tp.y * 55.0));
      float rush = mix(0.5, strand, fp) * (0.85 + 0.15 * weft);
      float aged = sFbm2(tp * 1.3);
      diffuseColor.rgb *= mix(vec3(0.72, 0.68, 0.5), vec3(1.05, 1.0, 0.82), rush) * (0.88 + aged * 0.2);
      float tatH = rush;
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', 'normal = sBump(normal, -vViewPosition, tatH, 0.0006);')
  })
  return m
}

export class KitMaterials {
  private cache = new Map<string, Material>()
  readonly glow: GlowEntry[] = []

  private outside: KitMaterials | null = null

  constructor(private exterior = true) {}

  /** Exposed materials for the world outside an interior's windows. */
  outdoor(): KitMaterials {
    if (this.exterior)
      return this
    this.outside ??= new KitMaterials(true)
    return this.outside
  }

  /** Glow entries from this set and its outdoor child. */
  glowAll(): GlowEntry[] {
    return this.outside ? [...this.glow, ...this.outside.glow] : this.glow
  }

  private keep<M extends Material>(key: string, make: () => M): M {
    const hit = this.cache.get(key)
    if (hit)
      return hit as M
    const m = make()
    this.cache.set(key, m)
    return m
  }

  wood(species: WoodSpecies, finish: WoodFinish = 'raw', lacquer?: string): MeshStandardMaterial {
    return this.keep(`wood:${species}:${finish}:${lacquer ?? ''}`, () => woodMaterial({ species, finish, lacquer, exposure: this.exterior ? 1 : 0 }))
  }

  emissive(key: string, color: string, base: number, body = '#1a1410'): MeshStandardMaterial {
    return this.keep(key, () => {
      const m = new MeshStandardMaterial({ color: body, emissive: new Color(color), emissiveIntensity: base, roughness: 0.7 })
      this.glow.push({ mat: m, base })
      return m
    })
  }

  get(key: MatKey): Material {
    const ex = this.exterior ? 1 : 0
    switch (key) {
      case 'stone': return this.keep(key, () => stoneMaterial('#8a857b', '#55514a', 1.5))
      case 'paleStone': return this.keep(key, () => stoneMaterial('#b3ada2', '#7d786f', 1.2))
      case 'darkStone': return this.keep(key, () => stoneMaterial('#3c3a37', '#1c1b1a', 2))
      case 'mossStone': return this.keep(key, () => mossy(stoneMaterial('#7d786d', '#45423c', 1.4), 0.85, 1.8))
      case 'plaster': return this.keep(key, () => applyWeather(mossy(new MeshStandardMaterial({ color: '#e4ddcc', roughness: 0.92 }), 0.05, 2), { exposure: ex }))
      case 'darkWall': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#3a2e25', roughness: 0.88 }), { exposure: ex }))
      case 'tatami': return this.keep(key, tatami)
      case 'paper': return this.keep(key, () => {
        const m = paperMaterial({ transmission: 0.45 })
        this.glow.push({ mat: m, base: 0.45, floor: 0.65 })
        return m
      })
      case 'scroll': return this.keep(key, () => paperMaterial({ tint: '#e9e0c8', transmission: 0, ink: 1 }))
      case 'lacquer': return this.wood('keyaki', 'urushi', '#a3301c')
      case 'hinoki': return this.wood('hinoki', 'oil')
      case 'sugi': return this.wood('sugi')
      case 'aged': return this.wood('aged')
      case 'charred': return this.wood('charred')
      case 'keyaki': return this.wood('keyaki', 'oil')
      case 'bamboo': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#7f8f4a', roughness: 0.45 }), { exposure: ex }))
      case 'bronze': return this.keep(key, () => new MeshStandardMaterial({ color: '#8c6a34', metalness: 1, roughness: 0.42 }))
      case 'roof': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#2c2d2e', roughness: 0.62, metalness: 0.1, side: DoubleSide }), { exposure: ex, patchScale: 1 }))
      case 'thatch': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#6e5a3a', roughness: 0.98, side: DoubleSide }), { exposure: ex }))
      case 'lanternGlow': return this.emissive(key, '#ffb35c', 1.6, '#3a2a1a')
      case 'emberGlow': return this.emissive(key, '#ff5a1e', 2.2, '#2a0c04')
      case 'windowGlow': return this.emissive(key, '#ffd9a0', 0.9, '#40372a')
      case 'red': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#b0301f', roughness: 0.6 }), { exposure: ex }))
      case 'gold': return this.keep(key, () => new MeshStandardMaterial({ color: '#d9a43c', metalness: 1, roughness: 0.3 }))
      case 'white': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#ece7dc', roughness: 0.7 }), { exposure: ex }))
      case 'moss': return this.keep(key, () => applyWeather(mossy(new MeshStandardMaterial({ color: '#40562a', roughness: 0.95 }), 1, 3), { exposure: ex }))
      case 'fern': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#3f6a2a', roughness: 0.6, side: DoubleSide }), { exposure: ex }))
      case 'ivy': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#2f4a22', roughness: 0.55, side: DoubleSide }), { exposure: ex }))
      case 'soil': return this.keep(key, () => applyWeather(new MeshStandardMaterial({ color: '#4a3826', roughness: 0.96 }), { exposure: ex, puddles: true }))
    }
  }

  /** Register an externally made material for disposal. */
  own<M extends Material>(key: string, make: () => M): M {
    return this.keep(key, make)
  }

  all(): Record<string, Material> {
    return Object.fromEntries(this.cache)
  }

  dispose(): void {
    this.outside?.dispose()
    this.outside = null
    for (const m of this.cache.values()) m.dispose()
    this.cache.clear()
    this.glow.length = 0
  }
}
