/**
 * Raked gravel (karesansui). The rake lines are a distance field: concentric
 * around each boulder, blending into straight parallel waves away from them,
 * so the pattern really follows the stones. Grains are real size (~6 mm);
 * when wet their tops go glossy and pick up the sky — gravel like pearls.
 */
import { Mesh, MeshStandardMaterial, PlaneGeometry, Vector4 } from 'three'
import { addNoise, addWorldVaryings, inject, patch } from '../../shader'
import { applyWeather } from '../../weather/cover'

export interface GravelOptions {
  width: number
  depth: number
  /** Boulders the rake circles: x, z, radius. Up to 10. */
  rocks: [number, number, number][]
  spacing?: number
  color?: string
  y?: number
}

export function gravelMaterial(o: GravelOptions): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: o.color ?? '#d8d4c8', roughness: 0.9 })
  const rocks = Array.from({ length: 10 }, (_, i) => {
    const r = o.rocks[i]
    return r ? new Vector4(r[0], r[1], r[2], 1) : new Vector4(0, 0, 0, 0)
  })
  const local = { uRocks: { value: rocks }, uRake: { value: o.spacing ?? 0.075 } }
  m.userData.rocks = rocks
  patch(m, 'kit-gravel', (sh) => {
    Object.assign(sh.uniforms, local)
    addWorldVaryings(sh)
    addNoise(sh)
    sh.fragmentShader = `uniform vec4 uRocks[10];\nuniform float uRake;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec2 gp = vSWPos.xz;
      float dmin = 1e3;
      for (int i = 0; i < 10; i++) {
        if (uRocks[i].w > 0.5) dmin = min(dmin, length(gp - uRocks[i].xy) - uRocks[i].z);
      }
      float ringZone = smoothstep(0.55, 1.15, dmin);
      float coord = mix(dmin, gp.y + sin(gp.x * 0.35) * 0.25, ringZone);
      float ph = coord / uRake;
      float fadeR = 1.0 - smoothstep(0.2, 0.7, fwidth(ph));
      float ridge = mix(0.5, 0.5 + 0.5 * cos(ph * 6.2832), fadeR);
      float edge = 1.0 - smoothstep(0.0, 0.06, dmin);
      // Pebbles: cellular noise, so close up the grains are round stones, not value-noise blocks.
      vec2 cp = gp * 150.0;
      float pfp = sFootprint2(cp, 0.25, 0.8);
      float dmin2 = 0.5;
      float cellH = 0.5;
      // Pebbles only where they resolve: distant gravel skips the cell search entirely.
      if (pfp > 0.01) {
        vec2 ci = floor(cp);
        dmin2 = 9.0;
        for (int j = -1; j <= 1; j++) {
          for (int i = -1; i <= 1; i++) {
            vec2 cc = ci + vec2(float(i), float(j));
            vec2 pt = cc + 0.2 + 0.6 * vec2(sHash12(cc), sHash12(cc + 17.3));
            float dd = length(cp - pt);
            if (dd < dmin2) { dmin2 = dd; cellH = sHash12(cc + 5.1); }
          }
        }
      }
      float grain = mix(0.5, clamp(1.0 - dmin2 * 1.5, 0.0, 1.0), pfp);
      float tone = mix(0.5, cellH, pfp);
      diffuseColor.rgb *= (0.84 + ridge * 0.2) * (0.9 + (tone - 0.5) * 0.18 + (grain - 0.5) * 0.12) * (1.0 - edge * 0.25);
      float gravelH = ridge * 0.8 + grain * 0.25;
      float pearl = smoothstep(0.55, 0.85, grain) * ridge;
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'roughnessmap_fragment', '', 'roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.55, pearl * 0.6);')
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', 'normal = sBump(normal, -vViewPosition, gravelH, uRake * 0.18 * (1.0 - swSnow * 0.75));')
  })
  applyWeather(m, { darken: 0.34, patchScale: 0.9 })
  return m
}

export function gravelBed(o: GravelOptions): Mesh {
  const g = new PlaneGeometry(o.width, o.depth, 1, 1)
  g.rotateX(-Math.PI / 2)
  const mesh = new Mesh(g, gravelMaterial(o))
  mesh.position.y = o.y ?? 0.012
  mesh.receiveShadow = true
  mesh.name = 'gravel'
  return mesh
}
