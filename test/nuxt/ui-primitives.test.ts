import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Badge from '~/components/ui/Badge.vue'
import Button from '~/components/ui/Button.vue'
import Input from '~/components/ui/Input.vue'

describe('Badge', () => {
  it('renders its slot content', async () => {
    const wrapper = await mountSuspended(Badge, { slots: { default: () => 'In stock' } })

    expect(wrapper.text()).toBe('In stock')
  })

  it('defaults to the sage variant at medium size', async () => {
    const wrapper = await mountSuspended(Badge)

    expect(wrapper.classes()).toContain('bg-sage-50')
    expect(wrapper.classes()).toContain('text-xs')
  })

  it('applies the requested variant and size', async () => {
    const wrapper = await mountSuspended(Badge, { props: { variant: 'error', size: 'sm' } })

    expect(wrapper.classes()).toContain('bg-red-50')
    expect(wrapper.classes()).toContain('text-2xs')
  })

  it('resolves a class for every declared variant', async () => {
    const variants = ['forest', 'sage', 'bark', 'stone', 'success', 'warning', 'error'] as const

    for (const variant of variants) {
      const wrapper = await mountSuspended(Badge, { props: { variant } })
      // A missing map entry would render `undefined` into the class list.
      expect(wrapper.classes(), variant).not.toContain('undefined')
      expect(wrapper.classes().length, variant).toBeGreaterThan(3)
    }
  })
})

describe('Button', () => {
  it('renders a real button element by default', async () => {
    const wrapper = await mountSuspended(Button, { slots: { default: () => 'Save' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.text()).toBe('Save')
  })

  it('renders a link when given a `to` target', async () => {
    const wrapper = await mountSuspended(Button, {
      props: { to: '/gallery' },
      slots: { default: () => 'Browse' },
    })

    expect(wrapper.find('a').attributes('href')).toBe('/gallery')
  })

  // Button declares no emits — the click handler falls through to the native
  // element — so assert on the listener rather than on wrapper.emitted().
  it('calls a click listener when pressed', async () => {
    const onClick = vi.fn()
    const wrapper = await mountSuspended(Button, {
      attrs: { onClick },
      slots: { default: () => 'Save' },
    })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('marks the element disabled so the browser suppresses clicks', async () => {
    const wrapper = await mountSuspended(Button, {
      props: { disabled: true },
      slots: { default: () => 'Save' },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('also disables the element while loading', async () => {
    const wrapper = await mountSuspended(Button, {
      props: { loading: true },
      slots: { default: () => 'Save' },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('svg.animate-spin').exists()).toBe(true)
  })

  it('resolves a class for every declared variant', async () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const

    for (const variant of variants) {
      const wrapper = await mountSuspended(Button, { props: { variant } })
      expect(wrapper.classes(), variant).not.toContain('undefined')
    }
  })
})

describe('Input', () => {
  it('reflects its bound value', async () => {
    const wrapper = await mountSuspended(Input, { props: { modelValue: 'Juniper' } })

    expect(wrapper.find('input').element.value).toBe('Juniper')
  })

  it('emits update:modelValue as the user types', async () => {
    const wrapper = await mountSuspended(Input, { props: { modelValue: '' } })

    await wrapper.find('input').setValue('Maple')

    expect(wrapper.emitted('update:modelValue')).toEqual([['Maple']])
  })

  it('shows the error message when one is given', async () => {
    const wrapper = await mountSuspended(Input, {
      props: { modelValue: '', error: 'Email is required' },
    })

    expect(wrapper.text()).toContain('Email is required')
  })

  it('styles the field differently in the error state', async () => {
    const plain = await mountSuspended(Input, { props: { modelValue: '' } })
    const errored = await mountSuspended(Input, {
      props: { modelValue: '', error: 'Email is required' },
    })

    expect(errored.find('input').classes()).not.toEqual(plain.find('input').classes())
  })
})
