<script setup lang="ts">
const mail = useMail()

const title = ref('Liefdescoach Ravennah | Hulp met dates of in de liefde');
const description = ref('Problemen in de liefde kennen we allemaal en soms hebben we iemand nodig die naar je luistert en je onafhankelijk adviseert. Dingen die je misschien niet direct van je vrienden of vriendinnen hoort.');
const ogImage = ref('https://www.ravennah.com/ravennah-social-liefdescoach.jpg');
const pageUrl = ref('https://www.ravennah.com/liefdescoach');

const name = ref('')
const email = ref('')
const phone = ref('')
const message = ref('')
const loading = ref(false)

definePageMeta({
    layout: 'liefdescoach'
})

useHead({
    title,
    meta: [
        {hid: 'description', name: 'description', content: description},
        {hid: 'og:title', property: 'og:title', content: title},
        {hid: 'og:url', property: 'og:url', content: pageUrl},
        {hid: 'og:description', property: 'og:description', content: description},
        {hid: 'og:image', property: 'og:image', content: ogImage},

        // twitter card
        {hid: "twitter:title", name: "twitter:title", content: title},
        {hid: "twitter:url", name: "twitter:url", content: pageUrl},
        {hid: 'twitter:description', name: 'twitter:description', content: description},
        {hid: "twitter:image", name: "twitter:image", content: ogImage},
        ]
})

async function send(){
    loading.value = true
    mail.send({
        config:0,
        from: 'Liefdescoach Ravennah <info@ravennah.com>',
        subject: 'Intake Liefdescoach Ravennah',
        text: 'Naam:\n' + name.value + '\n\nEmail:\n' + email.value + '\n\nTelefoonnummer:\n' + phone.value + '\n\nBericht:\n' + message.value,
    })

    name.value = ''
    email.value = ''
    phone.value = ''
    message.value = ''
    
    loading.value = false
}

</script>

<template>
  <div class="mt-0 md:mt-24">
      <div class="container mx-auto p-8 md:px-0 md:py-24">
          <div class="flex justify-center items-center">
              <form class="w-full md:w-1/2 text-center space-y-8">
                  <h2 class="text-2xl md:text-4xl uppercase font-black text-gray-800">
                      <span class="pink-underline">Kennismaking plannen</span><span class="text-rose-600">.</span>
                  </h2>
                  <p class="text-2xl">
            Laat je naam, email en telefoonnummer achter en ik neem zo snel mogelijk contact met je op om de kennismaking in te plannen.
                  </p>
                  <svg class="w-8 h-8 inline-block stroke-current text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="{2}" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  <div class="text-left space-y-6">
                      <label>Naam</label>
          <input 
            id="naam"
            v-model="name"
            
            :required="true"
            type="text"
            placeholder="Je naam"
            class="w-full"
          />
          <label>E-mail</label>
          <input 
            id="email"
            v-model="email"
            :required="true"
            type="email"
            placeholder="Je e-mailadres"
            class="w-full"
          />
                      <label>Telefoonnummer</label>
                      <input 
                          id="phone"
                          v-model="phone"
                          type="text"
                          placeholder="Je telefoonnummer"
                          class="w-full"
                          />
          <label>Bericht</label>
          <textarea
            id="bericht"
            v-model="message"
            :rows="4"
            :required="true"
            placeholder="Waar gaat het over?"
            class="w-full"
          />
                      <button type="sumbit" class="button rose" @click="send">
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
                      </button>
                  </div>
                  <img
                      class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                      src="https://images.unsplash.com/photo-1542338347-4fff3276af78?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                      >
              </form>
          </div>
      </div>
  </div>
</template>