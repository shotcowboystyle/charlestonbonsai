<script setup lang="ts">
/**
 * Retreats landing — multi-day bonsai workshops at a private house in
 * the Blue Ridge, sold as packages that bundle lodging, a tree to keep,
 * and time at the bench with the craftsperson.
 *
 * Audience is the same as the rest of the site: serious collectors and
 * committed hobbyists. The page exists to make the offering legible and
 * to collect a structured inquiry — real dates and tree selection happen
 * over email after first contact.
 *
 * The page is a peer of /events and /visit. Same sumi-e atelier dialect,
 * same eyebrow numerals, same form state machine. See .impeccable.md.
 *
 * Form state machine: idle → submitting → success | error
 *   - success replaces the form in place (no redirect, no toast)
 *   - server/network errors restore the form with an italic note and
 *     a direct-mail escape hatch
 */
import heroImage from '~/assets/images/retreat-photos/retreat-hero.jpeg'
import treeImage1 from '~/assets/images/retreat-photos/retreat-individual-tree-1.jpeg'
import treeImage2 from '~/assets/images/retreat-photos/retreat-individual-tree-2.jpeg'
import treeImage3 from '~/assets/images/retreat-photos/retreat-individual-tree-3.jpeg'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

type FieldKey
  = | 'name'
    | 'email'
    | 'preferredDates'
    | 'partySize'
    | 'packageType'
    | 'skillLevel'
    | 'notes'

interface InquiryResponse {
  ok: boolean
  error?: string
  field?: FieldKey
}

const { siteName, contactEmail } = useSite()

useHead({
  title: `Retreats — ${siteName}`,
  meta: [
    {
      name: 'description',
      content: 'Multi-day bonsai workshops at a private house in the Blue Ridge. Packages bundle lodging, time at the bench, and a finished specimen to bring home.',
    },
  ],
})

const currentYear = new Date().getFullYear()

// ---- Plate data --------------------------------------------------------
// One opening plate and three package plates. "Starting from" values are
// placeholders pending Curt's confirmation; flagged with TODO so they
// surface in code review before launch.
const openingPlate = {
  region: 'Blue Ridge · Late October',
  setting: 'Private house · six guest maximum',
  bench: 'Outdoor bench under a covered porch',
}

const packagePlates = [
  {
    title: 'A weekend at the bench',
    duration: '2 nights · 3 days',
    cohort: 'Up to 4 guests',
    tree: 'Trident maple, training stage',
    // TODO(pricing): confirm anchor with Curt before launch.
    startingFrom: '$2,400 / guest',
    aspectRatio: '4 / 5',
    image: treeImage1,
  },
  {
    title: 'The five-day immersion',
    duration: '4 nights · 5 days',
    cohort: 'Up to 4 guests',
    tree: 'Japanese white pine, statement class',
    startingFrom: '$4,800 / guest',
    aspectRatio: '4 / 5',
    image: treeImage2,
  },
  {
    title: 'Private commission',
    duration: 'Bespoke dates',
    cohort: '1–2 guests',
    tree: 'Negotiated in advance',
    startingFrom: 'By inquiry',
    aspectRatio: '4 / 5',
    image: treeImage3,
  },
] as const

// ---- Form state --------------------------------------------------------
const form = reactive({
  name: '',
  email: '',
  preferredDates: '',
  partySize: '',
  packageType: '',
  skillLevel: '',
  notes: '',
})

const state = ref<FormState>('idle')
const fieldErrors = ref<Record<string, string>>({})
const submitError = ref('')

const nameId = useId()
const emailId = useId()
const datesId = useId()
const partySizeId = useId()
const packageTypeId = useId()
const skillLevelId = useId()
const notesId = useId()
const submitErrorId = useId()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

const ERROR_COPY: Record<string, string> = {
  name: 'I’ll need a name for the reply.',
  email: 'I’ll need an email to write back to.',
  email_invalid: 'That email address doesn’t look right.',
  preferredDates: 'A month or rough date window helps me check the calendar.',
  partySize: 'Pick a number between one and six.',
  packageType: 'Pick whichever is closest — we can change it.',
  skillLevel: 'Pick the one that sounds most like you.',
  notes: 'Anything you can share about what you’re after helps me reply usefully.',
}

