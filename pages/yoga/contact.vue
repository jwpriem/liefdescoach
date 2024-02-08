<template>
  <div class="">
    <Header image="/yoga-sfeer.jpg">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Stuur een bericht</span><span class="text-emerald-600">.</span>
      </h1>
        <div class="mt-8 space-y-3 darkForm">
          <LCInput
            id="naam"
            v-model="form.name"
            label="Naam"
            :required="true"
            :error="this.$rav.getErrorMessage('name', errors)"
            type="text"
            placeholder="Je naam"
            class="w-full"
          />
          <LCInput
            id="email"
            v-model="form.email"
            label="E-mail"
            :required="true"
            :error="this.$rav.getErrorMessage('email', errors)"
            type="text"
            placeholder="Je e-mailadres"
            class="w-full"
          />
          <LCTextarea
            id="bericht"
            v-model="form.message"
            label="Bericht"
            :rows="4"
            :required="true"
            :error="this.$rav.getErrorMessage('message', errors)"
            placeholder="Waar gaat het over?"
            class="w-full"
          />
          <div class="button emerald" @click="send">
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block"
                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Verzend
          </div>
          <div class="py-12">
        <p class="intro"><span
          class="text-emerald-700 text-xl md:text-2xl font-bold">Adres Studio YES Wellness</span><br>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
               stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
          </svg>
          Emmy van Leersumhof 24a
          Rotterdam (Nesselande)
        </p>
        <a class="intro" href="https://www.google.com/maps/place/Emmy+van+Leersumhof+24a,+3059+LT+Rotterdam/@51.9683125,4.585844,17z/data=!3m1!4b1!4m6!3m5!1s0x47c5cd7dec493187:0xd32480c3b7fa1581!8m2!3d51.9683092!4d4.5884189!16s%2Fg%2F11t40nxhs0?entry=ttu" target="_blank">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
</svg>
      <u>Bekijk op Google Maps</u>
      </a>
        </div>
        </div>
    </Header>
  </div>
</template>

<script>
import {required, email} from 'vuelidate/lib/validators'
import Header from '~/components/Header'
import LCInput from '~/components/forms/LCInput'
import LCTextarea from '~/components/forms/LCTextarea'

export default {
  layout: 'yoga',
  head() {
    return {
      title: this.pageTitle,
      meta:[
        { hid: 'description', name: 'description', content:  this.description },
        { hid: 'og:title', property: 'og:title', content: this.pageTitle },
        { hid: 'og:url', property: 'og:url', content: this.pageUrl },
        { hid: 'og:description', property: 'og:description', content: this.description },
        { hid: 'og:image', property: 'og:image', content: this.ogImage},

        // twitter card
        { hid: "twitter:title", name: "twitter:title", content: this.pageTitle },
        { hid: "twitter:url", name: "twitter:url", content: this.pageUrl },
        { hid: 'twitter:description', name: 'twitter:description', content: this.description },
        { hid: "twitter:image", name: "twitter:image", content: this.ogImage},
        ]
    }
  },
  components: {
    Header,
    LCInput,
    LCTextarea
  },
  data() {
    return {
      pageTitle: 'Yoga Ravennah | Contact',
      description: 'Wil je meer weten of een keer een proefles meedoen? Neem dan contact op via het formulier of mijn socials.',
      ogImage: 'https://www.ravennah.com/ravennah-social.jpg',
      pageUrl: 'https://www.ravennah.com/yoga/contact',
      loading: false,
      errors: [],
      form: {
        name: '',
        email: '',
        message: ''
      }
    }
  },
  validations() {
    return {
      form: {
        name: {
          required
        },
        email: {
          required,
          email
        },
        message: {
          required
        }
      }
    }
  },
  methods: {
    send() {
      this.$v.form.$touch()

      if (this.$v.form.$invalid) {
        this.errors = this.$rav.setErrorMessages(this.$v.form)
        this.$message.error('1 of meerdere velden bevatten fouten')
      }

      if (!this.$v.form.$invalid) {
        this.loading = true
        const message = 'Het contactformulier is ingevuld.<br>' + '<b>Naam:</b> ' + this.form.name + '<br>' + '<b>Email:</b> ' + this.form.email + '<br>' + '<b>Bericht:</b> ' + this.form.message + '<br>'

        this.$mail.send({
          from: 'info@ravennah.com',
          subject: 'Contactformulier Yoga',
          html: message,
          to: 'info@ravennah.com'
        }).then(() => {
          this.$message.success('Je bericht is verzonden!')
          this.loading = false

          this.form.name = ''
          this.form.email = ''
          this.form.message = ''

          this.$nextTick(() => {
            this.$v.$reset()
          })

          this.$ga.event({
            eventCategory: 'form',
            eventAction: 'send',
            eventLabel: 'contact'
          })
        })
      }
    }
  }
}
</script>
