<script setup lang="ts">
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/#about', label: 'About' },
  { to: '/#contact', label: 'Contact' },
]

// Handle scroll
onMounted(() => {
  const handleScroll = () => {
    scrolled.value = window.scrollY > 50
  }

  window.addEventListener('scroll', handleScroll)
  handleScroll() // Check initial state

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>

<template>
  <header
    ref="navbar"
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="scrolled ? 'bg-cream/95 backdrop-blur-md shadow-soft' : 'bg-transparent'"
  >
    <nav class="container-custom">
      <div class="flex items-center justify-between h-16">
        <!-- Logo — typographic monogram -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div
            class="w-9 h-9 border-2 flex items-center justify-center transition-all duration-300"
            :class="scrolled ? 'border-charcoal' : 'border-white/60'"
          >
            <span
              class="font-serif text-sm font-bold tracking-tight transition-colors duration-300"
              :class="scrolled ? 'text-charcoal' : 'text-white'"
            >CB</span>
          </div>
          <div>
            <div
              class="font-serif font-semibold text-sm transition-colors duration-300"
              :class="scrolled ? 'text-charcoal' : 'text-white'"
            >
              Charleston Bonsai
            </div>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-8">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-xs tracking-widest uppercase font-medium transition-colors duration-300 link-underline"
            :class="scrolled ? 'text-charcoal hover:text-forest' : 'text-white/90 hover:text-white'"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <!-- CTA Button -->
        <div v-if="route.path !== '/gallery'" class="hidden md:block">
          <NuxtLink
            to="/gallery"
            class="btn text-xs tracking-widest uppercase transition-all duration-300"
            :class="scrolled ? 'btn-primary' : 'bg-white text-forest hover:bg-cream'"
          >
            Explore Collection
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 rounded-lg transition-colors"
          :class="scrolled ? 'text-charcoal hover:bg-cream' : 'text-white hover:bg-white/10'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="!mobileMenuOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div
          v-if="mobileMenuOpen"
          class="md:hidden absolute top-full left-0 right-0 bg-cream/95 backdrop-blur-md shadow-soft-lg border-t border-stone-100"
        >
          <div class="container-custom py-4 space-y-4">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="block py-2 text-xs tracking-widest uppercase font-medium text-charcoal hover:text-forest transition-colors"
              @click="mobileMenuOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
            <NuxtLink
              v-if="route.path !== '/gallery'"
              to="/gallery"
              class="btn btn-primary w-full text-xs tracking-widest uppercase"
              @click="mobileMenuOpen = false"
            >
              Explore Collection
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>
