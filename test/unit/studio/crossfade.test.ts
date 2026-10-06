import type { Look } from '~/lib/studio/crossfade'
import { describe, expect, it } from 'vitest'
import { atmoLook, ATMOSPHERES } from '~/lib/studio/atmospheres'
import { Crossfader, hexToLinear, lerpAngle, lerpLook, stepAccumulator } from '~/lib/studio/crossfade'

function maxDiff(a: Look, b: Look): number {
  let m = 0
  for (const k of Object.keys(a)) {
    const flat = (v: unknown): number[] => (typeof v === 'number' ? [v] : (v as unknown[]).flatMap(flat))
    const x = flat(a[k])
    const y = flat(b[k])
    x.forEach((v, i) => {
      m = Math.max(m, Math.abs(v - (y[i] as number)))
    })
  }
  return m
}

describe('crossfade', () => {
  const looks = ATMOSPHERES.map(atmoLook)

  it('snapshots the on-screen look when the target changes mid-fade (no snap)', () => {
    const f = new Crossfader(looks[0]!, 1.6)
    f.set(looks[1]!)
    f.step(0.5)
    const before = f.current()
    f.set(looks[2]!)
    const after = f.current()
    expect(maxDiff(before, after)).toBeLessThan(1e-9)
    f.step(0.3)
    f.set(looks[3]!)
    f.set(looks[0]!)
    expect(f.mix).toBe(0)
    for (let i = 0; i < 200; i++) f.step(1 / 60)
    expect(maxDiff(f.current(), looks[0]!)).toBeLessThan(1e-9)
  })

  it('changes continuously frame to frame during a fade', () => {
    const f = new Crossfader(looks[0]!, 1.6)
    f.set(looks[2]!)
    let prev = f.current()
    for (let i = 0; i < 120; i++) {
      f.step(1 / 60)
      const cur = f.current()
      expect(maxDiff(prev, cur)).toBeLessThan(0.08)
      prev = cur
    }
  })

  it('applies instantly when asked', () => {
    const f = new Crossfader(looks[0]!)
    f.set(looks[3]!, true)
    expect(f.current()).toEqual(looks[3])
  })

  it('interpolates the sun the short way round, in spherical coordinates', () => {
    expect(lerpAngle(0.1, Math.PI * 2 - 0.1, 0.5)).toBeCloseTo(0, 6)
    const mid = lerpLook(looks[0]!, looks[2]!, 0.5)
    expect(mid.sunEl).toBeCloseTo((looks[0]!.sunEl + looks[2]!.sunEl) / 2)
  })

  it('accumulates slowly and clears faster (asymmetric clocks)', () => {
    let up = 0
    let down = 1
    for (let i = 0; i < 60; i++) {
      up = stepAccumulator(up, 1, 1 / 60, 7, 2.5)
      down = stepAccumulator(down, 0, 1 / 60, 7, 2.5)
    }
    expect(up).toBeGreaterThan(0.1)
    expect(up).toBeLessThan(0.2)
    expect(1 - down).toBeGreaterThan(up)
  })

  it('decodes sRGB hex to linear', () => {
    expect(hexToLinear('#ffffff')).toEqual([1, 1, 1])
    expect(hexToLinear('#808080')[0]).toBeCloseTo(0.2158, 3)
  })
})
