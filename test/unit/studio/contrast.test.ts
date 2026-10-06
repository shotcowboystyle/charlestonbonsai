import { describe, expect, it } from 'vitest'
import { ATMOSPHERES } from '~/lib/studio/atmospheres'

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1, 7), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x! + 0.05) / (y! + 0.05)
}

describe('atmosphere chrome palettes', () => {
  for (const a of ATMOSPHERES) {
    it(`${a.en}: text passes AA over its own scrim`, () => {
      expect(ratio(a.css.ink, a.css.paper)).toBeGreaterThanOrEqual(7)
      expect(ratio(a.css.inkSoft, a.css.paper)).toBeGreaterThanOrEqual(4.5)
    })
  }
})
