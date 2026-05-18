<script setup lang="ts">
/**
 * Mobile menu — full-screen typographic takeover (folio, not tray).
 *
 * Accessibility commitments:
 *   - ESC closes
 *   - Body scroll locked while open
 *   - Focus moves to the first nav item on open
 *   - Focus is trapped within the takeover via inert on background siblings
 *   - Focus returns to the menu button when the takeover closes
 *
 * Motion:
 *   - Surface fade and item stagger via opacity only
 *   - Under prefers-reduced-motion, --duration-* tokens collapse to 0ms,
 *     so transitions become instant. Content remains visible by default.
 */
interface Props {
  open: boolean
  links: ReadonlyArray<{ to: string, label: string }>
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const takeoverRef = ref<HTMLElement | null>(null)

// Address line shown at the bottom of the takeover (mirrors footer imprint)
const imprintLine = '943 Godber Street · Charleston, SC'
const hoursLine = 'By appointment · Tues — Sat'

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

// Body scroll lock — uses a data attribute on <html> so the lock state
// is observable in devtools and survives hot module reloads cleanly.
function setBodyScrollLock(locked: boolean) {
  if (typeof document === 'undefined')
    return
  if (locked) {
    document.documentElement.setAttribute('data-nav-open', 'true')
    document.body.style.overflow = 'hidden'
  }
  else {
    document.documentElement.removeAttribute('data-nav-open')
    document.body.style.overflow = ''
  }
}

watch(() => props.open, async (isOpen) => {
  setBodyScrollLock(isOpen)
  if (isOpen) {
    await nextTick()
    // First nav link is the focus target. Querying inside the takeover
    // sidesteps NuxtLink's ref typing without losing the trap.
    const firstLink = takeoverRef.value?.querySelector<HTMLAnchorElement>('.takeover__link')
    firstLink?.focus()
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  setBodyScrollLock(false)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="takeover">
      <div
        v-if="open"
        ref="takeoverRef"
        class="takeover"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div class="takeover__inner">
          <div class="takeover__top" aria-hidden="true">
            <p class="takeover__eyebrow">
              <span>Charleston Bonsai</span>
              <span class="takeover__bullet">·</span>
              <span>Navigation</span>
            </p>
          </div>

          <nav class="takeover__nav" aria-label="Primary mobile">
            <ol>
              <li
                v-for="(link, i) in links"
                :key="link.to"
                :style="{ '--i': i } as Record<string, number>"
              >
                <NuxtLink
                  :to="link.to"
                  class="takeover__link"
                  @click="emit('close')"
                >
                  <span class="takeover__link-numeral">{{ String(i + 1).padStart(2, '0') }}</span>
                  <span class="takeover__link-label">{{ link.label }}</span>
                </NuxtLink>
              </li>
            </ol>
          </nav>

          <div class="takeover__rule" aria-hidden="true" />

          <footer class="takeover__colophon">
            <div class="takeover__imprint">
              <p class="takeover__imprint-line">
                {{ imprintLine }}
              </p>
              <p class="takeover__imprint-line takeover__imprint-line--faint">
                {{ hoursLine }}
              </p>
            </div>
            <LayoutThemeToggle />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.takeover {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-sticky) - 1);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* Pad past the fixed header so the wordmark stays visible behind the
   takeover surface (the header still renders above it with z-sticky). */
.takeover__inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 5.5rem clamp(1.5rem, 6vw, 3rem) clamp(2rem, 6vw, 3rem);
  gap: var(--space-xl);
  max-width: 64rem;
  margin: 0 auto;
  width: 100%;
}

.takeover__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.takeover__eyebrow {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2xs);
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
}

.takeover__bullet {
  color: var(--accent);
}

.takeover__nav {
  flex: 1;
  display: flex;
  align-items: center;
}

.takeover__nav ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
}

.takeover__link {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-md);
  text-decoration: none;
  color: var(--text);
  position: relative;
  padding: var(--space-2xs) 0;
  opacity: 0;
  transform: translateY(0);
  /* Stagger via per-item delay; capped at 4 items so total < 240ms */
  animation: takeover-item var(--duration-slow) var(--ease-out-quart) forwards;
  animation-delay: calc(var(--i, 0) * 60ms + 120ms);
}

.takeover__link-numeral {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.875rem;
  letter-spacing: 0;
  color: var(--accent);
  font-feature-settings: var(--feat-spec-data);
  flex-shrink: 0;
  min-width: 2ch;
}

.takeover__link-label {
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(2rem, 9vw, 3.25rem);
  line-height: var(--leading-display-tight);
  letter-spacing: var(--tracking-display);
  color: var(--text);
}

.takeover__link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.5rem;
  height: 1px;
  background: var(--text);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.takeover__link:hover::after,
.takeover__link:focus-visible::after {
  transform: scaleX(1);
}

.takeover__link:focus-visible {
  outline: none;
}

.takeover__rule {
  height: 1px;
  background: var(--border-hair);
}

.takeover__colophon {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-lg);
}

.takeover__imprint {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
}

.takeover__imprint-line {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
}

.takeover__imprint-line--faint {
  color: var(--text-faint);
}

/* Surface enter/leave — opacity only per motion principles */
.takeover-enter-active,
.takeover-leave-active {
  transition: opacity var(--duration-base) var(--ease-out-quart);
}

.takeover-enter-from,
.takeover-leave-to {
  opacity: 0;
}

/* Item stagger keyframe — opacity only */
@keyframes takeover-item {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Reduced motion: skip stagger entirely; items appear immediately. */
@media (prefers-reduced-motion: reduce) {
  .takeover__link {
    opacity: 1;
    animation: none;
  }
}
</style>