function validate(): boolean {
  const errors: Record<string, string> = {}

  if (!form.name.trim())
    errors.name = ERROR_COPY.name!

  const email = form.email.trim()
  if (!email)
    errors.email = ERROR_COPY.email!
  else if (!EMAIL_PATTERN.test(email) || email.length > 254)
    errors.email = ERROR_COPY.email_invalid!

  if (!form.preferredDates.trim())
    errors.preferredDates = ERROR_COPY.preferredDates!

  const partySizeNum = Number.parseInt(form.partySize, 10)
  if (!Number.isFinite(partySizeNum) || partySizeNum < 1 || partySizeNum > 6)
    errors.partySize = ERROR_COPY.partySize!

  if (!form.packageType)
    errors.packageType = ERROR_COPY.packageType!

  if (!form.skillLevel)
    errors.skillLevel = ERROR_COPY.skillLevel!

  if (!form.notes.trim())
    errors.notes = ERROR_COPY.notes!

  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

function clearFieldError(field: keyof typeof form) {
  if (fieldErrors.value[field]) {
    const next = { ...fieldErrors.value }
    delete next[field]
    fieldErrors.value = next
  }
}

async function handleSubmit() {
  submitError.value = ''
  if (!validate()) {
    state.value = 'error'
    return
  }

  state.value = 'submitting'

  const partySizeValue = Number.parseInt(form.partySize, 10)

  try {
    const response = await $fetch<InquiryResponse>('/api/retreats/inquire', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        preferredDates: form.preferredDates.trim(),
        partySize: partySizeValue,
        packageType: form.packageType,
        skillLevel: form.skillLevel,
        notes: form.notes.trim(),
      },
    }).catch((err: { data?: InquiryResponse } | unknown) => {
      // $fetch throws on non-2xx; normalize to a stub so we can branch
      // on it uniformly below.
      if (typeof err === 'object' && err !== null && 'data' in err) {
        const data = (err as { data?: InquiryResponse }).data
        if (data)
          return data
      }
      return { ok: false, error: 'network' } as InquiryResponse
    })

    if (response.ok) {
      state.value = 'success'
      return
    }

    if (response.field && ERROR_COPY[response.field]) {
      fieldErrors.value = {
        ...fieldErrors.value,
        [response.field]: ERROR_COPY[response.field]!,
      }
      state.value = 'error'
      return
    }

    state.value = 'error'
    submitError.value = `Something didn’t get through. Please try again, or write directly to ${contactEmail}.`
  }
  catch (err) {
    // Defensive: $fetch errors should already be normalized above. Log
    // anything else loudly per the project's no-silent-swallow rule.
    console.error('[retreats/inquire] unexpected error:', err)
    state.value = 'error'
    submitError.value = `Something didn’t get through. Please try again, or write directly to ${contactEmail}.`
  }
}
</script>

