import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '~/composables/useTheme'

describe('useTheme.initFromClient (which tests readInitialTheme)', () => {
  let mockGetItem: any
  let mockSetItem: any
  let mockMatchMedia: any
  const STORAGE_KEY = 'cb-theme'

  beforeEach(() => {
    mockGetItem = vi.fn()
    mockSetItem = vi.fn()
    mockMatchMedia = vi.fn()

    // Mock localStorage
    const localStorageMock = {
      getItem: mockGetItem,
      setItem: mockSetItem,
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    vi.stubGlobal('localStorage', localStorageMock)

    // Mock matchMedia
    vi.stubGlobal('matchMedia', mockMatchMedia)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to matchMedia when localStorage throws an error', () => {
    mockGetItem.mockImplementation(() => {
      throw new Error('Access denied')
    })
    mockMatchMedia.mockReturnValue({ matches: true })

    const { theme, initFromClient } = useTheme()
    initFromClient()

    expect(theme.value).toBe('dark')
    expect(mockGetItem).toHaveBeenCalledWith(STORAGE_KEY)
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('falls back to matchMedia when localStorage contains an invalid value', () => {
    mockGetItem.mockReturnValue('blue')
    mockMatchMedia.mockReturnValue({ matches: true })

    const { theme, initFromClient } = useTheme()
    initFromClient()

    expect(theme.value).toBe('dark')
    expect(mockGetItem).toHaveBeenCalledWith(STORAGE_KEY)
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('returns valid value from localStorage without checking matchMedia', () => {
    mockGetItem.mockReturnValue('dark')

    const { theme, initFromClient } = useTheme()
    initFromClient()

    expect(theme.value).toBe('dark')
    expect(mockGetItem).toHaveBeenCalledWith(STORAGE_KEY)
    expect(mockMatchMedia).not.toHaveBeenCalled()
  })

  it('gracefully falls back to light theme when window.matchMedia is undefined', () => {
    mockGetItem.mockReturnValue(null)
    vi.stubGlobal('matchMedia', undefined) // Overwrite specifically for this test

    const { theme, initFromClient } = useTheme()
    initFromClient()

    expect(theme.value).toBe('light')
  })

  it('returns dark theme when matchMedia matches prefers-color-scheme: dark', () => {
    mockGetItem.mockReturnValue(null)
    mockMatchMedia.mockReturnValue({ matches: true })

    const { theme, initFromClient } = useTheme()
    initFromClient()

    expect(theme.value).toBe('dark')
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('returns light theme when matchMedia does not match prefers-color-scheme: dark', () => {
    mockGetItem.mockReturnValue(null)
    mockMatchMedia.mockReturnValue({ matches: false })

    const { theme, initFromClient } = useTheme()
    initFromClient()

    expect(theme.value).toBe('light')
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })
})
