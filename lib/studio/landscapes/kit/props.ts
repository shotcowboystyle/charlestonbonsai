/**
 * The shared prop kit. Every function appends geometry to a Batch under a
 * material key, so props cost nothing in draw calls beyond their materials.
 * Sizes are real metres; `s` scales a prop uniformly.
 */
import type { Batch } from './batch'
import { BoxGeometry, CylinderGeometry, Matrix4, PlaneGeometry, SphereGeometry, Vector3 } from 'three'
import { at } from './batch'
import { beam, boulder, lathe, post } from './shapes'

const T = (x: number, y: number, z: number, ry = 0, s = 1, rx = 0, rz = 0) => at(x, y, z, ry, rx, rz).multiply(new Matrix4().makeScale(s, s, s))

/** Kasuga-style stone lantern, ~1.9 m at s = 1. The firebox glows. */
export function lantern(b: Batch, x: number, z: number, ry = 0, s = 1, y0 = 0, stone = 'stone'): Vector3 {
  const m = (y: number) => T(x, y0 + y * s, z, ry, s)
  b.add(stone, lathe([[0.36, 0], [0.38, 0.06], [0.3, 0.12], [0.12, 0.16]], 6), m(0))
  b.add(stone, post(0.1, 0.72, 10), m(0.16))
  b.add(stone, lathe([[0.12, 0], [0.33, 0.06], [0.33, 0.12], [0.26, 0.16]], 6), m(0.88))
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4
    b.add(stone, beam(0.07, 0.36, 0.07), T(x + Math.cos(a + ry) * 0.18 * s, y0 + 1.22 * s, z + Math.sin(a + ry) * 0.18 * s, ry, s))
  }
  b.add('lanternGlow', new BoxGeometry(0.27, 0.3, 0.27), m(1.22))
  b.add(stone, lathe([[0.05, 0.36], [0.2, 0.3], [0.5, 0.08], [0.56, 0.03], [0.5, 0], [0.1, 0]], 6), m(1.4))
  b.add(stone, new SphereGeometry(0.08, 10, 8), m(1.84))
  return new Vector3(x, y0 + 1.22 * s, z)
}

/** Torii gate: two pillars, the curving kasagi lintel over a black shimaki, and the nuki tie. */
export function torii(b: Batch, x: number, z: number, ry = 0, s = 1, paint = 'lacquer'): void {
  const span = 2.6 * s
  const h = 3.4 * s
  const ax = new Vector3(Math.cos(ry), 0, -Math.sin(ry))
  for (const side of [-1, 1]) {
    const px = x + ax.x * span / 2 * side
    const pz = z + ax.z * span / 2 * side
    b.add(paint, post(0.17 * s, h, 16, 0.85), T(px, 0, pz, ry))
    b.add('charred', post(0.22 * s, 0.25 * s, 16), T(px, 0, pz, ry))
  }
  b.add(paint, beam(span + 0.5 * s, 0.22 * s, 0.2 * s), T(x, h * 0.78, z, ry))
  const segs = 9
  const L = span + 1.4 * s
  for (let i = 0; i < segs; i++) {
    const u = (i + 0.5) / segs - 0.5
    const lift = (Math.abs(u) * 2) ** 2.4 * 0.28 * s
    const tilt = Math.sign(u) * (Math.abs(u) * 2) ** 1.4 * 0.32
    const cx = x + ax.x * u * L
    const cz = z + ax.z * u * L
    b.add('charred', beam(L / segs + 0.02, 0.16 * s, 0.34 * s), T(cx, h + 0.06 * s + lift, cz, ry, 1, 0, tilt))
    b.add(paint, beam(L / segs + 0.02, 0.2 * s, 0.3 * s), T(cx, h - 0.12 * s + lift * 0.8, cz, ry, 1, 0, tilt))
  }
  b.add(paint, beam(0.16 * s, 0.45 * s, 0.14 * s), T(x, h * 0.9, z, ry))
}

