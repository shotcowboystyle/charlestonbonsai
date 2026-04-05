<script setup lang="ts">
import { useToastStore } from '~/stores/toast'

definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const tokenCookie = useCookie('admin_token')
const toast = useToastStore()

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = ref<Record<string, string>>({})
const saving = ref(false)

async function handleSubmit() {
  errors.value = {}

  if (!form.value.email) {
    errors.value.email = 'Email is required'
  }
  if (!form.value.password || form.value.password.length < 8) {
    errors.value.password = 'Password must be at least 8 characters'
  }
  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
  }

  if (Object.keys(errors.value).length > 0)
    return

  saving.value = true

  try {
    const { data: _data, error: createError } = await useFetch('/api/admin/users/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
      },
      body: {
        email: form.value.email,
        password: form.value.password,
      },
    })

    if (createError.value) {
      if (createError.value.statusCode === 409) {
        errors.value.email = 'A user with this email already exists'
      }
      else {
        toast.error('Failed to create user', createError.value.statusMessage || 'An unexpected error occurred. Please try again.')
      }
      return
    }

    toast.success('User created', `Admin user "${form.value.email}" has been added.`)
    router.push('/admin/users')
  }
  catch {
    toast.error('Unexpected error', 'Something went wrong while creating the user. Please try again.')
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin/users" class="text-stone-400 hover:text-charcoal transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="font-serif text-2xl text-charcoal">
        Add New Admin User
      </h1>
    </div>

    <!-- Form -->
    <div class="bg-white rounded-xl shadow-soft p-6">
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <UiInput
          v-model="form.email"
          type="email"
          label="Email Address"
          placeholder="admin@example.com"
          required
          :error="errors.email"
        />

        <UiInput
          v-model="form.password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          required
          :error="errors.password"
        />

        <UiInput
          v-model="form.confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Repeat password"
          required
          :error="errors.confirmPassword"
        />

        <div class="pt-4 flex gap-4">
          <NuxtLink
            to="/admin/users"
            class="btn btn-ghost flex-1 text-center"
          >
            Cancel
          </NuxtLink>
          <UiButton
            type="submit"
            variant="primary"
            class="flex-1"
            :loading="saving"
          >
            Create User
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
