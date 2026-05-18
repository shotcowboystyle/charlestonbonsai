<script setup lang="ts">
/**
 * Typographic Lt / Dk toggle, set in Cardo italic.
 *
 * Reads as a print mark rather than a UI control. The whole control
 * is one button with an aria-pressed binding; both letters render
 * visually distinct states but the click target spans both for
 * comfortable touch area (>44px).
 */
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-pressed="theme === 'dark'"
    :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="toggleTheme"
  >
    <span
      class="theme-toggle__letter"
      :class="{ 'is-active': theme === 'light' }"
      aria-hidden="true"
    >
      Lt
    </span>
    <span class="theme-toggle__rule" aria-hidden="true" />
    <span
      class="theme-toggle__letter"
      :class="{ 'is-active': theme === 'dark' }"
      aria-hidden="true"
    >
      Dk
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2xs);
  background: transparent;
  border: 0;
  padding: var(--space-2xs) var(--space-xs);
  cursor: pointer;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.875rem;
  line-height: 1;
  color: var(--text-faint);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.theme-toggle:hover {
  color: var(--text);
}

.theme-toggle:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.theme-toggle__letter {
  color: var(--text-faint);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.theme-toggle__letter.is-active {
  color: var(--text);
}

.theme-toggle__rule {
  width: 1px;
  height: 0.75em;
  background: var(--border-hair);
  align-self: center;
}
</style>
