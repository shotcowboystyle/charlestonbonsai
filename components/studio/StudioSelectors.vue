<script setup lang="ts">
/**
 * The five selectors. Each is a cycling button (click or its key) plus a
 * native select whose optgroups show the families — upright, multi-trunk,
 * deciduous, conifers... — when the visitor wants to choose directly.
 */
import type { Selection, SelectionKey } from '~/lib/studio/state'
import { ATMOSPHERES } from '~/lib/studio/atmospheres'
import { SIZES } from '~/lib/studio/bonsai/sizes'
import { SPECIES, SPECIES_GROUPS } from '~/lib/studio/bonsai/species'
import { STYLE_GROUPS, STYLES } from '~/lib/studio/bonsai/styles'
import { LANDSCAPE_META } from '~/lib/studio/landscapes/meta'

const props = defineProps<{ selection: Selection, sizeLocked: boolean }>()
const emit = defineEmits<{ cycle: [key: SelectionKey, dir: 1 | -1], pick: [key: SelectionKey, value: string] }>()

interface Group { name: string, items: { id: string, label: string }[] }
interface Control { key: SelectionKey, label: string, shortcut: string, groups: Group[], value: string }

const controls = computed<Control[]>(() => {
  const s = props.selection
  const st = STYLES.find(x => x.id === s.style)
  const sp = SPECIES.find(x => x.id === s.tree)
  const sz = SIZES.find(x => x.id === s.size)
  const ls = LANDSCAPE_META.find(x => x.id === s.scene)
  const at = ATMOSPHERES.find(x => x.id === s.atmo)
  return [
    { key: 'style', label: 'Style', shortcut: 'S', value: st?.name ?? '', groups: STYLE_GROUPS.map(g => ({ name: g, items: STYLES.filter(x => x.group === g).map(x => ({ id: x.id, label: `${x.name} · ${x.english}` })) })) },
    { key: 'tree', label: 'Tree', shortcut: 'T', value: sp?.common ?? '', groups: SPECIES_GROUPS.map(g => ({ name: g, items: SPECIES.filter(x => x.group === g).map(x => ({ id: x.id, label: x.common })) })) },
    { key: 'size', label: 'Size', shortcut: 'Z', value: sz?.name ?? '', groups: ['Miniature', 'Medium and large'].map(g => ({ name: g, items: SIZES.filter(x => x.group === g).map(x => ({ id: x.id, label: `${x.name} · ${x.cmMin}–${x.cmMax} cm` })) })) },
    { key: 'scene', label: 'Landscape', shortcut: 'L', value: ls?.en ?? '', groups: [{ name: 'Landscapes', items: LANDSCAPE_META.map(x => ({ id: x.id, label: x.en })) }] },
    { key: 'atmo', label: 'Atmosphere', shortcut: 'A', value: at ? `${at.jp} ${at.en}` : '', groups: [{ name: 'Atmospheres', items: ATMOSPHERES.map(x => ({ id: x.id, label: `${x.jp} · ${x.en}` })) }] },
  ]
})

function onPick(key: SelectionKey, e: Event): void {
  emit('pick', key, (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <nav class="st-selectors" aria-label="Tree and setting">
    <div v-for="c in controls" :key="c.key" class="st-sel" :class="{ 'st-sel--locked': c.key === 'size' && sizeLocked }" :data-key="c.key">
      <button
        type="button"
        class="st-sel__cycle"
        :aria-label="`${c.label}: ${c.value}${c.key === 'size' && sizeLocked ? ', set by the style' : ''}`"
        :aria-keyshortcuts="c.shortcut"
        :aria-disabled="c.key === 'size' && sizeLocked ? 'true' : undefined"
        :title="c.key === 'size' && sizeLocked ? 'Shito and Mame styles set the size' : `Next ${c.label.toLowerCase()} (${c.shortcut})`"
        @click="c.key === 'size' && sizeLocked ? undefined : $emit('cycle', c.key, 1)"
      >
        <span class="st-sel__label">{{ c.label }}</span>
        <span class="st-sel__value" :title="c.value">{{ c.value }}</span>
      </button>
      <label class="st-sel__pick">
        <span class="sr-only">Choose {{ c.label.toLowerCase() }}</span>
        <select :value="selection[c.key]" :disabled="c.key === 'size' && sizeLocked" @change="onPick(c.key, $event)">
          <optgroup v-for="g in c.groups" :key="g.name" :label="g.name">
            <option v-for="o in g.items" :key="o.id" :value="o.id">{{ o.label }}</option>
          </optgroup>
        </select>
        <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.2" /></svg>
      </label>
    </div>
  </nav>
</template>