<template>
  <article class="retreats">
    <!-- ───────────────────────────────────────────────────
         I. MASTHEAD
         ─────────────────────────────────────────────────── -->
    <header class="retreats__masthead">
      <p class="retreats__eyebrow">
        <span class="retreats__numeral">I</span>
        <span>Retreats</span>
      </p>
      <h1 class="retreats__heading">
        A few days at the bench, in the Blue Ridge.
      </h1>
      <p class="retreats__lede">
        A private house in the mountains. A small bench under a covered
        porch. One tree per guest, chosen in advance and worked on across
        the visit — the same tree comes home with you. The instruction is
        bonsai the way it is actually practiced: slow, exact, and one
        decision at a time.
      </p>
    </header>

    <!-- ───────────────────────────────────────────────────
         II. OPENING PLATE
         ─────────────────────────────────────────────────── -->
    <section class="opening" aria-label="The house and the bench">
      <div class="strip" role="presentation">
        <span class="strip__item">{{ openingPlate.region }}</span>
        <span class="strip__dot" aria-hidden="true">·</span>
        <span class="strip__item">{{ openingPlate.setting }}</span>
        <span class="strip__dot" aria-hidden="true">·</span>
        <span class="strip__item">{{ openingPlate.bench }}</span>
      </div>
      <div class="opening__image">
        <img
          :src="heroImage"
          alt="The retreat house and covered porch in the Blue Ridge."
          fetchpriority="high"
        >
      </div>
    </section>

    <!-- ───────────────────────────────────────────────────
         III. THE PRACTICE
         ─────────────────────────────────────────────────── -->
    <section class="practice" aria-labelledby="practice-heading">
      <p class="practice__eyebrow">
        <span class="retreats__numeral">II</span>
        <span>The Practice</span>
      </p>
      <h2 id="practice-heading" class="sr-only">
        The practice
      </h2>
      <div class="practice__prose">
        <p>
          A retreat is built around a single tree, selected for you before
          you arrive. The first morning is spent reading it — taxonomy,
          stage, the line it already has and the line it could have.
          From there the work proceeds at the pace of the work: wire,
          rest, cut, rest, repot when the season allows, rest. There is
          no curriculum sheet.
        </p>
        <p>
          The house holds up to six guests. Meals are simple and shared.
          Mornings and late afternoons are at the bench; the middle of
          the day is for the porch, the trail behind the house, or
          nothing in particular. You leave on the last morning with a
          finished specimen, a care card written for your climate, and
          a season of follow-up correspondence.
        </p>
      </div>
    </section>

    <!-- ───────────────────────────────────────────────────
         IV. PACKAGES — TRIO
         ─────────────────────────────────────────────────── -->
    <section class="packages" aria-labelledby="packages-heading">
      <p class="packages__eyebrow">
        <span class="retreats__numeral">III</span>
        <span>Packages</span>
      </p>
      <h2 id="packages-heading" class="sr-only">
        Retreat packages
      </h2>
      <ol class="packages__row">
        <li
          v-for="(plate, i) in packagePlates"
          :key="i"
          class="packages__plate"
        >
          <div class="strip" role="presentation">
            <span class="strip__item">{{ plate.duration }}</span>
            <span class="strip__dot" aria-hidden="true">·</span>
            <span class="strip__item">{{ plate.cohort }}</span>
          </div>
          <div
            class="packages__image"
            :style="{ aspectRatio: plate.aspectRatio }"
          >
            <img
              :src="plate.image"
              alt="A specimen worked at the retreat bench."
              loading="lazy"
            >
          </div>
          <div class="packages__caption">
            <h3 class="packages__title">
              {{ plate.title }}
            </h3>
            <p class="packages__tree">
              {{ plate.tree }}
            </p>
            <p class="packages__price">
              <em>Starting from {{ plate.startingFrom }}</em>
            </p>
          </div>
        </li>
      </ol>
    </section>

    <!-- ───────────────────────────────────────────────────
         V. WHAT'S INCLUDED
         ─────────────────────────────────────────────────── -->
    <section class="included" aria-labelledby="included-heading">
      <p class="included__eyebrow">
        <span class="retreats__numeral">IV</span>
        <span>What’s Included</span>
      </p>
      <h2 id="included-heading" class="sr-only">
        What’s included
      </h2>
      <dl class="included__dl">
        <div>
          <dt>Lodging</dt>
          <dd>A private room in the house. Linens, coffee, the porch.</dd>
        </div>
        <div>
          <dt>Instruction</dt>
          <dd>One-on-one bench time across every day; no group lectures.</dd>
        </div>
        <div>
          <dt>The tree</dt>
          <dd>A finished specimen selected for you, in a pot suited to it.</dd>
        </div>
        <div>
          <dt>Meals &amp; tools</dt>
          <dd>Breakfasts and dinners. Bench tools provided; yours to use.</dd>
        </div>
      </dl>
    </section>

    <!-- ───────────────────────────────────────────────────
         VI. WHO IT'S FOR
         ─────────────────────────────────────────────────── -->
    <section class="audience" aria-labelledby="audience-heading">
      <p class="audience__eyebrow">
        <span class="retreats__numeral">V</span>
        <span>Who it’s for</span>
      </p>
      <h2 id="audience-heading" class="sr-only">
        Who the retreats are for
      </h2>
      <div class="audience__prose">
        <p>
          Collectors who already have a few trees on the bench and want
          a stretch of time with a craftsperson to push a single specimen
          forward. Hobbyists who have been reading about ramification and
          deadwood for a year and want to do it with their hands. Couples
          who share the hobby and want a few days that aren’t a hotel.
        </p>
        <p>
          Not for absolute beginners — there’s a half-day intro class in
          Charleston for that. If you can name three species you’ve kept
          alive for a season, you’re in range.
        </p>
      </div>
    </section>

    <!-- ───────────────────────────────────────────────────
         VII. INQUIRY
         ─────────────────────────────────────────────────── -->
    <section
      id="inquire"
      class="inquire"
      :aria-labelledby="state === 'success' ? undefined : 'inquire-heading'"
    >
      <Transition name="inquire-state" mode="out-in">
        <div v-if="state === 'success'" key="success" class="inquire__success">
          <p>
            <em>Received. I’ll write back within a few days.</em>
          </p>
        </div>

        <form
          v-else
          key="form"
          class="inquire__form"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <header class="inquire__header">
            <p class="inquire__eyebrow">
              <span class="retreats__numeral">VI</span>
              <span>Inquire</span>
            </p>
            <h2 id="inquire-heading" class="inquire__heading">
              Tell me about the trip.
            </h2>
            <p class="inquire__lede">
              A reply usually comes within a few days. Real dates and the
              tree itself are worked out over email — this form is just the
              first note.
            </p>
          </header>

          <div class="inquire__grid">
            <div class="field">
              <label :for="nameId" class="field__label">Your name</label>
              <input
                :id="nameId"
                v-model="form.name"
                type="text"
                autocomplete="name"
                class="field__input"
                :aria-invalid="!!fieldErrors.name || undefined"
                :aria-describedby="fieldErrors.name ? `${nameId}-err` : undefined"
                :disabled="state === 'submitting'"
                @input="clearFieldError('name')"
              >
              <p
                v-if="fieldErrors.name"
                :id="`${nameId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.name }}</span>
              </p>
            </div>

            <div class="field">
              <label :for="emailId" class="field__label">Email</label>
              <input
                :id="emailId"
                v-model="form.email"
                type="email"
                inputmode="email"
                autocomplete="email"
                class="field__input"
                :aria-invalid="!!fieldErrors.email || undefined"
                :aria-describedby="fieldErrors.email ? `${emailId}-err` : undefined"
                :disabled="state === 'submitting'"
                @input="clearFieldError('email')"
              >
              <p
                v-if="fieldErrors.email"
                :id="`${emailId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.email }}</span>
              </p>
            </div>

            <div class="field">
              <label :for="datesId" class="field__label">Preferred dates</label>
              <input
                :id="datesId"
                v-model="form.preferredDates"
                type="text"
                autocomplete="off"
                placeholder="Late September, or Oct 10–14"
                class="field__input"
                :aria-invalid="!!fieldErrors.preferredDates || undefined"
                :aria-describedby="fieldErrors.preferredDates ? `${datesId}-err` : undefined"
                :disabled="state === 'submitting'"
                @input="clearFieldError('preferredDates')"
              >
              <p
                v-if="fieldErrors.preferredDates"
                :id="`${datesId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.preferredDates }}</span>
              </p>
            </div>

            <div class="field">
              <label :for="partySizeId" class="field__label">Party size</label>
              <input
                :id="partySizeId"
                v-model="form.partySize"
                type="number"
                min="1"
                max="6"
                inputmode="numeric"
                class="field__input"
                :aria-invalid="!!fieldErrors.partySize || undefined"
                :aria-describedby="fieldErrors.partySize ? `${partySizeId}-err` : undefined"
                :disabled="state === 'submitting'"
                @input="clearFieldError('partySize')"
              >
              <p
                v-if="fieldErrors.partySize"
                :id="`${partySizeId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.partySize }}</span>
              </p>
            </div>

            <div class="field">
              <label :for="packageTypeId" class="field__label">Package</label>
              <div class="field__select-wrap">
                <select
                  :id="packageTypeId"
                  v-model="form.packageType"
                  class="field__input field__input--select"
                  :aria-invalid="!!fieldErrors.packageType || undefined"
                  :aria-describedby="fieldErrors.packageType ? `${packageTypeId}-err` : undefined"
                  :disabled="state === 'submitting'"
                  @change="clearFieldError('packageType')"
                >
                  <option value="" disabled>
                    Choose one
                  </option>
                  <option value="weekend">
                    A weekend at the bench
                  </option>
                  <option value="immersion">
                    The five-day immersion
                  </option>
                  <option value="private">
                    Private commission
                  </option>
                  <option value="undecided">
                    Not sure yet
                  </option>
                </select>
                <span class="field__select-mark" aria-hidden="true" />
              </div>
              <p
                v-if="fieldErrors.packageType"
                :id="`${packageTypeId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.packageType }}</span>
              </p>
            </div>

            <div class="field">
              <label :for="skillLevelId" class="field__label">Skill level</label>
              <div class="field__select-wrap">
                <select
                  :id="skillLevelId"
                  v-model="form.skillLevel"
                  class="field__input field__input--select"
                  :aria-invalid="!!fieldErrors.skillLevel || undefined"
                  :aria-describedby="fieldErrors.skillLevel ? `${skillLevelId}-err` : undefined"
                  :disabled="state === 'submitting'"
                  @change="clearFieldError('skillLevel')"
                >
                  <option value="" disabled>
                    Choose one
                  </option>
                  <option value="beginner">
                    Beginner — a season or two in
                  </option>
                  <option value="intermediate">
                    Intermediate — a few trees on the bench
                  </option>
                  <option value="advanced">
                    Advanced — collection in development
                  </option>
                </select>
                <span class="field__select-mark" aria-hidden="true" />
              </div>
              <p
                v-if="fieldErrors.skillLevel"
                :id="`${skillLevelId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.skillLevel }}</span>
              </p>
            </div>

            <div class="field field--span field--notes">
              <label :for="notesId" class="field__label">Tell me what you’re after</label>
              <textarea
                :id="notesId"
                v-model="form.notes"
                rows="6"
                class="field__input field__input--textarea"
                :aria-invalid="!!fieldErrors.notes || undefined"
                :aria-describedby="fieldErrors.notes ? `${notesId}-err` : undefined"
                :disabled="state === 'submitting'"
                @input="clearFieldError('notes')"
              />
              <p
                v-if="fieldErrors.notes"
                :id="`${notesId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.notes }}</span>
              </p>
            </div>
          </div>

          <div class="inquire__foot">
            <p
              v-if="submitError"
              :id="submitErrorId"
              class="inquire__submit-error"
              role="alert"
            >
              {{ submitError }}
            </p>
            <button
              type="submit"
              class="inquire__submit"
              :disabled="state === 'submitting'"
              :aria-describedby="submitError ? submitErrorId : undefined"
            >
              <span>{{ state === 'submitting' ? 'Sending' : 'Send inquiry' }}</span>
              <span class="inquire__submit-mark" aria-hidden="true">
                {{ state === 'submitting' ? '…' : '→' }}
              </span>
            </button>
          </div>
        </form>
      </Transition>
    </section>

    <!-- ───────────────────────────────────────────────────
         VIII. LATITUDE FOOTER
         ─────────────────────────────────────────────────── -->
    <footer class="retreats__lat" aria-hidden="true">
      <span>Blue Ridge · 35°N</span>
      <span>{{ currentYear }}</span>
    </footer>
  </article>
