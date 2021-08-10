const isDev = process.env.NODE_ENV !== 'production'

export default {
  server: {
    port: isDev ? 3000 : 8080, // default: 3000
    host: isDev ? 'localhost' : '0.0.0.0' // default: localhost
  },
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: 'Liefdescoach',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Source+Sans+Pro:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap'
      }
    ]
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
    '@/assets/css/main.css'
  ],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
    '~/plugins/globalFunctions',
    '~/plugins/vuelidate',
    '~/plugins/message'
  ],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/tailwindcss
    '@nuxtjs/tailwindcss'
  ],
  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    '@nuxtjs/axios',
    'nuxt-mail',
    '@nuxtjs/gtm'
  ],
  gtm: {
    id: 'GTM-PZP28PP'
  },
  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
  },

  // See https://github.com/nuxt-community/axios-module#options
  axios: {
    baseURL: isDev ? 'http://localhost:3000/' : 'https://www.liefdes.coach/'
  },

  mail: {
    smtp: {
      host: 'mail.privateemail.com',
      port: 587,
      auth: {
        user: 'ravennah@liefdes.coach',
        pass: process.env.EMAIL_PASS
      }
    }
  }
}
