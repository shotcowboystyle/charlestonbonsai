import type { FilterState } from '~/types'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import FilterPills from '~/components/gallery/FilterPills.vue'
import { expectDefined } from '../utils/expect-defined'

function filters(overrides: Partial<FilterState> = {}): FilterState {
  return {
    sizes: [],
    careLevels: [],
    treeTypes: [],
    search: '',
    sortBy: 'newest',
    inStockOnly: true,
    ...overrides,
  }
}

describe('FilterPills', () => {
  it('renders nothing when no facet filters are active', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters() },
    })

    expect(wrapper.find('ul').exists()).toBe(false)
  })

  // Search text and sort order are not facets, so they must not conjure a pill
  // row on their own — otherwise "clear all" would appear with nothing to clear.
  it('stays hidden when only search and sort are set', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters({ search: 'juniper', sortBy: 'name' }) },
    })

    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('renders one pill per active facet plus a clear-all control', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: {
        modelValue: filters({
          treeTypes: ['juniper', 'maple'],
          sizes: ['small'],
          careLevels: ['beginner'],
        }),
      },
    })

    expect(wrapper.findAll('.pill')).toHaveLength(4)
    expect(wrapper.find('.pills__clear').exists()).toBe(true)
  })

  it('labels pills with human-readable names, not raw enum keys', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: {
        modelValue: filters({
          treeTypes: ['juniper'],
          sizes: ['extra-large'],
          careLevels: ['intermediate'],
        }),
      },
    })

    const labels = wrapper.findAll('.pill__label').map(node => node.text())
    expect(labels).toEqual(['Juniper', 'Extra Large', 'Intermediate'])
  })

  it('uses the short size label so the pill stays on one line', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters({ sizes: ['mini'] }) },
    })

    // The long label is 'Mini (< 6")'; the pill must not carry the parenthetical.
    expect(expectDefined(wrapper.find('.pill__label')).text()).toBe('Mini')
  })

  it('emits removeSpecies with the species that was clicked', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters({ treeTypes: ['juniper', 'maple'] }) },
    })

    await expectDefined(wrapper.findAll('.pill')[1], 'second pill').trigger('click')

    expect(wrapper.emitted('removeSpecies')).toEqual([['maple']])
  })

  it('emits removeSize with the size that was clicked', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters({ sizes: ['large'] }) },
    })

    await expectDefined(wrapper.find('.pill')).trigger('click')

    expect(wrapper.emitted('removeSize')).toEqual([['large']])
  })

  it('emits removeCare with the care level that was clicked', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters({ careLevels: ['expert'] }) },
    })

    await expectDefined(wrapper.find('.pill')).trigger('click')

    expect(wrapper.emitted('removeCare')).toEqual([['expert']])
  })

  it('emits clearAll from the clear control', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters({ treeTypes: ['pine'] }) },
    })

    await wrapper.find('.pills__clear').trigger('click')

    expect(wrapper.emitted('clearAll')).toHaveLength(1)
  })

  it('gives every pill an accessible remove label', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters({ treeTypes: ['pine'], sizes: ['small'] }) },
    })

    expect(wrapper.findAll('.pill .sr-only')).toHaveLength(2)
  })

  it('labels the pill list for assistive technology', async () => {
    const wrapper = await mountSuspended(FilterPills, {
      props: { modelValue: filters({ treeTypes: ['pine'] }) },
    })

    expect(wrapper.find('ul').attributes('aria-label')).toBe('Active filters')
  })
})
