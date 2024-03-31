<script setup lang="ts">
const mail = useMail()

const title = ref('Liefdescoach Ravennah | Hulp met dates of in de liefde');
const description = ref('Problemen in de liefde kennen we allemaal en soms hebben we iemand nodig die naar je luistert en je onafhankelijk adviseert. Dingen die je misschien niet direct van je vrienden of vriendinnen hoort.');
const ogImage = ref('https://www.ravennah.com/ravennah-social-liefdescoach.jpg');
const pageUrl = ref('https://www.ravennah.com/liefdescoach');

const name = ref('')
const email = ref('')
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
        subject: 'Contactformulier Liefdescoach Ravennah',
        text: 'Naam:\n' + name.value + '\n\nEmail:\n' + email.value + '\n\nBericht:\n' + message.value,
    })

    name.value = ''
    email.value = ''
    message.value = ''
    
    loading.value = false
}

</script>

<template>
  <div class="">
      <Header image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1950&q=80">
          <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
              <span class="pink-underline">Stuur een bericht</span><span class="text-rose-600">.</span>
          </h1>
          <div class="mt-8 space-y-3 darkForm">
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
          <label>Bericht</label>
          <textarea
            id="bericht"
            v-model="message"
            :rows="4"
            :required="true"
            placeholder="Waar gaat het over?"
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
      </Header>
  </div>
</template>