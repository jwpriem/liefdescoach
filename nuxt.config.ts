// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // SEO: Site-wide head configuration
  app: {
    head: {
      htmlAttrs: { lang: 'nl' },
      meta: [
        { name: 'geo.region', content: 'NL-ZH' },
        { name: 'geo.placename', content: 'Rotterdam' },
        { name: 'geo.position', content: '51.9683092;4.5884189' },
        { name: 'ICBM', content: '51.9683092, 4.5884189' }
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
    appwriteKey: '',
    cronSecret: '',           // NUXT_CRON_SECRET
    revenuePerBooking: '14',  // NUXT_REVENUE_PER_BOOKING
    costPerLesson: '35',      // NUXT_COST_PER_LESSON
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

  // Plugins to run before rendering page
  plugins: [
    '~/plugins/rav'
  ],

  modules: [
    '@nuxt/fonts',
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

  fonts: {
    families: [
      { name: 'Montserrat', provider: 'google', weights: [200, 300, 400, 500, 600, 700, 800, 900] },
      { name: 'Source Sans 3', provider: 'google', weights: [200, 300, 400, 500, 600, 700, 800, 900] }
    ]
  },

  css: ['~/assets/css/tailwind.css'],

  routeRules: {
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

  compatibilityDate: '2025-01-01'
})
