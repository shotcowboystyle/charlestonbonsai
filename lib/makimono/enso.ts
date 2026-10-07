/**
 * The visitor's ensō: a bristle brush whose stroke is drawn by scrolling.
 *
 * Scroll speed sets the brush. Slow travel presses harder and lets the ink
 * pool; fast travel lifts the brush and runs it dry, so the stroke breaks into
 * kasure streaks. The stroke only ever extends past the furthest point
 * reached, so the finished circle is a record of how this visitor travelled,
 * and no two are the same.
 */

const SIZE = 1024
const C = SIZE / 2
const R0 = SIZE * 0.355
const START = (115 / 180) * Math.PI
const SWEEP = Math.PI * 2 * 1.03
const ARC = SWEEP * R0
const BRISTLES = 48
const STEP = 1.4
const MAX_STEPS = 160
const WIDTH = SIZE * 0.11

interface Bristle { o: number, ink: number, seed: number, freq: number }

function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

/** Smooth 1D value noise, 0..1. */
function noise(x: number, seed: number): number {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i + seed) * (1 - u) + hash(i + 1 + seed) * u
}

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

export class Enso {
  private ctx: CanvasRenderingContext2D
  private blob: HTMLCanvasElement
  private bristles: Bristle[]
  private drawn = 0
  private target = 0.004
  private dry = 0
  private seed = 0

  constructor(canvas: HTMLCanvasElement, ink: string) {
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx)
      throw new Error('2D canvas unavailable')
    this.ctx = ctx
    ctx.fillStyle = ink

    // Soft stamp for wet pooling, rendered once.
    this.blob = document.createElement('canvas')
    this.blob.width = this.blob.height = 64
    const b = this.blob.getContext('2d')
    if (b) {
      const g = b.createRadialGradient(32, 32, 0, 32, 32, 32)
      g.addColorStop(0, ink)
      g.addColorStop(1, 'transparent')
      b.fillStyle = g
      b.fillRect(0, 0, 64, 64)
    }

    const seed = Math.random() * 1000
    this.seed = seed
    this.bristles = Array.from({ length: BRISTLES }, (_, i) => ({
      o: (i / (BRISTLES - 1) - 0.5) + (hash(seed + i) - 0.5) * 0.02,
      ink: 0.9 + hash(seed + i * 3.1) * 0.2,
      seed: seed + i * 17.3,
      freq: 0.6 + hash(seed + i * 7.7) * 1.4,
    }))
  }

  /** Ask the stroke to reach `p` (0..1) at brush dryness `dry`. It never retreats. */
  extend(p: number, dry: number): void {
    this.dry = dry
    if (p > this.target)
      this.target = Math.min(p, 1)
  }

  /** Is the brush still catching up with the visitor? */
  get busy(): boolean {
    return this.drawn < this.target
  }

  /** Paint up to MAX_STEPS stamps toward the target. A long jump draws over several frames. */
  tick(): void {
    const ctx = this.ctx
    let steps = 0
    while (this.drawn < this.target && steps < MAX_STEPS) {
      this.drawn = Math.min(this.drawn + STEP / ARC, this.target)
      this.stamp(this.drawn)
      steps++
    }
    ctx.globalAlpha = 1
  }

  private stamp(p: number): void {
    const ctx = this.ctx
    const dry = this.dry
    const theta = START + SWEEP * p
    // A hand is not a compass: the circle leans, wobbles, and the end curls inward.
    const r = R0 * (1 + 0.022 * Math.sin(2 * theta + 0.4) + 0.01 * Math.sin(5 * theta + 1.3) - 0.05 * smooth(0.8, 1, p))
    const nx = Math.cos(theta)
    const ny = Math.sin(theta)
    const px = C + r * nx
    const py = C + r * ny

    // Pressure: a heavy press at the start, a lift at the end, and a hand that
    // never holds one pressure for long in between.
    const press = Math.min(0.55 + 0.45 * (p / 0.03), 1)
      * (1 - 0.66 * smooth(0.86, 1, p))
      * (0.78 + 0.44 * noise(p * 7, this.seed))
    const width = WIDTH * (0.62 + 0.5 * (1 - dry)) * press
    const along = (p * ARC) / 38

    for (const b of this.bristles) {
      const edge = Math.abs(b.o) * 2
      b.ink -= (0.00011 + 0.0006 * dry) * STEP * (0.6 + 0.8 * edge)
      // Slow travel lets the brush pool and recover a little, never past full.
      if (dry < 0.2)
        b.ink += 0.00009 * STEP * (1 - dry * 5)
      b.ink = Math.min(Math.max(b.ink, edge < 0.6 ? 0.14 : 0), 1)
      if (b.ink <= 0)
        continue
      // Capped below 1 so even a rushed stroke leaves dry streaks rather than nothing.
      // The outer bristles always skip a little, so even a wet stroke has a ragged edge.
      const gate = Math.min(0.06 + 0.55 * dry + 0.32 * (1 - b.ink) + 0.32 * smooth(0.6, 0.95, edge), 0.84)
      if (noise(along * b.freq, b.seed) < gate)
        continue
      const size = Math.max(2.2, (width / BRISTLES) * 2.8)
      ctx.globalAlpha = 0.24 * Math.min(1, b.ink * 1.5)
      ctx.fillRect(px + nx * b.o * width - size / 2, py + ny * b.o * width - size / 2, size, size)
    }

    if (dry < 0.15 && hash(along * 13.7) < 0.07) {
      const s = width * 1.2
      const jitter = (hash(along * 5.1) - 0.5) * width * 0.5
      ctx.globalAlpha = 0.05
      ctx.drawImage(this.blob, px + nx * jitter - s / 2, py + ny * jitter - s / 2, s, s)
    }
  }
}
