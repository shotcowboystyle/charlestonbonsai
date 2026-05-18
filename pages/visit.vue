<script setup lang="ts">
useHead({
  title: 'Visit — Charleston Bonsai',
  meta: [
    {
      name: 'description',
      content: 'Visits to the Charleston Bonsai nursery are by appointment, Tuesday through Saturday. Specimens viewed by request.',
    },
  ],
})

const currentYear = new Date().getFullYear()
</script>

<template>
  <article class="visit-page">
    <header class="visit-page__masthead">
      <p class="visit-page__eyebrow">
        <span class="visit-page__numeral">I</span>
        <span>Visit</span>
      </p>
      <h1 class="visit-page__heading">
        By appointment, year-round.
      </h1>
      <p class="visit-page__lede">
        The nursery is a working bench, not a storefront. Visits are arranged
        in advance so that a tree can be on the table when you arrive and so
        that the person who trained it can be there to talk about it.
      </p>
    </header>

    <section class="visit-page__lines" aria-label="Visit details">
      <dl class="visit-page__dl">
        <div>
          <dt>Where</dt>
          <dd>
            943 Godber Street<br>
            Charleston, South Carolina 29412
          </dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>By appointment · Tuesday through Saturday</dd>
        </div>
        <div>
          <dt>Write</dt>
          <dd>
            <a href="mailto:hello@charlestonbonsai.com">hello@charlestonbonsai.com</a>
          </dd>
        </div>
      </dl>
    </section>

    <section class="visit-page__close">
      <p>
        Inquiries about specific specimens — lineage, training history,
        repotting cycle, pot lineage — are welcome. Please name the tree.
      </p>
      <p class="visit-page__year">
        Charleston · Est. 2015
      </p>
    </section>

    <footer class="visit-page__lat" aria-hidden="true">
      <span>32°47′N · 79°55′W</span>
      <span>{{ currentYear }}</span>
    </footer>
  </article>
</template>

<style scoped>
.visit-page {
  max-width: 64rem;
  margin: 0 auto;
  padding: clamp(5rem, 12vw, 9rem) clamp(1.5rem, 5vw, 3rem) clamp(4rem, 10vw, 7rem);
  display: flex;
  flex-direction: column;
  gap: var(--section-y);
  background: var(--surface);
  color: var(--text);
}

.visit-page__masthead {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 50ch;
}

.visit-page__eyebrow {
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

.visit-page__numeral {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--accent);
}

.visit-page__heading {
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--type-display-2);
  line-height: var(--leading-display-tight);
  letter-spacing: var(--tracking-display);
  margin: 0;
  color: var(--text);
}

.visit-page__lede {
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.65;
  color: var(--text-muted);
  max-width: var(--measure-reading);
  margin: 0;
}

.visit-page__lines {
  border-top: 1px solid var(--border-hair);
  padding-top: var(--space-xl);
}

.visit-page__dl {
  display: grid;
  gap: var(--space-xl);
  grid-template-columns: 1fr;
  margin: 0;
}

@media (min-width: 720px) {
  .visit-page__dl {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2xl);
  }
}

.visit-page__dl > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.visit-page__dl dt {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
}

.visit-page__dl dd {
  font-family: var(--font-display);
  font-size: 1.125rem;
  line-height: 1.55;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.visit-page__dl a {
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 1px;
  transition: color var(--duration-base) var(--ease-out-quart);
}

.visit-page__dl a:hover,
.visit-page__dl a:focus-visible {
  color: var(--accent);
}

.visit-page__close {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: var(--measure-reading);
}

.visit-page__close p {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-muted);
  margin: 0;
}

.visit-page__year {
  font-family: var(--font-body);
  font-size: 0.6875rem !important;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint) !important;
  font-feature-settings: var(--feat-small-caps);
}

.visit-page__lat {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border-hair);
  padding-top: var(--space-md);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-spec-data);
}
</style>
