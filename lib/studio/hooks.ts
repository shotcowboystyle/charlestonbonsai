/**
 * `window.__studio`: automation hooks for deterministic screenshots and
 * E2E tests, in the spirit of the source's `__seek`. Every hook routes
 * through the same functions the UI uses — nothing here has its own path.
 */
import type { Selection, SelectionKey } from './state'
import { OPTION_IDS } from './state'

export interface HookTarget {
  seek: (t: number) => void
  select: <K extends SelectionKey>(key: K, value: Selection[K], instant?: boolean) => void
  orbit: (az: number, el: number, zoom?: number) => void
  perf: () => unknown
  state: () => { t: number, playing: boolean, selection: Selection }
  /** World point to canvas fractions [x, y], for scorecards and tests. */
  project: (x: number, y: number, z: number) => [number, number]
}

export interface StudioHooks {
  seek: (t: number) => void
  style: (v: string | number, instant?: boolean) => void
  tree: (v: string | number, instant?: boolean) => void
  size: (v: string | number, instant?: boolean) => void
  scene: (v: string | number, instant?: boolean) => void
  atmo: (v: string | number, instant?: boolean) => void
  orbit: (az: number, el: number, zoom?: number) => void
  perf: () => unknown
  state: HookTarget['state']
  project: HookTarget['project']
}

declare global {
  interface Window {
    __studio?: StudioHooks
  }
}

export function installHooks(target: HookTarget): () => void {
  const pick = <K extends SelectionKey>(key: K) => (v: string | number, instant = true) => {
    const list = OPTION_IDS[key]
    const value = typeof v === 'number' ? list[((v % list.length) + list.length) % list.length] : v
    if (!(list as readonly string[]).includes(value as string))
      throw new RangeError(`__studio.${key}: unknown value ${String(v)}`)
    target.select(key, value as Selection[K], instant)
  }
  window.__studio = {
    seek: target.seek,
    style: pick('style'),
    tree: pick('tree'),
    size: pick('size'),
    scene: pick('scene'),
    atmo: pick('atmo'),
    orbit: target.orbit,
    perf: target.perf,
    state: target.state,
    project: target.project,
  }
  return () => {
    delete window.__studio
  }
}