/** Arched bridge: curved deck of planks, lacquered rails, bronze giboshi caps. */
export function archBridge(b: Batch, x: number, z: number, ry: number, length: number, width: number, rise: number, y0 = 0): void {
  const n = 14
  const ax = new Vector3(Math.cos(ry), 0, -Math.sin(ry))
  const side = new Vector3(Math.sin(ry), 0, Math.cos(ry))
  const arc = (u: number) => rise * (1 - (2 * u - 1) ** 2)
  for (let i = 0; i < n; i++) {
    const u0 = i / n
    const u1 = (i + 1) / n
    const um = (u0 + u1) / 2
    const slope = Math.atan2(arc(u1) - arc(u0), length / n)
    const cx = x + ax.x * (um - 0.5) * length
    const cz = z + ax.z * (um - 0.5) * length
    b.add('aged', beam(length / n * 1.06 / Math.cos(slope), 0.08, width), T(cx, y0 + arc(um), cz, ry, 1, 0, slope))
    for (const sd of [-1, 1]) {
      const rx = cx + side.x * width / 2 * sd
      const rz = cz + side.z * width / 2 * sd
      b.add('lacquer', beam(length / n * 1.12 / Math.cos(slope), 0.07, 0.07), T(rx, y0 + arc(um) + 0.78, rz, ry, 1, 0, slope))
      b.add('lacquer', beam(length / n * 1.1 / Math.cos(slope), 0.05, 0.05), T(rx, y0 + arc(um) + 0.4, rz, ry, 1, 0, slope))
      if (i % 3 === 0 || i === n - 1) {
        const u = i === n - 1 ? 1 : u0
        const px = x + ax.x * (u - 0.5) * length + side.x * width / 2 * sd
        const pz = z + ax.z * (u - 0.5) * length + side.z * width / 2 * sd
        b.add('lacquer', beam(0.1, 0.9, 0.1), T(px, y0 + arc(u) + 0.4, pz, ry))
        if (u === 0 || u === 1)
          b.add('bronze', lathe([[0.07, 0], [0.08, 0.06], [0.05, 0.14], [0.002, 0.24]], 12), T(px, y0 + arc(u) + 0.85, pz))
      }
    }
  }
  for (const u of [0.08, 0.92]) {
    const cx = x + ax.x * (u - 0.5) * length
    const cz = z + ax.z * (u - 0.5) * length
    b.add('aged', post(0.09, y0 + 0.5, 10), T(cx + side.x * width * 0.4, -0.5, cz + side.z * width * 0.4))
    b.add('aged', post(0.09, y0 + 0.5, 10), T(cx - side.x * width * 0.4, -0.5, cz - side.z * width * 0.4))
  }
}

/** Weathered fence along a polyline: posts and two rails, gaps at the ends. */
export function fence(b: Batch, pts: [number, number][], height: number, groundAt: (x: number, z: number) => number, key = 'aged'): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i] as [number, number]
    const [x1, z1] = pts[i + 1] as [number, number]
    const L = Math.hypot(x1 - x0, z1 - z0)
    const ry = -Math.atan2(z1 - z0, x1 - x0)
    const nPost = Math.max(1, Math.round(L / 1.8))
    for (let k = 0; k <= nPost; k++) {
      const u = k / nPost
      const x = x0 + (x1 - x0) * u
      const z = z0 + (z1 - z0) * u
      b.add(key, beam(0.11, height + 0.1, 0.11), T(x, groundAt(x, z) + height / 2 - 0.05, z, ry))
    }
    const mx = (x0 + x1) / 2
    const mz = (z0 + z1) / 2
    const gy = groundAt(mx, mz)
    for (const fy of [0.35, 0.8]) b.add(key, beam(L, 0.07, 0.045), T(mx, gy + height * fy, mz, ry))
    for (let k = 0; k < L / 0.16; k++) {
      const u = (k + 0.5) / (L / 0.16)
      const x = x0 + (x1 - x0) * u
      const z = z0 + (z1 - z0) * u
      b.add('bamboo', new CylinderGeometry(0.018, 0.018, height * 0.62, 6), T(x, groundAt(x, z) + height * 0.5, z))
    }
  }
}

export function stone(b: Batch, x: number, y: number, z: number, size: number, seed: number, flat = 0.6, key = 'mossStone', ry = 0): void {
  b.add(key, boulder(seed, size, flat), T(x, y, z, ry))
}

