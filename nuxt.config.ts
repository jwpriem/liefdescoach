// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // SEO: Site-wide head configuration
  app: {
    head: {
      htmlAttrs: { lang: 'nl' },
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'geo.region', content: 'NL-ZH' },
        { name: 'geo.placename', content: 'Rotterdam' },
        { name: 'geo.position', content: '51.9683092;4.5884189' },
        { name: 'ICBM', content: '51.9683092, 4.5884189' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Yoga Ravennah' },
        { name: 'theme-color', content: '#030712' },
      ],
      // GTM script (replaces @zadigetvoltaire/nuxt-gtm)
      script: [
        {
          innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PZP28PP');`,
          type: 'text/javascript'
        }
      ],
      noscript: [
        {
          innerHTML: '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PZP28PP" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
          tagPosition: 'bodyOpen'
        }
      ]
    }
  },

  runtimeConfig: {
    // Private keys are only available on the server
    databaseUrl: '',            // NUXT_DATABASE_URL (Neon PostgreSQL)
    cronSecret: '',             // NUXT_CRON_SECRET
    revenuePerBooking: '14',   // NUXT_REVENUE_PER_BOOKING
    costPerLesson: '35',       // NUXT_COST_PER_LESSON
    sessionSecret: '',         // NUXT_SESSION_SECRET (for signing session cookies)
    vapidPrivateKey: '',       // NUXT_VAPID_PRIVATE_KEY (Web Push VAPID private key)
    vapidEmail: '',            // NUXT_VAPID_EMAIL (e.g. mailto:info@ravennah.com)
    // Public keys that are exposed to the client
    public: {
      vapidPublicKey: '',         // NUXT_PUBLIC_VAPID_PUBLIC_KEY (Web Push VAPID public key)
      mailPass: '',
      mailPassDev: ''
    }
  },

  devServer: {
    port: 3000,
    host: 'localhost'
  },

  // Plugins to run before rendering page
  plugins: [
    '~/plugins/rav',
    '~/plugins/ios26-history-patch.client',
  ],

  modules: [
    '@nuxt/fonts',
    'dayjs-nuxt',
    '@nuxtjs/sitemap',
    '@nuxt/ui',
    '@vite-pwa/nuxt',
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Yoga Ravennah',
      short_name: 'Yoga Ravennah',
      description: 'Yoga studio boekingssysteem van Ravennah',
      start_url: '/account',
      scope: '/',
      display: 'standalone',
      display_override: ['standalone'],
      background_color: '#030712',
      theme_color: '#030712',
      orientation: 'portrait',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/account',
      // Only cache app shell assets — fonts are fetched from CDN and cached separately
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      // Import custom push notification handler into the generated service worker
      importScripts: ['/push-sw.js'],
    },
    devOptions: {
      enabled: false,
    },
  },

  dayjs: {
    locales: ['en', 'nl'],
    plugins: ['relativeTime', 'utc', 'timezone'],
    defaultLocale: 'nl',
    defaultTimezone: 'America/New_York'
  },

  sitemap: {
    autoLastmod: true,
    // Cache the sitemap for 1 hour to avoid regenerating on every request
    cacheMaxAgeSeconds: 3600,
  },

  fonts: {
    families: [
      { name: 'Montserrat', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Source Sans 3', provider: 'google', weights: [400, 500, 600, 700] }
    ]
  },

  css: ['~/assets/css/tailwind.css'],

  routeRules: {
    // Static pages: ISR — render once, then serve from cache indefinitely
    // stale-while-revalidate ensures the cached version is served while re-rendering in background
    '/': { isr: true },
    '/over': { isr: true },
    '/tarieven': { isr: true },
    '/priveles': { isr: true },
    '/hatha-yoga': { isr: true },
    '/voordelen': { isr: true },
    '/contact': { isr: true },
    '/bo-bol': { isr: true },
    '/yoga-capelle-aan-den-ijssel': { isr: true },
    '/yoga-zuidplas': { isr: true },
    '/yoga-waddinxveen': { isr: true },
    '/yoga-zevenhuizen': { isr: true },
    '/eerste-les': { isr: true },
    // Dynamic/authenticated pages: disable SSR to prevent Vue instance accumulation
    '/lessen': { ssr: false },
    '/account': { ssr: false },
    '/archief': { ssr: false },
    '/login': { ssr: false },
    '/verify-email': { ssr: false },
    '/reset-wachtwoord': { ssr: false },
    '/admin/**': { ssr: false },
    // Legacy redirects
    '/liefdescoach/**': { redirect: '/', statusCode: 301 },
    '/yoga': { redirect: '/', statusCode: 301 },
    '/yoga/account': { redirect: '/account', statusCode: 301 },
    '/yoga/archief': { redirect: '/archief', statusCode: 301 },
    '/yoga/contact': { redirect: '/contact', statusCode: 301 },
    '/yoga/hatha-yoga': { redirect: '/hatha-yoga', statusCode: 301 },
    '/yoga/lessen': { redirect: '/lessen', statusCode: 301 },
    '/yoga/login': { redirect: '/login', statusCode: 301 },
    '/yoga/over': { redirect: '/over', statusCode: 301 },
    '/yoga/priveles': { redirect: '/priveles', statusCode: 301 },
    '/yoga/tarieven': { redirect: '/tarieven', statusCode: 301 },
    '/yoga/voordelen': { redirect: '/voordelen', statusCode: 301 },
  },

  icon: {
    mode: 'svg',
  },

  vite: {
    build: {
      sourcemap: false,
    },
  },

  nitro: {
    // Compress static assets with gzip + brotli — reduces bandwidth and memory transfer
    compressPublicAssets: { gzip: true, brotli: true },
    // Minify the server bundle to reduce startup memory footprint
    minify: true,
    // Use bounded LRU cache instead of unbounded in-memory default
    storage: {
      cache: {
        driver: 'lru-cache',
        max: 20,
      }
    },
    // Restrict API access to same origin only — rejects cross-origin requests
    routeRules: {
      '/api/**': {
        cors: false,
        headers: {
          'Access-Control-Allow-Origin': 'same-origin',
        },
      },
    },
  }
})
