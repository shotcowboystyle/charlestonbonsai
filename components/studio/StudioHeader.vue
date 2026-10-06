<script setup lang="ts">
defineProps<{ sound: boolean }>()
defineEmits<{ toggleSound: [] }>()

const el = ref<HTMLElement | null>(null)
defineExpose({ el })
</script>

<template>
  <header ref="el" class="st-head">
    <NuxtLink to="/gallery" class="st-head__back">
      <span aria-hidden="true">←</span> Catalog
    </NuxtLink>
    <p class="st-head__mark">
      <span lang="ja" class="st-head__jp">盆栽工房</span>
      <span class="st-head__en">Bonsai Studio</span>
    </p>
    <slot />
    <button
      type="button"
      class="st-head__sound"
      :aria-pressed="sound"
      :aria-label="sound ? 'Sound: on' : 'Sound: off'"
      @click="$emit('toggleSound')"
    >
      <span class="st-head__sound-label">Sound</span>
      <span class="st-head__sound-value">{{ sound ? 'On' : 'Off' }}</span>
    </button>
  </header>
</template>
