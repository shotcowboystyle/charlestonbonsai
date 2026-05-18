/**
 * Theme state for the sumi-e atelier system.
 *
 * Both light and dark are first-class modes. The brief commits to:
 *   - Read system preference on first visit
 *   - Persist explicit user selection to localStorage (key: STORAGE_KEY)
 *   - Apply data-theme on <html> so light-dark() in tokens.css resolves
 *
 * The pre-paint script in plugins/theme.client.ts runs before paint
 * to avoid a theme flash. This composable owns runtime state.
 */
import { useState } from '#imports'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'cb-theme'

function readInitialTheme(): Theme {
  if (typeof window === 'undefined')
    return 'light'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark')
      return stored
  }
  catch {
    // localStorage disabled — fall through to system preference
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined')
    return
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  const theme = useState<Theme>('cb-theme', () => 'light')

  function setTheme(next: Theme) {
    theme.value = next
    applyTheme(next)
    if (typeof window === 'undefined')
      return
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
    catch {
      // localStorage disabled — selection won't persist this session
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  function initFromClient() {
    if (typeof window === 'undefined')
      return
    const resolved = readInitialTheme()
    theme.value = resolved
    applyTheme(resolved)
  }

  return { theme, setTheme, toggleTheme, initFromClient }
}
