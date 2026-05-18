// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-08-05',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  runtimeConfig: {
    // Server-side only
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    adminEmail: process.env.ADMIN_EMAIL || 'curt.blanton@gmail.com',
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',

    // Public (exposed to client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://xhderhlscsreyylyucvb.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_ERYNxpVpCDlF17CT_VwCgg_ogPIzCg7',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    },
  },

  app: {
    head: {
      title: 'Charleston Bonsai Gallery',
      meta: [
        { name: 'description', content: 'Premium bonsai trees cultivated with care in Charleston. Explore our curated collection of living art.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { charset: 'utf-8' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        // Sumi-e atelier type system. Cardo (Renaissance-revival serif with
        // small-caps and oldstyle figures) pairs with Albert Sans (restrained
        // humanist body). Legacy Playfair + Outfit families are retired with
        // the design reset (see .impeccable.md).
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&family=Albert+Sans:wght@300;400;500;600;700&display=swap' },
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

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Configure Nitro for server API routes
  nitro: {
    // Don't prerender API routes
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      ignore: ['/api'],
    },
  },
})
