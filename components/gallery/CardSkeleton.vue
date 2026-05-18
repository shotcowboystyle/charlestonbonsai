<script setup lang="ts">
// Placeholder tile rendered while the catalog loads. Geometry mirrors
// TreeCard.vue exactly so the swap to real cards does not shift layout.
// The pulse is a slow opacity drift, not the conventional sweep — it
// reads as ink settling on paper rather than chrome catching light.
// Under prefers-reduced-motion the pulse stops (tokens.css forces 0ms).
</script>

<template>
  <div class="skel" aria-hidden="true">
    <div class="skel__frame" />
    <div class="skel__meta">
      <div class="skel__bar skel__bar--name" />
      <div class="skel__bar skel__bar--line" />
      <div class="skel__bar skel__bar--price" />
    </div>
  </div>
</template>

<style scoped>
.skel {
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--surface-raised);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.skel__frame {
  aspect-ratio: 4 / 5;
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border-hair);
  animation: skel-breath 2.8s var(--ease-in-out) infinite;
}

.skel__meta {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  column-gap: var(--space-sm);
  row-gap: var(--space-2xs);
  padding: var(--space-sm) var(--space-md) var(--space-md);
}

.skel__bar {
  background: var(--surface-raised);
  border-radius: var(--radius-sm);
  height: 0.875rem;
  animation: skel-breath 2.8s var(--ease-in-out) infinite;
}

.skel__bar--name {
  grid-column: 1;
  grid-row: 1;
  width: 62%;
  height: 1.125rem;
  animation-delay: 60ms;
}

.skel__bar--price {
  grid-column: 2;
  grid-row: 1;
  width: 3.5rem;
  height: 1.125rem;
  animation-delay: 120ms;
}

.skel__bar--line {
  grid-column: 1 / -1;
  grid-row: 2;
  width: 80%;
  animation-delay: 180ms;
}

@keyframes skel-breath {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 1; }
}
</style>
