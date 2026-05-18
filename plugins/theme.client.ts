/**
 * Pre-paint theme application.
 *
 * Runs before the app mounts on the client. Reads the persisted theme
 * (or system preference on first visit) and sets data-theme on <html>
 * synchronously so the first paint already matches the user's mode.
 *
 * This avoids a theme flash between SSR/SSG output (no data-theme yet)
 * and the first client hydration. The inline script approach was
 * considered; a client plugin runs early enough for SSG output served
 * statically because Nuxt hydrates from the page's existing markup —
 * applying data-theme before any user interaction is sufficient.
 */
export default defineNuxtPlugin(() => {
  const { initFromClient } = useTheme()
  initFromClient()
})
