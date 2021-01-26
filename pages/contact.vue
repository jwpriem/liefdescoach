<template>
  <div class="">
    <Header image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1950&q=80">
      <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800 pink-underline">
        Stuur een bericht<span class="text-rose-600">.</span>
      </h1>
      <div class="mt-8 space-y-3">
        <div>
          <label class="font-bold uppercase text-rose-600">Naam:<sup>*</sup></label>
          <input v-model="form.name" type="text" class="p-4 bg-gray-200 w-full">
        </div>
        <div>
          <label class="font-bold uppercase text-rose-600">Email:<sup>*</sup></label>
          <input v-model="form.email" type="text" class="p-4 bg-gray-200 w-full">
        </div>
        <div>
          <label class="font-bold uppercase text-rose-600">Bericht:<sup>*</sup></label>
          <textarea v-model="form.message" rows="4" type="text" class="p-4 bg-gray-200 w-full" />
        </div>
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
    </Header>
  </div>
</template>

<script>
import Header from '@/components/Header'
import { required, email } from 'vuelidate/lib/validators'
export default {
  components: {
    Header
  },
  data () {
    return {
      loading: false,
      form: {
        name: '',
        email: '',
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
        message: {
          required
        }
      }
    }
  },
  methods: {
    send () {
      this.$v.form.$touch()

      if (!this.$v.form.$invalid) {
        this.loading = true
        const message = 'Het contactformulier is ingevuld.<br>' + '<b>Naam:</b> ' + this.form.name + '<br>' + '<b>Email:</b> ' + this.form.email + '<br>' + '<b>Bericht:</b> ' + this.form.message + '<br>'

        this.$mail.send({
          from: 'ravennah@liefdes.coach',
          subject: 'Contactformulier Liefdescoach',
          html: message,
          to: 'ravennah@liefdes.coach'
        }).then(() => {
          this.loading = false

          this.form.name = ''
          this.form.email = ''
          this.form.message = ''

          this.$nextTick(() => {
            this.$v.$reset()
          })
        })
      }
    }
  }
}
</script>
