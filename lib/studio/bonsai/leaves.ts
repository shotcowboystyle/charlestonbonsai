/**
 * Leaf, needle and blossom geometries in a unit frame: base at the origin,
 * the blade running up +Y to length 1, facing +Z. foliage.ts orients and
 * scales instances of these into pads.
 */
import type { BloomKind, LeafKind } from './species'
import { BufferAttribute, BufferGeometry, Color, IcosahedronGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type P2 = [number, number]

/** Fan-triangulate a star-shaped outline around `centre`, with a gentle cup along the midrib. */
export function fan(outline: P2[], centre: P2, cup = 0.12, tint?: (x: number, y: number) => Color): BufferGeometry {
  const pos: number[] = [centre[0], centre[1], 0]
  const col: number[] = []
  const pushCol = (x: number, y: number) => {
    if (tint) {
      const c = tint(x, y)
      col.push(c.r, c.g, c.b)
    }
  }
  pushCol(centre[0], centre[1])
  for (const [x, y] of outline) {
    pos.push(x, y, cup * x * x * 4 - 0.04 * y)
    pushCol(x, y)
  }
  const idx: number[] = []
  for (let i = 1; i < outline.length; i++) idx.push(0, i, i + 1)
  idx.push(0, outline.length, 1)
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  if (tint)
    g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Pointed oval: `w` is half-width, `tip` sharpens the apex. */
export function ovalOutline(w: number, n = 10, tip = 1.4): P2[] {
  const right: P2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    right.push([w * Math.sin(Math.PI * t) ** 0.8 * (1 - 0.35 * t ** tip), t])
  }
  const left = right.slice(1, -1).reverse().map(([x, y]) => [-x, y] as P2)
  return [[0, 0], ...right.slice(1), ...left]
}

/** Lobed leaf from a polar function about (0, cy). */
function lobed(lobes: number, depth: number, spread: number, cy: number): BufferGeometry {
  const out: P2[] = [[0, 0]]
  const n = lobes * 8
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = -spread + 2 * spread * t
    const peak = Math.sin(Math.PI * lobes * t) ** 2
    const r = (1 - cy) * (depth + (1 - depth) * peak ** 0.55) * (1 - 0.25 * Math.abs(a) / spread)
    out.push([Math.sin(a) * r, cy + Math.cos(a) * r])
  }
  // Wind counter-clockwise so the leaf faces +Z like the others (snow needs the true up normal).
  return fan([out[0] as P2, ...out.slice(1).reverse()], [0, cy], 0.05)
}

function needles(count: number, spread: number, width: number, curve: number): BufferGeometry {
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const tilt = spread * (0.5 + 0.5 * ((i * 7) % 5) / 4)
    const dx = Math.cos(a) * tilt
    const dz = Math.sin(a) * tilt
    const b = pos.length / 3
    const side: [number, number] = [-Math.sin(a) * width, Math.cos(a) * width]
    for (const [k, y] of [[0, 0], [1, 0.5], [2, 1]] as [number, number][]) {
      const bend = curve * y * y
      const w = k === 2 ? 0 : 1 - y * 0.6
      pos.push(dx * y + side[0] * w, y - bend * 0.2, dz * y + side[1] * w + bend)
      pos.push(dx * y - side[0] * w, y - bend * 0.2, dz * y - side[1] * w + bend)
    }
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** A flat spray of overlapping scales along a forked stem (juniper, hinoki). */
function spray(fanShape: boolean): BufferGeometry {
  const parts: BufferGeometry[] = []
  const stems: [number, number, number][] = fanShape
    ? [[0, 0, 0], [-0.55, 0.3, 0.6], [0.55, 0.3, 0.6], [-0.3, 0.55, 0.45], [0.3, 0.55, 0.45]]
    : [[0, 0, 0], [-0.35, 0.35, 0.55], [0.35, 0.5, 0.45]]
  for (const [ang, start, length] of stems) {
    const L = ang === 0 ? 1 : length
    const steps = 6
    for (let i = 0; i < steps; i++) {
      const t = start + (i / steps) * L
      const s = 0.13 * (1 - i / steps * 0.5)
      const g = fan(ovalOutline(0.55, 4, 1), [0, 0.5], 0)
      g.scale(s, s * 1.6, s)
      g.rotateZ(ang + (i % 2 ? 0.5 : -0.5) * (fanShape ? 0.6 : 1))
      g.translate(Math.sin(-ang) * (t - start) + (ang === 0 ? 0 : Math.sin(-ang) * 0.05), start + Math.cos(ang) * (t - start), 0)
      parts.push(g)
    }
  }
  const merged = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  if (!merged)
    throw new Error('spray merge failed')
  return merged
}

function compound(): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (let i = 0; i < 7; i++) {
    const g = fan(ovalOutline(0.3, 8), [0, 0.45], 0.1)
    g.scale(0.55, 0.55, 0.55)
    g.rotateZ((i / 7 - 0.5) * 2.6 + 0.2)
    g.translate(0, 0.42, 0)
    parts.push(g)
  }
  const merged = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  if (!merged)
    throw new Error('compound merge failed')
  return merged
}

export function leafGeometry(kind: LeafKind): BufferGeometry {
  switch (kind) {
    case 'palmate': return lobed(5, 0.42, Math.PI * 0.82, 0.38)
    case 'trilobe': return lobed(3, 0.55, Math.PI * 0.55, 0.35)
    case 'oval': return fan(ovalOutline(0.3), [0, 0.45])
    case 'glossy': return fan(ovalOutline(0.36, 10, 2), [0, 0.45], 0.2)
    case 'needles': return needles(18, 0.32, 0.012, 0.15)
    case 'needles5': return needles(24, 0.45, 0.014, 0.3)
    case 'tuft': return needles(16, 0.9, 0.02, 0.05)
    case 'scale': return spray(false)
    case 'fan': return spray(true)
    case 'compound': return compound()
  }
}

/** Blossoms, bracts and flowers carry vertex colour for their centres. */
export function bloomGeometry(kind: BloomKind, petal: string, centre: string): BufferGeometry {
  const pc = new Color(petal)
  const cc = new Color(centre)
  const petals = kind === 'bract' ? 3 : 5
  const parts: BufferGeometry[] = []
  for (let i = 0; i < petals; i++) {
    const w = kind === 'flower' ? 0.42 : kind === 'bract' ? 0.5 : 0.36
    const g = fan(ovalOutline(w, 8, 0.4), [0, 0.35], kind === 'flower' ? 0.3 : 0.15, (_x, y) => cc.clone().lerp(pc, Math.min(1, y * 2.2)))
    g.scale(0.5, 0.5, 0.5)
    g.rotateX(kind === 'flower' ? -0.5 : -0.25)
    g.rotateZ((i / petals) * Math.PI * 2)
    parts.push(g)
  }
  const merged = mergeGeometries(parts)
  for (const p of parts) p.dispose()
  if (!merged)
    throw new Error('bloom merge failed')
  return merged
}

export function fruitGeometry(): BufferGeometry {
  const g = new IcosahedronGeometry(0.5, 2)
  g.scale(1, 0.88, 1)
  g.deleteAttribute('uv')
  return g
}

/** Shared with the falling-leaf particles. */
export function palmateLeaf(): BufferGeometry {
  return leafGeometry('palmate')
}
