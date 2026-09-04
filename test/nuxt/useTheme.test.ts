import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from 'nuxt/app'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useTheme } from '~/composables/useTheme'

const ThemeTestComponent = defineComponent({
  setup() {
    return useTheme()
  },
  template: '<div></div>',
})

describe('useTheme', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.documentElement.removeAttribute('data-theme')
    window.localStorage.clear()
    clearNuxtState() // clear useState
  })

  it('setTheme ignores disabled localStorage and still applies theme', async () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('localStorage is disabled')
    })

    const wrapper = await mountSuspended(ThemeTestComponent)
    expect(wrapper.vm.theme).toBe('light')

    wrapper.vm.setTheme('dark')

    // The main functionality we want to test for this issue
    expect(wrapper.vm.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(setItemSpy).toHaveBeenCalled()
  })

  it('setTheme updates theme, applies it to DOM, and saves to localStorage', async () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem')

    const wrapper = await mountSuspended(ThemeTestComponent)
    expect(wrapper.vm.theme).toBe('light')

    wrapper.vm.setTheme('dark')

    expect(wrapper.vm.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(setItemSpy).toHaveBeenCalledWith('cb-theme', 'dark')
    expect(window.localStorage.getItem('cb-theme')).toBe('dark')
  })
})
