<script setup lang="ts">
// `fixed` pins the ink variant for surfaces that never go dark (admin).
withDefaults(defineProps<{
  variant?: 'horizontal' | 'wordmark' | 'icon' | 'primary'
  fixed?: boolean
}>(), { variant: 'horizontal', fixed: false })

const { siteName } = useSite()
</script>

<template>
  <span class="brand-logo" :class="{ 'brand-logo--fixed': fixed }">
    <img
      class="brand-logo__img brand-logo__img--ink"
      :src="`/brand/charleston-bonsai-${variant}-ink.svg`"
      :alt="siteName"
    >
    <img
      v-if="!fixed"
      class="brand-logo__img brand-logo__img--bone"
      :src="`/brand/charleston-bonsai-${variant}-bone.svg`"
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

:global([data-theme='dark']) .brand-logo:not(.brand-logo--fixed) .brand-logo__img--ink {
  display: none;
}

:global([data-theme='dark']) .brand-logo:not(.brand-logo--fixed) .brand-logo__img--bone {
  display: block;
}
</style>
