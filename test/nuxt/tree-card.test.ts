import type { PublicTree } from '~/types'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import TreeCard from '~/components/gallery/TreeCard.vue'
import { mapPublicTreeRow } from '~/server/utils/mappers'
import { makeTreeRow } from '../fixtures/trees'

function tree(overrides: Partial<PublicTree> = {}): PublicTree {
  return { ...mapPublicTreeRow(makeTreeRow()), ...overrides }
}

describe('TreeCard', () => {
  it('links to the specimen detail page by slug', async () => {
    const wrapper = await mountSuspended(TreeCard, {
      props: { tree: tree({ slug: 'windswept-juniper' }) },
    })

    expect(wrapper.find('a').attributes('href')).toBe('/gallery/windswept-juniper')
  })

  it('shows the specimen name', async () => {
    const wrapper = await mountSuspended(TreeCard, { props: { tree: tree() } })

    expect(wrapper.find('.specimen__name-text').text()).toBe('Windswept Juniper')
  })

  // Pricing is by inquiry only. A card must never render a dollar figure, even
  // if a price somehow reaches the client.
  it('shows "price on inquiry" and never a number', async () => {
    const wrapper = await mountSuspended(TreeCard, { props: { tree: tree() } })

    expect(wrapper.find('.specimen__price').text()).toBe('Price on inquiry')
    expect(wrapper.text()).not.toMatch(/\$\s*\d/)
  })

  it('renders age, short size, and height on the metadata line', async () => {
    const wrapper = await mountSuspended(TreeCard, {
      props: { tree: tree({ age: 20, size: 'medium', height: '14"' }) },
    })

    const line = wrapper.find('.specimen__line').text()
    expect(line).toContain('Age 20 yrs')
    expect(line).toContain('Medium')
    expect(line).toContain('14"')
  })

  it('uses the short size label, without the dimension parenthetical', async () => {
    const wrapper = await mountSuspended(TreeCard, {
      props: { tree: tree({ size: 'extra-large' }) },
    })

    expect(wrapper.find('.specimen__line').text()).toContain('Extra Large')
    expect(wrapper.find('.specimen__line').text()).not.toContain('(')
  })

  it('shows a 3D badge only when the specimen has a model', async () => {
    const withModel = await mountSuspended(TreeCard, {
      props: { tree: tree({ model3dUrl: 'https://example.test/model.glb' }) },
    })
    const withoutModel = await mountSuspended(TreeCard, {
      props: { tree: tree({ model3dUrl: undefined }) },
    })

    expect(withModel.find('.specimen__mark').exists()).toBe(true)
    expect(withoutModel.find('.specimen__mark').exists()).toBe(false)
  })

  it('swaps in the placeholder when the thumbnail fails to load', async () => {
    const wrapper = await mountSuspended(TreeCard, { props: { tree: tree() } })
    const img = wrapper.find('img')

    await img.trigger('error')

    expect(img.attributes('src')).toBe('/images/trees/placeholder-thumb.svg')
  })

  it('gives the link an accessible label that names the specimen', async () => {
    const wrapper = await mountSuspended(TreeCard, { props: { tree: tree() } })

    expect(wrapper.find('a').attributes('aria-label'))
      .toBe('Windswept Juniper — Juniperus procumbens, price on inquiry')
  })

  it('lazy-loads the thumbnail and gives it the specimen name as alt text', async () => {
    const wrapper = await mountSuspended(TreeCard, { props: { tree: tree() } })
    const img = wrapper.find('img')

    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('alt')).toBe('Windswept Juniper')
  })
})
