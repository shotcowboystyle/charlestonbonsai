<script setup lang="ts">
definePageMeta({ layout: 'legal' })

const { siteName, siteDomain, contactEmail, contactMailto } = useSite()

useHead({
  title: `Privacy Policy — ${siteName}`,
  meta: [
    {
      name: 'description',
      content: `How ${siteName} collects, uses, and protects information from visitors to the catalog and from inquiries received by email or social media.`,
    },
  ],
})
</script>

<template>
  <header class="legal-masthead">
    <p class="legal-masthead__kicker">
      The legal · privacy
    </p>
    <h1 class="legal-masthead__title">
      Privacy Policy
    </h1>
    <p class="legal-masthead__subtitle">
      Last updated 19 April 2026
    </p>
  </header>

  <article class="legal-article">
    <section>
      <h2>
        <span class="legal-num">01</span>
        <span>Introduction</span>
      </h2>
      <p>
        {{ siteName }} (“we,” “us,” or “our”) operates the website at
        {{ siteDomain }} (the “Site”). This Privacy Policy explains how
        we collect, use, disclose, and safeguard information when you visit
        the Site or interact with our social-media pages on Facebook and
        Instagram. Please read it carefully. If you disagree with its terms,
        please discontinue use of the Site.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">02</span>
        <span>Information we collect</span>
      </h2>
      <h3>Information you provide to us</h3>
      <p>
        We may collect personal information you voluntarily provide when you:
      </p>
      <ul>
        <li>Contact us by email</li>
        <li>Submit an inquiry through the Site or our social-media pages</li>
        <li>Schedule an appointment to visit the nursery</li>
        <li>Make a purchase or inquire about a specific tree</li>
      </ul>
      <p>
        This may include your name, email address, phone number, and any
        message content you provide.
      </p>

      <h3>Automatically collected information</h3>
      <p>
        When you visit the Site, certain information may be collected
        automatically — your IP address, browser type, operating system,
        referring URL, and pages viewed — and used in aggregate to analyse
        usage and improve the experience.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">03</span>
        <span>Social media and Meta platforms</span>
      </h2>
      <p>
        We maintain business pages on Facebook and Instagram, both operated
        by Meta Platforms, Inc. When you interact with our pages on these
        platforms — by liking, commenting, or sending a message — Meta
        collects information about those interactions in accordance with
        their own privacy policies.
      </p>
      <p>
        We may use Meta’s business tools to:
      </p>
      <ul>
        <li>Post content and updates about our collection</li>
        <li>Respond to messages and comments from followers</li>
        <li>View insights and analytics about page performance</li>
        <li>Promote our work to relevant audiences</li>
      </ul>
      <p>
        Any personal data processed through Meta’s platforms is subject to
        <a href="https://www.facebook.com/policy" target="_blank" rel="noopener noreferrer">Meta’s Privacy Policy</a>.
        We do not control, and are not responsible for, Meta’s data-collection
        or processing practices.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">04</span>
        <span>How we use your information</span>
      </h2>
      <p>
        We use the information we collect to:
      </p>
      <ul>
        <li>Respond to your inquiries and provide assistance</li>
        <li>Schedule appointments and process transactions</li>
        <li>Send updates about the collection or events, if you have opted in</li>
        <li>Operate, maintain, and improve the Site and our social-media presence</li>
        <li>Comply with applicable laws and legal obligations</li>
      </ul>
    </section>

    <section>
      <h2>
        <span class="legal-num">05</span>
        <span>Sharing of information</span>
      </h2>
      <p>
        We do not sell, trade, or otherwise transfer your personal information
        to third parties, except in the following limited circumstances:
      </p>
      <ul>
        <li><strong>Service providers</strong> — we may share information with trusted third-party service providers who assist us in operating the Site or our business, under strict confidentiality obligations.</li>
        <li><strong>Legal requirements</strong> — we may disclose information when required by law, court order, or governmental authority.</li>
        <li><strong>Business transfers</strong> — in the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
      </ul>
    </section>

    <section>
      <h2>
        <span class="legal-num">06</span>
        <span>Cookies and tracking technologies</span>
      </h2>
      <p>
        The Site may use cookies and similar tracking technologies to
        enhance your browsing experience and analyse traffic. You may
        configure your browser to refuse cookies; however, some features
        of the Site may not function properly as a result.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">07</span>
        <span>Data security</span>
      </h2>
      <p>
        We implement reasonable technical and organisational measures to
        protect your personal information from unauthorised access,
        disclosure, alteration, or destruction. No method of transmission
        over the internet or electronic storage is entirely secure, however,
        and we cannot guarantee absolute security.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">08</span>
        <span>Third-party links</span>
      </h2>
      <p>
        The Site may contain links to third-party websites. We are not
        responsible for the privacy practices or content of those sites.
        We encourage you to review the privacy policies of any third-party
        sites you visit.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">09</span>
        <span>Children’s privacy</span>
      </h2>
      <p>
        The Site is not directed to children under the age of 13. We do not
        knowingly collect personal information from children under 13. If
        you believe we have inadvertently collected such information,
        please contact us so we can delete it.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">10</span>
        <span>Your rights</span>
      </h2>
      <p>
        Depending on your location, you may have certain rights with
        respect to your personal information, including the right to:
      </p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your personal information</li>
        <li>Opt out of marketing communications at any time</li>
      </ul>
      <p>
        To exercise any of these rights, please write to us at the address below.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">11</span>
        <span>Changes to this policy</span>
      </h2>
      <p>
        We may update this Privacy Policy from time to time. We will note
        any material changes by updating the “Last updated” date at the top
        of this page. Your continued use of the Site after any changes
        constitutes your acceptance of the revised policy.
      </p>
    </section>

    <section>
      <h2>
        <span class="legal-num">12</span>
        <span>Write to us</span>
      </h2>
      <p>
        Questions about this Privacy Policy or our data practices? Write to:
      </p>

      <div class="legal-contact">
        <p class="legal-contact__name">
          {{ siteName }}
        </p>
        <dl>
          <dt>By post</dt>
          <dd>
            943 Godber Street<br>
            Charleston, SC 29412
          </dd>
          <dt>By email</dt>
          <dd>
            <a :href="contactMailto">{{ contactEmail }}</a>
          </dd>
        </dl>
      </div>
    </section>
  </article>
</template>
