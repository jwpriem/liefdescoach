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
            :error="this.$lc.getErrorMessage('name', errors)"
            type="text"
            placeholder="Je naam"
            class="w-full"
          />
          <LCInput
            id="email"
            v-model="form.email"
            label="E-mail"
            :required="true"
            :error="this.$lc.getErrorMessage('email', errors)"
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
            :error="this.$lc.getErrorMessage('message', errors)"
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
  components: {
    Header,
    LCInput,
    LCTextarea
  },
  data() {
    return {
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
        this.errors = this.$lc.setErrorMessages(this.$v.form)
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
