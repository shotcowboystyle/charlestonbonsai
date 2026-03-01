<script setup lang="ts">
// Meta
useHead({
  title: 'Forgot Password - Charleston Bonsai Admin',
})

// Form state
const email = ref('')
const loading = ref(false)
const submitted = ref(false)
const errorMessage = ref<string | null>(null)

// Submit form
async function handleSubmit() {
  if (!email.value)
    return

  loading.value = true
  errorMessage.value = null

  try {
    const { error } = await useFetch('/api/admin/auth/forgot-password', {
      method: 'POST',
      body: {
        email: email.value.toLowerCase(),
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
        <!-- Not submitted state -->
        <div v-if="!submitted">
          <h1 class="text-2xl font-serif font-bold text-gray-900 mb-2">
            Forgot Password
          </h1>
          <p class="text-gray-600 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form @submit.prevent="handleSubmit">
            <!-- Email -->
            <div class="mb-6">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent transition"
                placeholder="admin@example.com"
              >
            </div>

            <!-- Error -->
            <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {{ errorMessage }}
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading || !email"
              class="w-full py-3 px-4 bg-forest text-white font-medium rounded-lg hover:bg-forest-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span v-if="loading">Sending...</span>
              <span v-else>Send Reset Link</span>
            </button>
          </form>
        </div>

        <!-- Submitted state -->
        <div v-else class="text-center py-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-xl font-serif font-bold text-gray-900 mb-2">
            Check Your Email
          </h2>
          <p class="text-gray-600 mb-6">
            If an account with that email exists, we've sent you a password reset link. The link will expire in 1 hour.
          </p>
        </div>

        <!-- Back to login -->
        <div class="mt-6 text-center border-t pt-6">
          <NuxtLink to="/admin/login" class="text-forest hover:text-forest-600 font-medium">
            ← Back to Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
