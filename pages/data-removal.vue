<script setup lang="ts">
definePageMeta({ layout: 'legal' })

const { siteName } = useSite()

useHead({
  title: `Data Removal — ${siteName}`,
  meta: [
    {
      name: 'description',
      content: `Request removal of your personal information from ${siteName}. We confirm within 5 business days and complete the removal within 30 days.`,
    },
  ],
})

// Email assembled at runtime so it never appears as a plain string in source.
const emailParts = ['curt.blanton', '@', 'gmail', '.', 'com']
const email = computed(() => emailParts.join(''))
const mailto = computed(() => `mailto:${email.value}?subject=Data%20Removal%20Request`)
</script>

<template>
  <header class="legal-masthead">
    <p class="legal-masthead__kicker">
      The legal · data removal
    </p>
    <h1 class="legal-masthead__title">
      Data Removal
    </h1>
    <p class="legal-masthead__subtitle">
      We confirm within 5 business days and complete the removal within 30 days.
    </p>
  </header>

  <article class="legal-article">
    <section>
      <h2>
        <span class="legal-num">01</span>
        <span>Your right to removal</span>
      </h2>
      <p>
        You may ask us to delete any personal information we hold about
        you. This includes data collected through the website, through
        social-media interactions on Facebook or Instagram, or through any
        direct correspondence you have had with us.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">02</span>
        <span>What we can remove</span>
      </h2>
      <ul>
        <li>Your name, email address, and phone number if you provided them to us directly</li>
        <li>Any messages or correspondence you have sent us</li>
        <li>Records of any appointments or inquiries</li>
        <li>Any other personal data we hold in connection with your interactions with {{ siteName }}</li>
      </ul>
      <p>
        Note that we cannot remove data held by Meta (Facebook or Instagram)
        on their own platforms. For data held by Meta, please visit
        <a href="https://www.facebook.com/help/contact/540977946302970" target="_blank" rel="noopener noreferrer">Facebook’s data-removal page</a>.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">03</span>
        <span>How to submit a request</span>
      </h2>
      <p>
        Send an email to the address below with the subject line
        <strong>“Data Removal Request”</strong>. Please include your full
        name and a description of the data you would like removed so we can
        locate your records.
      </p>

      <div class="legal-callout">
        <p class="legal-callout__eyebrow">
          Write to
        </p>
        <a :href="mailto" class="legal-callout__action">
          {{ email }}
        </a>
        <p class="legal-callout__hint">
          Subject · Data Removal Request
        </p>
      </div>
    </section>

    <section>
      <h2>
        <span class="legal-num">04</span>
        <span>What happens next</span>
      </h2>
      <ol>
        <li>We confirm receipt within <strong>5 business days</strong>.</li>
        <li>We locate and delete all personal data associated with you from our systems.</li>
        <li>We send a final confirmation once removal is complete, within <strong>30 days</strong> of your request.</li>
      </ol>
    </section>

    <section>
      <h2>
        <span class="legal-num">05</span>
        <span>Exceptions</span>
      </h2>
      <p>
        In some cases we may be required to retain certain information to
        comply with legal obligations — such as tax or financial records.
        If this applies, we will tell you what we are required to retain
        and why.
      </p>
    </section>
  </article>
</template>
