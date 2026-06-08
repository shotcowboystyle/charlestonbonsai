<script setup lang="ts">
/**
 * Site footer — printed-catalog colophon.
 *
 * Three columns on desktop:
 *   1. Imprint — address, hours
 *   2. Notified — single-field email signup with inline state machine
 *   3. Colophon — typefaces, established year, location, theme toggle, legal
 *
 * Surface is --surface-sunken; the column rule is the colophon page's
 * masthead. Mobile collapses to a single stacked column separated by
 * hairline rules.
 */
const year = new Date().getFullYear()
const { siteName, contactEmail, contactMailto } = useSite()
</script>

<template>
  <footer class="cb-footer" role="contentinfo">
    <div class="cb-footer__inner">
      <div class="cb-footer__rule" aria-hidden="true" />

      <div class="cb-footer__grid">
        <!-- Column 1: Imprint -->
        <section class="cb-footer__col cb-footer__col--imprint" aria-labelledby="footer-imprint">
          <h2 id="footer-imprint" class="cb-footer__heading">
            Visit
          </h2>
          <address class="cb-footer__address">
            <span class="cb-footer__place">
              Charleston, South Carolina
            </span>
            <span>943 Godber Street</span>
            <span>Charleston, SC 29412</span>
          </address>
          <p class="cb-footer__hours">
            By appointment, Tuesday through Saturday.
          </p>
          <p class="cb-footer__write">
            <a :href="contactMailto">
              {{ contactEmail }}
            </a>
          </p>
        </section>

        <!-- Column 2: Notified -->
        <section class="cb-footer__col cb-footer__col--notify" aria-labelledby="footer-notify">
          <h2 id="footer-notify" class="cb-footer__heading">
            Notified
          </h2>
          <LayoutSubscribeForm />
        </section>

        <!-- Column 3: Colophon -->
        <section class="cb-footer__col cb-footer__col--colophon" aria-labelledby="footer-colophon">
          <h2 id="footer-colophon" class="cb-footer__heading">
            Colophon
          </h2>
          <div class="cb-footer__colophon">
            <p>Set in Cardo &amp; Albert Sans.</p>
            <p>Established 2015.</p>
            <p>Made in Charleston, South Carolina.</p>
          </div>
          <div class="cb-footer__theme">
            <span class="cb-footer__theme-label">Theme</span>
            <LayoutThemeToggle />
          </div>
        </section>
      </div>

      <div class="cb-footer__legal">
        <p class="cb-footer__copy">
          &copy; {{ year }} {{ siteName }}
        </p>
        <nav class="cb-footer__legal-nav" aria-label="Legal">
          <NuxtLink to="/privacy-policy">
            Privacy
          </NuxtLink>
          <span class="cb-footer__legal-bullet" aria-hidden="true">·</span>
          <NuxtLink to="/terms-of-service">
            Terms
          </NuxtLink>
          <span class="cb-footer__legal-bullet" aria-hidden="true">·</span>
          <NuxtLink to="/data-removal">
            Data removal
          </NuxtLink>
          <span class="cb-footer__legal-bullet" aria-hidden="true">·</span>
          <NuxtLink to="/admin/login">
            Admin
          </NuxtLink>
        </nav>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.cb-footer {
  background: var(--surface-sunken);
  color: var(--text-muted);
  border-top: 1px solid var(--border-hair);
}

.cb-footer__inner {
  max-width: 96rem;
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 5rem) clamp(1.5rem, 5vw, 3rem);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* The page-wide masthead rule that the three columns sit under */
.cb-footer__rule {
  height: 1px;
  background: var(--ink-4);
  width: 100%;
}

.cb-footer__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-2xl);
}

/* Hairline separators between stacked sections on mobile */
@media (max-width: 719px) {
  .cb-footer__col + .cb-footer__col {
    padding-top: var(--space-xl);
    border-top: 1px solid var(--border-hair);
  }
}

@media (min-width: 720px) {
  .cb-footer__grid {
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-xl);
  }
}

@media (min-width: 1100px) {
  .cb-footer__grid {
    grid-template-columns: 1.1fr 1.4fr 1fr;
    gap: clamp(var(--space-xl), 5vw, var(--space-3xl));
  }
}

.cb-footer__col {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.cb-footer__heading {
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
  font-weight: 500;
}

/* --------------------------------------------------------
   IMPRINT COLUMN
   -------------------------------------------------------- */
.cb-footer__address {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
  font-style: normal;
}

.cb-footer__address > span {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  line-height: 1.5;
  color: var(--text);
  font-feature-settings: var(--feat-running-text);
}

.cb-footer__place {
  font-style: italic;
  font-size: 1.125rem !important;
  margin-bottom: var(--space-3xs);
}

.cb-footer__hours {
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--text-muted);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.cb-footer__write {
  margin: 0;
}

.cb-footer__write a {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 1px;
  transition: color var(--duration-base) var(--ease-out-quart);
}

.cb-footer__write a:hover,
.cb-footer__write a:focus-visible {
  color: var(--accent);
}

.cb-footer__write a:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

/* --------------------------------------------------------
   COLOPHON COLUMN
   -------------------------------------------------------- */
.cb-footer__colophon {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
}

.cb-footer__colophon p {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-muted);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.cb-footer__theme {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.cb-footer__theme-label {
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
}

/* --------------------------------------------------------
   LEGAL ROW
   -------------------------------------------------------- */
.cb-footer__legal {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  border-top: 1px solid var(--border-hair);
  padding-top: var(--space-md);
}

.cb-footer__copy {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.16em;
  color: var(--text-faint);
  margin: 0;
  font-feature-settings: var(--feat-spec-data);
}

.cb-footer__legal-nav {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2xs);
}

.cb-footer__legal-nav a {
  font-family: var(--font-body);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  text-decoration: none;
  font-feature-settings: var(--feat-small-caps);
  transition: color var(--duration-base) var(--ease-out-quart);
}

.cb-footer__legal-nav a:hover,
.cb-footer__legal-nav a:focus-visible {
  color: var(--text);
}

.cb-footer__legal-nav a:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.cb-footer__legal-bullet {
  color: var(--text-faint);
  opacity: 0.5;
}
</style>
