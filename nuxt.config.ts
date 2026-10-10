import { isBuiltin } from 'node:module'
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-08-05',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxtjs/partytown',
    '@nuxt/fonts',
  ],

  // Self-hosted from /_fonts/ at build: no render-blocking third-party CSS.
  // Sumi-e atelier type system. Cardo (Renaissance-revival serif with
  // small-caps and oldstyle figures) pairs with Albert Sans (restrained
  // humanist body). Yuji Syuku brushes the kanji on the home page.
  fonts: {
    defaults: { weights: [400], styles: ['normal'] },
    families: [
      { name: 'Cardo', provider: 'google', weights: [400, 700], styles: ['normal', 'italic'] },
      { name: 'Albert Sans', provider: 'google', weights: [300, 400, 500, 600, 700] },
      { name: 'Yuji Syuku', provider: 'google' },
    ],
  },

  // GA4 runs in a Partytown web worker (see plugins/gtag.ts) so gtag.js stays
  // off the main thread. `forward` stubs these on window and relays calls in.
  partytown: {
    forward: ['dataLayer.push', 'gtag'],
  },

  // Tailwind v4 ships as a Vite plugin; the theme lives in the CSS entry
  // (assets/css/main.css), not in a tailwind.config.ts.
  css: ['~/assets/css/main.css'],

  // Agent skill folders hold tens of thousands of files; watching them makes
  // `nuxt dev` fail with EMFILE. Merged with Nuxt's default ignore list.
  ignore: ['.claude', '.agents'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    // Server-side only
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    adminEmail: process.env.ADMIN_EMAIL || 'curt.blanton@gmail.com',
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
    jwtSecret: process.env.JWT_SECRET || '',

    // Public (exposed to client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://xhderhlscsreyylyucvb.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_ERYNxpVpCDlF17CT_VwCgg_ogPIzCg7',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      siteName: process.env.SITE_NAME || 'Charleston Bonsai',
      siteDomain: process.env.SITE_DOMAIN || 'charlestonbonsaico.com',
      // Set via NUXT_PUBLIC_GA_MEASUREMENT_ID. Empty disables analytics.
      gaMeasurementId: '',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: `${process.env.SITE_NAME || 'Charleston Bonsai'} Gallery`,
      meta: [
        { name: 'description', content: `Premium bonsai trees cultivated with care. Explore the ${process.env.SITE_NAME || 'Charleston Bonsai'} collection of living art.` },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { charset: 'utf-8' },
        { name: 'theme-color', content: '#F4F0E7' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      script: [
        // Pre-paint theme bootstrap. Runs synchronously in <head> before
        // first paint to set data-theme on <html>, avoiding a flash on
        // initial render. The composable useTheme owns runtime state;
        // this only handles the very first paint.
        {
          tagPosition: 'head',
          innerHTML: `(function(){try{var t=localStorage.getItem('cb-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`,
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  routeRules: {
    // robots.txt disallows crawling /admin; this keeps any linked admin URL
    // out of the index too.
    '/admin/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },

    // Pages that read the trees table are cached (ISR on Vercel) and refresh
    // every 10 minutes, so catalog edits, sales and slug changes reach the
    // live site without a redeploy. Prerendering them froze a build-time
    // snapshot: retired slugs kept serving 200 with stale content.
    '/': { isr: 600 },
    '/gallery': { isr: 600 },
    '/gallery/**': { isr: 600 },

    // Slugs renamed in the October 2026 catalog cleanup. Permanent redirects
    // carry over links and search history from the old URLs.
    ...Object.fromEntries(Object.entries({
      'ficus-retusa': 'lagerstroemia-indica',
      'ficus-ginseng': 'ligustrum',
      'cedar-of-lebanon': 'chloroleucon-tortum',
      'trident-maple-forest': 'taxodium-distichum-forest',
      'bamboo-leaf-ficus': 'planera-aquatica',
    }).map(([from, to]) => [`/gallery/${from}`, { redirect: { to: `/gallery/${to}`, statusCode: 301 } }])),
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  typescript: {
    strict: true,
    // vite-plugin-checker's vue-tsc checker patches `typescript/lib/typescript.js`,
    // which TypeScript 7 no longer ships — it throws on every dev boot. Type
    // checking still runs out-of-band via `pnpm run typecheck`.
    typeCheck: false,
  },

  // Configure Nitro for server API routes
  nitro: {
    // Precompressed .br/.gz copies of public assets and prerendered pages, so
    // the node server (and `pnpm lighthouse:*`) serves them compressed.
    compressPublicAssets: true,

    // Nitro treats node builtins as ESM externals, and its default
    // `requireReturnsDefault: 'auto'` then resolves `require('stream')` to the
    // module *namespace* rather than the CJS module object. Bundled CJS
    // dependencies that subclass a builtin break on boot:
    //   jws:     util.inherits(DataStream, Stream)
    //            -> 'The "superCtor.prototype" property must be of type object'
    //   undici:  class Dispatcher extends EventEmitter
    //            -> 'Class extends value [object Module] is not a constructor'
    //
    // 'preferred' hands back the default export, which for a builtin is what
    // `require()` returns. Scoped to builtins on purpose — applying it globally
    // breaks packages that do want the namespace (e.g. `require('zod').z`).
    commonJS: {
      requireReturnsDefault: (id: string) => (isBuiltin(id) ? 'preferred' : 'auto'),
    },

    // Only pages with no database content are prerendered. Catalog pages
    // use ISR (see routeRules) so they track the trees table.
    prerender: {
      routes: ['/visit', '/events', '/retreats', '/privacy-policy', '/terms-of-service', '/data-removal'],
    },
  },
})
