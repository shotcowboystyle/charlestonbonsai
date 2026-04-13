<script setup lang="ts">
// Initialize GSAP on client
const { $gsap } = useNuxtApp()
const route = useRoute()

function scrollToHash(hash: string) {
  const target = document.querySelector(hash)
  if (target) {
    $gsap.to(window, {
      duration: 0.8,
      scrollTo: { y: target, offsetY: 80 },
      ease: 'power2.inOut',
    })
  }
}

onMounted(() => {
  // Handle anchor hash on initial page load (e.g. navigating from /gallery to /#about)
  if (route.hash) {
    nextTick(() => scrollToHash(route.hash))
  }

  // Smooth scroll behavior for bare anchor links (href="#section")
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault()
      const hash = anchor.getAttribute('href') as string
      const target = document.querySelector(hash)
      if (target) {
        $gsap.to(window, {
          duration: 0.8,
          scrollTo: { y: target, offsetY: 80 },
          ease: 'power2.inOut',
        })
      }
    })
  })
})

// Also handle when navigating to a hash route within the SPA
watch(() => route.hash, (hash) => {
  if (hash) {
    nextTick(() => scrollToHash(hash))
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <LayoutNavbar />
    <main class="flex-grow">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