/** Seated stone Buddha, ~1 m at s = 1. */
export function buddha(b: Batch, x: number, y: number, z: number, ry: number, s = 1, key = 'mossStone'): Vector3 {
  b.add(key, lathe([[0.5, 0], [0.52, 0.08], [0.44, 0.16], [0.36, 0.2]], 18), T(x, y, z, ry, s))
  b.add(key, lathe([[0.42, 0], [0.44, 0.12], [0.3, 0.2], [0.24, 0.42], [0.21, 0.56], [0.12, 0.62], [0.06, 0.64]], 20), T(x, y + 0.2 * s, z, ry, s))
  b.add(key, new SphereGeometry(0.15, 16, 12), T(x, y + 0.92 * s, z, ry, s))
  b.add(key, new SphereGeometry(0.07, 10, 8), T(x, y + 1.06 * s, z, ry, s))
  b.add(key, beam(0.34, 0.08, 0.16), T(x, y + 0.42 * s, z + 0.16 * s, ry, s))
  return new Vector3(x, y + 0.6 * s, z)
}

/** Temple bell hanging from a beam: bronze lathe with lip and crown. */
export function bell(b: Batch, x: number, y: number, z: number, s = 1): void {
  b.add('bronze', lathe([[0.002, 0.62], [0.16, 0.6], [0.24, 0.5], [0.26, 0.2], [0.3, 0.04], [0.3, 0], [0.27, 0]], 28), T(x, y - 0.66 * s, z, 0, s))
  b.add('bronze', new CylinderGeometry(0.03, 0.03, 0.12, 8), T(x, y - 0.03 * s, z, 0, s))
}

/** Bronze brazier on three legs; returns the ember position. */
export function brazier(b: Batch, x: number, z: number, s = 1, y0 = 0): Vector3 {
  b.add('bronze', lathe([[0.002, 0], [0.22, 0.02], [0.3, 0.12], [0.33, 0.24], [0.31, 0.26], [0.27, 0.12], [0.002, 0.08]], 24), T(x, y0 + 0.28 * s, z, 0, s))
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2
    b.add('bronze', beam(0.04, 0.32, 0.04), T(x + Math.cos(a) * 0.2 * s, y0 + 0.15 * s, z + Math.sin(a) * 0.2 * s, -a, s, 0, 0.18))
  }
  for (let k = 0; k < 9; k++) {
    const a = k * 2.4
    b.add('emberGlow', boulder(k, 0.05, 0.6, 1), T(x + Math.cos(a) * 0.12 * s * (k % 3) / 2, y0 + 0.47 * s, z + Math.sin(a) * 0.12 * s * (k % 3) / 2, 0, s))
  }
  return new Vector3(x, y0 + 0.55 * s, z)
}

/** Red shrine marker post with a small cap. */
export function marker(b: Batch, x: number, y: number, z: number, ry = 0, s = 1): void {
  b.add('red', beam(0.14, 1.3, 0.14), T(x, y + 0.65 * s, z, ry, s))
  b.add('roof', lathe([[0.16, 0], [0.12, 0.08], [0.002, 0.16]], 4), T(x, y + 1.3 * s, z, ry + Math.PI / 4, s))
  b.add('white', new PlaneGeometry(0.1, 0.5), T(x, y + 0.9 * s, z + 0.072 * s, ry, s))
}

/** Hokora spirit house on a stone plinth. */
export function spiritHouse(b: Batch, x: number, y: number, z: number, ry = 0, s = 1): void {
  b.add('stone', beam(0.9, 0.5, 0.7), T(x, y + 0.25 * s, z, ry, s))
  b.add('aged', beam(0.6, 0.5, 0.48), T(x, y + 0.75 * s, z, ry, s))
  for (const sd of [-1, 1]) b.add('roof', beam(0.84, 0.04, 0.46), T(x, y + 1.12 * s, z + sd * 0.18 * s, ry, s, sd * 0.55))
  b.add('aged', beam(0.86, 0.06, 0.06), T(x, y + 1.24 * s, z, ry, s))
}
