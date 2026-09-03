import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import Modal from '~/components/ui/Modal.vue'

afterEach(() => {
  // Modal teleports into <body>, and mountSuspended does not tear the teleported
  // node down, so without this each test would query the previous test's dialog.
  document.body.innerHTML = ''
  // The component leaks this style too (see the unmount test below).
  document.body.style.overflow = ''
})

/** The dialog most recently teleported into the document. */
function currentDialog(): Element | null {
  const dialogs = document.querySelectorAll('[role="dialog"]')
  return dialogs.item(dialogs.length - 1)
}

describe('Modal', () => {
  it('renders nothing while closed', async () => {
    const wrapper = await mountSuspended(Modal, { props: { modelValue: false } })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(wrapper.html()).not.toContain('role="dialog"')
  })

  it('teleports a dialog to the body when opened', async () => {
    await mountSuspended(Modal, { props: { modelValue: true } })

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
  })

  it('renders the title when one is given', async () => {
    await mountSuspended(Modal, { props: { modelValue: true, title: 'Confirm removal' } })

    expect(document.body.textContent).toContain('Confirm removal')
  })

  it('applies the size class for the requested width', async () => {
    await mountSuspended(Modal, { props: { modelValue: true, size: 'xl' } })

    expect(currentDialog()?.className).toContain('max-w-xl')
  })

  it('defaults to the medium width', async () => {
    await mountSuspended(Modal, { props: { modelValue: true } })

    expect(currentDialog()?.className).toContain('max-w-md')
  })

  it('locks body scroll when it opens', async () => {
    const wrapper = await mountSuspended(Modal, { props: { modelValue: false } })

    await wrapper.setProps({ modelValue: true })

    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when it closes', async () => {
    const wrapper = await mountSuspended(Modal, { props: { modelValue: false } })

    await wrapper.setProps({ modelValue: true })
    await wrapper.setProps({ modelValue: false })

    expect(document.body.style.overflow).toBe('')
  })

  // Regression guard: the scroll lock used to be applied in a `watch` with no
  // matching cleanup, so a modal destroyed while open (route change, v-if on a
  // parent) left the page permanently unscrollable.
  it('releases body scroll when unmounted while open', async () => {
    const wrapper = await mountSuspended(Modal, { props: { modelValue: false } })
    await wrapper.setProps({ modelValue: true })
    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('does not touch body scroll when unmounted while closed', async () => {
    // A closed modal must not clear a lock some other component owns.
    document.body.style.overflow = 'hidden'
    const wrapper = await mountSuspended(Modal, { props: { modelValue: false } })

    wrapper.unmount()

    expect(document.body.style.overflow).toBe('hidden')
  })

  it('hides the close button when showClose is false', async () => {
    await mountSuspended(Modal, {
      props: { modelValue: true, title: 'Titled', showClose: false },
    })

    expect(currentDialog()?.querySelector('button') ?? null).toBeNull()
  })
})
