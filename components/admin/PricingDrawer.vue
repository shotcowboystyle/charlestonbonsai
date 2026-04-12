<script setup lang="ts">
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [price: number]
}>()

// --- Species Data ---
const SPECIES: Record<string, { name: string, multiplier: number, rarity: string, note: string }> = {
  'juniper-shimpaku': {
    name: 'Shimpaku Juniper',
    multiplier: 1.6,
    rarity: 'premium',
    note: 'Highly prized for fine foliage and natural jin/shari. Itoigawa variety commands top prices.',
  },
  'juniper-procumbens': {
    name: 'Juniper Procumbens Nana',
    multiplier: 1.0,
    rarity: 'common',
    note: 'Most popular beginner species. Widely available and forgiving. Good starter stock.',
  },
  'juniper-rocky-mountain': {
    name: 'Rocky Mountain Juniper',
    multiplier: 1.3,
    rarity: 'moderate',
    note: 'Excellent collected (yamadori) material with dramatic deadwood and trunk character.',
  },
  'japanese-maple': {
    name: 'Japanese Maple',
    multiplier: 1.5,
    rarity: 'premium',
    note: 'Prized for seasonal color changes. Delicate ramification adds significant value.',
  },
  'black-pine': {
    name: 'Japanese Black Pine',
    multiplier: 1.7,
    rarity: 'premium',
    note: 'Classic bonsai species. Thick bark and powerful character. Slow development adds value.',
  },
  'chinese-elm': {
    name: 'Chinese Elm',
    multiplier: 0.9,
    rarity: 'common',
    note: 'Hardy and forgiving. Excellent ramification potential. Abundant availability keeps prices accessible.',
  },
  'ficus': {
    name: 'Ficus (Tropical)',
    multiplier: 0.8,
    rarity: 'common',
    note: 'Popular indoor species. Easy to grow and style. Mass production reduces premium potential.',
  },
  'azalea-satsuki': {
    name: 'Satsuki Azalea',
    multiplier: 1.4,
    rarity: 'moderate',
    note: 'Spectacular flowering adds value. Japanese cultivars command premium prices.',
  },
  'trident-maple': {
    name: 'Trident Maple',
    multiplier: 1.3,
    rarity: 'moderate',
    note: 'Excellent nebari development and fall color. Fusion plantings popular.',
  },
  'white-pine': {
    name: 'Japanese White Pine',
    multiplier: 1.8,
    rarity: 'premium',
    note: 'The aristocrat of bonsai. Slow growth, blue-green needles. Grafted varieties especially valued.',
  },
  'bald-cypress': {
    name: 'Bald Cypress',
    multiplier: 1.1,
    rarity: 'moderate',
    note: 'Unique deciduous conifer. Buttressed trunk and fine ramification. Growing in popularity.',
  },
  'other': {
    name: 'Other / Mixed Species',
    multiplier: 1.0,
    rarity: 'varies',
    note: 'Pricing varies widely by species rarity and regional demand.',
  },
}

const POT_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'mid', label: 'Mid-range' },
  { value: 'handmade', label: 'Handmade' },
  { value: 'signed', label: 'Signed' },
] as const

const STYLING_OPTIONS = [
  { value: 'raw', label: 'Raw' },
  { value: 'developing', label: 'Developing' },
  { value: 'refined', label: 'Refined' },
  { value: 'exhibition', label: 'Exhibition' },
] as const

const POT_HELPERS: Record<string, string> = {
  basic: 'Plastic nursery pot or mica training container — adds $5-20.',
  mid: 'Mass-produced glazed or unglazed ceramic — adds $20-60.',
  handmade: 'Artisan-crafted ceramic from a known potter — adds $60-150.',
  signed: 'Collectible pot by a recognized artist — adds $150-500.',
}

const STYLING_HELPERS: Record<string, string> = {
  raw: 'Unstyled or freshly collected material. Reduces value ~40%.',
  developing: 'Basic structure set, still needs refinement. Reduces value ~15%.',
  refined: 'Good taper, clean ramification, ready to display. Adds ~15%.',
  exhibition: 'Show-quality with exceptional detail. Adds ~50%.',
}

// Calculator state
const species = ref('juniper-shimpaku')
const age = ref(5)
const height = ref(18)
const potQuality = ref('mid')
const stylingLevel = ref('refined')

