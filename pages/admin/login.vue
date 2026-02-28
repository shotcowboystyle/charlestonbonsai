<script setup lang="ts">
definePageMeta({
  layout: false,
})

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const loginError = ref('')
const errors = ref({
  email: '',
  password: '',
})

// Redirect if already authenticated
onMounted(async () => {
  if (authStore.isAuthenticated) {
    router.push('/admin')
    return
  }

  const isAuthed = await authStore.checkAuth()
  if (isAuthed) {
    router.push('/admin')
  }
})

async function handleLogin() {
  // Reset errors
  loginError.value = ''
  errors.value = { email: '', password: '' }

  // Validate
  if (!email.value) {
    errors.value.email = 'Email is required'
    return
  }
  if (!password.value) {
    errors.value.password = 'Password is required'
    return
  }

  loading.value = true

  try {
    const success = await authStore.login(email.value, password.value)

    if (success) {
      router.push('/admin')
    }
    else {
      loginError.value = authStore.error || 'Invalid email or password'
    }
  }
  catch {
    loginError.value = 'An error occurred. Please try again.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-cream flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-3">
          <div class="w-12 h-12 bg-forest rounded-lg flex items-center justify-center">
            <span class="text-2xl">🌲</span>
          </div>
          <div class="text-left">
            <div class="font-serif text-xl font-semibold text-charcoal">
              Charleston Bonsai
            </div>
            <div class="text-xs text-stone-500">
              Admin Portal
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-2xl shadow-soft p-8">
        <h1 class="font-serif text-2xl text-charcoal text-center mb-6">
          Sign In
        </h1>

        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <UiInput
              v-model="email"
              type="email"
              label="Email"
              placeholder="admin@example.com"
              required
              :error="errors.email"
            />

            <UiInput
              v-model="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              required
              :error="errors.password"
            />
          </div>

          <!-- Error message -->
          <div v-if="loginError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">
              {{ loginError }}
            </p>
          </div>

          <UiButton
            type="submit"
            variant="primary"
            full-width
            class="mt-6"
            :loading="loading"
          >
            Sign In
          </UiButton>
        </form>
      </div>

      <!-- Back to site -->
      <p class="text-center mt-6 text-sm text-stone-500">
        <NuxtLink to="/" class="hover:text-charcoal transition-colors">
          ← Back to website
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
