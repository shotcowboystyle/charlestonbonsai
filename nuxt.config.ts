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
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap' },
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
