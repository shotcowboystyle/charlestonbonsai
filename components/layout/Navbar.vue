<script setup lang="ts">
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const navLinks = [
  { to: '/', label: 'Index' },
  { to: '/gallery', label: 'Catalog' },
  { to: '/#visit', label: 'Visit' },
]

// Handle scroll
onMounted(() => {
  const handleScroll = () => {
    scrolled.value = window.scrollY > 50
  }

  window.addEventListener('scroll', handleScroll)
  handleScroll() // Check initial state

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>

<template>
  <header
    ref="navbar"
    class="cb-nav"
    :class="scrolled ? 'cb-nav--scrolled' : ''"
  >
    <nav class="cb-nav__inner">
      <div class="cb-nav__row">
        <!-- Logo — typographic monogram -->
        <NuxtLink to="/" class="cb-nav__logo group">
          <span class="cb-nav__mark" aria-hidden="true">CB</span>
          <span class="cb-nav__wordmark">Charleston Bonsai</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
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

        <!-- Mobile Menu Button -->
        <button
          class="cb-nav__menu-btn"
          aria-label="Toggle navigation"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="!mobileMenuOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div
          v-if="mobileMenuOpen"
          class="cb-nav__mobile"
        >
          <div class="cb-nav__mobile-inner">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="cb-nav__mobile-link"
              @click="mobileMenuOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </nav>
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
  transition:
    background-color var(--duration-base) var(--ease-out-quart),
    border-color var(--duration-base) var(--ease-out-quart);
  border-bottom: 1px solid transparent;
}

.cb-nav--scrolled {
  background: color-mix(in oklch, var(--surface) 92%, transparent);
  border-bottom-color: var(--border-hair);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.cb-nav__inner {
  max-width: 96rem;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 4vw, 3rem);
}

.cb-nav__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4.5rem;
}

.cb-nav__logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
  color: var(--text);
}

.cb-nav__mark {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ink-2);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text);
}

.cb-nav__wordmark {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-style: italic;
  color: var(--text);
}

.cb-nav__links {
  display: none;
  align-items: center;
  gap: var(--space-xl);
}

@media (min-width: 768px) {
  .cb-nav__links {
    display: flex;
  }
}

.cb-nav__link {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  position: relative;
  padding: var(--space-2xs) 0;
  transition: color var(--duration-base) var(--ease-out-quart);
  font-feature-settings: var(--feat-small-caps);
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

.cb-nav__menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xs);
  color: var(--text);
  background: transparent;
  border: 0;
  cursor: pointer;
}

@media (min-width: 768px) {
  .cb-nav__menu-btn {
    display: none;
  }
}

.cb-nav__mobile {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface);
  border-top: 1px solid var(--border-hair);
}

.cb-nav__mobile-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md) clamp(1.25rem, 4vw, 3rem);
}

.cb-nav__mobile-link {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  text-decoration: none;
  padding: var(--space-2xs) 0;
  font-feature-settings: var(--feat-small-caps);
}
</style>
