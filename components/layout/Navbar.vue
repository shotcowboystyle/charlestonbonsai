<script setup lang="ts">
/**
 * Site chrome — header.
 *
 * Two modes:
 *   - Editorial: transparent over the homepage's opening plate.
 *     After scroll, fades to translucent bone with a hairline rule.
 *   - Product: solid bone surface with a hairline rule from first paint.
 *     Used on /gallery, /gallery/[id], /visit, and policy pages.
 *
 * The wordmark is a bracketed [CB] monogram set in Cardo italic with
 * the wordmark to its right. No square enclosure, no symbol-and-text
 * lockup that reads like a startup mark.
 */
const route = useRoute()

const navLinks = [
  { to: '/', label: 'Index' },
  { to: '/gallery', label: 'Catalog' },
  { to: '/events', label: 'Events' },
  { to: '/retreats', label: 'Retreats' },
  { to: '/visit', label: 'Visit' },
] as const

// Editorial mode is the homepage only. Every other public route is product mode.
const isEditorial = computed(() => route.path === '/')

const scrolled = ref(false)
const menuOpen = ref(false)

function handleScroll() {
  scrolled.value = window.scrollY > 80
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Close on route change. Vue's reactivity handles the watch cleanup
// when the component unmounts.
watch(() => route.path, () => {
  menuOpen.value = false
})

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header
    class="cb-nav"
    :class="{
      'cb-nav--editorial': isEditorial,
      'cb-nav--product': !isEditorial,
      'cb-nav--scrolled': scrolled,
      'cb-nav--menu-open': menuOpen,
    }"
    role="banner"
  >
    <a class="cb-nav__skip sr-only" href="#main-content">
      Skip to content
    </a>

    <nav class="cb-nav__inner" aria-label="Primary">
      <div class="cb-nav__row">
        <NuxtLink to="/" class="cb-nav__wordmark" @click="closeMenu">
          <span class="cb-nav__mark" aria-hidden="true">
            <span class="cb-nav__bracket cb-nav__bracket--open">[</span>
            <span class="cb-nav__monogram">CB</span>
            <span class="cb-nav__bracket cb-nav__bracket--close">]</span>
          </span>
          <span class="cb-nav__rule" aria-hidden="true" />
          <span class="cb-nav__name">Charleston Bonsai</span>
        </NuxtLink>

        <div class="cb-nav__links">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="cb-nav__link"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <div class="cb-nav__trailing" aria-hidden="true" />

        <button
          type="button"
          class="cb-nav__menu-btn"
          :aria-expanded="menuOpen"
          aria-label="Toggle navigation"
          @click="toggleMenu"
        >
          <span class="cb-nav__menu-rule" aria-hidden="true" />
          <span class="cb-nav__menu-label">
            {{ menuOpen ? 'Close' : 'Menu' }}
          </span>
        </button>
      </div>
    </nav>

    <LayoutMobileMenu
      :open="menuOpen"
      :links="navLinks"
      @close="closeMenu"
    />
  </header>
</template>

<style scoped>
.cb-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky);
  background: transparent;
  border-bottom: 1px solid transparent;
  transition:
    background-color var(--duration-base) var(--ease-out-quart),
    border-color var(--duration-base) var(--ease-out-quart);
}

/* Product mode: solid bone from first paint. */
.cb-nav--product {
  background: var(--surface);
  border-bottom-color: var(--border-hair);
}

/* Editorial mode (homepage): transparent until scroll, then translucent. */
.cb-nav--editorial.cb-nav--scrolled {
  background: color-mix(in oklch, var(--surface) 92%, transparent);
  border-bottom-color: var(--border-hair);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Menu open: surface becomes solid so the mobile takeover meets it cleanly. */
.cb-nav--menu-open {
  background: var(--surface);
  border-bottom-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.cb-nav__skip {
  background: var(--surface);
  color: var(--text);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--text);
  font-family: var(--font-body);
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-feature-settings: var(--feat-small-caps);
}

.cb-nav__inner {
  max-width: 96rem;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 4vw, 3rem);
}

.cb-nav__row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  height: 4.75rem;
  gap: var(--space-md);
}

/* --------------------------------------------------------
   WORDMARK — bracketed monogram + hairline rule + name
   -------------------------------------------------------- */
.cb-nav__wordmark {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
  color: var(--text);
}

.cb-nav__mark {
  display: inline-flex;
  align-items: baseline;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  letter-spacing: 0.02em;
  color: var(--text);
  line-height: 1;
}

.cb-nav__bracket {
  color: var(--accent);
  font-style: normal;
  font-weight: 400;
}

.cb-nav__bracket--open {
  margin-right: 0.075em;
}

.cb-nav__bracket--close {
  margin-left: 0.075em;
}

.cb-nav__monogram {
  font-feature-settings: 'smcp' 1;
  letter-spacing: 0.08em;
}

.cb-nav__rule {
  display: inline-block;
  width: 1px;
  height: 1rem;
  background: var(--border-hair);
}

.cb-nav__name {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  color: var(--text);
  line-height: 1;
}

@media (max-width: 480px) {
  .cb-nav__rule,
  .cb-nav__name {
    display: none;
  }
}

/* --------------------------------------------------------
   LINKS (desktop only) — center column
   -------------------------------------------------------- */
.cb-nav__links {
  display: none;
  align-items: center;
  justify-content: center;
  gap: var(--space-xl);
}

@media (min-width: 768px) {
  .cb-nav__links {
    display: flex;
  }
}

.cb-nav__link {
  position: relative;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  padding: var(--space-2xs) 0;
  font-feature-settings: var(--feat-small-caps);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.cb-nav__link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.cb-nav__link:hover,
.cb-nav__link:focus-visible,
.cb-nav__link.router-link-exact-active {
  color: var(--text);
}

.cb-nav__link:hover::after,
.cb-nav__link:focus-visible::after,
.cb-nav__link.router-link-exact-active::after {
  transform: scaleX(1);
}

.cb-nav__link:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

/* Right column kept deliberately empty on desktop — restraint is the slot */
.cb-nav__trailing {
  display: none;
}

@media (min-width: 768px) {
  .cb-nav__trailing {
    display: block;
    width: 1px;
  }
}

/* --------------------------------------------------------
   MOBILE MENU BUTTON — typographic, not iconographic
   -------------------------------------------------------- */
.cb-nav__menu-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3xs);
  padding: var(--space-2xs) 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  justify-self: end;
}

@media (min-width: 768px) {
  .cb-nav__menu-btn {
    display: none;
  }
}

.cb-nav__menu-rule {
  width: 1.5rem;
  height: 1px;
  background: var(--text);
  transition: background-color var(--duration-base) var(--ease-out-quart);
}

.cb-nav__menu-label {
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
}

.cb-nav__menu-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}
</style>
