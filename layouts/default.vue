<script setup lang="ts">
// Initialize GSAP on client
const { $gsap } = useNuxtApp()

onMounted(() => {
  // Smooth scroll behavior for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute('href') as string)
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