</template>

<style scoped>
/* ============================================================
   OUTER FRAME — single column, generous Ma between sections.
   Max width matches events.vue so the two verticals read as
   siblings. The packages row is allowed to spread to the full
   80rem column for image presence.
   ============================================================ */
.retreats {
  background: var(--surface);
  color: var(--text);
  display: flex;
  flex-direction: column;
  padding: clamp(5rem, 12vw, 9rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 8vw, 5rem);
  max-width: 80rem;
  margin: 0 auto;
  gap: var(--section-y);
}

/* Shared eyebrow numeral — matches index.vue, visit.vue, events.vue. */
.retreats__numeral {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--accent);
}

.retreats__eyebrow,
.practice__eyebrow,
.packages__eyebrow,
.included__eyebrow,
.audience__eyebrow,
.inquire__eyebrow {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-feature-settings: var(--feat-small-caps);
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-sm);
  margin: 0;
}

/* ============================================================
   I. MASTHEAD
   ============================================================ */
.retreats__masthead {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 56ch;
}

.retreats__heading {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: var(--type-display-2);
  line-height: var(--leading-display-tight);
  letter-spacing: var(--tracking-display);
  margin: 0;
  color: var(--text);
}

.retreats__lede {
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.65;
  color: var(--text-muted);
  max-width: var(--measure-reading);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

/* ============================================================
   STRIP — small-caps identification line for plates.
   Hairline borders top and bottom; sits above the image.
   ============================================================ */
.strip {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs);
  padding: var(--space-xs) 0;
  border-top: 1px solid var(--border-hair);
  border-bottom: 1px solid var(--border-hair);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
}

