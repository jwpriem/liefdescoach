<template>
  <div class="mt-0 md:mt-24">
    <div class="container mx-auto p-8 md:px-0 md:py-24">
      <div class="flex justify-center items-center">
        <div class="w-full md:w-1/2 text-center space-y-8">
          <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800">
            <span class="pink-underline">Kennismaking plannen</span><span class="text-rose-600">.</span>
          </h2>
          <p class="text-2xl">
            Laat je naam, email en telefoonnummer achter en ik neem zo snel mogelijk contact met je op om de kennismaking in te plannen.
          </p>
          <svg class="w-8 h-8 inline-block stroke-current text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          <div class="text-left space-y-6">
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
            <LCInput
              id="telefoon"
              v-model="form.phone"
              label="Telefoonnummer"
              :required="true"
              :error="this.$lc.getErrorMessage('phone', errors)"
              type="text"
              placeholder="Je telefoonnummer"
              class="w-full"
            />
            <LCTextarea
              id="bericht"
              v-model="form.message"
              label="Waar kan ik je mee helpen?"
              :rows="4"
              :required="true"
              :error="this.$lc.getErrorMessage('message', errors)"
              placeholder="Waar kan ik je mee helpen?"
              class="w-full"
            />
            <div class="button rose" @click="send">
              <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verzend
            </div>
          </div>
          <img
            class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
            src="https://images.unsplash.com/photo-1542338347-4fff3276af78?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { email, required } from 'vuelidate/lib/validators'
import LCInput from '~/components/forms/LCInput'
import LCTextarea from '~/components/forms/LCTextarea'

export default {
  components: {
    LCInput,
    LCTextarea
  },
  data () {
    return {
      loading: false,
      errors: [],
      form: {
        name: '',
        email: '',
        phone: '',
        message: ''
      }
    }
  },
  validations () {
    return {
      form: {
        name: {
          required
        },
        email: {
          required,
          email
        },
        phone: {
          required
        },
        message: {
          required
        }
      }
    }
  },
  methods: {
    send () {
      this.$v.form.$touch()

      if (this.$v.form.$invalid) {
        this.errors = this.$lc.setErrorMessages(this.$v.form)
        this.$message.error('1 of meerdere velden bevatten fouten')
      }

      if (!this.$v.form.$invalid) {
        this.loading = true
        const message = 'Het contactformulier is ingevuld.<br>' + '<b>Naam:</b> ' + this.form.name + '<br>' + '<b>Email:</b> ' + this.form.email + '<br>' + '<b>Telefoon:</b> ' + this.form.phone + '<br>' + '<b>Waar kan ik je mee helpen?</b> ' + this.form.message + '<br>'

        this.$mail.send({
          from: 'ravennah@liefdes.coach',
          subject: 'Intake Liefdescoach',
          html: message,
          to: 'ravennah@liefdes.coach'
        }).then(() => {
          this.$message.success('Je bericht is verzonden!')
          this.loading = false

          this.form.name = ''
          this.form.email = ''
          this.form.phone = ''
          this.form.message = ''

          this.$nextTick(() => {
            this.$v.$reset()
          })

          this.$ga.event({
            eventCategory: 'form',
            eventAction: 'send',
            eventLabel: 'intake'
          })
        })
      }
    }
  }
}
</script>
