<template>
  <header
    ref="navbar"
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="scrolled ? 'bg-white/95 backdrop-blur-md shadow-soft' : 'bg-transparent'"
  >
    <nav class="container-custom">
      <div class="flex items-center justify-between h-20">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div 
            class="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
            :class="scrolled ? 'bg-forest' : 'bg-white/20 backdrop-blur-sm'"
          >
            <span class="text-2xl">🌲</span>
          </div>
          <div>
            <div 
              class="font-serif font-semibold transition-colors duration-300"
              :class="scrolled ? 'text-charcoal' : 'text-white'"
            >
              Charleston Bonsai
            </div>
            <div 
              class="text-xs transition-colors duration-300"
              :class="scrolled ? 'text-stone-500' : 'text-white/70'"
            >
              Living Art
            </div>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-8">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="font-medium transition-colors duration-300 link-underline"
            :class="scrolled ? 'text-charcoal hover:text-forest' : 'text-white/90 hover:text-white'"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <!-- CTA Button -->
        <div class="hidden md:block">
          <NuxtLink
            to="/gallery"
            class="btn transition-all duration-300"
            :class="scrolled ? 'btn-primary' : 'bg-white text-forest hover:bg-cream'"
          >
            Explore Collection
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-lg transition-colors"
          :class="scrolled ? 'text-charcoal hover:bg-cream' : 'text-white hover:bg-white/10'"
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
          class="md:hidden absolute top-full left-0 right-0 bg-white shadow-soft-lg border-t border-stone-100"
        >
          <div class="container-custom py-4 space-y-4">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="block py-2 font-medium text-charcoal hover:text-forest transition-colors"
              @click="mobileMenuOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
            <NuxtLink
              to="/gallery"
              class="btn btn-primary w-full"
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
