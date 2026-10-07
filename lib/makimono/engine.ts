/**
 * Loads the scrollcraft engine, which ships unmodified in public/scrollcraft/.
 * The engine is a classic script that sets window.ScrollCraft; its stylesheet
 * carries global resets, so the page adds it through useHead and it leaves
 * with the page on navigation.
 */

export interface ScrollCraftInstance {
  destroy: () => void
  layout: () => void
}

interface ScrollCraftGlobal {
  mount: (root: Element, opts?: Record<string, unknown>) => ScrollCraftInstance
}

declare global {
  interface Window { ScrollCraft?: ScrollCraftGlobal }
}

export const ENGINE_CSS = '/scrollcraft/scrollcraft.css'
const ENGINE_JS = '/scrollcraft/scrollcraft.js'

function stylesheetReady(): Promise<void> {
  const link = document.querySelector<HTMLLinkElement>(`link[href="${ENGINE_CSS}"]`)
  if (!link || link.sheet)
    return Promise.resolve()
  return new Promise((resolve) => {
    link.addEventListener('load', () => resolve(), { once: true })
    // A failed stylesheet should not hold the page hostage; the world still mounts.
    link.addEventListener('error', () => resolve(), { once: true })
  })
}

function script(): Promise<ScrollCraftGlobal> {
  if (window.ScrollCraft)
    return Promise.resolve(window.ScrollCraft)
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = ENGINE_JS
    el.async = true
    el.onload = () => window.ScrollCraft ? resolve(window.ScrollCraft) : reject(new Error('scrollcraft did not register'))
    el.onerror = () => reject(new Error(`failed to load ${ENGINE_JS}`))
    document.head.appendChild(el)
  })
}

export async function loadScrollCraft(): Promise<ScrollCraftGlobal> {
  const [engine] = await Promise.all([script(), stylesheetReady()])
  return engine
}
