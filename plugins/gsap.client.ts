import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

export default defineNuxtPlugin(() => {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

  // Global animation defaults
  gsap.defaults({
    ease: 'power2.out',
    duration: 0.8,
  })

  // Smooth scroll to anchors
  const scrollToAnchor = (target: string) => {
    const element = document.querySelector(target)
    if (element) {
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: element, offsetY: 80 },
        ease: 'power3.inOut',
      })
    }
  }

  // Fade in animation helper
  const fadeIn = (element: Element | string, options: gsap.TweenVars = {}) => {
    return gsap.from(element, {
      opacity: 0,
      y: 30,
      ...options,
    })
  }

  // Stagger animation helper
  const staggerIn = (elements: Element[] | string, options: gsap.TweenVars = {}) => {
    return gsap.from(elements, {
      opacity: 0,
      y: 40,
      stagger: 0.1,
      ...options,
    })
  }

  // Scroll-triggered animation helper
  const scrollIn = (element: Element | string, options: gsap.TweenVars = {}) => {
    return gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
      opacity: 0,
      y: 40,
      ...options,
    })
  }

  // Parallax effect helper
  const parallax = (element: Element | string, speed: number = 0.5) => {
    gsap.to(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
      y: () => window.innerHeight * speed,
      ease: 'none',
    })
  }

  return {
    provide: {
      gsap,
      ScrollTrigger,
      gsapHelpers: {
        scrollToAnchor,
        fadeIn,
        staggerIn,
        scrollIn,
        parallax,
      },
    },
  }
})
