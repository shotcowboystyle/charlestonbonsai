<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-charcoal mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :class="textareaClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="mt-1.5 text-sm text-red-500">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1.5 text-sm text-stone-500">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id?: string
  label?: string
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
})

defineEmits(['update:modelValue'])

const textareaClasses = computed(() => {
  const base = [
    'w-full px-4 py-3 bg-white border rounded-lg resize-none',
    'focus:outline-none focus:ring-2 focus:border-transparent',
    'transition-all duration-200',
    'disabled:bg-cream-100 disabled:cursor-not-allowed',
  ]

  const errorClass = props.error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-stone-200 focus:ring-sage'

  return [...base, errorClass]
})
</script>
