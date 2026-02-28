<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'forest' | 'sage' | 'bark' | 'stone' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'sage',
  size: 'md',
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center font-medium rounded-full'
  
  const variants = {
    forest: 'bg-forest-50 text-forest-500',
    sage: 'bg-sage-50 text-sage-400',
    bark: 'bg-bark-50 text-bark-400',
    stone: 'bg-stone-100 text-stone-500',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    error: 'bg-red-50 text-red-600',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-2xs',
    md: 'px-3 py-1 text-xs',
  }

  return [base, variants[props.variant], sizes[props.size]]
})
</script>