// Defaults used as fallback (values are always in the maps, but TS can't prove it)
const DEFAULT_SPECIES = SPECIES['juniper-shimpaku']!
const DEFAULT_POT = { low: 20, high: 60, label: 'Mid-range ceramic' }
const DEFAULT_STYLING = { factor: 1.15, label: 'Refined' }

// Computed pricing
const result = computed(() => {
  const sp = SPECIES[species.value] ?? DEFAULT_SPECIES

  let basePerYear: { low: number, high: number }
  switch (sp.rarity) {
    case 'premium':
      basePerYear = { low: 25, high: 50 }
      break
    case 'moderate':
      basePerYear = { low: 20, high: 35 }
      break
    default:
      basePerYear = { low: 15, high: 25 }
      break
  }

  const baseValueLow = age.value * basePerYear.low
  const baseValueHigh = age.value * basePerYear.high

  let sizeFactor: number
  if (height.value <= 6)
    sizeFactor = 0.7
  else if (height.value <= 12)
    sizeFactor = 0.9
  else if (height.value <= 24)
    sizeFactor = 1.0
  else if (height.value <= 36)
    sizeFactor = 1.2
  else
    sizeFactor = 1.5

  const potFactors = {
    basic: { low: 5, high: 20, label: 'Basic plastic/mica' },
    mid: { low: 20, high: 60, label: 'Mid-range ceramic' },
    handmade: { low: 60, high: 150, label: 'Handmade artisan' },
    signed: { low: 150, high: 500, label: 'Signed/collectible' },
  } as const
  const pot = potFactors[potQuality.value as keyof typeof potFactors] ?? DEFAULT_POT

  const stylingMultipliers = {
    raw: { factor: 0.6, label: 'Raw / unstyled' },
    developing: { factor: 0.85, label: 'Developing' },
    refined: { factor: 1.15, label: 'Refined' },
    exhibition: { factor: 1.5, label: 'Exhibition-ready' },
  } as const
  const styling = stylingMultipliers[stylingLevel.value as keyof typeof stylingMultipliers] ?? DEFAULT_STYLING

  const treeLow = baseValueLow * sizeFactor * sp.multiplier * styling.factor
  const treeHigh = baseValueHigh * sizeFactor * sp.multiplier * styling.factor

  const totalLow = Math.max(Math.round(treeLow + pot.low), 5)
  const totalHigh = Math.max(Math.round(treeHigh + pot.high), 10)

  const midPrice = (totalLow + totalHigh) / 2
  let tier: string
  if (midPrice < 60)
    tier = 'starter'
  else if (midPrice < 250)
    tier = 'enthusiast'
  else if (midPrice < 800)
    tier = 'advanced'
  else
    tier = 'showcase'

  const tierLabels: Record<string, string> = {
    starter: 'Starter / Gift',
    enthusiast: 'Enthusiast',
    advanced: 'Advanced',
    showcase: 'Showcase',
  }

  const ageContribution = (baseValueLow + baseValueHigh) / 2
  const speciesContribution = ageContribution * (sp.multiplier - 1)
  const sizeContribution = ageContribution * (sizeFactor - 1)
  const stylingContribution = ageContribution * (styling.factor - 1)
  const potContribution = (pot.low + pot.high) / 2

  return {
    low: totalLow,
    high: totalHigh,
    tier,
    tierLabel: tierLabels[tier] ?? 'Enthusiast',
    breakdown: [
      { label: `Age (${age.value} yrs)`, value: ageContribution, color: 'bg-forest' },
      { label: `Species (${sp.name})`, value: speciesContribution, color: 'bg-bark' },
      { label: `Size (${height.value}")`, value: sizeContribution, color: 'bg-sage' },
      { label: `Styling (${styling.label})`, value: stylingContribution, color: 'bg-moss' },
      { label: `Pot (${pot.label})`, value: potContribution, color: 'bg-stone' },
    ],
    speciesNote: sp.note,
  }
})

const maxBreakdownValue = computed(() =>
  Math.max(...result.value.breakdown.map(e => Math.abs(e.value)), 1),
)

