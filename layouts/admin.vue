<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

// Compute page title from route
const route = useRoute()
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/listings': 'Manage Listings',
    '/admin/listings/create': 'Add New Tree',
  }

  // Check for edit page
  if (route.path.startsWith('/admin/listings/') && route.path !== '/admin/listings/') {
    return 'Edit Tree'
  }

  return titles[route.path] || 'Admin'
})

async function handleLogout() {
  await authStore.logout()
  router.push('/admin/login')
}

const isMobileMenuOpen = ref(false)

watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})

// Check auth on mount
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    const isAuthed = await authStore.checkAuth()
    if (!isAuthed) {
      router.push('/admin/login')
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-cream-100 flex relative">
    <!-- Global Toast Notifications -->
    <AdminToast />

    <!-- Mobile Overlay -->
    <div v-if="isMobileMenuOpen" class="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" @click="isMobileMenuOpen = false" />

    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200 flex-shrink-0 transform transition-transform duration-300 md:relative md:translate-x-0" :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'">
      <div class="h-full flex flex-col">
        <!-- Logo -->
        <div class="p-6 border-b border-stone-200">
          <NuxtLink to="/admin" class="flex items-center gap-3">
            <div class="w-10 h-10 bg-forest rounded-lg flex items-center justify-center">
              <span class="text-white text-xl">🌲</span>
            </div>
            <div>
              <div class="font-serif font-semibold text-charcoal">
                Charleston
              </div>
              <div class="text-xs text-stone-500">
                Admin Panel
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 p-4">
          <ul class="space-y-1">
            <li>
              <NuxtLink
                to="/admin"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal hover:bg-cream transition-colors"
                active-class="bg-sage-50 text-sage-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/listings"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal hover:bg-cream transition-colors"
                active-class="bg-sage-50 text-sage-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Listings
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/listings/create"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal hover:bg-cream transition-colors"
                active-class="bg-sage-50 text-sage-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add New Tree
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/users"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal hover:bg-cream transition-colors"
                active-class="bg-sage-50 text-sage-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- User section -->
        <div class="p-4 border-t border-stone-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-sage rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">C</span>
              </div>
              <span class="text-sm text-charcoal">{{ authStore.user?.email }}</span>
            </div>
            <button
              class="text-stone-400 hover:text-charcoal transition-colors"
              title="Logout"
              @click="handleLogout"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 max-w-full">
      <!-- Top bar -->
      <header class="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 md:px-6">
        <div class="flex items-center gap-3">
          <button class="md:hidden text-stone-500 hover:text-charcoal focus:outline-none p-1 -ml-1 rounded-md" @click="isMobileMenuOpen = true">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="font-serif text-xl text-charcoal">
            {{ pageTitle }}
          </h1>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            target="_blank"
            class="text-sm text-sage hover:text-sage-400 transition-colors flex items-center gap-1"
          >
            View Site
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </NuxtLink>
        </div>
      </header>

      <!-- Page content -->
      <div class="flex-1 p-6 overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
