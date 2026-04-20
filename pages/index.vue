<script setup lang="ts">
// Meta tags
useHead({
  title: 'Charleston Bonsai Gallery - Premium Bonsai Trees',
  meta: [
    {
      name: 'description',
      content: 'Discover exceptional bonsai trees cultivated with care in Charleston. Each tree is a unique piece of living art, nurtured to bring tranquility to your space.',
    },
  ],
})

// Care levels data
const careLevels = [
  {
    name: 'Beginner',
    number: '01',
    description: 'Forgiving species that tolerate occasional neglect. Perfect for learning the basics.',
  },
  {
    name: 'Intermediate',
    number: '02',
    description: 'Requires consistent care and attention. Great for developing your skills.',
  },
  {
    name: 'Advanced',
    number: '03',
    description: 'Demands precision and experience. Rewarding for dedicated enthusiasts.',
  },
  {
    name: 'Expert',
    number: '04',
    description: 'Master-level specimens requiring specialized knowledge and care.',
  },
]

// Fetch featured trees
const { data: featuredTrees, pending } = await useFetch('/api/trees/featured')

// GSAP animations
const { $gsap, ScrollTrigger: _scrollTrigger } = useNuxtApp()

onMounted(() => {
  // Hero timeline
  const heroTl = $gsap.timeline()

  heroTl
    .to(heroLabel.value, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
    .to('.section-heading', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
    }, '-=0.2')
    .to(heroSubtitle.value, {
      opacity: 1,
      y: 0,
      duration: 0.6,
    }, '-=0.4')
    .to(heroCta.value, {
      opacity: 1,
      y: 0,
      duration: 0.6,
    }, '-=0.3')
    .to(scrollIndicator.value, {
      opacity: 1,
      duration: 0.5,
    }, '-=0.2')

  // Featured section
  const featuredTl = $gsap.timeline({
    scrollTrigger: {
      trigger: '.section-padding',
      start: 'top 70%',
    },
  })

  featuredTl
    .to(featuredTitle.value, { opacity: 1, y: 0, duration: 0.6 })
    .to(featuredSubtitle.value, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
    .to('#featuredGrid .card', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.15,
    }, '-=0.3')
    .to(featuredCta.value, { opacity: 1, duration: 0.5 }, '-=0.2')

  // About section
  $gsap.timeline({
    scrollTrigger: {
      trigger: '#about',
      start: 'top 60%',
    },
  })
    .to(aboutImage.value, { opacity: 1, x: 0, duration: 0.8 })
    .to(aboutContent.value, { opacity: 1, x: 0, duration: 0.8 }, '-=0.5')
    .to('#stats > div', { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, '-=0.3')

  // Care levels
  $gsap.timeline({
    scrollTrigger: {
      trigger: careTitle.value,
      start: 'top 70%',
    },
  })
    .to(careTitle.value, { opacity: 1, duration: 0.6 })
    .to(careSubtitle.value, { opacity: 1, duration: 0.6 }, '-=0.3')
    .to('#careGrid .card', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
    }, '-=0.3')

  // Contact section
  $gsap.to(contactContent.value, {
    scrollTrigger: {
      trigger: '#contact',
      start: 'top 60%',
    },
    opacity: 1,
    x: 0,
    duration: 0.8,
  })

  $gsap.to(contactMap.value, {
    scrollTrigger: {
      trigger: '#contact',
      start: 'top 60%',
    },
    opacity: 1,
    x: 0,
    duration: 0.8,
    delay: 0.2,
  })
})

// Template refs
const heroLabel = ref<HTMLElement | null>(null)
const heroTitle = ref<HTMLElement | null>(null)
const heroSubtitle = ref<HTMLElement | null>(null)
const heroCta = ref<HTMLElement | null>(null)
const scrollIndicator = ref<HTMLElement | null>(null)

const featuredTitle = ref<HTMLElement | null>(null)
const featuredSubtitle = ref<HTMLElement | null>(null)
const featuredGrid = ref<HTMLElement | null>(null)
const featuredCta = ref<HTMLElement | null>(null)

const aboutImage = ref<HTMLElement | null>(null)
const aboutContent = ref<HTMLElement | null>(null)
const stats = ref<HTMLElement | null>(null)

const careTitle = ref<HTMLElement | null>(null)
const careSubtitle = ref<HTMLElement | null>(null)
const careGrid = ref<HTMLElement | null>(null)

