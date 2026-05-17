<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="cb-footer">
    <div class="cb-footer__inner">
      <div class="cb-footer__brand">
        <span class="cb-footer__mark" aria-hidden="true">CB</span>
        <span class="cb-footer__name">Charleston Bonsai</span>
      </div>

      <nav class="cb-footer__nav" aria-label="Footer">
        <NuxtLink to="/gallery">
          Catalog
        </NuxtLink>
        <NuxtLink to="/#visit">
          Visit
        </NuxtLink>
        <a href="mailto:hello@charlestonbonsai.com">
          Write
        </a>
        <NuxtLink to="/admin/login">
          Admin
        </NuxtLink>
      </nav>

      <div class="cb-footer__legal">
        <p class="cb-footer__copy">
          &copy; {{ year }} Charleston Bonsai
        </p>
        <div class="cb-footer__policies">
          <NuxtLink to="/privacy-policy">
            Privacy
          </NuxtLink>
          <NuxtLink to="/terms-of-service">
            Terms
          </NuxtLink>
          <NuxtLink to="/data-removal">
            Data removal
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.cb-footer {
  background: var(--surface-sunken);
  border-top: 1px solid var(--border-hair);
  color: var(--text-muted);
}

.cb-footer__inner {
  max-width: 90rem;
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1.25rem, 4vw, 3rem);
  display: grid;
  gap: var(--space-xl);
  grid-template-columns: 1fr;
  align-items: end;
}

@media (min-width: 720px) {
  .cb-footer__inner {
    grid-template-columns: auto 1fr auto;
    gap: var(--space-2xl);
  }
}

.cb-footer__brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text);
}

.cb-footer__mark {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ink-2);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
}

.cb-footer__name {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  color: var(--text);
}

.cb-footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md) var(--space-xl);
  justify-content: flex-start;
}

@media (min-width: 720px) {
  .cb-footer__nav {
    justify-content: center;
  }
}

.cb-footer__nav a {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  position: relative;
  padding-bottom: var(--space-3xs);
  font-feature-settings: var(--feat-small-caps);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.cb-footer__nav a::after {
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

.cb-footer__nav a:hover,
.cb-footer__nav a:focus-visible {
  color: var(--text);
}

.cb-footer__nav a:hover::after,
.cb-footer__nav a:focus-visible::after {
  transform: scaleX(1);
}

.cb-footer__legal {
  display: grid;
  gap: var(--space-2xs);
  justify-items: start;
}

@media (min-width: 720px) {
  .cb-footer__legal {
    justify-items: end;
    text-align: right;
  }
}

.cb-footer__copy {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  color: var(--text-faint);
  margin: 0;
  font-feature-settings: var(--feat-spec-data);
}

.cb-footer__policies {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.cb-footer__policies a {
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  text-decoration: none;
  font-feature-settings: var(--feat-small-caps);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.cb-footer__policies a:hover,
.cb-footer__policies a:focus-visible {
  color: var(--text);
}
</style>