const tierColors: Record<string, string> = {
  starter: 'bg-sage-200 text-sage-500',
  enthusiast: 'bg-forest-100 text-forest',
  advanced: 'bg-bark-100 text-bark',
  showcase: 'bg-bark-50 text-bark-500',
}

const sliderFillStyle = computed(() => (value: number, min: number, max: number) => {
  const pct = ((value - min) / (max - min)) * 100
  return {
    background: `linear-gradient(to right, rgb(45, 71, 57) 0%, rgb(45, 71, 57) ${pct}%, rgb(212, 207, 194) ${pct}%)`,
  }
})

function close() {
  emit('update:modelValue', false)
}

function applyMidpoint() {
  const mid = Math.round((result.value.low + result.value.high) / 2)
  emit('apply', mid)
  close()
}

function applyLow() {
  emit('apply', result.value.low)
  close()
}

function applyHigh() {
  emit('apply', result.value.high)
  close()
}

// Lock body scroll
watch(() => props.modelValue, (value) => {
  if (value) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-40 bg-charcoal-500/40 backdrop-blur-sm"
        @click="close"
      />
    </Transition>

    <!-- Drawer -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="modelValue"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-cream-50 shadow-soft-lg overflow-y-auto"
      >
        <!-- Header -->
        <div class="sticky top-0 z-10 bg-cream-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 class="font-serif text-lg text-charcoal">
              Pricing Calculator
            </h2>
            <p class="text-xs text-stone-400">
              Estimate sale price ranges
            </p>
          </div>
          <button
            type="button"
            class="text-stone-400 hover:text-charcoal transition-colors p-1 -mr-1"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Price Result -->
          <div class="bg-white border border-bark-100 rounded-xl p-5 text-center shadow-soft">
            <p class="text-2xs uppercase tracking-widest text-stone-400 font-semibold mb-1">
              Suggested Range
            </p>
            <div class="font-serif text-2xl text-bark">
              ${{ result.low.toLocaleString() }}
              <span class="text-sm text-stone-400 mx-1">to</span>
              ${{ result.high.toLocaleString() }}
            </div>
            <span class="inline-block mt-2 px-3 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wide" :class="[tierColors[result.tier]]">
              {{ result.tierLabel }}
            </span>
          </div>

          <!-- Apply Buttons -->
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              class="btn btn-outline text-xs py-2"
              @click="applyLow"
            >
              Use ${{ result.low.toLocaleString() }}
            </button>
            <button
              type="button"
              class="btn btn-primary text-xs py-2"
              @click="applyMidpoint"
            >
              Use ${{ Math.round((result.low + result.high) / 2).toLocaleString() }}
            </button>
            <button
              type="button"
              class="btn btn-outline text-xs py-2"
              @click="applyHigh"
            >
              Use ${{ result.high.toLocaleString() }}
            </button>
          </div>

          <!-- Species -->
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1.5">
              Species
              <span class="text-stone-400 text-xs font-normal ml-1">Affects base rate</span>
            </label>
            <select
              v-model="species"
              class="input w-full"
            >
              <optgroup label="Premium">
                <option value="white-pine">
                  Japanese White Pine
                </option>
                <option value="black-pine">
                  Japanese Black Pine
                </option>
                <option value="juniper-shimpaku">
                  Shimpaku Juniper
                </option>
                <option value="japanese-maple">
                  Japanese Maple
                </option>
              </optgroup>
              <optgroup label="Moderate">
                <option value="azalea-satsuki">
                  Satsuki Azalea
                </option>
                <option value="juniper-rocky-mountain">
                  Rocky Mountain Juniper
                </option>
                <option value="trident-maple">
                  Trident Maple
                </option>
                <option value="bald-cypress">
                  Bald Cypress
                </option>
              </optgroup>
              <optgroup label="Common">
                <option value="juniper-procumbens">
                  Juniper Procumbens Nana
                </option>
                <option value="chinese-elm">
                  Chinese Elm
                </option>
                <option value="ficus">
                  Ficus (Tropical)
                </option>
              </optgroup>
              <optgroup label="Other">
                <option value="other">
                  Other / Mixed Species
                </option>
              </optgroup>
            </select>
            <p class="mt-1.5 text-2xs text-stone-400 leading-relaxed">
              {{ result.speciesNote }}
            </p>
          </div>

          <!-- Age -->
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1.5">
              Years in Training
              <span class="text-stone-400 text-xs font-normal ml-1">Time you've worked it</span>
            </label>
            <div class="flex items-baseline gap-1 mb-1">
              <span class="text-base font-semibold text-forest">{{ age }}</span>
              <span class="text-xs text-stone-400">years</span>
            </div>
            <input
              v-model.number="age"
              type="range"
              min="1"
              max="50"
              step="1"
              class="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-forest [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-soft [&::-webkit-slider-thumb]:cursor-pointer"
              :style="sliderFillStyle(age, 1, 50)"
            >
            <div class="flex justify-between text-2xs text-stone-400 mt-0.5">
              <span>1 yr</span>
              <span>50 yrs</span>
            </div>
          </div>

          <!-- Height -->
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1.5">
              Height
              <span class="text-stone-400 text-xs font-normal ml-1">Pot to apex</span>
            </label>
            <div class="flex items-baseline gap-1 mb-1">
              <span class="text-base font-semibold text-forest">{{ height }}</span>
              <span class="text-xs text-stone-400">inches</span>
            </div>
            <input
              v-model.number="height"
              type="range"
              min="3"
              max="60"
              step="1"
              class="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-forest [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-soft [&::-webkit-slider-thumb]:cursor-pointer"
              :style="sliderFillStyle(height, 3, 60)"
            >
            <div class="flex justify-between text-2xs text-stone-400 mt-0.5">
              <span>3" (mame)</span>
              <span>60" (imperial)</span>
            </div>
          </div>

          <!-- Pot Quality -->
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1.5">Pot Quality</label>
            <div class="flex bg-stone-100 rounded-lg p-0.5 gap-0.5">
              <button
                v-for="opt in POT_OPTIONS"
                :key="opt.value"
                type="button"
                class="flex-1 px-2 py-1.5 rounded-md text-xs font-medium text-center transition-all" :class="[
                  potQuality === opt.value
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-stone-400 hover:text-charcoal',
                ]"
                @click="potQuality = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
            <p class="mt-1.5 text-2xs text-stone-400 leading-relaxed">
              {{ POT_HELPERS[potQuality] }}
            </p>
          </div>

          <!-- Styling Level -->
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1.5">Styling Level</label>
            <div class="flex bg-stone-100 rounded-lg p-0.5 gap-0.5">
              <button
                v-for="opt in STYLING_OPTIONS"
                :key="opt.value"
                type="button"
                class="flex-1 px-2 py-1.5 rounded-md text-xs font-medium text-center transition-all" :class="[
                  stylingLevel === opt.value
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-stone-400 hover:text-charcoal',
                ]"
                @click="stylingLevel = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
            <p class="mt-1.5 text-2xs text-stone-400 leading-relaxed">
              {{ STYLING_HELPERS[stylingLevel] }}
            </p>
          </div>

          <!-- Price Factors Breakdown -->
          <div class="border-t border-stone-200 pt-5">
            <h3 class="font-serif text-sm text-charcoal mb-3">
              Price Factors
            </h3>
            <ul class="space-y-2">
              <li
                v-for="entry in result.breakdown"
                :key="entry.label"
              >
                <div class="flex items-center justify-between text-xs mb-0.5">
                  <span class="flex items-center gap-1.5 text-stone-500">
                    <span class="w-1.5 h-1.5 rounded-full" :class="[entry.color]" />
                    {{ entry.label }}
                  </span>
                  <span class="font-semibold tabular-nums" :class="[entry.value >= 0 ? 'text-forest' : 'text-stone-400']">
                    {{ entry.value >= 0 ? '+' : '-' }}${{ Math.abs(Math.round(entry.value)) }}
                  </span>
                </div>
                <div class="h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300" :class="[entry.color]"
                    :style="{ width: `${Math.max(Math.abs(entry.value) / maxBreakdownValue * 100, 3)}%` }"
                  />
                </div>
              </li>
            </ul>
          </div>

          <!-- Footer note -->
          <p class="text-2xs text-stone-400 text-center leading-relaxed border-t border-stone-200 pt-4">
            Estimates for hobbyist and small-scale sellers. Actual prices vary by local market, tree character, and buyer demand.
          </p>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
