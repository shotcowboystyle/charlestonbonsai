<script setup lang="ts">
type Status = 'confirmed' | 'already' | 'expired' | 'invalid'

const route = useRoute()
const { siteName } = useSite()
const status = computed<Status>(() => {
  const raw = route.query.status
  if (raw === 'confirmed' || raw === 'already' || raw === 'expired' || raw === 'invalid')
    return raw
  return 'invalid'
})

const heading = computed(() => {
  switch (status.value) {
    case 'confirmed': return 'Subscription confirmed.'
    case 'already': return 'Already confirmed.'
    case 'expired': return 'This link has expired.'
    case 'invalid': return 'This link is not valid.'
  }
  return ''
})

const body = computed(() => {
  switch (status.value) {
    case 'confirmed':
      return 'You’ll receive a quiet note when a new tree is listed. Nothing else.'
    case 'already':
      return 'Your address is already on the list. No action needed.'
    case 'expired':
      return 'Subscribe again from the footer and we’ll send a fresh confirmation link.'
    case 'invalid':
      return 'The token didn’t match anything we have on record. If you signed up recently, the link may have already been used.'
  }
  return ''
})

useHead({
  title: `Subscription — ${siteName}`,
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <article class="confirmed-page">
    <header class="confirmed-page__masthead">
      <p class="confirmed-page__eyebrow">
        <span class="confirmed-page__numeral">·</span>
        <span>Subscription</span>
      </p>
      <h1 class="confirmed-page__heading">
        {{ heading }}
      </h1>
      <p class="confirmed-page__lede">
        {{ body }}
      </p>
    </header>

    <p class="confirmed-page__return">
      <NuxtLink to="/">
        Return to the gallery
      </NuxtLink>
    </p>
  </article>
</template>

<style scoped>
.confirmed-page {
  max-width: 64rem;
  margin: 0 auto;
  padding: clamp(5rem, 12vw, 9rem) clamp(1.5rem, 5vw, 3rem) clamp(4rem, 10vw, 7rem);
  display: flex;
  flex-direction: column;
  gap: var(--section-y);
  background: var(--surface);
  color: var(--text);
}

.confirmed-page__masthead {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 52ch;
}

.confirmed-page__eyebrow {
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

.confirmed-page__numeral {
  color: var(--text-faint);
}

.confirmed-page__heading {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.1;
  margin: 0;
}

.confirmed-page__lede {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.125rem;
  line-height: 1.55;
  color: var(--text-muted);
  margin: 0;
}

.confirmed-page__return {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
}

.confirmed-page__return a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: 2px;
  transition: border-color var(--duration-base) var(--ease-out-quart);
}

.confirmed-page__return a:hover,
.confirmed-page__return a:focus-visible {
  border-bottom-color: var(--text);
}
</style>
