<script setup lang="ts">
useHead({
  title: 'Data Removal Request - Charleston Bonsai',
  meta: [
    { name: 'description', content: 'Request removal of your personal data from Charleston Bonsai. We will process your request within 30 days.' },
  ],
})

// Email assembled at runtime so it never appears as a plain string in source
const emailParts = ['curt.blanton', '@', 'gmail', '.', 'com']
const email = computed(() => emailParts.join(''))
const mailto = computed(() => `mailto:${email.value}?subject=Data%20Removal%20Request`)
</script>

<template>
  <div>
    <!-- Page Header -->
    <section class="bg-forest text-white section-padding">
      <div class="container-custom">
        <h1 class="font-serif text-4xl md:text-5xl mb-4">
          Data Removal Request
        </h1>
        <p class="text-white/70">
          Your privacy matters to us. We will process all removal requests within 30 days.
        </p>
      </div>
    </section>

    <!-- Content -->
    <section class="section-padding bg-white">
      <div class="container-custom max-w-3xl">
        <div class="space-y-8">
          <div>
            <h2 class="text-2xl font-serif text-charcoal mb-3">
              Your Right to Data Removal
            </h2>
            <p class="text-stone-600 leading-relaxed">
              You have the right to request that we delete any personal information we hold about you.
              This includes data collected through our website, social media interactions (including
              Facebook and Instagram), or any direct communications you have had with us.
            </p>
          </div>

          <div>
            <h2 class="text-2xl font-serif text-charcoal mb-3">
              What We Can Remove
            </h2>
            <ul class="list-disc pl-6 text-stone-600 space-y-2">
              <li>Your name, email address, and phone number if provided to us directly</li>
              <li>Any messages or correspondence you have sent us</li>
              <li>Records of any appointments or inquiries</li>
              <li>Any other personal data we hold in connection with your interactions with Charleston Bonsai</li>
            </ul>
            <p class="text-stone-600 leading-relaxed mt-4">
              Please note: we cannot remove data held by Meta (Facebook/Instagram) on their own platforms.
              For data held by Meta, please visit
              <a href="https://www.facebook.com/help/contact/540977946302970" target="_blank" rel="noopener noreferrer" class="text-forest hover:underline">
                Facebook's data removal page
              </a>.
            </p>
          </div>

          <div>
            <h2 class="text-2xl font-serif text-charcoal mb-3">
              How to Submit a Request
            </h2>
            <p class="text-stone-600 leading-relaxed mb-6">
              Send an email to the address below with the subject line <strong>"Data Removal Request"</strong>.
              Please include your full name and a description of the data you would like removed so we can
              locate your records. We will confirm receipt within 5 business days and complete the removal
              within 30 days.
            </p>

            <div class="p-8 bg-cream rounded-2xl text-center">
              <p class="text-stone-500 text-sm uppercase tracking-wide font-medium mb-3">
                Contact Us
              </p>
              <a
                :href="mailto"
                class="inline-flex items-center gap-3 text-forest font-semibold text-lg hover:text-forest-400 transition-colors"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {{ email }}
              </a>
              <p class="text-stone-400 text-sm mt-4">
                Subject: Data Removal Request
              </p>
            </div>
          </div>

          <div>
            <h2 class="text-2xl font-serif text-charcoal mb-3">
              What Happens Next
            </h2>
            <ol class="list-decimal pl-6 text-stone-600 space-y-3">
              <li>We will send you a confirmation email within <strong>5 business days</strong> acknowledging your request.</li>
              <li>We will locate and delete all personal data associated with you from our systems.</li>
              <li>We will send a final confirmation once the removal is complete, within <strong>30 days</strong> of your request.</li>
            </ol>
          </div>

          <div>
            <h2 class="text-2xl font-serif text-charcoal mb-3">
              Exceptions
            </h2>
            <p class="text-stone-600 leading-relaxed">
              In some cases we may be required to retain certain information to comply with legal obligations
              (such as tax or financial records). If this applies, we will inform you of what we are required
              to retain and why.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
