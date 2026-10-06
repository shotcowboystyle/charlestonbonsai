import { describe, expect, it } from 'vitest'
import { ATMOSPHERES } from '~/lib/studio/atmospheres'
import { buildBonsai } from '~/lib/studio/bonsai/build'
import { keyToAction } from '~/lib/studio/keys'
import { cycleValue, DEFAULT_SELECTION, normalizeSelection, parseQuery, sizeLocked, toQuery, withValue } from '~/lib/studio/state'

describe('selection and URL state', () => {
  it('round-trips through the query string', () => {
    const sel = { style: 'kengai', tree: 'juniper', size: 'chumono', scene: 'koi-pond', atmo: 'tsukiyo' } as const
    expect(parseQuery(toQuery(sel))).toEqual(sel)
  })

  it('falls back to defaults for missing or unknown values', () => {
    expect(parseQuery({})).toEqual(DEFAULT_SELECTION)
    expect(parseQuery({ style: 'nope', tree: ['elm', 'pine'], size: 42 })).toEqual({ ...DEFAULT_SELECTION, tree: 'elm' })
  })

  it('lets Shito and Mame snap the size, with one source of truth', () => {
    expect(parseQuery({ style: 'mame', size: 'imperial' }).size).toBe('mame')
    const shito = withValue(DEFAULT_SELECTION, 'style', 'shito')
    expect(shito.size).toBe('shito')
    expect(sizeLocked(shito)).toBe(true)
    expect(withValue(shito, 'size', 'imperial')).toBe(shito)
    expect(cycleValue(shito, 'size')).toBe(shito)
    expect(normalizeSelection({ ...DEFAULT_SELECTION, style: 'chokkan', size: 'omono' }).size).toBe('omono')
  })

  it('builds the dwarf preset at its own size even if asked for another', () => {
    const b = buildBonsai({ style: 'mame', species: 'elm', size: 'imperial', leafBudget: 800 })
    expect(b.meta.height).toBeCloseTo(0.1)
    b.dispose()
  })

  it('cycles every selector and wraps', () => {
    let sel = DEFAULT_SELECTION
    for (let i = 0; i < ATMOSPHERES.length; i++) sel = cycleValue(sel, 'atmo')
    expect(sel.atmo).toBe(DEFAULT_SELECTION.atmo)
    expect(cycleValue(DEFAULT_SELECTION, 'scene', -1).scene).toBe('monastery-courtyard')
    expect(cycleValue({ ...DEFAULT_SELECTION, style: 'tanuki' }, 'style').style).toBe('chokkan')
  })
})

describe('keyboard map', () => {
  const body = { tag: 'BODY', role: null }
  const key = (k: string, shiftKey = false) => ({ key: k, shiftKey, altKey: false, ctrlKey: false, metaKey: false })

  it('maps every pointer action to a key', () => {
    expect(keyToAction(key(' '), body)).toEqual({ type: 'toggle' })
    expect(keyToAction(key('L', true), body)).toEqual({ type: 'cycle', key: 'scene', dir: -1 })
    expect(keyToAction(key('ArrowLeft'), body)?.type).toBe('orbit')
    expect(keyToAction(key('+'), body)?.type).toBe('zoom')
    expect(keyToAction(key('c'), body)).toEqual({ type: 'reset-view' })
  })

  it('leaves keys alone inside form controls and the slider', () => {
    expect(keyToAction(key('s'), { tag: 'SELECT', role: null })).toBeNull()
    expect(keyToAction(key('ArrowLeft'), { tag: 'DIV', role: 'slider' })).toBeNull()
    expect(keyToAction(key(' '), { tag: 'BUTTON', role: null })).toBeNull()
  })
})
