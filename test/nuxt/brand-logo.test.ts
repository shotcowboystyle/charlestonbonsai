import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import BrandLogo from '~/components/ui/BrandLogo.vue'

describe('BrandLogo', () => {
  it('gives every image intrinsic dimensions so layout never waits on the SVG', async () => {
    const wrapper = await mountSuspended(BrandLogo)
    const imgs = wrapper.findAll('img')

    expect(imgs).toHaveLength(2)
    for (const img of imgs) {
      expect(img.attributes('width')).toBe('392')
      expect(img.attributes('height')).toBe('57')
    }
  })

  it('sizes each variant to its own aspect ratio', async () => {
    const wrapper = await mountSuspended(BrandLogo, { props: { variant: 'icon', fixed: true } })
    const img = wrapper.get('img')

    expect(img.attributes('width')).toBe('76')
    expect(img.attributes('height')).toBe('90')
  })
})
