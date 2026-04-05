<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useToastStore } from '~/stores/toast'

const authStore = useAuthStore()
const toast = useToastStore()

// Form state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

// Reset form
function resetForm() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  errorMessage.value = null
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
      toast.success('Password changed', 'Your password has been updated successfully.')
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
