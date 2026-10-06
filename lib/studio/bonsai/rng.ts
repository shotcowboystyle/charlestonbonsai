/**
 * Seeded randomness for the bonsai generator. Everything procedural in the
 * studio draws from these so a `style|species|size` combination always grows
 * the same tree — deep links, screenshots and tests depend on it.
 */

/** FNV-1a 32-bit hash of a string. */
export function hashString(s: string): number {
  let h = 0x811C9DC5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function seedFor(style: string, species: string, size: string): number {
  return hashString(`${style}|${species}|${size}`)
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next: () => number
  /** Uniform float in [a, b). */
  range: (a: number, b: number) => number
  /** Integer in [a, b] inclusive. */
  int: (a: number, b: number) => number
  /** Approximately normal, mean 0, sd 1 (sum of three uniforms). */
  gauss: () => number
  pick: <T>(list: readonly T[]) => T
  /** A child stream, so adding draws in one place doesn't reshuffle another. */
  fork: (salt: string | number) => Rng
}

/** mulberry32: tiny, fast, good enough statistical quality for geometry. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    gauss: () => (next() + next() + next() - 1.5) * 2,
    pick: (list) => {
      if (list.length === 0)
        throw new RangeError('pick() from an empty list')
      return list[Math.floor(next() * list.length)] as (typeof list)[number]
    },
    fork: salt => createRng(hashString(`${seed}:${salt}`)),
  }
  return rng
}

/** Stateless hash of an integer to [0, 1) — for per-instance attributes. */
export function hash01(n: number): number {
  let x = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B)
  x ^= x >>> 13
  x = Math.imul(x, 0xC2B2AE35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}
