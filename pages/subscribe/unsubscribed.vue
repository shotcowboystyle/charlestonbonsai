<script setup lang="ts">
const { siteName } = useSite()

useHead({
  title: `Unsubscribed — ${siteName}`,
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <article class="unsub-page">
    <header class="unsub-page__masthead">
      <p class="unsub-page__eyebrow">
        <span class="unsub-page__numeral">·</span>
        <span>Subscription</span>
      </p>
      <h1 class="unsub-page__heading">
        Unsubscribed.
      </h1>
      <p class="unsub-page__lede">
        You won’t hear from us again. If this was a mistake, you can sign up
        from the footer at any time.
      </p>
    </header>

    <p class="unsub-page__return">
      <NuxtLink to="/">
        Return to the gallery
      </NuxtLink>
    </p>
  </article>
</template>

<style scoped>
.unsub-page {
  max-width: 64rem;
  margin: 0 auto;
  padding: clamp(5rem, 12vw, 9rem) clamp(1.5rem, 5vw, 3rem) clamp(4rem, 10vw, 7rem);
  display: flex;
  flex-direction: column;
  gap: var(--section-y);
  background: var(--surface);
  color: var(--text);
}

.unsub-page__masthead {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 52ch;
}

.unsub-page__eyebrow {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-sm);
  margin: 0;
}

.unsub-page__numeral {
  color: var(--text-faint);
}

.unsub-page__heading {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.1;
  margin: 0;
}

.unsub-page__lede {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.125rem;
  line-height: 1.55;
  color: var(--text-muted);
  margin: 0;
}

.unsub-page__return {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
}

.unsub-page__return a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: 2px;
  transition: border-color var(--duration-base) var(--ease-out-quart);
}

.unsub-page__return a:hover,
.unsub-page__return a:focus-visible {
  border-bottom-color: var(--text);
}
</style>