.strip__dot {
  color: var(--text-faint);
  letter-spacing: 0;
}

.strip__item {
  white-space: nowrap;
}

/* ============================================================
   PLATE PLACEHOLDER — sumi-e diagonal hatch.
   Used until photography of the house and trees is dropped in.
   ============================================================ */
.plate-placeholder {
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(
      45deg,
      transparent 0 14px,
      color-mix(in oklch, var(--ink-3) 14%, transparent) 14px 15px
    ),
    var(--surface-raised);
}

/* ============================================================
   II. OPENING PLATE
   ============================================================ */
.opening {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.opening__image {
  width: 100%;
  /* Landscape orientation for the house — a small but deliberate
     break from events.vue's portrait, because the subject here is a
     building/setting rather than a single specimen. */
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--surface-raised);
}

@media (min-width: 720px) {
  .opening__image {
    aspect-ratio: 16 / 9;
  }
}

.opening__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

/* ============================================================
   III. THE PRACTICE
   ============================================================ */
.practice {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 64rem;
  align-self: stretch;
}

.practice__prose {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: var(--measure-reading);
}

.practice__prose p {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--text-muted);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

/* ============================================================
   IV. PACKAGES
   ============================================================ */
.packages {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.packages__row {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2.5rem, 5vw, 4rem);
}

