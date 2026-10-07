import { describe, expect, it } from 'vitest'
import { fitWithin } from '~/utils/resize-image'

describe('fitWithin', () => {
  it('scales a landscape photo by its width', () => {
    expect(fitWithin(4032, 3024, 1200)).toEqual({ width: 1200, height: 900 })
  })

  it('scales a portrait photo by its height', () => {
    expect(fitWithin(3024, 4032, 1200)).toEqual({ width: 900, height: 1200 })
  })

  it('scales a square image to the max', () => {
    expect(fitWithin(3000, 3000, 1200)).toEqual({ width: 1200, height: 1200 })
  })

  it('never upscales an image already inside the box', () => {
    expect(fitWithin(800, 600, 1200)).toEqual({ width: 800, height: 600 })
  })
})
