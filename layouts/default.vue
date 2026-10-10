<script setup lang="ts">
const route = useRoute()

// Smooth scroll to in-page anchors, clearing the fixed header.
function scrollToHash(hash: string) {
  const target = document.querySelector(hash)
  if (!target)
    return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY - 80,
    behavior: reduceMotion ? 'auto' : 'smooth',
  })
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
      scrollToHash(anchor.getAttribute('href') as string)
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
    <main id="main-content" class="flex-grow" tabindex="-1">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
