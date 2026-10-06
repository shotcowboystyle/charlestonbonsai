import { describe, expect, it } from 'vitest'
import { DUR, easeInOut, SETTLE, stageIndexAt, stageProgress, STAGES, stagger, timelineState } from '~/lib/studio/timeline'

describe('timeline', () => {
  it('has seven bilingual stages in order', () => {
    expect(STAGES).toHaveLength(7)
    expect(STAGES.map(s => s.romaji)).toEqual(['Nebari', 'Miki', 'Eda', 'Koeda', 'Harigane', 'Ha', 'Koke'])
    for (let i = 1; i < STAGES.length; i++) expect(STAGES[i]!.t).toBeGreaterThan(STAGES[i - 1]!.t)
  })

  it('is a pure function of t: stepping forwards equals seeking', () => {
    let t = 0
    const forwards: [number, ReturnType<typeof timelineState>][] = []
    while (t < DUR) {
      t = Math.min(DUR, t + 1 / 60)
      forwards.push([t, timelineState(t)])
    }
    const sample = forwards.filter((_, i) => i % 37 === 0).reverse()
    for (const [tt, state] of sample)
      expect(timelineState(tt)).toEqual(state)
  })

  it('un-grows exactly as it grew when scrubbed backwards', () => {
    const down = [7.5, 5, 3, 1, 0.2].map(timelineState)
    const up = [0.2, 1, 3, 5, 7.5].map(timelineState).reverse()
    expect(down).toEqual(up)
  })

  it('reveals monotonically and completes', () => {
    let prev = timelineState(0)
    for (let t = 0; t <= DUR; t += 0.05) {
      const s = timelineState(t)
      expect(s.growth).toBeGreaterThanOrEqual(prev.growth - 1e-9)
      expect(s.plane).toBeGreaterThanOrEqual(prev.plane - 1e-9)
      prev = s
    }
    const end = timelineState(DUR)
    expect(end).toMatchObject({ plane: 1, growth: 4, foliage: 1, moss: 1, wireVisible: false, frac: 1 })
    expect(timelineState(0)).toMatchObject({ plane: 0, growth: 0, foliage: 0, moss: 0 })
  })

  it('finishes each stage early, leaving a beat of stillness', () => {
    for (let i = 0; i < STAGES.length; i++) {
      const next = STAGES[i + 1]?.t ?? DUR
      const span = next - STAGES[i]!.t
      expect(stageProgress(STAGES[i]!.t + span * SETTLE, i)).toBe(1)
      expect(stageProgress(STAGES[i]!.t + span * SETTLE * 0.5, i)).toBeLessThan(1)
    }
  })

  it('shows wire only during Harigane, coiling on then stripping off', () => {
    const tw = STAGES[4]!.t
    expect(timelineState(tw - 0.01).wireVisible).toBe(false)
    expect(timelineState(tw + 0.3).wireVisible).toBe(true)
    expect(timelineState(tw + 0.3).wireGrow).toBeGreaterThan(0)
    expect(timelineState(STAGES[5]!.t + 0.01).wireVisible).toBe(false)
  })

  it('finds stages and staggers members so the last still arrives on time', () => {
    expect(stageIndexAt(0)).toBe(0)
    expect(stageIndexAt(DUR)).toBe(6)
    expect(stagger(1, 0.4)).toBe(1)
    expect(stagger(0.4, 0.4)).toBe(0)
    expect(easeInOut(0.5)).toBeCloseTo(0.5)
  })
})
