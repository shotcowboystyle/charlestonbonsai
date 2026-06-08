<script setup lang="ts">
/**
 * Events landing — bonsai arrangements composed for weddings, private
 * dinners, hospitality installs, and corporate events in the Lowcountry.
 *
 * Every booking is bespoke; the page exists to make a case and to
 * collect a structured inquiry. Three audiences (couples, planners,
 * hospitality) addressed in equal weight via voice — not via tabs or
 * audience selectors. See .impeccable.md for design context.
 *
 * Form state machine: idle → submitting → success | error
 *   - success replaces the form in place (no redirect, no toast)
 *   - server/network errors restore the form with an italic note and
 *     a direct-mail escape hatch
 */
type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface InquiryResponse {
  ok: boolean
  error?: string
  field?: 'name' | 'email' | 'eventDate' | 'location' | 'eventType' | 'notes'
}

const { siteName, contactEmail } = useSite()

useHead({
  title: `Events — ${siteName}`,
  meta: [
    {
      name: 'description',
      content: 'Bonsai composed for weddings, private dinners, and hospitality installs in the Lowcountry. Every event built from scratch and tended through the evening.',
    },
  ],
})

const currentYear = new Date().getFullYear()

// ---- Plate data --------------------------------------------------------
// Three trio plates after the opening plate. "Starting from" values are
// placeholders pending Curt's confirmation; flagged with TODO so they
// surface in code review before launch.
const openingPlate = {
  composition: 'Japanese black pine',
  scale: 'Statement piece',
  pot: 'Hand-thrown stoneware',
}

const trioPlates = [
  {
    composition: 'Trident maple grove',
    scale: 'Table-scale · 8–14″',
    pot: 'Unglazed Tokoname',
    // TODO(pricing): confirm anchor with Curt before launch.
    startingFrom: '$185 / assembly',
    aspectRatio: '4 / 5',
  },
  {
    composition: 'Japanese white pine',
    scale: 'Centerpiece · 16–22″',
    pot: 'Mica training pot',
    startingFrom: '$325 / assembly',
    aspectRatio: '4 / 5',
  },
  {
    composition: 'Coastal juniper',
    scale: 'Statement · 28″ and up',
    pot: 'Stoneware on a hand-cut slab',
    startingFrom: '$850 / piece',
    aspectRatio: '4 / 5',
  },
] as const

// ---- Form state --------------------------------------------------------
const form = reactive({
  name: '',
  email: '',
  eventDate: '',
  location: '',
  eventType: '',
  headcount: '',
  tableCount: '',
  notes: '',
})

const state = ref<FormState>('idle')
const fieldErrors = ref<Record<string, string>>({})
const submitError = ref('')

const nameId = useId()
const emailId = useId()
const dateId = useId()
const locationId = useId()
const eventTypeId = useId()
const headcountId = useId()
const tableCountId = useId()
const notesId = useId()
const submitErrorId = useId()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

