<script setup lang="ts">
/**
 * Editorial reading layout used by the legal trio:
 *   - /privacy-policy
 *   - /terms-of-service
 *   - /data-removal
 *
 * Pages opt in via `definePageMeta({ layout: 'legal' })`. The slot
 * receives a masthead block (kicker + title + subtitle) and the document
 * body as plain semantic HTML; the typographic treatment for h2 / h3 /
 * p / ul / ol / blockquote / strong / em / a is applied here so the
 * three documents stay coherent without each page repeating styles.
 *
 * The kicker, title, and subtitle slots are typed loosely so each page
 * can render them however it likes inside the masthead area. The
 * canonical pattern is below in <template>.
 */
</script>

<template>
  <div class="legal">
    <div class="legal__shell">
      <NuxtLink to="/" class="legal__return">
        <span aria-hidden="true">←</span>
        return to the index
      </NuxtLink>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.legal {
  --nav-h: 4.75rem;
  --col-pad-x: clamp(1.25rem, 5vw, 2.5rem);
  --col-max: 50rem;
  --reading-max: 38rem;

  min-height: 100vh;
  padding-top: var(--nav-h);
  background: var(--surface);
  color: var(--text);
}

.legal__shell {
  max-width: var(--col-max);
  margin: 0 auto;
  padding: var(--space-xl) var(--col-pad-x) var(--space-3xl);
}

.legal__return {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5em;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  text-decoration: none;
  padding: var(--space-2xs) 0;
  margin-bottom: var(--space-2xl);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.legal__return:hover {
  color: var(--text);
}

.legal__return:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

/* ──────── masthead (slot content, scoped :deep) ──────── */

.legal :deep(.legal-masthead) {
  margin-bottom: var(--space-3xl);
  display: grid;
  gap: var(--space-sm);
}

.legal :deep(.legal-masthead__kicker) {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--accent);
  font-feature-settings: var(--feat-small-caps);
}

.legal :deep(.legal-masthead__title) {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.25rem, 5.5vw, 3.5rem);
  line-height: 1.04;
  letter-spacing: -0.025em;
  color: var(--text);
}

.legal :deep(.legal-masthead__subtitle) {
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--text-faint);
  letter-spacing: 0.01em;
}

/* ──────── article body (slot content) ──────── */

.legal :deep(.legal-article) {
  max-width: var(--reading-max);
}

.legal :deep(.legal-article > section + section) {
  margin-top: var(--space-2xl);
}

.legal :deep(.legal-article h2) {
  display: grid;
  grid-template-columns: 2.5em 1fr;
  gap: var(--space-2xs);
  align-items: baseline;
  margin: 0 0 var(--space-md);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.375rem, 2.6vw, 1.75rem);
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--text);
}

.legal :deep(.legal-article h2 .legal-num) {
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  color: var(--text-faint);
  font-feature-settings: var(--feat-spec-data), var(--feat-small-caps);
  white-space: nowrap;
}

.legal :deep(.legal-article h3) {
  margin: var(--space-xl) 0 var(--space-2xs);
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 1.125rem;
  color: var(--text);
}

.legal :deep(.legal-article p) {
  margin: 0 0 1.1em;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text);
}

.legal :deep(.legal-article p:last-child) {
  margin-bottom: 0;
}

.legal :deep(.legal-article ul),
.legal :deep(.legal-article ol) {
  margin: 0 0 1.1em;
  padding-left: 1.25em;
  display: grid;
  gap: 0.4em;
}

.legal :deep(.legal-article li) {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text);
}

.legal :deep(.legal-article li::marker) {
  color: var(--text-faint);
}

.legal :deep(.legal-article a) {
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 0.05em;
  transition: color var(--duration-base) var(--ease-out-quart);
}

.legal :deep(.legal-article a:hover) {
  color: var(--accent);
}

.legal :deep(.legal-article a:focus-visible) {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.legal :deep(.legal-article strong) {
  font-weight: 700;
  color: var(--text);
}

.legal :deep(.legal-article em) {
  font-style: italic;
}

/* ──────── contact callout ──────── */

.legal :deep(.legal-contact) {
  margin-top: var(--space-md);
  padding: var(--space-md) var(--space-md);
  background: var(--surface-raised);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  display: grid;
  gap: var(--space-2xs);
  max-width: var(--reading-max);
}

.legal :deep(.legal-contact__name) {
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--text);
}

.legal :deep(.legal-contact dl) {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: var(--space-md);
  row-gap: var(--space-3xs);
  font-family: var(--font-body);
  font-size: 0.9375rem;
}

.legal :deep(.legal-contact dt) {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  align-self: baseline;
  padding-top: 0.4em;
}

.legal :deep(.legal-contact dd) {
  margin: 0;
  color: var(--text);
}

/* ──────── focal callout (write-to-us with display email) ──────── */

.legal :deep(.legal-callout) {
  margin: var(--space-lg) 0 var(--space-xl);
  padding: var(--space-lg) var(--space-md);
  background: var(--surface-raised);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  display: grid;
  gap: var(--space-2xs);
  max-width: var(--reading-max);
}

.legal :deep(.legal-callout__eyebrow) {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--accent);
  font-feature-settings: var(--feat-small-caps);
}

.legal :deep(.legal-callout__action) {
  position: relative;
  display: inline-block;
  width: max-content;
  max-width: 100%;
  padding-bottom: 0.15em;
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  color: var(--text);
  text-decoration: none;
  border-bottom: 0;
  word-break: break-word;
}

.legal :deep(.legal-callout__action::after) {
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

.legal :deep(.legal-callout__action:hover::after),
.legal :deep(.legal-callout__action:focus-visible::after) {
  transform: scaleX(1);
}

.legal :deep(.legal-callout__hint) {
  margin: var(--space-2xs) 0 0;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-faint);
}

/* ──────── dark mode display-weight bump ──────── */

[data-theme='dark'] .legal :deep(.legal-masthead__title),
[data-theme='dark'] .legal :deep(.legal-article h2) {
  font-weight: 700;
}
</style>
