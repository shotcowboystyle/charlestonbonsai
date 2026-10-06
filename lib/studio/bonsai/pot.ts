/**
 * The pot as a hero object (webgl-3d-object): a superellipse lathe so one
 * builder covers oval, round, rectangular, cascade and tray shapes, with a
 * rolled lip, feet, an inner wall down to the soil, and glazed or unglazed
 * ceramic. Also produces the band table for the rising section cap.
 */
import type { PotKind } from './styles'
import { BoxGeometry, BufferAttribute, BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export interface PotSpec {
  kind: PotKind
  /** Half-width along x and half-depth along z, metres. */
  w: number
  d: number
  /** Body height excluding feet. */
  h: number
  feet: number
  /** Superellipse exponent: 2 is an ellipse, 8 a soft rectangle. */
  n: number
  soilY: number
  rimY: number
  wall: number
}

/** Pot proportions per kind, from tree height `H` and canopy half-width. */
export function potSpec(kind: PotKind, H: number, spread: number): PotSpec {
  const tiny = H < 0.12 ? 1.25 : 1
  const base = Math.max(0.3 * H, spread * 0.62) * tiny
  let w = base
  let d = base * 0.7
  let h = base * 0.36
  let n = 2
  if (kind === 'rect') {
    n = 8
    d = w * 0.72
    h = w * 0.36
  }
  else if (kind === 'oval') {
    d = w * 0.66
    h = w * 0.3
  }
  else if (kind === 'round') {
    w = base * 0.78
    d = w
    h = w * (H < 0.12 ? 1.0 : 0.72)
  }
  else if (kind === 'tall') {
    w = 0.17 * H * tiny
    d = w
    h = w * 2.7
    n = 6
  }
  else if (kind === 'medium') {
    w = 0.21 * H * tiny
    d = w
    h = w * 1.45
    n = 3
  }
  else if (kind === 'tray') {
    w = Math.max(0.55 * H, spread * 0.95)
    d = w * 0.5
    h = w * 0.085
    n = 2.4
  }
  else if (kind === 'slab') {
    w = Math.max(0.42 * H, spread * 0.8)
    d = w * 0.62
    h = w * 0.06
    n = 2.2
  }
  const feet = kind === 'slab' ? 0 : h * 0.09
  const wall = Math.max(0.0015, w * 0.045)
  const rimY = feet + h
  const soilY = kind === 'slab' ? rimY : feet + h * 0.86
  return { kind, w, d, h, feet, n, soilY, rimY, wall }
}

/** Superellipse plan point. */
export function planPoint(th: number, a: number, b: number, n: number): [number, number] {
  const c = Math.cos(th)
  const s = Math.sin(th)
  const e = 2 / n
  return [a * Math.sign(c) * Math.abs(c) ** e, b * Math.sign(s) * Math.abs(s) ** e]
}

/** Outer and inner profile: [height fraction, radius fraction, crease]. */
function profile(kind: PotKind): [number, number, boolean][] {
  if (kind === 'slab')
    return [[0, 0.97, false], [0.55, 1.0, false], [1, 0.95, true], [1, 0.0, true]]
  if (kind === 'rect' || kind === 'tall')
    return [[0, 0.93, true], [0.82, 1.0, true], [0.82, 1.045, true], [1, 1.045, true], [1, 0.93, true], [0.86, 0.93, false]]
  if (kind === 'tray')
    return [[0, 0.9, false], [0.6, 0.98, false], [0.9, 1.03, false], [1, 1.035, true], [1, 0.95, true], [0.7, 0.95, false]]
  return [[0, 0.84, false], [0.18, 0.93, false], [0.7, 1.0, false], [0.84, 1.0, true], [0.88, 1.06, false], [1, 1.06, true], [1, 0.92, true], [0.86, 0.92, false]]
}

function lathe(spec: PotSpec, segs: number): BufferGeometry {
  const prof = profile(spec.kind)
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const rings: number[] = []
  const push = (yf: number, rf: number) => {
    rings.push(pos.length / 3)
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2
      const [x, z] = planPoint(th, spec.w * rf, spec.d * rf, spec.n)
      pos.push(x, spec.feet + yf * spec.h, z)
      uv.push(j / segs, yf * spec.h)
    }
  }
  prof.forEach(([yf, rf, crease], i) => {
    push(yf, rf)
    if (crease && i > 0 && i < prof.length - 1)
      push(yf, rf)
  })
  for (let r = 0; r < rings.length - 1; r++) {
    const a0 = rings[r] as number
    const b0 = rings[r + 1] as number
    for (let j = 0; j < segs; j++) idx.push(a0 + j, b0 + j, a0 + j + 1, a0 + j + 1, b0 + j, b0 + j + 1)
  }
  // Closed bottom so the pot reads as solid from below and in shadow.
  const c = pos.length / 3
  pos.push(0, spec.feet, 0)
  uv.push(0.5, 0)
  const r0 = rings[0] as number
  for (let j = 0; j < segs; j++) idx.push(c, r0 + j, r0 + j + 1)
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function potGeometry(spec: PotSpec, segs = 96): BufferGeometry {
  const body = lathe(spec, segs)
  if (spec.feet <= 0)
    return body
  const parts: BufferGeometry[] = [body]
  const fw = Math.min(spec.w, spec.d) * 0.16
  const corners = spec.kind === 'rect' || spec.kind === 'tall' ? [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75] : [Math.PI * 0.3, Math.PI * 0.7, Math.PI * 1.3, Math.PI * 1.7]
  for (const th of corners) {
    const [x, z] = planPoint(th, spec.w * 0.74, spec.d * 0.74, spec.n)
    const f = new BoxGeometry(fw, spec.feet * 1.05, fw * 0.8)
    f.translate(x, spec.feet * 0.5, z)
    parts.push(f)
  }
  const merged = mergeGeometries(parts, false)
  for (const p of parts) p.dispose()
  if (!merged)
    throw new Error('pot merge failed')
  return merged
}

/** Inner radius fraction at soil level. */
export function innerFrac(kind: PotKind): number {
  const p = profile(kind)
  return (p[p.length - 1] as [number, number, boolean])[1]
}

/** Slightly mounded soil surface inside the rim. */
export function soilGeometry(spec: PotSpec, mound: number, rings = 10, segs = 64): BufferGeometry {
  const f = spec.kind === 'slab' ? 0.86 : innerFrac(spec.kind)
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  pos.push(0, spec.soilY + mound, 0)
  uv.push(0.5, 0.5)
  for (let i = 1; i <= rings; i++) {
    const t = i / rings
    for (let j = 0; j < segs; j++) {
      const th = (j / segs) * Math.PI * 2
      const [x, z] = planPoint(th, spec.w * f * t, spec.d * f * t, spec.n)
      pos.push(x, spec.soilY + mound * (1 - t * t), z)
      uv.push(0.5 + x, 0.5 + z)
    }
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j)
  for (let i = 1; i < rings; i++) {
    const a = 1 + (i - 1) * segs
    const b = 1 + i * segs
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs
      idx.push(a + j, a + j1, b + j, a + j1, b + j1, b + j)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Pot section bands for the cap: [yMin, yMax, halfWidth, sides]. Open above the soil. */
export function potBands(spec: PotSpec, step: number): [number, number, number, number][] {
  const prof = profile(spec.kind)
  const out: [number, number, number, number][] = []
  const sides = spec.n > 4 ? 4 : 64
  if (spec.feet > 0)
    out.push([0, spec.feet, 0, sides])
  for (let y = spec.feet; y < spec.soilY; y += step) {
    const yf = Math.min(1, (y + step - spec.feet) / spec.h)
    let rf = (prof[0] as [number, number, boolean])[1]
    for (let i = 1; i < prof.length; i++) {
      const a = prof[i - 1] as [number, number, boolean]
      const b = prof[i] as [number, number, boolean]
      if (b[0] < a[0])
        break
      if (yf >= a[0] && yf <= b[0]) {
        rf = b[0] > a[0] ? a[1] + (b[1] - a[1]) * ((yf - a[0]) / (b[0] - a[0])) : Math.max(a[1], b[1])
        break
      }
    }
    out.push([y, Math.min(spec.soilY, y + step), spec.w * rf * 0.995, sides])
  }
  return out
}

/** Unit superellipse disc for the section cap, with a rim attribute for the clay ring. */
export function capGeometry(aspect: number, n: number, segs = 64): BufferGeometry {
  const pos: number[] = [0, 0, 0]
  const rim: number[] = [0]
  const idx: number[] = []
  for (let j = 0; j < segs; j++) {
    const th = (j / segs) * Math.PI * 2
    const [x, z] = planPoint(th, 1, aspect, n)
    pos.push(x, 0, z)
    rim.push(1)
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j)
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('aRim', new BufferAttribute(new Float32Array(rim), 1))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}
