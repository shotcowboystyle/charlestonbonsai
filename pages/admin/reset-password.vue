<script setup lang="ts">
// Meta
useHead({
  title: 'Reset Password - Charleston Bonsai Admin',
})

// Route
const route = useRoute()

// Get token from URL
const token = computed(() => route.query.token as string || '')

// Form state
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const validating = ref(true)
const tokenValid = ref(false)
const tokenMessage = ref('')
const submitted = ref(false)
const errorMessage = ref<string | null>(null)

// Validate token on mount
onMounted(async () => {
  if (!token.value) {
    validating.value = false
    tokenValid.value = false
    tokenMessage.value = 'No reset token provided'
    return
  }

  try {
    const { data, error } = await useFetch('/api/admin/auth/validate-reset-token', {
      query: { token: token.value },
    })

    if (error.value || !data.value?.valid) {
      tokenValid.value = false
      tokenMessage.value = data.value?.message || 'Invalid reset token'
    }
    else {
      tokenValid.value = true
      tokenMessage.value = data.value.message
    }
  }
  catch {
    tokenValid.value = false
    tokenMessage.value = 'An error occurred'
  }
  finally {
    validating.value = false
  }
})

// Submit form
async function handleSubmit() {
  if (!password.value || !confirmPassword.value)
    return

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }

  loading.value = true
  errorMessage.value = null

  try {
    const { error } = await useFetch('/api/admin/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      },
    })

    if (error.value) {
      errorMessage.value = error.value.statusMessage || 'An error occurred'
    }
    else {
      submitted.value = true
    }
  }
  catch {
    errorMessage.value = 'An error occurred. Please try again.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-forest-50 px-4">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <span class="text-3xl font-serif font-bold text-forest">Charleston Bonsai</span>
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Loading state -->
        <div v-if="validating" class="text-center py-8">
          <div class="animate-spin w-8 h-8 border-4 border-forest border-t-transparent rounded-full mx-auto mb-4" />
          <p class="text-gray-600">
            Verifying reset link...
          </p>
        </div>

        <!-- Invalid token -->
        <div v-else-if="!tokenValid" class="text-center py-4">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="text-xl font-serif font-bold text-gray-900 mb-2">
            Invalid Link
          </h2>
          <p class="text-gray-600 mb-6">
            {{ tokenMessage }}
          </p>
          <NuxtLink to="/admin/forgot-password" class="text-forest hover:text-forest-600 font-medium">
            Request a new reset link →
          </NuxtLink>
        </div>

        <!-- Success state -->
        <div v-else-if="submitted" class="text-center py-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-xl font-serif font-bold text-gray-900 mb-2">
            Password Reset
          </h2>
          <p class="text-gray-600 mb-6">
            Your password has been changed successfully. You can now log in with your new password.
          </p>
          <NuxtLink
            to="/admin/login"
            class="inline-block py-3 px-6 bg-forest text-white font-medium rounded-lg hover:bg-forest-600 transition"
          >
            Go to Login
          </NuxtLink>
        </div>

        <!-- Reset form -->
        <div v-else>
          <h1 class="text-2xl font-serif font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p class="text-gray-600 mb-6">
            Enter your new password below.
          </p>

          <form @submit.prevent="handleSubmit">
            <!-- New Password -->
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="new-password"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent transition"
                placeholder="Minimum 8 characters"
              >
            </div>

            <!-- Confirm Password -->
            <div class="mb-6">
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                autocomplete="new-password"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent transition"
                placeholder="Confirm your password"
              >
            </div>

            <!-- Error -->
            <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {{ errorMessage }}
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading || !password || !confirmPassword"
              class="w-full py-3 px-4 bg-forest text-white font-medium rounded-lg hover:bg-forest-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span v-if="loading">Resetting...</span>
              <span v-else>Reset Password</span>
            </button>
          </form>
        </div>

        <!-- Back to login -->
        <div v-if="!submitted" class="mt-6 text-center border-t pt-6">
          <NuxtLink to="/admin/login" class="text-forest hover:text-forest-600 font-medium">
            ← Back to Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
