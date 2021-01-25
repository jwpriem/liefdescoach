<template>
  <div class="">
    <Header image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1950&q=80">
      <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
        Stuur een bericht<span class="text-rose-600">.</span>
      </h1>
      <div class="mt-8 space-y-3">
        <div>
          <label>Naam:<sup>*</sup></label>
          <input v-model="form.name" type="text" class="p-4 bg-gray-200 w-full">
        </div>
        <div>
          <label>Email:<sup>*</sup></label>
          <input v-model="form.email" type="text" class="p-4 bg-gray-200 w-full">
        </div>
        <div>
          <label>Bericht:<sup>*</sup></label>
          <textarea v-model="form.message" rows="4" type="text" class="p-4 bg-gray-200 w-full" />
        </div>
        <div class="button rose" @click="send">
          <svg
            :class="loading ? 'animate-spin' : ''"
            class="w-6 h-6 inline-block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          ><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
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
          to: 'jwpriem@gmail.com'
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

<style lang="postcss" scoped>
label {
  @apply font-bold uppercase text-rose-600;
}
</style>
