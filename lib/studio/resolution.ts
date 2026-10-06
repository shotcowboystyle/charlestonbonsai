/**
 * Automatic Retina scale (3d-retina-resolution, "Auto, capped at 2x"): start
 * at min(devicePixelRatio, 2), step down a quarter after sustained slow
 * frames and recover with hysteresis, never resizing every few frames.
 * Pure: it consumes frame times and reports when the ratio should change.
 */
export class AdaptiveRatio {
  current: number
  private slow = 0
  private fast = 0

  constructor(public max: number, public min = 1) {
    this.current = max
  }

  /** Feed one frame time; returns the new ratio when it changes, else null. */
  sample(frameMs: number): number | null {
    if (frameMs > 22) {
      this.slow++
      this.fast = 0
    }
    else if (frameMs < 18) {
      this.fast++
      this.slow = Math.max(0, this.slow - 1)
    }
    if (this.slow > 90 && this.current > this.min) {
      this.current = Math.max(this.min, this.current - 0.25)
      this.slow = 0
      return this.current
    }
    if (this.fast > 360 && this.current < this.max) {
      this.current = Math.min(this.max, this.current + 0.25)
      this.fast = 0
      return this.current
    }
    return null
  }
}

/** Median of a sample window (frame times for `perf()`). */
export function median(a: number[]): number {
  if (!a.length)
    return 0
  const s = [...a].sort((x, y) => x - y)
  return s[Math.floor(s.length / 2)] as number
}
