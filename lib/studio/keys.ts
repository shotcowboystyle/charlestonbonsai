/**
 * Keyboard map. Every pointer action has a key: orbit, zoom, reset, play,
 * restart, the five selectors (Shift reverses) and sound.
 */
import type { SelectionKey } from './state'

export type KeyAction
  = | { type: 'toggle' }
    | { type: 'restart' }
    | { type: 'reset-view' }
    | { type: 'cycle', key: SelectionKey, dir: 1 | -1 }
    | { type: 'orbit', az: number, el: number }
    | { type: 'zoom', factor: number }
    | { type: 'sound' }

const CYCLE: Record<string, SelectionKey> = { s: 'style', t: 'tree', z: 'size', l: 'scene', a: 'atmo' }

export const SHORTCUTS: readonly [string, string][] = [
  ['Space', 'Play or pause'],
  ['R', 'Grow again from soil'],
  ['S / T / Z', 'Next style, tree, size'],
  ['L / A', 'Next landscape, atmosphere'],
  ['Shift + key', 'Previous instead'],
  ['Arrows', 'Turn the view'],
  ['+ / −', 'Zoom'],
  ['C', 'Reset the view'],
  ['M', 'Sound on or off'],
]

/** Map a key event to an action, or null when the key belongs to a focused control. */
export function keyToAction(e: { key: string, shiftKey: boolean, altKey: boolean, ctrlKey: boolean, metaKey: boolean }, target: { tag: string, role: string | null }): KeyAction | null {
  if (e.altKey || e.ctrlKey || e.metaKey)
    return null
  const tag = target.tag.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select')
    return null
  const onControl = tag === 'button' || tag === 'a' || target.role === 'slider'
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
  if (k === ' ' && !onControl)
    return { type: 'toggle' }
  if (k === 'r')
    return { type: 'restart' }
  if (k === 'c')
    return { type: 'reset-view' }
  if (k === 'm')
    return { type: 'sound' }
  const cyc = CYCLE[k]
  if (cyc)
    return { type: 'cycle', key: cyc, dir: e.shiftKey ? -1 : 1 }
  if (target.role === 'slider')
    return null
  if (k === 'ArrowLeft')
    return { type: 'orbit', az: 0.12, el: 0 }
  if (k === 'ArrowRight')
    return { type: 'orbit', az: -0.12, el: 0 }
  if (k === 'ArrowUp')
    return { type: 'orbit', az: 0, el: 0.06 }
  if (k === 'ArrowDown')
    return { type: 'orbit', az: 0, el: -0.06 }
  if (k === '+' || k === '=')
    return { type: 'zoom', factor: 1.15 }
  if (k === '-' || k === '_')
    return { type: 'zoom', factor: 1 / 1.15 }
  return null
}
