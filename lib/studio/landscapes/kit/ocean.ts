/**
 * The churning sea below the Coastal Cliff Temple, after
 * 3d-ultra-realistic-water: a deep-water Gerstner sum (ω = √(g·k), ΣQ < 1)
 * displaced in the vertex shader on exponential rings, shaded per pixel from
 * the analytic derivatives, each wave faded at its own pixel footprint, with
 * Jacobian crest foam and a sunlit subsurface lift. Phases are wrapped on the
 * CPU so float32 `sin` never sees a huge argument. Reflections come from the
 * sky PMREM through the standard material, so it fogs into the same sky.
 */
import { BufferAttribute, BufferGeometry, Color, Mesh, MeshStandardMaterial } from 'three'
import { inject, patch } from '../../shader'

// [wavelength m, amplitude m, heading deg off the wind, steepness Q] — ΣQ = 0.74.
const SPECTRUM: [number, number, number, number][] = [
  [78, 0.8, 0, 0.17],
  [49, 0.52, 23, 0.15],
  [31, 0.33, -17, 0.12],
  [19.5, 0.2, 38, 0.1],
  [12.3, 0.12, -31, 0.08],
  [7.7, 0.07, 12, 0.06],
  [4.9, 0.04, -49, 0.04],
  [3.1, 0.02, 64, 0.02],
]

function rings(cx: number, cz: number, n = 150, segs = 240): BufferGeometry {
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i < n; i++) {
    const r = 6 * (Math.exp(0.04 * i) - 1) + 0.5
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2
      pos.push(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r)
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs
      const a = i * segs + j
      const b = i * segs + j1
      const c = (i + 1) * segs + j
      const d = (i + 1) * segs + j1
      idx.push(a, b, d, a, d, c)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('normal', new BufferAttribute(new Float32Array(pos.length).fill(0).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3))
  g.setIndex(idx)
  return g
}

export interface Ocean {
  mesh: Mesh
  update: (time: number) => void
}

export function createOcean(opts: { y: number, centre: [number, number], wind: number, sea?: number }): Ocean {
  const g = 9.81
  const sea = opts.sea ?? 1.2
  const waves = SPECTRUM.map(([L, A, h, Q]) => {
    const k = (Math.PI * 2) / L
    const ang = opts.wind + (h * Math.PI) / 180
    return { L, A: A * sea, Q, k, w: Math.sqrt(g * k), dx: Math.cos(ang), dz: Math.sin(ang) }
  })
  const uni = {
    uWave: { value: waves.map(w => [w.dx, w.dz, w.k, w.A]).flat() },
    uWave2: { value: waves.map(w => [w.Q, w.L, 0, 0]).flat() },
    uPhase: { value: Array.from({ length: 8 }).fill(0) },
    uSSS: { value: new Color(0.035, 0.3, 0.27) },
  }
  const mat = new MeshStandardMaterial({ color: new Color(0.01, 0.06, 0.08), roughness: 0.16, metalness: 0 })
  const WAVES = /* glsl */`
    uniform vec4 uWave[8];
    uniform vec4 uWave2[8];
    uniform float uPhase[8];
    uniform vec3 uSSS;
    varying vec2 vOX;
    varying float vCrest;
  `
  patch(mat, 'kit-ocean', (sh) => {
    Object.assign(sh.uniforms, uni)
    sh.vertexShader = `${WAVES}\n${sh.vertexShader}`.replace('#include <begin_vertex>', /* glsl */`
      vec3 transformed = position;
      vec2 ox = (modelMatrix * vec4(position, 1.0)).xz;
      float camD = length(cameraPosition.xz - ox);
      float vfoot = 1.2 * 0.04 * (camD + 6.0);
      float crest = 0.0;
      for (int i = 0; i < 8; i++) {
        vec4 w = uWave[i];
        float fade = 1.0 - smoothstep(0.18 * uWave2[i].y, 0.5 * uWave2[i].y, vfoot);
        float th = w.z * dot(w.xy, ox) - uPhase[i];
        transformed.xz += uWave2[i].x * w.w * w.xy * cos(th) * fade;
        transformed.y += w.w * sin(th) * fade;
        crest += w.w * sin(th) * fade;
      }
      vOX = ox;
      vCrest = crest;
    `)
    sh.fragmentShader = `${WAVES}\n${sh.fragmentShader}`
    sh.fragmentShader = inject(sh.fragmentShader, 'normal_fragment_maps', '', /* glsl */`
      float foot = 2.0 * (fwidth(vOX.x) + fwidth(vOX.y));
      vec3 n = vec3(0.0, 1.0, 0.0);
      float J = 1.0;
      for (int i = 0; i < 8; i++) {
        vec4 w = uWave[i];
        float fade = 1.0 - smoothstep(0.18 * uWave2[i].y, 0.5 * uWave2[i].y, foot);
        float th = w.z * dot(w.xy, vOX) - uPhase[i];
        float wa = w.z * w.w * fade;
        n.x -= w.x * wa * cos(th);
        n.z -= w.y * wa * cos(th);
        n.y -= uWave2[i].x * wa * sin(th);
        J -= uWave2[i].x * wa * sin(th) * 1.6;
      }
      vec3 wn = normalize(n);
      normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
      float foam = smoothstep(0.92, 0.5, J) * (1.0 - smoothstep(300.0, 1600.0, length(cameraPosition.xz - vOX)));
      foam *= smoothstep(0.25, 0.6, fract(sin(dot(floor(vOX * 3.0), vec2(12.9898, 78.233))) * 43758.5453) * 0.5 + 0.5 - (1.0 - foam) * 0.4);
    `)
    sh.fragmentShader = inject(sh.fragmentShader, 'color_fragment', '', 'diffuseColor.rgb += uSSS * max(0.0, vCrest) * 0.25;')
    sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nfloat oceanFoamRough = 0.0;')
    sh.fragmentShader = inject(sh.fragmentShader, 'lights_fragment_begin', /* glsl */`
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.88, 0.86), foam);
      material.diffuseColor = diffuseColor.rgb * (1.0 - metalnessFactor);
      material.roughness = mix(material.roughness, 0.9, foam);
    `)
  })
  const mesh = new Mesh(rings(opts.centre[0], opts.centre[1]), mat)
  mesh.position.y = opts.y
  mesh.frustumCulled = false
  mesh.receiveShadow = false
  mesh.name = 'ocean'
  return {
    mesh,
    update(time: number) {
      waves.forEach((w, i) => {
        uni.uPhase.value[i] = (w.w * time) % (Math.PI * 2)
      })
    },
  }
}
