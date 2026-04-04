<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const tokenCookie = useCookie('admin_token')
const authStore = useAuthStore()

interface AdminUser {
  id: string
  email: string
  created_at: string
}

const { data: response, pending, error, refresh } = await useFetch<{ users: AdminUser[] }>('/api/admin/users', {
  headers: {
    Authorization: `Bearer ${tokenCookie.value}`,
  },
})

const deleting = ref<string | null>(null)

async function handleDelete(id: string) {
  // eslint-disable-next-line no-alert
  if (!confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
    return
  }

  deleting.value = id

  try {
    const { error: delError } = await useFetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
      },
    })

    if (delError.value) {
      console.error(delError.value.statusMessage || 'Failed to delete user')
    }
    else {
      await refresh()
    }
  }
  catch {
    console.error('Failed to delete user')
  }
  finally {
    deleting.value = null
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="font-serif text-3xl text-charcoal mb-2">
          Admin Users
        </h1>
        <p class="text-stone-500">
          Manage system administrators
        </p>
      </div>
      <div class="flex">
        <NuxtLink to="/admin/users/create" class="btn btn-primary flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Admin
        </NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div v-if="pending" class="flex justify-center py-12">
      <div class="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin" />
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center justify-between">
      <div>
        <h3 class="font-medium">
          Error loading users
        </h3>
        <p class="text-sm mt-1 opacity-80">
          {{ error.statusMessage || error.message }}
        </p>
      </div>
      <button class="btn px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50" @click="() => refresh()">
        Retry
      </button>
    </div>

    <div v-else-if="response?.users" class="bg-white rounded-xl shadow-soft overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-stone-50 border-b border-stone-200 text-stone-500 text-sm">
              <th class="px-6 py-4 font-medium">
                Email
              </th>
              <th class="px-6 py-4 font-medium">
                Created On
              </th>
              <th class="px-6 py-4 font-medium text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="user in response.users" :key="user.id" class="hover:bg-cream-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-medium flex-shrink-0">
                    {{ user.email.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-medium text-charcoal">
                      {{ user.email }}
                    </div>
                    <div v-if="user.id === authStore.user?.id" class="text-xs text-sage bg-sage-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      You
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-stone-500 text-sm whitespace-nowrap">
                {{ new Date(user.created_at).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <button
                  v-if="user.id !== authStore.user?.id"
                  :disabled="deleting === user.id"
                  class="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block"
                  title="Delete user"
                  @click="handleDelete(user.id)"
                >
                  <div v-if="deleting === user.id" class="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="response.users.length === 0" class="p-12 text-center text-stone-500">
        No administrative users found.
      </div>
    </div>
  </div>
</template>