const contactContent = ref<HTMLElement | null>(null)
const contactMap = ref<HTMLElement | null>(null)
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-screen flex flex-col justify-end grain-overlay">
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-forest-500 via-forest to-charcoal">
        <div class="absolute inset-0 bg-hero-pattern opacity-5" />
      </div>

      <!-- Content -->
      <div class="relative px-6 sm:px-10 lg:px-16 pb-16 md:pb-24">
        <div class="max-w-5xl">
          <span
            ref="heroLabel"
            class="inline-block text-xs tracking-[0.3em] uppercase text-white/50 mb-6 opacity-0"
          >
            Charleston, South Carolina
          </span>
          <h1
            ref="heroTitle"
            class="display-text text-white mb-8 opacity-0"
          >
            Cultivating<br>Living<br>Art.
          </h1>
          <div class="w-16 h-px bg-white/30 mb-8" />
          <p
            ref="heroSubtitle"
            class="text-lg md:text-xl text-white/60 mb-10 max-w-lg opacity-0"
          >
            Each bonsai in our collection represents years of patience, artistry, and dedication.
          </p>
          <div ref="heroCta" class="flex flex-wrap gap-6 opacity-0">
            <NuxtLink to="/gallery" class="btn bg-white text-forest hover:bg-cream text-sm uppercase tracking-[0.15em] px-8 py-4">
              Explore Collection
            </NuxtLink>
            <a href="#about" class="btn border border-white/30 text-white/80 hover:text-white hover:border-white/60 text-sm uppercase tracking-[0.15em] px-8 py-4">
              Learn More
            </a>
          </div>
        </div>
      </div>

      <!-- Scroll indicator — vertical text on right -->
      <div ref="scrollIndicator" class="absolute bottom-8 right-8 opacity-0 hidden md:flex flex-col items-center gap-3">
        <span class="text-xs tracking-[0.2em] uppercase text-white/40" style="writing-mode: vertical-lr;">Scroll</span>
        <div class="w-px h-8 bg-white/20" />
      </div>
    </section>

    <!-- Featured Collection -->
    <section class="section-padding bg-cream">
      <div class="px-6 sm:px-10 lg:px-16">
        <!-- Header: left-aligned with subtitle at opposite end -->
        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16">
          <div>
            <span class="text-xs tracking-[0.3em] uppercase text-sage mb-4 block">Selected Works</span>
            <h2 ref="featuredTitle" class="section-heading opacity-0">
              Featured<br>Trees
            </h2>
          </div>
          <p ref="featuredSubtitle" class="section-subheading lg:text-right lg:max-w-sm opacity-0 mt-4 lg:mt-0">
            Hand-selected specimens showcasing the finest in bonsai artistry
          </p>
        </div>

        <div v-if="pending" class="flex justify-center py-12">
          <UiLoadingSpinner />
        </div>

        <div v-else-if="featuredTrees?.length" id="featuredGrid" ref="featuredGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <HomeFeaturedTreeCard
            v-for="(tree, index) in featuredTrees"
            :key="tree.id"
            :tree="tree"
            class="opacity-0"
            :style="{ '--stagger-index': index }"
          />
        </div>

        <div v-else class="text-center py-12 text-stone-500">
          <p>No featured trees available at the moment.</p>
        </div>

        <div ref="featuredCta" class="text-center mt-16 opacity-0">
          <NuxtLink to="/gallery" class="btn btn-outline group text-sm uppercase tracking-[0.15em]">
            View Full Collection
            <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- About Section — Dark editorial -->
    <section id="about" class="section-padding bg-charcoal text-white relative overflow-hidden">
      <!-- Decorative symbol -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.03] font-serif select-none pointer-events-none" style="font-size: 30vw;">
        ∞
      </div>

      <div class="relative px-6 sm:px-10 lg:px-16">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div ref="aboutImage" class="relative opacity-0">
            <div class="aspect-[4/5] bg-gradient-to-br from-forest-300 to-forest rounded-lg overflow-hidden grain-overlay">
              <img
                src="/images/hero/pattern.svg"
                alt="Bonsai cultivation"
                class="w-full h-full object-cover opacity-30"
              >
            </div>
            <div class="absolute -bottom-4 -right-4 w-32 h-32 bg-bark rounded-lg -z-10" />
          </div>

          <div ref="aboutContent" class="opacity-0">
            <span class="text-xs tracking-[0.3em] uppercase text-sage-200 mb-4 block">Our Story</span>
            <h2 class="section-heading text-white mt-2">
              Where Art<br>Meets Nature
            </h2>
            <div class="space-y-4 text-white/60 mt-6">
              <p>
                Charleston Bonsai was founded on a simple belief: that the ancient art of bonsai
                can bring profound peace and beauty into modern life. What began as a personal
                passion has grown into a curated collection of exceptional trees.
              </p>
              <p>
                Each specimen in our nursery has been carefully cultivated over years—some over
                decades—to achieve the perfect balance of form, proportion, and natural beauty.
              </p>
              <p>
                Whether you're a seasoned collector or just beginning your bonsai journey,
                we invite you to experience the meditative practice of caring for these
                living sculptures.
              </p>
            </div>
            <div id="stats" ref="stats" class="mt-10 grid grid-cols-3 gap-0">
              <div class="opacity-0 border-t border-white/10 pt-6">
                <div class="text-5xl font-serif text-white tracking-tight">
                  15+
                </div>
                <div class="text-xs tracking-[0.2em] uppercase text-white/40 mt-2">
                  Years Experience
                </div>
              </div>
              <div class="opacity-0 border-t border-white/10 pt-6">
                <div class="text-5xl font-serif text-white tracking-tight">
                  200+
                </div>
                <div class="text-xs tracking-[0.2em] uppercase text-white/40 mt-2">
                  Trees Cultivated
                </div>
              </div>
              <div class="opacity-0 border-t border-white/10 pt-6">
                <div class="text-5xl font-serif text-white tracking-tight">
                  50+
                </div>
                <div class="text-xs tracking-[0.2em] uppercase text-white/40 mt-2">
                  Species
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Care Levels — Numbered editorial list -->
    <section class="section-padding bg-cream">
      <div class="px-6 sm:px-10 lg:px-16">
        <div class="mb-12">
          <span class="text-xs tracking-[0.3em] uppercase text-sage mb-4 block">Skill Levels</span>
          <h2 ref="careTitle" class="section-heading opacity-0">
            Find Your<br>Level
          </h2>
          <p ref="careSubtitle" class="section-subheading mt-4 opacity-0">
            From beginner-friendly to expert challenges, we have trees for every skill level
          </p>
        </div>

        <div id="careGrid" ref="careGrid" class="divide-y divide-stone-200">
          <div
            v-for="level in careLevels"
            :key="level.name"
            class="card group flex items-center gap-6 md:gap-10 py-6 md:py-8 opacity-0 !bg-transparent !shadow-none !rounded-none hover:!translate-y-0 hover:!shadow-none"
          >
            <span class="text-sm font-sans text-stone-300 tracking-wide w-8 flex-shrink-0">
              {{ level.number }}
            </span>
            <h3 class="font-serif text-xl md:text-2xl text-charcoal min-w-[140px]">
              {{ level.name }}
            </h3>
            <p class="text-stone-500 text-sm flex-1 hidden md:block">
              {{ level.description }}
            </p>
            <svg class="w-5 h-5 text-stone-300 group-hover:text-forest group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- Location / Contact — Typographic weight -->
    <section id="contact" class="section-padding bg-forest text-white relative overflow-hidden grain-overlay">
      <!-- Decorative text -->
      <div class="absolute top-1/2 right-0 -translate-y-1/2 text-white/[0.03] font-serif select-none pointer-events-none" style="font-size: 20vw; line-height: 1;">
        Visit
      </div>

      <div class="relative px-6 sm:px-10 lg:px-16">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div ref="contactContent" class="opacity-0">
            <span class="text-xs tracking-[0.3em] uppercase text-sage-200 mb-4 block">Find Us</span>
            <h2 class="font-serif text-5xl md:text-6xl tracking-tight leading-none mt-2 mb-8">
              Our Nursery
            </h2>
            <p class="text-white/50 mb-10 max-w-md">
              Experience our collection in person. Schedule a visit to stroll through
              our gardens and find your perfect bonsai companion.
            </p>

            <div class="space-y-6">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">
                    Address
                  </div>
                  <div class="text-white/50">
                    123 Bonsai Lane, Charleston, SC 29401
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">
                    Hours
                  </div>
                  <div class="text-white/50">
                    Open Daily: 9am - 6pm (By Appointment)
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">
                    Contact
                  </div>
                  <a href="mailto:hello@charlestonbonsai.com" class="text-white/50 hover:text-white transition-colors">
                    hello@charlestonbonsai.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Map placeholder -->
          <div ref="contactMap" class="bg-white/5 border border-white/10 rounded-lg overflow-hidden aspect-[4/3] lg:aspect-auto opacity-0">
            <div class="w-full h-full min-h-[300px] flex items-center justify-center text-white/30">
              <div class="text-center">
                <svg class="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p class="text-xs tracking-[0.2em] uppercase">
                  Map Coming Soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
