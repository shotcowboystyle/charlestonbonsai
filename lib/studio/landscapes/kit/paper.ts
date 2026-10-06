/**
 * Washi for shoji, scrolls and shrine streamers (3d-paper-material,
 * condensed to a single procedural pass): formation clouds and warped kozo
 * fibres give the surface, and back-light transmission is driven by the same
 * fields — thin formation glows, fibre bundles and flecks hold light back —
 * so a lit shoji never reads as a lamp inside a card.
 */
import { Color, DoubleSide, MeshStandardMaterial } from 'three'
import { addNoise, addWorldVaryings, inject, patch } from '../../shader'

export interface PaperOptions {
  tint?: string
  /** Colour of the light behind the sheet. */
  back?: string
  /** Base transmission; the atmosphere's glow scales it. */
  transmission?: number
  /** Optional ink: 1 draws an ensō circle centred on the sheet (hanging scroll). */
  ink?: number
}

export function paperMaterial(o: PaperOptions = {}): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: o.tint ?? '#f0e8d2', roughness: 0.93, side: DoubleSide, emissive: new Color(o.back ?? '#ffd7a4'), emissiveIntensity: o.transmission ?? 0.35 })
  patch(m, 'kit-paper', (sh) => {
    sh.uniforms.uInk = { value: o.ink ?? 0 }
    addWorldVaryings(sh)
    addNoise(sh)
    sh.vertexShader = `varying vec2 vPaperUv;\n${sh.vertexShader}`
    sh.vertexShader = inject(sh.vertexShader, 'begin_vertex', '', 'vPaperUv = uv;')
    sh.fragmentShader = `uniform float uInk;\nvarying vec2 vPaperUv;\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', /* glsl */`
      vec2 q = vSWPos.xy * 0.7 + vSWPos.zy * 0.7;
      float form = sFbm2(q * 9.0);
      vec2 wq = q + vec2(sNoise2(q * 30.0), sNoise2(q * 30.0 + 5.0)) * 0.014;
      float rot = (sNoise2(wq * 2.1) - 0.5) * 1.5;
      vec2 rq = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * wq;
      float fib = smoothstep(0.62, 0.95, sNoise2(rq * vec2(1.9, 54.0))) * sFootprint2(rq * 54.0, 0.4, 1.4);
      fib += 0.55 * smoothstep(0.7, 0.98, sNoise2(rq * vec2(44.0, 2.3) * 2.7)) * sFootprint2(rq * 120.0, 0.4, 1.4);
      float fleck = smoothstep(0.86, 0.9, sNoise2(q * 140.0)) * sFootprint2(q * 140.0, 0.4, 1.2);
      diffuseColor.rgb *= 0.9 + form * 0.12 + fib * 0.06 - fleck * 0.25;
      float ink = 0.0;
      if (uInk > 0.5) {
        vec2 c = (vPaperUv - vec2(0.5, 0.56)) * vec2(1.0, 1.6);
        float r = length(c);
        float a = atan(c.y, c.x);
        float brush = 0.06 + 0.035 * sin(a * 1.0 + 1.2) + (sFbm2(vec2(a * 4.0, r * 30.0)) - 0.5) * 0.03;
        float gap = smoothstep(0.2, 0.55, a + 3.14159) * smoothstep(5.9, 5.6, a + 3.14159);
        ink = smoothstep(brush, brush - 0.015, abs(r - 0.3)) * gap;
        ink = max(ink, smoothstep(0.62, 0.85, ink + fib * 0.4) * step(0.05, ink));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.045, 0.04), ink);
      }
      float paperTr = clamp(0.74 + (0.5 - form) * 0.85 - fib * 0.22 - fleck * 0.45 - ink, 0.0, 1.4);
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'emissivemap_fragment', '', 'totalEmissiveRadiance *= paperTr;')
  })
  return m
}
