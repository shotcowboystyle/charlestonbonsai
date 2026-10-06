import { describe, expect, it } from 'vitest'
import { AdaptiveRatio, median } from '~/lib/studio/resolution'

describe('adaptive pixel ratio', () => {
  it('steps down after sustained slow frames, not on a single hitch', () => {
    const r = new AdaptiveRatio(2)
    expect(r.sample(80)).toBeNull()
    let changed: number | null = null
    for (let i = 0; i < 200 && changed === null; i++) changed = r.sample(40)
    expect(changed).toBe(1.75)
  })

  it('recovers slowly with hysteresis and respects its bounds', () => {
    const r = new AdaptiveRatio(2)
    r.current = 1
    for (let i = 0; i < 300; i++) expect(r.sample(16.7)).toBeNull()
    let up: number | null = null
    for (let i = 0; i < 100 && up === null; i++) up = r.sample(16.7)
    expect(up).toBe(1.25)
    const floor = new AdaptiveRatio(1)
    for (let i = 0; i < 500; i++) expect(floor.sample(60)).toBeNull()
  })

  it('takes a median', () => {
    expect(median([5, 1, 9])).toBe(5)
    expect(median([])).toBe(0)
  })
})
