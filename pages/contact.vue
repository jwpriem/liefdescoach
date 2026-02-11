<script setup lang="ts">
const store = useMainStore();

const title = ref('Yoga Ravennah | Contact');
const description = ref('Wil je meer weten of een keer een proefles meedoen? Neem dan contact op via het formulier of mijn socials.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/contact');
const name = ref('');
const email = ref('');
const message = ref('');

definePageMeta({
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
 await store.setLoading(true)
 await $fetch('/api/mail/send', {
   method: 'POST',
   body: {
     type: 'contact',
     data: {
       name: name.value,
       email: email.value,
       message: message.value,
     }
   }
 })

  name.value = ''
  email.value = ''
  message.value = ''
 await store.setLoading(false)
}

const isLoading = computed(() => store.isLoading);

</script>

<template>
  <div class="">
    <IsLoading :loading="isLoading" />
    <Header image="/ravennah_side_plank.webp">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Stuur een bericht</span><span class="text-emerald-600">.</span>
      </h1>
        <div class="mt-8 space-y-3 darkForm">
         <UFormField label="Naam" required>
          <UInput id="naam" color="primary" v-model="name" variant="outline" type="text" placeholder="Je naam" />
         </UFormField>
         <UFormField label="Email" required>
         <UInput id="email" color="primary" v-model="email" variant="outline" type="email" placeholder="Je e-mailadres" />
         </UFormField>
         <UFormField label="Bericht" required>
          <UTextarea id="bericht" v-model="message" :rows="4" color="primary" variant="outline" placeholder="Waar gaat het over?" />
         </UFormField>
         <UButton color="primary" variant="solid" size="xl" @click="send">Verzenden</UButton>
          <Addresses />
        </div>
    </Header>
  </div>
</template>