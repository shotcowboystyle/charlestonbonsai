import type { Directive, DirectiveBinding } from 'vue'

declare module '#app' {
  interface NuxtApp {
    $gsap: any
    $ScrollTrigger: any
  }
}

// GSAP Fade Up directive
export const vGsapFadeUp: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { $gsap } = useNuxtApp()
    
    $gsap.from(el, {
      y: binding.value?.y || 30,
      opacity: 0,
      duration: binding.value?.duration || 0.8,
      delay: binding.value?.delay || 0,
      ease: binding.value?.ease || 'power2.out',
    })
  },
}

// GSAP Scroll Trigger directive
export const vGsapScroll: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { $gsap, $ScrollTrigger } = useNuxtApp()
    
    $gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: binding.value?.start || 'top 80%',
        end: binding.value?.end || 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
      y: binding.value?.y || 40,
      opacity: 0,
      duration: binding.value?.duration || 0.8,
      stagger: binding.value?.stagger || 0,
      ease: binding.value?.ease || 'power2.out',
    })
  },
}

// GSAP Stagger directive (for groups of elements)
export const vGsapStagger: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { $gsap, $ScrollTrigger } = useNuxtApp()
    
    const children = el.children
    if (!children.length) return
    
    $gsap.from(children, {
      scrollTrigger: {
        trigger: el,
        start: binding.value?.start || 'top 80%',
      },
      y: binding.value?.y || 30,
      opacity: 0,
      duration: binding.value?.duration || 0.6,
      stagger: binding.value?.stagger || 0.1,
      ease: binding.value?.ease || 'power2.out',
    })
  },
}

// Export as Nuxt plugin
export default defineNuxtPlugin((nuxtApp) => {
  // Register GSAP plugins
  const gsap = nuxtApp.$gsap
  const ScrollTrigger = nuxtApp.$ScrollTrigger
  
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger)
  }
})
