import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<{ id: string, email: string } | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const token = ref<string | null>(null)

  // Actions
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: loginError } = await useFetch('/api/admin/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      if (loginError.value || !data.value) {
        throw new Error(loginError.value?.statusMessage || 'Login failed')
      }

      const result = data.value as { success: boolean, user: { id: string, email: string }, token: string }

      user.value = result.user
      token.value = result.token
      isAuthenticated.value = true

      // Store token in cookie
      const tokenCookie = useCookie('admin_token', {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: true,
        httpOnly: false,
      })
      tokenCookie.value = result.token

      return true
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Login failed'
      return false
    }
    finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await useFetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    }
    catch (e) {
      console.error('Logout error:', e)
    }
    finally {
      user.value = null
      token.value = null
      isAuthenticated.value = false

      const tokenCookie = useCookie('admin_token')
      tokenCookie.value = null
    }
  }

  async function checkAuth() {
    const tokenCookie = useCookie('admin_token')

    if (!tokenCookie.value) {
      isAuthenticated.value = false
      return false
    }

    token.value = tokenCookie.value

    try {
      const { data, error: authError } = await useFetch('/api/admin/auth/verify', {
        headers: {
          Authorization: `Bearer ${tokenCookie.value}`,
        },
      })

      if (authError.value || !data.value) {
        isAuthenticated.value = false
        return false
      }

      const result = data.value as { success: boolean, user: { id: string, email: string } }

      if (result.success) {
        user.value = result.user
        isAuthenticated.value = true
        return true
      }

      return false
    }
    catch {
      isAuthenticated.value = false
      return false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    token,

    // Actions
    login,
    logout,
    checkAuth,
    clearError,
  }
})