@media (min-width: 900px) {
  .packages__row {
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(2rem, 3vw, 3rem);
    align-items: start;
  }
}

.packages__plate {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.packages__image {
  width: 100%;
  background: var(--surface-raised);
  overflow: hidden;
}

.packages__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.packages__caption {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.packages__title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: 1.25rem;
  line-height: 1.3;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.packages__tree {
  font-family: var(--font-display);
  font-size: 1rem;
  line-height: 1.4;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.packages__price {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--accent);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.packages__price em {
  font-style: italic;
}

/* ============================================================
   V. WHAT'S INCLUDED
   ============================================================ */
.included {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.included__dl {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin: 0;
  border-top: 1px solid var(--border-hair);
}

@media (min-width: 720px) {
  .included__dl {
    grid-template-columns: repeat(4, 1fr);
    border-top: 1px solid var(--border-hair);
    border-bottom: 1px solid var(--border-hair);
  }
}

.included__dl > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border-hair);
}

@media (min-width: 720px) {
  .included__dl > div {
    padding: var(--space-lg) var(--space-md) var(--space-lg) 0;
    border-bottom: 0;
    border-right: 1px solid var(--border-hair);
  }
  .included__dl > div:last-child {
    border-right: 0;
  }
  .included__dl > div:not(:first-child) {
    padding-left: var(--space-md);
  }
}

.included__dl dt {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  margin: 0;
}

.included__dl dd {
  font-family: var(--font-display);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

/* ============================================================
   VI. WHO IT'S FOR — quieter, narrower prose
   ============================================================ */
.audience {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  align-self: stretch;
}

.audience__prose {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 60ch;
}

.audience__prose p {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-muted);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

/* ============================================================
   VII. INQUIRY
   ============================================================ */
.inquire {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 56rem;
  width: 100%;
}

.inquire__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.inquire__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 56ch;
}

.inquire__heading {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: var(--type-display-3);
  line-height: var(--leading-display-tight);
  letter-spacing: var(--tracking-display);
  margin: 0;
  color: var(--text);
}

.inquire__lede {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text-muted);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.inquire__grid {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: var(--space-xl);
  row-gap: var(--space-lg);
}

@media (min-width: 720px) {
  .inquire__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  min-width: 0;
}

.field--span {
  grid-column: 1 / -1;
}

.field--notes {
  margin-top: var(--space-sm);
}

.field__label {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
}

.field__input {
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--ink-4);
  border-radius: 0;
  padding: var(--space-xs) 0;
  font-family: var(--font-display);
  font-size: 1.0625rem;
  line-height: 1.4;
  color: var(--text);
  width: 100%;
  font-feature-settings: var(--feat-running-text);
  transition:
    border-color var(--duration-base) var(--ease-out-quart),
    border-width var(--duration-base) var(--ease-out-quart);
  min-height: 2.5rem;
}

.field__input:focus {
  outline: none;
  border-bottom-color: var(--text);
  box-shadow: inset 0 -1px 0 var(--text);
}

.field__input:disabled {
  color: var(--text-faint);
  cursor: not-allowed;
}

.field__input::placeholder {
  color: var(--text-faint);
  font-style: italic;
}

.field__input[aria-invalid='true'] {
  border-bottom-color: var(--text);
  box-shadow: inset 0 -1px 0 var(--text);
}

.field__input--textarea {
  resize: vertical;
  min-height: 8rem;
  line-height: 1.55;
  padding-top: var(--space-sm);
}

.field__select-wrap {
  position: relative;
  display: block;
}

.field__input--select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: var(--space-lg);
  cursor: pointer;
  font-family: var(--font-display);
  background-image: none;
}

