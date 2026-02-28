<template>
  <div :class="['max-w-7xl mx-auto', paddingClass]">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md'
})

const paddingClass = computed(() => {
  const classes = {
    none: '',
    sm: 'px-4 sm:px-6 lg:px-8',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
    xl: 'px-8 sm:px-12 lg:px-16'
  }
  return classes[props.padding]
})
</script>
