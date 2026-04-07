<script setup lang="ts">
import type { Tree } from '~/types'
import QRCode from 'qrcode'

interface Props {
  modelValue: boolean
  tree: Tree | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const config = useRuntimeConfig()
const qrDataUrl = ref('')

const galleryUrl = computed(() => {
  if (!props.tree)
    return ''
  const base = config.public.siteUrl || window.location.origin
  return `${base}/gallery/${props.tree.slug}`
})

watch(() => props.modelValue, async (open) => {
  if (open && props.tree) {
    qrDataUrl.value = await QRCode.toDataURL(galleryUrl.value, {
      width: 300,
      margin: 2,
      color: {
        dark: '#2A2D2E',
        light: '#FFFFFF',
      },
    })
  }
})

function handlePrint() {
  window.print()
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <UiModal :model-value="modelValue" title="QR Code" size="sm" @update:model-value="close">
    <div v-if="tree" class="flex flex-col items-center text-center">
      <img
        v-if="qrDataUrl"
        :src="qrDataUrl"
        :alt="`QR code for ${tree.name}`"
        class="w-48 h-48"
      >
      <p class="mt-3 font-serif text-lg text-charcoal">
        {{ tree.name }}
      </p>
      <p class="text-sm text-stone-500">
        {{ tree.species }}
      </p>
      <p class="mt-1 text-sm font-medium text-charcoal">
        ${{ tree.price.toLocaleString() }}
      </p>
      <p class="mt-2 text-xs text-stone-400 break-all">
        {{ galleryUrl }}
      </p>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <button class="btn btn-ghost" @click="close">
          Close
        </button>
        <button class="btn btn-primary" @click="handlePrint">
          Print QR
        </button>
      </div>
    </template>
  </UiModal>

  <!-- Print-only card (rendered outside modal, visible only when printing) -->
  <div v-if="tree && qrDataUrl" class="hidden print:flex fixed inset-0 z-[9999] items-center justify-center bg-white">
    <div class="flex flex-col items-center text-center p-8">
      <img
        :src="qrDataUrl"
        :alt="`QR code for ${tree.name}`"
        class="w-72 h-72"
      >
      <p class="mt-4 font-serif text-2xl text-black">
        {{ tree.name }}
      </p>
      <p class="text-base text-gray-600">
        {{ tree.species }}
      </p>
      <p class="mt-2 text-lg font-semibold text-black">
        ${{ tree.price.toLocaleString() }}
      </p>
      <p class="mt-3 text-sm text-gray-500">
        Scan for details & care info
      </p>
    </div>
  </div>
</template>
