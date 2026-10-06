/**
 * CPU noise for terrain heights and prop scatter. Deterministic; every
 * system that sits on the ground samples the same height function
 * (threejs-landscape: grass, stones and fog must not float or sink).
 */

function hash(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function vnoise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

export function fbm(x: number, y: number, oct = 4): number {
  let s = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < oct; i++) {
    s += amp * vnoise(x * f, y * f)
    f *= 2.03
    amp *= 0.5
  }
  return s
}

export function ridged(x: number, y: number, oct = 4): number {
  let s = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1)
    s += amp * n * n
    f *= 2.07
    amp *= 0.5
  }
  return s
}

/** Domain-warped fbm: reads as eroded land rather than crumpled paper. */
export function warped(x: number, z: number, scale: number, warp: number): number {
  const wx = x + (fbm(x * scale * 1.6, z * scale * 1.6, 3) - 0.5) * warp
  const wz = z + (fbm(x * scale * 1.6 + 41, z * scale * 1.6 - 17, 3) - 0.5) * warp
  return fbm(wx * scale, wz * scale, 5)
}

export function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** 0 inside r0, 1 beyond r1: flattens ground around the display. */
export function rise(x: number, z: number, r0: number, r1: number): number {
  return smoothstep(r0, r1, Math.hypot(x, z))
}