const ERROR_COPY: Record<string, string> = {
  name: 'I’ll need a name for the reply.',
  email: 'I’ll need an email to write back to.',
  email_invalid: 'That email address doesn’t look right.',
  eventDate: 'An event date helps me check the calendar.',
  location: 'A venue or city — even a rough one — helps me scope.',
  eventType: 'Pick whichever is closest.',
  notes: 'Anything you can share about the event helps me reply usefully.',
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

  if (!form.eventDate)
    errors.eventDate = ERROR_COPY.eventDate!

  if (!form.location.trim())
    errors.location = ERROR_COPY.location!

  if (!form.eventType)
    errors.eventType = ERROR_COPY.eventType!

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

  const headcountValue = form.headcount.trim() === ''
    ? null
    : Number.parseInt(form.headcount, 10)
  const tableCountValue = form.tableCount.trim() === ''
    ? null
    : Number.parseInt(form.tableCount, 10)

  try {
    const response = await $fetch<InquiryResponse>('/api/events/inquire', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        eventDate: form.eventDate,
        location: form.location.trim(),
        eventType: form.eventType,
        headcount: Number.isFinite(headcountValue) ? headcountValue : null,
        tableCount: Number.isFinite(tableCountValue) ? tableCountValue : null,
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
    console.error('[events/inquire] unexpected error:', err)
    state.value = 'error'
    submitError.value = `Something didn’t get through. Please try again, or write directly to ${contactEmail}.`
  }
}
</script>

<template>
  <article class="events">
    <!-- ───────────────────────────────────────────────────
         I. MASTHEAD
         ─────────────────────────────────────────────────── -->
    <header class="events__masthead">
      <p class="events__eyebrow">
        <span class="events__numeral">I</span>
        <span>Events</span>
      </p>
      <h1 class="events__heading">
        Bonsai composed for a room and an evening.
      </h1>
      <p class="events__lede">
        Each arrangement is composed for the room it will occupy and the
        evening it will mark. {{ siteName }} works directly with
        planners, florists, and couples within the Lowcountry — every
        event is built from scratch, set on the day of, and tended
        through the night.
      </p>
    </header>

    <!-- ───────────────────────────────────────────────────
         II. OPENING PLATE
         ─────────────────────────────────────────────────── -->
    <section class="opening" aria-label="Studio arrangement, opening plate">
      <div class="strip" role="presentation">
        <span class="strip__item">{{ openingPlate.composition }}</span>
        <span class="strip__dot" aria-hidden="true">·</span>
        <span class="strip__item">{{ openingPlate.scale }}</span>
        <span class="strip__dot" aria-hidden="true">·</span>
        <span class="strip__item">{{ openingPlate.pot }}</span>
      </div>
      <div class="opening__image">
        <div class="plate-placeholder" aria-hidden="true" />
      </div>
    </section>

    <!-- ───────────────────────────────────────────────────
         III. THE PRACTICE
         ─────────────────────────────────────────────────── -->
    <section class="practice" aria-labelledby="practice-heading">
      <p class="practice__eyebrow">
        <span class="events__numeral">II</span>
        <span>The Practice</span>
      </p>
      <h2 id="practice-heading" class="sr-only">
        The practice
      </h2>
      <div class="practice__prose">
        <p>
          Bonsai for an event is not a centerpiece pulled from a shelf.
          The tree is selected and styled with the table in mind — its
          scale, the height of the candles, the kind of conversation
          that will happen across it. A studio bench is set up days
          ahead so that what arrives at the venue has been seen and
          adjusted before anyone else sees it.
        </p>
        <p>
          {{ siteName }} works directly with couples planning their
          own table, with planners building the room around a theme,
          and with restaurants and hotels who want a living object on
          a counter for the season. The conversation always begins the
          same way: tell me about the room, the evening, and the people
          who will be there.
        </p>
      </div>
    </section>

    <!-- ───────────────────────────────────────────────────
         IV. PLATES — TRIO
         ─────────────────────────────────────────────────── -->
    <section class="trio" aria-label="Three further arrangements">
      <ol class="trio__row">
        <li
          v-for="(plate, i) in trioPlates"
          :key="i"
          class="trio__plate"
        >
          <div class="strip" role="presentation">
            <span class="strip__item">{{ plate.composition }}</span>
            <span class="strip__dot" aria-hidden="true">·</span>
            <span class="strip__item">{{ plate.scale }}</span>
          </div>
          <div
            class="trio__image"
            :style="{ aspectRatio: plate.aspectRatio }"
          >
            <div class="plate-placeholder" aria-hidden="true" />
          </div>
          <div class="trio__caption">
            <p class="trio__pot">
              {{ plate.pot }}
            </p>
            <p class="trio__price">
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
        <span class="events__numeral">III</span>
        <span>What’s Included</span>
      </p>
      <h2 id="included-heading" class="sr-only">
        What’s included
      </h2>
      <dl class="included__dl">
        <div>
          <dt>Delivery</dt>
          <dd>Placed on the day of, by the person who composed the arrangement.</dd>
        </div>
        <div>
          <dt>Styling</dt>
          <dd>On-site composition with your planner or florist, with the room in mind.</dd>
        </div>
        <div>
          <dt>Care</dt>
          <dd>Trees are checked and tended through the evening; they’re alive, not props.</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>Retrieved the day after. Nothing for you to coordinate.</dd>
        </div>
      </dl>
    </section>

    <!-- ───────────────────────────────────────────────────
         VI. PLANNERS & FLORISTS
         ─────────────────────────────────────────────────── -->
    <section class="trade" aria-labelledby="trade-heading">
      <p class="trade__eyebrow">
        <span class="events__numeral">IV</span>
        <span>Planners &amp; Florists</span>
      </p>
      <h2 id="trade-heading" class="sr-only">
        Working with planners and florists
      </h2>
      <div class="trade__prose">
        <p>
          Bonsai sits unusually well alongside florals — it brings
          vertical weight and a longer line than cut flowers can, and
          it survives the room temperature shifts that florals don’t.
          The work is meant to complement what’s already being
          designed, not to compete with it.
        </p>
        <p>
          Send the brief — color palette, table count, the florist of
          record, anything visual you’ve already pinned. The first
          reply will be honest about what’s possible at the scale of
          the event and what should probably stay floral. If we’re a
          fit, planning happens in your timeline, not a separate one.
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
              <span class="events__numeral">V</span>
              <span>Inquire</span>
            </p>
            <h2 id="inquire-heading" class="inquire__heading">
              Tell me about the event.
            </h2>
            <p class="inquire__lede">
              A reply usually comes within a few days. Anything you can share
              about the room, the date, and the feeling helps me write back
              with something useful.
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
              <label :for="dateId" class="field__label">Event date</label>
              <input
                :id="dateId"
                v-model="form.eventDate"
                type="date"
                class="field__input"
                :aria-invalid="!!fieldErrors.eventDate || undefined"
                :aria-describedby="fieldErrors.eventDate ? `${dateId}-err` : undefined"
                :disabled="state === 'submitting'"
                @input="clearFieldError('eventDate')"
              >
              <p
                v-if="fieldErrors.eventDate"
                :id="`${dateId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.eventDate }}</span>
              </p>
            </div>

            <div class="field">
              <label :for="locationId" class="field__label">Venue or city</label>
              <input
                :id="locationId"
                v-model="form.location"
                type="text"
                autocomplete="off"
                class="field__input"
                :aria-invalid="!!fieldErrors.location || undefined"
                :aria-describedby="fieldErrors.location ? `${locationId}-err` : undefined"
                :disabled="state === 'submitting'"
                @input="clearFieldError('location')"
              >
              <p
                v-if="fieldErrors.location"
                :id="`${locationId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.location }}</span>
              </p>
            </div>

            <div class="field field--span">
              <label :for="eventTypeId" class="field__label">Kind of event</label>
              <div class="field__select-wrap">
                <select
                  :id="eventTypeId"
                  v-model="form.eventType"
                  class="field__input field__input--select"
                  :aria-invalid="!!fieldErrors.eventType || undefined"
                  :aria-describedby="fieldErrors.eventType ? `${eventTypeId}-err` : undefined"
                  :disabled="state === 'submitting'"
                  @change="clearFieldError('eventType')"
                >
                  <option value="" disabled>
                    Choose one
                  </option>
                  <option value="wedding">
                    Wedding
                  </option>
                  <option value="private_dinner">
                    Private dinner
                  </option>
                  <option value="hospitality">
                    Hospitality install
                  </option>
                  <option value="corporate">
                    Corporate event
                  </option>
                  <option value="other">
                    Something else
                  </option>
                </select>
                <span class="field__select-mark" aria-hidden="true" />
              </div>
              <p
                v-if="fieldErrors.eventType"
                :id="`${eventTypeId}-err`"
                class="field__error"
                role="alert"
              >
                <span class="field__error-mark" aria-hidden="true" />
                <span>{{ fieldErrors.eventType }}</span>
              </p>
            </div>

            <div class="field">
              <label :for="headcountId" class="field__label">
                Approximate headcount <span class="field__optional">optional</span>
              </label>
              <input
                :id="headcountId"
                v-model="form.headcount"
                type="number"
                min="1"
                inputmode="numeric"
                class="field__input"
                :disabled="state === 'submitting'"
              >
            </div>

            <div class="field">
              <label :for="tableCountId" class="field__label">
                Approximate tables <span class="field__optional">optional</span>
              </label>
              <input
                :id="tableCountId"
                v-model="form.tableCount"
                type="number"
                min="1"
                inputmode="numeric"
                class="field__input"
                :disabled="state === 'submitting'"
              >
            </div>

            <div class="field field--span field--notes">
              <label :for="notesId" class="field__label">Tell me about the event</label>
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
    <footer class="events__lat" aria-hidden="true">
      <span>32°47′N · 79°55′W</span>
      <span>{{ currentYear }}</span>
    </footer>
  </article>
</template>

<style scoped>
/* ============================================================
   OUTER FRAME — single column, generous Ma between sections.
   Max width matches visit.vue (64rem); trio plates are allowed
   to break to a wider content column (80rem) for image presence.
   ============================================================ */
.events {
  background: var(--surface);
  color: var(--text);
  display: flex;
  flex-direction: column;
  padding: clamp(5rem, 12vw, 9rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 8vw, 5rem);
  max-width: 80rem;
  margin: 0 auto;
  gap: var(--section-y);
}

/* Shared eyebrow numeral — matches index.vue and visit.vue pattern. */
.events__numeral {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--accent);
}

