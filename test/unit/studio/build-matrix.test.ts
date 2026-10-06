import { describe, expect, it } from 'vitest'
import { buildBonsai } from '~/lib/studio/bonsai/build'
import { SIZE_IDS } from '~/lib/studio/bonsai/sizes'
import { SPECIES_IDS } from '~/lib/studio/bonsai/species'
import { STYLE_IDS } from '~/lib/studio/bonsai/styles'
import { timelineState } from '~/lib/studio/timeline'

/**
 * Every style and every species must build at every size class without
 * throwing. The full product is 17 × 21 × 10 = 3,570 trees; that is slow in
 * CI, so each style × species pair is built at two sizes chosen by rotation —
 * every size class is still exercised by every style.
 */
describe('buildBonsai matrix', () => {
  for (const [si, style] of STYLE_IDS.entries()) {
    it(`builds ${style} for every species`, () => {
      for (const [ti, species] of SPECIES_IDS.entries()) {
        for (const k of [0, 5]) {
          const size = SIZE_IDS[(si + ti + k) % SIZE_IDS.length]!
          const b = buildBonsai({ style, species, size, leafBudget: 1500 })
          const pos = (b.group.getObjectByName('wood') as any).geometry.getAttribute('position')
          expect(pos.count, `${style}/${species}/${size} wood`).toBeGreaterThan(0)
          expect(b.meta.stats.leaves, `${style}/${species}/${size} leaves`).toBeGreaterThan(0)
          expect(Number.isFinite(b.meta.bounds.max.y)).toBe(true)
          for (const v of pos.array as Float32Array) {
            if (!Number.isFinite(v))
              throw new Error(`${style}/${species}/${size}: non-finite vertex`)
          }
          b.applyTimeline(timelineState(4))
          b.dispose()
        }
      }
    }, 60_000)
  }

  it('builds every size class for the default tree', () => {
    for (const size of SIZE_IDS) {
      const b = buildBonsai({ style: 'chokkan', species: 'japanese-maple', size })
      expect(b.meta.stats.triangles).toBeGreaterThan(100)
      b.dispose()
    }
  })
})
