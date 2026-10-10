<script setup lang="ts">
// `fixed` pins the ink variant for surfaces that never go dark (admin).
withDefaults(defineProps<{
  variant?: 'horizontal' | 'wordmark' | 'icon' | 'primary'
  fixed?: boolean
}>(), { variant: 'horizontal', fixed: false })

const { siteName } = useSite()

// Intrinsic SVG sizes, so the browser reserves the box before the file loads.
const SIZES = {
  horizontal: [392, 57],
  wordmark: [247, 54],
  icon: [76, 90],
  primary: [247, 230],
} as const
</script>

<template>
  <span class="brand-logo" :class="{ 'brand-logo--fixed': fixed }">
    <img
      class="brand-logo__img brand-logo__img--ink"
      :src="`/brand/charleston-bonsai-${variant}-ink.svg`"
      :width="SIZES[variant][0]"
      :height="SIZES[variant][1]"
      :alt="siteName"
    >
    <img
      v-if="!fixed"
      class="brand-logo__img brand-logo__img--bone"
      :src="`/brand/charleston-bonsai-${variant}-bone.svg`"
      :width="SIZES[variant][0]"
      :height="SIZES[variant][1]"
      alt=""
      aria-hidden="true"
    >
  </span>
</template>

<style scoped>
.brand-logo {
  display: inline-flex;
  line-height: 0;
}

.brand-logo__img {
  display: block;
  height: 100%;
  width: auto;
}

.brand-logo__img--bone {
  display: none;
}

[data-theme='dark'] .brand-logo:not(.brand-logo--fixed) .brand-logo__img--ink {
  display: none;
}

[data-theme='dark'] .brand-logo:not(.brand-logo--fixed) .brand-logo__img--bone {
  display: block;
}
</style>