.field__input--select::-ms-expand {
  display: none;
}

.field__select-mark {
  position: absolute;
  right: 0;
  bottom: var(--space-sm);
  width: 0.625rem;
  height: 0.375rem;
  pointer-events: none;
  background:
    linear-gradient(45deg, transparent 50%, var(--text-muted) 50%) no-repeat,
    linear-gradient(-45deg, transparent 50%, var(--text-muted) 50%) no-repeat;
  background-size: 50% 100%;
  background-position: 0 0, 100% 0;
}

.field__error {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2xs);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.field__error-mark {
  width: 6px;
  height: 6px;
  background: var(--text);
  flex-shrink: 0;
  transform: translateY(-1px);
}

/* ---- Inquiry foot — submit + server error -------------------------- */
.inquire__foot {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-md);
  border-top: 1px solid var(--border-hair);
  padding-top: var(--space-lg);
}

.inquire__submit-error {
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--text);
  margin: 0;
  align-self: flex-end;
  text-align: right;
  max-width: 52ch;
  font-feature-settings: var(--feat-running-text);
}

.inquire__submit {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: transparent;
  border: 0;
  padding: var(--space-2xs) 0;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
  border-bottom: 1px solid var(--ink-4);
  transition:
    color var(--duration-base) var(--ease-out-quart),
    border-color var(--duration-base) var(--ease-out-quart);
}

.inquire__submit-mark {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1;
  transition: transform var(--duration-base) var(--ease-out-quart);
}

.inquire__submit:hover:not(:disabled),
.inquire__submit:focus-visible {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.inquire__submit:hover:not(:disabled) .inquire__submit-mark,
.inquire__submit:focus-visible .inquire__submit-mark {
  transform: translateX(4px);
}

.inquire__submit:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.inquire__submit:disabled {
  color: var(--text-faint);
  border-bottom-color: var(--border-hair);
  cursor: not-allowed;
}

/* ---- Success state ------------------------------------------------- */
.inquire__success {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 16rem;
  border-top: 1px solid var(--border-hair);
  border-bottom: 1px solid var(--border-hair);
  padding: var(--space-2xl) 0;
}

.inquire__success p {
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  line-height: 1.25;
  color: var(--accent);
  margin: 0;
  max-width: 36ch;
  font-feature-settings: var(--feat-running-text);
}

.inquire__success em {
  font-style: italic;
}

/* State transition — opacity only per motion principles */
.inquire-state-enter-active,
.inquire-state-leave-active {
  transition: opacity var(--duration-slow) var(--ease-out-quart);
}

.inquire-state-enter-from,
.inquire-state-leave-to {
  opacity: 0;
}

/* ============================================================
   VIII. LATITUDE FOOTER
   ============================================================ */
.retreats__lat {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border-hair);
  padding-top: var(--space-md);
  margin-top: var(--space-xl);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-spec-data);
}

@media (prefers-reduced-motion: reduce) {
  .inquire-state-enter-active,
  .inquire-state-leave-active {
    transition: none;
  }
}
</style>
