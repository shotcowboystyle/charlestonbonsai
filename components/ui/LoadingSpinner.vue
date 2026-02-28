<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullPage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  fullPage: false,
})

const containerClasses = computed(() => {
  return props.fullPage
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center py-8'
})

const spinnerClasses = computed(() => {
  const sizes = {
    sm: 'h-4 w-4 text-sage',
    md: 'h-8 w-8 text-sage',
    lg: 'h-12 w-12 text-sage',
  }
  return sizes[props.size]
})
</script>

<template>
  <div :class="containerClasses">
    <svg
      class="animate-spin"
      :class="spinnerClasses"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <p v-if="text" class="mt-3 text-sm text-stone-500">
      {{ text }}
    </p>
  </div>
</template>
