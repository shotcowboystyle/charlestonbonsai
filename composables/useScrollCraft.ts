import type { Ref } from 'vue'

/**
 * Scroll-driven interaction runtime.
 *
 * The engine (assets/js/scrollcraft.js) is a vendored IIFE that reads
 * `data-sc-*` attributes off markup you author and drives them. It generates
 * no DOM and it is never edited per-page — bespoke behaviour is written in the
 * page and driven off the `--sc-p` custom property the engine publishes on
 * each act.
 *
 * It is imported dynamically so the ~57KB never lands in the SSR bundle or on
 * a route that has no acts.
 */

interface ScrollCraftApi {
  layout: () => void
  read: () => void
  acts: unknown[]
  worlds: unknown[]
  clips: unknown[]
}

interface ScrollCraftGlobal {
  mount: (root: Element | string, opts?: Record<string, unknown>) => ScrollCraftApi
  reduce: () => boolean
  instances: ScrollCraftApi[]
}

declare global {
  interface Window {
    ScrollCraft?: ScrollCraftGlobal
  }
}

export function useScrollCraft(root: Ref<HTMLElement | null>) {
  let api: ScrollCraftApi | null = null

  onMounted(async () => {
    await import('~/assets/js/scrollcraft.js')
    if (!window.ScrollCraft || !root.value)
      return
    api = window.ScrollCraft.mount(root.value)
  })

  onBeforeUnmount(() => {
    // ponytail: the engine has no teardown — its scroll/resize listeners and
    // rAF loop are process-wide and permanent. Emptying the instance's work
    // lists makes the orphaned loop a no-op after the page unmounts, which is
    // what actually matters (a stale act would otherwise keep writing inline
    // styles to detached nodes). The idle rAF itself leaks one loop per visit
    // to this route. Add a real destroy() to the engine if a session is ever
    // expected to enter and leave this page dozens of times.
    if (!api)
      return
    api.acts.length = 0
    api.worlds.length = 0
    api.clips.length = 0
    api = null
  })

  return {
    relayout: () => api?.layout(),
  }
}
