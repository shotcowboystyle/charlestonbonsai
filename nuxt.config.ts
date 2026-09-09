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
  ],

  // Tailwind v4 ships as a Vite plugin; the theme lives in the CSS entry
  // (assets/css/main.css), not in a tailwind.config.ts.
  css: ['~/assets/css/main.css'],

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
      siteDomain: process.env.SITE_DOMAIN || 'charlestonbonsai.com',
    },
  },

  app: {
    head: {
      title: `${process.env.SITE_NAME || 'Charleston Bonsai'} Gallery`,
      meta: [
        { name: 'description', content: `Premium bonsai trees cultivated with care. Explore the ${process.env.SITE_NAME || 'Charleston Bonsai'} collection of living art.` },
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

    // Don't prerender API routes
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      ignore: ['/api'],
    },
  },
})