.events__eyebrow,
.practice__eyebrow,
.included__eyebrow,
.trade__eyebrow,
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
.events__masthead {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 56ch;
}

.events__heading {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: var(--type-display-2);
  line-height: var(--leading-display-tight);
  letter-spacing: var(--tracking-display);
  margin: 0;
  color: var(--text);
}

.events__lede {
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
   Used until studio assembly photography is dropped in. The
   pattern is intentional (matches index.vue) so the page never
   reads as "missing image" — it reads as "this is the place".
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
  /* Portrait at all viewports — matches the trio plates' orientation
     so the language is consistent. The opening plate's prominence
     comes from being full-width while the trio splits three ways. */
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--surface-raised);
}

@media (min-width: 720px) {
  .opening__image {
    /* Slightly less tall on mid+ to avoid an overwhelming tower. */
    aspect-ratio: 3 / 4;
  }
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
   IV. TRIO
   ============================================================ */
.trio__row {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2.5rem, 5vw, 4rem);
}

@media (min-width: 900px) {
  .trio__row {
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(2rem, 3vw, 3rem);
    align-items: start;
  }
}

.trio__plate {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.trio__image {
  width: 100%;
  background: var(--surface-raised);
  overflow: hidden;
}

.trio__caption {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.trio__pot {
  font-family: var(--font-display);
  font-size: 1rem;
  line-height: 1.4;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.trio__price {
  font-family: var(--font-display);
  font-size: 0.875rem;
  color: var(--accent);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.trio__price em {
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
   VI. PLANNERS & FLORISTS — quieter, narrower than the practice
   ============================================================ */
.trade {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  align-self: stretch;
}

.trade__prose {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 60ch;
}

.trade__prose p {
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
  /* Cap the form's width so fields don't sprawl. Slightly wider than
     the trade prose so the side-by-side fields have breathing room. */
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
  /* Notes gets visibly more room than the other fields — the brief
     calls it the most important field and the design says so. */
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

.field__optional {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.6875rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--text-faint);
  font-feature-settings: var(--feat-running-text);
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
  /* Some browsers (Safari) need this so the date input doesn't clip. */
  min-height: 2.5rem;
}

.field__input:focus {
  outline: none;
  border-bottom-color: var(--text);
  /* Heavier underline on focus, achieved via box-shadow to avoid the
     layout shift of changing border-width. Uses --text rather than
     --accent to match the subscribe form's quieter focus treatment. */
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

/* Native date input: keep the picker indicator quiet and theme-aware */
.field__input[type='date'] {
  color-scheme: light dark;
}

/* Select — custom mark, native control underneath for accessibility */
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
.events__lat {
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
</style>
