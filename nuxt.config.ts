// https://nuxt.com/docs/api/configuration/nuxt-config
const isDev = process.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  devtools: { enabled: true },
  
  runtimeConfig: {
    // Private keys are only available on the server
    postmark: '',
    appwriteKey: '',
    // Public keys that are exposed to the client
    public: {
      project: '',
      database: '',
      mailPass: '',
      mailPassDev: ''
    }
  },
  
  server: {
    port: isDev ? 3000 : 8080, // default: 3000
    host: isDev ? 'localhost' : '0.0.0.0' // default: localhost
  },

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
    '~/plugins/rav'
    ],
  
  modules: [
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    'dayjs-nuxt',
    'nuxt-mail',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@zadigetvoltaire/nuxt-gtm',
    '@nuxt/ui'
  ],
  
  dayjs: {
    locales: ['en', 'nl'],
    plugins: ['relativeTime', 'utc', 'timezone'],
    defaultLocale: 'nl',
    defaultTimezone: 'America/New_York'
  },
  
  mail: {
    message: {
      to: 'info@ravennah.com',
    },
    smtp: {
      host: isDev ? "sandbox.smtp.mailtrap.io" : "mail.privateemail.com",
      port: isDev ? 2525 : 465,
      secure: isDev ? false : true,
      auth: {
        user: isDev ? process.env.NUXT_PUBLIC_MAIL_USER_DEV : "info@ravennah.com",
        pass: isDev ? process.env.NUXT_PUBLIC_MAIL_PASS_DEV : process.env.NUXT_PUBLIC_MAIL_PASS,
      }
    },
  },
  
  sitemap: {
    autoLastmod: true
  },
  
  robots: {
    UserAgent: '*',
    Sitemap: 'https://www.ravennah.com/sitemap.xml'
  },
  
  googleFonts: {
    families: {
      Montserrat: [200,300,400,500,600,700,800,900],
      'Source+Sans+3': [200,300,400,500,600,700,800,900]
      }
  },
  
  gtm: {
    id: 'GTM-PZP28PP'
  },

  ui: {
    global: true
  },

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
  }
})
