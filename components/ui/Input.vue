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
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="inputClasses"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <div
        v-if="icon"
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
      >
        <component :is="icon" class="h-5 w-5 text-stone-400" />
      </div>
    </div>
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
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  icon?: any
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
})

defineEmits(['update:modelValue'])

const inputClasses = computed(() => {
  const base = [
    'w-full px-4 py-3 bg-white border rounded-lg',
    'focus:outline-none focus:ring-2 focus:border-transparent',
    'transition-all duration-200',
    'disabled:bg-cream-100 disabled:cursor-not-allowed',
  ]

  const errorClass = props.error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-stone-200 focus:ring-sage'

  const iconPadding = props.icon ? 'pr-10' : ''

  return [...base, errorClass, iconPadding]
})
</script>
