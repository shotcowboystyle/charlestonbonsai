import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { dryness, FINALE, hungAt, LEGS, legStart, PEAK, PLATES, RATE, restTime, screenX, SCROLL_TOTAL, scrollAt, SPEED, strokeProgress, TOTAL, trackAt, win, windowIn, windowOpacity, WINDOWS } from '~/lib/makimono/track'

describe('the handscroll track', () => {
  it('lays the legs end to end, and the peak owns the most scroll', () => {
    expect(legStart(0)).toBe(0)
    expect(legStart(LEGS.length)).toBeCloseTo(TOTAL)
    const peak = LEGS.find(l => l.key === 'ink')!
    expect(Math.max(...LEGS.map(l => l.w))).toBe(peak.w)
    expect(LEGS.filter(l => l.w === peak.w)).toHaveLength(1)
  })

  it('scrolls the hero 1:1, then slows the world where there is something to look at', () => {
    expect(scrollAt(1)).toBe(1)
    const vhPerUnit = (from: number, to: number) => (scrollAt(to) - scrollAt(from)) / (to - from)
    // the hand, the real tree and the bench each take more scroll per unit of track than the hero
    expect(vhPerUnit(legStart(1), legStart(2))).toBeGreaterThan(1)
    expect(vhPerUnit(PEAK.photoFrom, legStart(4))).toBeGreaterThan(vhPerUnit(legStart(2), legStart(3)))
    expect(vhPerUnit(legStart(5), legStart(6))).toBeGreaterThan(vhPerUnit(legStart(4), legStart(5)))
    for (const t of [0.5, legStart(1), 4.2, PEAK.photoFrom + 0.3, 11, TOTAL])
      expect(trackAt(scrollAt(t))).toBeCloseTo(t)
    expect(SCROLL_TOTAL).toBeGreaterThan(TOTAL)
  })

  it('lets the hero go the moment the visitor scrolls', () => {
    expect(windowOpacity(0, WINDOWS.hero)).toBe(1)
    expect(windowOpacity(0.1, WINDOWS.hero)).toBeLessThan(1)
    expect(windowOpacity(0.41, WINDOWS.hero)).toBe(0)
  })

  it('holds the real tree on screen for at least two viewports of scroll', () => {
    expect(scrollAt(PEAK.hide) - scrollAt(PEAK.photoTo)).toBeGreaterThanOrEqual(1.4)
    expect(scrollAt(legStart(4)) - scrollAt(PEAK.photoFrom)).toBeGreaterThanOrEqual(2)
  })

  it('leaves empty paper between the nursery and the bench', () => {
    const [, nurseryEnd = 0] = WINDOWS.nursery.split(' ').map(Number)
    const [benchStart = 0] = WINDOWS.bench.split(' ').map(Number)
    expect((benchStart - nurseryEnd) * SCROLL_TOTAL).toBeGreaterThanOrEqual(0.5)
  })

  it('raises copy only while it fades in, then holds it still', () => {
    const spec = WINDOWS.bench
    const [from = 0, to = 0] = spec.split(' ').map(Number)
    const at = (f: number) => trackAt(f * SCROLL_TOTAL)
    expect(windowIn(at(from), spec)).toBe(0)
    expect(windowIn(at(from + (to - from) * 0.5), spec)).toBe(1)
    expect(windowIn(at(to - 0.0001), spec)).toBe(1)
  })

  it('writes copy windows as fractions of the whole scroll, clamped', () => {
    expect(win(0, TOTAL)).toBe('0.0000 1.0000 0.3 0.3')
    expect(win(0, legStart(1))).toBe(`0.0000 ${(legStart(1) / SCROLL_TOTAL).toFixed(4)} 0.3 0.3`)
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

  it('keeps the seasons copy up through the third tree', () => {
    const autumn = PLATES.find(p => p.src === 'm-autumn')!
    expect(windowOpacity(autumn.at, WINDOWS.seasons)).toBe(1)
  })

  it('keeps the nursery copy up until the last specimen is centred', () => {
    expect(windowOpacity(hungAt(3), WINDOWS.nursery)).toBe(1)
  })

  it('holds the bench copy for at least a viewport of scroll', () => {
    const [from = 0, to = 0, rIn = 0, rOut = 0] = WINDOWS.bench.split(' ').map(Number)
    expect((to - from) * (1 - rIn - rOut) * SCROLL_TOTAL).toBeGreaterThanOrEqual(1.5)
  })

  it('hangs the specimens inside the nursery, with room between the bigger phone cards', () => {
    for (const portrait of [false, true]) {
      for (let i = 0; i < 4; i++) {
        expect(hungAt(i, portrait)).toBeGreaterThan(legStart(4))
        expect(hungAt(i, portrait)).toBeLessThan(legStart(5))
      }
    }
    // centre-to-centre travel, in band-heights; the portrait card is 0.4 band-h wide
    const gap = RATE.front * SPEED * (hungAt(1, true) - hungAt(0, true))
    expect(gap).toBeGreaterThan(0.45)
  })
})
