<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  hover: true,
  padding: 'none',
})

const cardClasses = computed(() => {
  const base = 'bg-white rounded-2xl shadow-soft overflow-hidden transition-all duration-300'
  
  const hoverClass = props.hover ? 'hover:shadow-soft-lg hover:-translate-y-1' : ''
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return [base, hoverClass, paddingClasses[props.padding]]
})
</script>
