// https://nuxt.com/docs/api/configuration/nuxt-config
const isDev = process.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  compatibilityDate: '2026-02-07',
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys are only available on the server
    appwriteKey: '',
    cronSecret: '',           // NUXT_CRON_SECRET
    revenuePerBooking: '14',  // NUXT_REVENUE_PER_BOOKING
    costPerLesson: '50',      // NUXT_COST_PER_LESSON
    // Public keys that are exposed to the client
    public: {
      project: '',
      database: '',
      mailPass: '',
      mailPassDev: ''
    }
  },

  devServer: {
    port: 3000,
    host: 'localhost'
  },

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
    '~/plugins/rav'
  ],

  modules: [
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    'dayjs-nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/ui',
    '@nuxt/image'
  ],

  image: {
    domains: ['images.unsplash.com']
  },

  dayjs: {
    locales: ['en', 'nl'],
    plugins: ['relativeTime', 'utc', 'timezone'],
    defaultLocale: 'nl',
    defaultTimezone: 'America/New_York'
  },

  sitemap: {
    autoLastmod: true
  },

  imports: {
    dirs: ['app/stores']
  },

  css: ['~/assets/css/tailwind.css'],

  site: {
    url: 'https://www.ravennah.com'
  },

  robots: {
    // Default behavior allows all and points to sitemap (verified by sitemap module)
  },

  googleFonts: {
    families: {
      Montserrat: [200, 300, 400, 500, 600, 700, 800, 900],
      'Source+Sans+3': [200, 300, 400, 500, 600, 700, 800, 900]
    }
  },



  ui: {
    global: true
  },

  routeRules: {
    '/liefdescoach/**': { redirect: { to: '/', statusCode: 301 } },
    '/yoga': { redirect: { to: '/', statusCode: 301 } },
    '/yoga/account': { redirect: { to: '/account', statusCode: 301 } },
    '/yoga/archief': { redirect: { to: '/archief', statusCode: 301 } },
    '/yoga/contact': { redirect: { to: '/contact', statusCode: 301 } },
    '/yoga/hatha-yoga': { redirect: { to: '/hatha-yoga', statusCode: 301 } },
    '/yoga/lessen': { redirect: { to: '/lessen', statusCode: 301 } },
    '/yoga/login': { redirect: { to: '/login', statusCode: 301 } },
    '/yoga/over': { redirect: { to: '/over', statusCode: 301 } },
    '/yoga/priveles': { redirect: { to: '/priveles', statusCode: 301 } },
    '/yoga/tarieven': { redirect: { to: '/tarieven', statusCode: 301 } },
    '/yoga/voordelen': { redirect: { to: '/voordelen', statusCode: 301 } },
  }
})
