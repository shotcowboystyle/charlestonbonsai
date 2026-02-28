<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center">
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-forest via-forest-400 to-forest-500">
        <div class="absolute inset-0 bg-hero-pattern opacity-10" />
        <div class="absolute inset-0 bg-gradient-to-t from-forest-500/50 to-transparent" />
      </div>
      
      <!-- Content -->
      <div class="relative container-custom py-32 md:py-40">
        <div class="max-w-3xl">
          <h1 
            ref="heroTitle"
            class="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 leading-tight"
          >
            Cultivating Living Art in the Heart of Charleston
          </h1>
          <p 
            ref="heroSubtitle"
            class="text-lg md:text-xl text-white/80 mb-8 max-w-2xl"
          >
            Each bonsai in our collection represents years of patience, artistry, and dedication. 
            Discover your perfect companion in tranquility.
          </p>
          <div ref="heroCta" class="flex flex-wrap gap-4">
            <NuxtLink to="/gallery" class="btn bg-white text-forest hover:bg-cream">
              Explore Collection
            </NuxtLink>
            <a href="#about" class="btn border-2 border-white text-white hover:bg-white/10">
              Our Story
            </a>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg class="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>

    <!-- Featured Collection -->
    <section class="section-padding bg-cream">
      <div class="container-custom">
        <div class="text-center mb-12">
          <h2 ref="featuredTitle" class="section-heading">Featured Trees</h2>
          <p ref="featuredSubtitle" class="section-subheading mx-auto">
            Hand-selected specimens showcasing the finest in bonsai artistry
          </p>
        </div>

        <div v-if="pending" class="flex justify-center py-12">
          <UiLoadingSpinner />
        </div>

        <div v-else-if="featuredTrees?.length" ref="featuredGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <HomeFeaturedTreeCard
            v-for="tree in featuredTrees"
            :key="tree.id"
            :tree="tree"
          />
        </div>

        <div v-else class="text-center py-12 text-stone-500">
          <p>No featured trees available at the moment.</p>
        </div>

        <div class="text-center mt-12">
          <NuxtLink to="/gallery" class="btn btn-outline">
            View Full Collection
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section-padding bg-white">
      <div class="container-custom">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div ref="aboutImage" class="relative">
            <div class="aspect-[4/3] bg-gradient-to-br from-sage-100 to-cream rounded-2xl overflow-hidden">
              <img
                src="/images/hero/pattern.svg"
                alt="Bonsai cultivation"
                class="w-full h-full object-cover opacity-50"
              />
            </div>
            <div class="absolute -bottom-6 -right-6 w-48 h-48 bg-forest rounded-2xl -z-10" />
          </div>

          <div ref="aboutContent">
            <span class="text-sage font-medium tracking-wide uppercase text-sm">Our Story</span>
            <h2 class="section-heading mt-2">Where Art Meets Nature</h2>
            <div class="space-y-4 text-stone-600">
              <p>
                Charleston Bonsai was founded on a simple belief: that the ancient art of bonsai 
                can bring profound peace and beauty into modern life. What began as a personal 
                passion has grown into a curated collection of exceptional trees.
              </p>
              <p>
                Each specimen in our nursery has been carefully cultivated over years—some over 
                decades—to achieve the perfect balance of form, proportion, and natural beauty. 
                We believe every tree tells a story, and we're here to help you find one that 
                resonates with yours.
              </p>
              <p>
                Whether you're a seasoned collector or just beginning your bonsai journey, 
                we invite you to experience the meditative practice of caring for these 
                living sculptures.
              </p>
            </div>
            <div class="mt-8 flex gap-8">
              <div>
                <div class="text-3xl font-serif text-forest">15+</div>
                <div class="text-sm text-stone-500">Years Experience</div>
              </div>
              <div>
                <div class="text-3xl font-serif text-forest">200+</div>
                <div class="text-sm text-stone-500">Trees Cultivated</div>
              </div>
              <div>
                <div class="text-3xl font-serif text-forest">50+</div>
                <div class="text-sm text-stone-500">Species</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Care Levels -->
    <section class="section-padding bg-cream">
      <div class="container-custom">
        <div class="text-center mb-12">
          <h2 class="section-heading">Find Your Level</h2>
          <p class="section-subheading mx-auto">
            From beginner-friendly to expert challenges, we have trees for every skill level
          </p>
        </div>

        <div ref="careLevels" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="card p-6 text-center">
            <div class="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">🌱</span>
            </div>
            <h3 class="font-serif text-xl text-charcoal mb-2">Beginner</h3>
            <p class="text-stone-500 text-sm">
              Forgiving species that tolerate occasional neglect. Perfect for learning the basics.
            </p>
          </div>

          <div class="card p-6 text-center">
            <div class="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">🌿</span>
            </div>
            <h3 class="font-serif text-xl text-charcoal mb-2">Intermediate</h3>
            <p class="text-stone-500 text-sm">
              Requires consistent care and attention. Great for developing your skills.
            </p>
          </div>

          <div class="card p-6 text-center">
            <div class="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">🌳</span>
            </div>
            <h3 class="font-serif text-xl text-charcoal mb-2">Advanced</h3>
            <p class="text-stone-500 text-sm">
              Demands precision and experience. Rewarding for dedicated enthusiasts.
            </p>
          </div>

          <div class="card p-6 text-center">
            <div class="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">🌲</span>
            </div>
            <h3 class="font-serif text-xl text-charcoal mb-2">Expert</h3>
            <p class="text-stone-500 text-sm">
              Master-level specimens requiring specialized knowledge and care.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Location / Contact -->
    <section id="contact" class="section-padding bg-forest text-white">
      <div class="container-custom">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <span class="text-sage-200 font-medium tracking-wide uppercase text-sm">Visit Us</span>
            <h2 class="font-serif text-3xl md:text-4xl mt-2 mb-6">Our Nursery</h2>
            <p class="text-white/70 mb-8">
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
                  <div class="font-medium">Address</div>
                  <div class="text-white/60">123 Bonsai Lane, Charleston, SC 29401</div>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">Hours</div>
                  <div class="text-white/60">Open Daily: 9am - 6pm (By Appointment)</div>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">Contact</div>
                  <a href="mailto:hello@charlestonbonsai.com" class="text-white/60 hover:text-white transition-colors">
                    hello@charlestonbonsai.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Map placeholder -->
          <div class="bg-white/10 rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto">
            <div class="w-full h-full flex items-center justify-center text-white/40">
              <div class="text-center">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p class="text-sm">Map placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Meta tags
useHead({
  title: 'Charleston Bonsai Gallery - Premium Bonsai Trees',
  meta: [
    { 
      name: 'description', 
      content: 'Discover exceptional bonsai trees cultivated with care in Charleston. Each tree is a unique piece of living art, nurtured to bring tranquility to your space.' 
    },
  ],
})

// Fetch featured trees
const { data: featuredTrees, pending } = await useFetch('/api/trees/featured')

// GSAP animations
const { $gsap, ScrollTrigger } = useNuxtApp()

onMounted(() => {
  // Hero animations
  const tl = $gsap.timeline()
  
  tl.from('.section-heading', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out',
  })
  
  // Featured section
  $gsap.from('#about .grid > div', {
    scrollTrigger: {
      trigger: '#about',
      start: 'top 80%',
    },
    opacity: 0,
    y: 40,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power2.out',
  })
})
</script>
