<script setup lang="ts">
import type { SizeClass } from '~/lib/studio/bonsai/sizes'
import type { SpeciesDef } from '~/lib/studio/bonsai/species'
import type { Stage } from '~/lib/studio/timeline'
import { sizeRangeLabel } from '~/lib/studio/bonsai/sizes'

defineProps<{ stage: Stage, species: SpeciesDef, size: SizeClass }>()

const el = ref<HTMLElement | null>(null)
defineExpose({ el })
</script>

<template>
  <div ref="el" class="st-plaque" aria-hidden="true">
    <p class="st-plaque__stage">
      <span lang="ja">{{ stage.jp }}</span>
      <span class="st-plaque__sep">/</span>
      <span>{{ stage.romaji }}</span>
    </p>
    <p class="st-plaque__en">
      {{ stage.en }}
    </p>
    <p class="st-plaque__meta">
      {{ species.common }}<span class="st-plaque__latin"> · <em>{{ species.latin }}</em></span>
    </p>
    <p class="st-plaque__meta">
      {{ size.name }} · {{ sizeRangeLabel(size.id) }}
    </p>
  </div>
</template>
