<template>
  <footer class="bg-forest text-white">
    <!-- Main Footer -->
    <div class="container-custom section-padding">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <!-- Brand -->
        <div class="lg:col-span-2">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <span class="text-3xl">🌲</span>
            </div>
            <div>
              <div class="font-serif text-xl font-semibold">
                Charleston Bonsai
              </div>
              <div class="text-sm text-white/60">
                Living Art Since 2024
              </div>
            </div>
          </div>
          <p class="text-white/70 max-w-md mb-6">
            Cultivating exceptional bonsai trees with patience, artistry, and dedication.
            Each tree is a unique piece of living art, nurtured to bring tranquility to your space.
          </p>
          <div class="flex gap-4">
            <a href="#" class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href="#" class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="#" class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.828.94z" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="font-serif text-lg font-semibold mb-4">
            Quick Links
          </h4>
          <ul class="space-y-3">
            <li>
              <NuxtLink to="/gallery" class="text-white/70 hover:text-white transition-colors">
                View Collection
              </NuxtLink>
            </li>
            <li>
              <a href="#about" class="text-white/70 hover:text-white transition-colors">
                Our Story
              </a>
            </li>
            <li>
              <a href="#contact" class="text-white/70 hover:text-white transition-colors">
                Contact Us
              </a>
            </li>
            <li>
              <NuxtLink to="/admin/login" class="text-white/70 hover:text-white transition-colors">
                Admin Login
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="font-serif text-lg font-semibold mb-4">
            Visit Us
          </h4>
          <address class="not-italic text-white/70 space-y-3">
            <p>
              123 Bonsai Lane<br>
              Charleston, SC 29401
            </p>
            <p>
              <a href="tel:+18435551234" class="hover:text-white transition-colors">
                (843) 555-1234
              </a>
            </p>
            <p>
              <a href="mailto:hello@charlestonbonsai.com" class="hover:text-white transition-colors">
                hello@charlestonbonsai.com
              </a>
            </p>
            <p class="text-sm">
              Open Daily: 9am - 6pm<br>
              By Appointment
            </p>
          </address>
        </div>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="border-t border-white/10">
      <div class="container-custom py-6">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-sm text-white/50">
            © {{ new Date().getFullYear() }} Charleston Bonsai. All rights reserved.
          </p>
          <div class="flex gap-6 text-sm text-white/50">
            <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
