import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { dryness, FINALE, LEGS, legStart, PEAK, PLATES, restTime, screenX, strokeProgress, TOTAL, win, windowOpacity } from '~/lib/makimono/track'

describe('the handscroll track', () => {
  it('lays the legs end to end, and the peak owns the most scroll', () => {
    expect(legStart(0)).toBe(0)
    expect(legStart(LEGS.length)).toBeCloseTo(TOTAL)
    const peak = LEGS.find(l => l.key === 'ink')!
    expect(Math.max(...LEGS.map(l => l.w))).toBe(peak.w)
    expect(LEGS.filter(l => l.w === peak.w)).toHaveLength(1)
  })

  it('writes copy windows as fractions of the whole track, clamped', () => {
    expect(win(0, TOTAL / 2)).toBe('0.0000 0.5000 0.3 0.3')
    expect(win(-1, TOTAL * 2, 0, 0.5)).toBe('0.0000 1.0000 0 0.5')
  })

  it('fades a scrim on the same plateau-and-ramps curve as the engine fades its text', () => {
    const spec = win(2, 4) // ramps over the first and last 30% of the window
    expect(windowOpacity(1.9, spec)).toBe(0)
    expect(windowOpacity(2.3, spec)).toBeGreaterThan(0)
    expect(windowOpacity(2.3, spec)).toBeLessThan(1)
    expect(windowOpacity(3, spec)).toBe(1)
    expect(windowOpacity(4.1, spec)).toBe(0)
    // a window with no ramp in is present from its first pixel, like the hero
    expect(windowOpacity(0, win(0, 1, 0, 0.5))).toBe(1)
  })

  it('unrolls right to left: a plate sits on its anchor, then travels right', () => {
    expect(screenX(4, 4, 0.3, 1, 1000, 800)).toBe(300)
    expect(screenX(5, 4, 0.3, 1, 1000, 800)).toBeGreaterThan(300)
    // far planes move slower than near ones
    expect(screenX(5, 4, 0.3, 0.3, 1000, 800)).toBeLessThan(screenX(5, 4, 0.3, 1.4, 1000, 800))
  })

  it('under reduced motion holds each leg at its resting composition', () => {
    LEGS.forEach((leg, i) => {
      const rest = legStart(i) + leg.rest
      expect(restTime(legStart(i))).toBe(rest)
      expect(restTime(legStart(i) + leg.w * 0.99)).toBe(rest)
    })
    expect(restTime(TOTAL)).toBe(legStart(LEGS.length - 1) + LEGS.at(-1)!.rest)
  })

  it('stages the peak inside the ink leg: veil, silence, drop, bloom, photograph', () => {
    const ink = LEGS.findIndex(l => l.key === 'ink')
    expect(PEAK.veilFrom).toBeGreaterThanOrEqual(legStart(ink))
    expect(PEAK.veilFrom).toBeLessThan(PEAK.show)
    expect(PEAK.show).toBeLessThan(PEAK.bloomFrom)
    expect(PEAK.bloomTo).toBeLessThan(PEAK.photoFrom)
    expect(PEAK.photoTo).toBeLessThan(PEAK.hide)
    expect(PEAK.hide).toBeLessThanOrEqual(PEAK.veilTo)
  })

  it('closes the ensō exactly as the seal lands, and never past it', () => {
    expect(strokeProgress(0)).toBe(0)
    expect(strokeProgress(FINALE.seal)).toBe(1)
    expect(strokeProgress(TOTAL)).toBe(1)
    expect(FINALE.riseFrom).toBeLessThan(FINALE.riseTo)
  })

  it('maps scroll speed to brush dryness: reading is wet, a flick is dry', () => {
    expect(dryness(0.3)).toBe(0)
    expect(dryness(20)).toBe(1)
  })

  it('ships both formats of every plate it references', () => {
    for (const p of new Set(PLATES.map(p => p.src))) {
      expect(existsSync(resolve('public/makimono', `${p}.avif`)), `${p}.avif`).toBe(true)
      expect(existsSync(resolve('public/makimono', `${p}.webp`)), `${p}.webp`).toBe(true)
    }
  })
})
