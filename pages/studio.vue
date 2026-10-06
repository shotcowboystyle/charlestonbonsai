<script setup lang="ts">
definePageMeta({ layout: false })

useHead({ meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }] })

useSeo({
  title: 'Bonsai Studio',
  description: 'Watch a bonsai grow from bare soil to a finished, wired, moss-dressed specimen. Choose the style, the species and the size, then place it in a Japanese garden at dawn, in snow, by moonlight or in rain.',
})
</script>

<template>
  <div class="studio-page">
    <ClientOnly>
      <StudioRoot />
      <template #fallback>
        <div class="studio-boot" aria-busy="true">
          <p class="studio-boot__mark">
            盆栽工房
          </p>
          <p class="studio-boot__line">
            Preparing the studio
          </p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.studio-boot {
  position: fixed;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 0.75rem;
  text-align: center;
  background: #ece8dc;
  color: #1d211c;
}

.studio-boot__mark {
  font-family: 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', var(--font-display), serif;
  font-size: 2.25rem;
  letter-spacing: 0.2em;
}

.studio-boot__line {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  letter-spacing: 0.08em;
  color: #4a4e45;
}
</style>
