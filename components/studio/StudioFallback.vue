<script setup lang="ts">
/**
 * Shown when WebGL is unavailable or the engine fails: a still ink study of
 * the selected tree, never a blank page. Renders the toast store itself
 * because the studio runs without the site layout.
 */
import { useToastStore } from '~/stores/toast'

defineProps<{ species: string, styleName: string }>()
const toast = useToastStore()
</script>

<template>
  <div class="st-fallback">
    <svg class="st-fallback__art" viewBox="0 0 320 300" role="img" :aria-label="`An ink study of a ${species} bonsai in ${styleName} style`">
      <g fill="none" stroke="currentColor" stroke-linecap="round">
        <path d="M160 238c-4-36 8-62-6-92-9-19-3-40 12-58" stroke-width="9" />
        <path d="M154 150c-22-6-44-2-66 10M164 118c22-8 44-6 62 4M160 176c18 0 34 6 48 16" stroke-width="4" />
      </g>
      <g fill="currentColor" opacity="0.82">
        <ellipse cx="86" cy="156" rx="40" ry="15" />
        <ellipse cx="226" cy="120" rx="44" ry="16" />
        <ellipse cx="210" cy="190" rx="34" ry="12" />
        <ellipse cx="166" cy="80" rx="48" ry="20" />
      </g>
      <path d="M96 238h128l-10 28H106z" fill="currentColor" opacity="0.9" />
      <path d="M80 270h160" stroke="currentColor" stroke-width="1" opacity="0.5" />
    </svg>
    <p class="st-fallback__title">
      {{ styleName }}, {{ species }}
    </p>
    <p class="st-fallback__note">
      The growing study needs WebGL. Your choices still change in the address bar, so the link can be opened on another device.
    </p>
    <ul class="st-fallback__toasts" aria-live="polite">
      <li v-for="t in toast.toasts" :key="t.id">
        <strong>{{ t.title }}</strong>
        <span v-if="t.description">{{ t.description }}</span>
      </li>
    </ul>
  </div>
</template>
