<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Form state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const errorMessage = ref<string | null>(null)

// Reset form
function resetForm() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  errorMessage.value = null
  success.value = false
}

// Submit form
async function handleSubmit() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value)
    return

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'New passwords do not match'
    return
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters'
    return
  }

  if (currentPassword.value === newPassword.value) {
    errorMessage.value = 'New password must be different from current password'
    return
  }

  loading.value = true
  errorMessage.value = null
  success.value = false

  try {
    const token = authStore.token

    if (!token) {
      errorMessage.value = 'Not authenticated'
      return
    }

    const { error } = await useFetch('/api/admin/auth/change-password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value,
      },
    })

    if (error.value) {
      errorMessage.value = error.value.statusMessage || 'An error occurred'
    }
    else {
      success.value = true
      resetForm()
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
  <div class="bg-white rounded-xl shadow-sm border p-6">
    <h3 class="text-lg font-serif font-bold text-gray-900 mb-4">
      Change Password
    </h3>

    <!-- Success message -->
    <div v-if="success" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Password changed successfully!
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Current Password -->
      <div class="mb-4">
        <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
          Current Password
        </label>
        <input
          id="currentPassword"
          v-model="currentPassword"
          type="password"
          required
          autocomplete="current-password"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent transition"
          placeholder="Enter current password"
        >
      </div>

      <!-- New Password -->
      <div class="mb-4">
        <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <input
          id="newPassword"
          v-model="newPassword"
          type="password"
          required
          autocomplete="new-password"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent transition"
          placeholder="Minimum 8 characters"
        >
      </div>

      <!-- Confirm Password -->
      <div class="mb-4">
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          required
          autocomplete="new-password"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent transition"
          placeholder="Confirm new password"
        >
      </div>

      <!-- Error -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {{ errorMessage }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="loading || !currentPassword || !newPassword || !confirmPassword"
        class="px-6 py-2 bg-forest text-white font-medium rounded-lg hover:bg-forest-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <span v-if="loading">Changing...</span>
        <span v-else>Change Password</span>
      </button>
    </form>
  </div>
</template>
