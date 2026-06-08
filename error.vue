<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error.statusCode === 404)
const { siteName } = useSite()

useHead({
  title: () => is404.value
    ? `Not in the catalog — ${siteName}`
    : `Something went wrong — ${siteName}`,
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
})

const headline = computed(() => {
  if (is404.value) {
    const msg = props.error.statusMessage?.trim()
    if (msg)
      return msg
    return 'That page isn’t in the catalog.'
  }
  return 'Something went wrong on our end.'
})

const subline = computed(() => is404.value
  ? 'You may have followed an old link, or the specimen has been retired to the archive.'
  : 'We’re looking into it. In the meantime, the catalog is still open.')

function goHome() {
  clearError({ redirect: '/' })
}
function goCatalog() {
  clearError({ redirect: '/gallery' })
}
</script>

<template>
  <NuxtLayout name="default">
    <div class="err">
      <article class="err__shell">
        <p class="err__eyebrow">
          {{ is404 ? 'Not found' : `Error ${error.statusCode || '500'}` }}
        </p>
        <h1 class="err__headline">
          {{ headline }}
        </h1>
        <p class="err__subline">
          {{ subline }}
        </p>

        <div class="err__actions">
          <button type="button" class="err__link" @click="goCatalog">
            Browse the catalog
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" class="err__link err__link--muted" @click="goHome">
            Return to the index
          </button>
        </div>
      </article>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.err {
  --nav-h: 4.75rem;
  --col-pad-x: clamp(1.25rem, 5vw, 2.5rem);
  min-height: calc(100vh - var(--nav-h));
  padding-top: var(--nav-h);
  background: var(--surface);
  color: var(--text);
  display: grid;
  align-content: center;
}

.err__shell {
  max-width: 44rem;
  margin: 0 auto;
  padding: var(--space-3xl) var(--col-pad-x);
  display: grid;
  gap: var(--space-md);
}

.err__eyebrow {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--accent);
  font-feature-settings: var(--feat-small-caps);
}

.err__headline {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2rem, 5vw, 3.25rem);
  line-height: 1.05;
  letter-spacing: -0.025em;
  color: var(--text);
}

.err__subline {
  margin: 0;
  max-width: 40ch;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text-muted);
}

.err__actions {
  margin-top: var(--space-md);
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-lg);
}

.err__link {
  position: relative;
  background: transparent;
  border: 0;
  padding: 0 0 0.2em;
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  color: var(--text);
  cursor: pointer;
}

.err__link::after {
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

.err__link:hover::after,
.err__link:focus-visible::after {
  transform: scaleX(1);
}

.err__link:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.err__link--muted {
  font-style: normal;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
}

.err__link--muted::after {
  background: var(--text-faint);
}

[data-theme='dark'] .err__headline {
  font-weight: 700;
}
</style>
