const isDev = process.env.NODE_ENV !== 'production'

export default {
  env: {
    openAi: process.env.OPENAI,
    database: process.env.DATABASE,
    project: process.env.PROJECT
  },
  publicRuntimeConfig: {
    database: process.env.DATABASE,
    project: process.env.PROJECT,
    postmark: process.env.POSTMARK
  },
  ssr: true,
  target: 'server',
  server: {
    port: isDev ? 3000 : 8080, // default: 3000
    host: isDev ? 'localhost' : '0.0.0.0' // default: localhost
  },
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: 'Ravennah',
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
          'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Source+Sans+3:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap'
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
    'tailwindcss'
  ],
  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    '@nuxtjs/axios',
    'nuxt-mail',
    '@nuxtjs/gtm',
    'cookie-universal-nuxt',
  ],
  gtm: {
    id: 'GTM-PZP28PP'
  },



  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    postcss: {
      postcssOptions: {
        plugins: {
          'postcss-import': {},
          'tailwindcss/nesting': 'postcss-nesting',
          tailwindcss: {},
          autoprefixer: {},
        }
      }
    },
  },

  serverMiddleware: {
    '/api': '~/api'
  },

  // See https://github.com/nuxt-community/axios-module#options
  axios: {
    baseURL: isDev ? 'http://localhost:3000/' : 'https://www.ravennah.com/'
  },

  mail: {
    smtp: {
      host: 'mail.privateemail.com',
      port: 587,
      auth: {
        user: 'info@ravennah.com',
        pass: process.env.EMAIL_PASS
      }
    }
  }
}
