<script setup lang="ts">
/**
 * Footer signup form. Single-field, underlined input with inline
 * state machine — no modal, no toast. The form is for the colophon,
 * so its rest state is intentionally quiet.
 *
 * States: idle → submitting → success | error
 *   - success: replaces the field inline with a quiet confirmation
 *   - error: shows a sumi-ink message (not red — restraint), field stays focusable
 */
type FormState = 'idle' | 'submitting' | 'success' | 'error'

const email = ref('')
const state = ref<FormState>('idle')
const errorMessage = ref('')

const fieldId = useId()
const messageId = useId()

async function handleSubmit() {
  const value = email.value.trim()
  if (!value) {
    state.value = 'error'
    errorMessage.value = 'An email is needed.'
    return
  }

  state.value = 'submitting'
  errorMessage.value = ''

  try {
    const response = await $fetch<{ ok: boolean, error?: string }>('/api/subscribe', {
      method: 'POST',
      body: { email: value },
    }).catch((err: { data?: { ok: boolean, error?: string } } | unknown) => {
      // $fetch throws on non-2xx; normalize to a stub response so we
      // can branch on it uniformly below.
      if (typeof err === 'object' && err !== null && 'data' in err) {
        const data = (err as { data?: { ok: boolean, error?: string } }).data
        if (data)
          return data
      }
      return { ok: false, error: 'network' }
    })

    if (response.ok) {
      state.value = 'success'
      email.value = ''
    }
    else {
      state.value = 'error'
      errorMessage.value = response.error === 'invalid_email'
        ? 'That email address doesn’t look right.'
        : 'That didn’t go through. Try again, or write hello@charlestonbonsai.com.'
    }
  }
  catch (err) {
    // Defensive: $fetch should already be handled above, but log
    // unexpected failures rather than silently swallowing.
    console.error('[subscribe] unexpected error:', err)
    state.value = 'error'
    errorMessage.value = 'That didn’t go through. Try again, or write hello@charlestonbonsai.com.'
  }
}
</script>

<template>
  <div class="subscribe">
    <Transition name="subscribe-state" mode="out-in">
      <p v-if="state === 'success'" key="success" class="subscribe__success">
        Recorded. Thank you.
      </p>
      <form
        v-else
        key="form"
        class="subscribe__form"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <label :for="fieldId" class="subscribe__label">
          When a new tree is listed
        </label>
        <div class="subscribe__row">
          <input
            :id="fieldId"
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            class="subscribe__input"
            placeholder="you@example.com"
            :aria-invalid="state === 'error' || undefined"
            :aria-describedby="state === 'error' ? messageId : undefined"
            :disabled="state === 'submitting'"
          >
          <button
            type="submit"
            class="subscribe__submit"
            :disabled="state === 'submitting'"
          >
            {{ state === 'submitting' ? 'Sending…' : 'Add me' }}
          </button>
        </div>
        <p class="subscribe__helper">
          A note when a new tree is listed. No newsletter, no marketing.
        </p>
        <p
          v-if="state === 'error'"
          :id="messageId"
          class="subscribe__error"
          role="alert"
        >
          <span class="subscribe__error-mark" aria-hidden="true" />
          {{ errorMessage }}
        </p>
      </form>
    </Transition>
  </div>
</template>

<style scoped>
.subscribe {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.subscribe__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.subscribe__label {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-feature-settings: var(--feat-small-caps);
}

.subscribe__row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  border-bottom: 1px solid var(--ink-4);
  padding-bottom: var(--space-2xs);
  transition: border-color var(--duration-base) var(--ease-out-quart);
}

.subscribe__row:focus-within {
  border-bottom-color: var(--text);
}

.subscribe__input {
  flex: 1;
  background: transparent;
  border: 0;
  padding: 0;
  font-family: var(--font-display);
  font-size: 1.0625rem;
  line-height: 1.3;
  color: var(--text);
  font-feature-settings: var(--feat-running-text);
}

.subscribe__input:focus {
  outline: none;
}

.subscribe__input::placeholder {
  color: var(--text-faint);
  font-style: italic;
}

.subscribe__input:disabled {
  color: var(--text-faint);
  cursor: not-allowed;
}

.subscribe__submit {
  flex-shrink: 0;
  background: transparent;
  border: 0;
  padding: 0;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--duration-base) var(--ease-out-quart);
}

.subscribe__submit:hover:not(:disabled),
.subscribe__submit:focus-visible {
  color: var(--accent);
}

.subscribe__submit:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.subscribe__submit:disabled {
  color: var(--text-faint);
  cursor: not-allowed;
}

.subscribe__helper {
  font-family: var(--font-body);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--text-faint);
  margin: 0;
  max-width: 32ch;
}

.subscribe__error {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2xs);
  font-family: var(--font-body);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--text);
  margin: 0;
  font-feature-settings: var(--feat-running-text);
}

.subscribe__error-mark {
  width: 6px;
  height: 6px;
  background: var(--text);
  flex-shrink: 0;
  transform: translateY(-1px);
}

.subscribe__success {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.0625rem;
  line-height: 1.4;
  color: var(--accent);
  margin: 0;
  padding: var(--space-md) 0;
}

/* State transition — opacity-only per motion principles */
.subscribe-state-enter-active,
.subscribe-state-leave-active {
  transition: opacity var(--duration-base) var(--ease-out-quart);
}

.subscribe-state-enter-from,
.subscribe-state-leave-to {
  opacity: 0;
}
</style>
