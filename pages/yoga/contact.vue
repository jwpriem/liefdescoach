<script setup lang="ts">
const mail = useMail()
const store = useMainStore();

const title = ref('Yoga Ravennah | Contact');
const description = ref('Wil je meer weten of een keer een proefles meedoen? Neem dan contact op via het formulier of mijn socials.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/contact');
const name = ref('');
const email = ref('');
const message = ref('');

definePageMeta({
    layout: 'yoga'
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
 await mail.send({
      config:0,
      from: 'Yoga Ravennah <info@ravennah.com>',
      subject: 'Contactformulier Yoga Ravennah',
      text: 'Naam:\n' + name.value + '\n\nEmail:\n' + email.value + '\n\nBericht:\n' + message.value,
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
         <UFormGroup label="Naam" required>
          <UInput id="naam" color="primary" v-model="name" variant="outline" type="text" placeholder="Je naam" />
         </UFormGroup>
         <UFormGroup label="Email" required>
         <UInput id="email" color="primary" v-model="email" variant="outline" type="email" placeholder="Je e-mailadres" />
         </UFormGroup>
         <UFormGroup label="Bericht" required>
          <UTextarea id="bericht" v-model="message" :rows="4" color="primary" variant="outline" placeholder="Waar gaat het over?" />
         </UFormGroup>
         <UButton color="primary" variant="solid" size="xl" @click="send">Verzenden</UButton>
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