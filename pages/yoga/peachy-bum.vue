<script setup lang="ts">
const title = ref('Yoga Ravennah | Peachy Bum');
const description = ref('Wil je graag een keer een iets actievere les? Bij mooi weer van april tot september geef ik een peachy bum les op het strand van Rotterdam Nesselande');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/over');

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

</script>

<template>
  <div>
      <Header image="/warmingup.webp" alignment="object-middle">
        <div class="flex justify-start items-center gap-x-6">
          <h1 class="text-3xl md:text-6xl uppercase font-black">
              <span class="emerald-underline">Peachy Bum</span
                  ><span class="text-emerald-600">.</span>
          </h1>
          <div class="flex grow-0 animate-bounce rounded-full bg-orange-300 text-orange-900 text-xs px-3 py-1">New</div>
        </div>
          <p class="intro">
        Wie graag iets actievers doet dan yoga en het leuk vind om buiten te sporten geef ik in de zomermaanden bij goed weer van april tot september Peachy Bum lessen! 
          </p>
          <p class="intro">
          De Peachy Bum is een andere benaming voor mooie getrainde billen. De musculus gluteus maximus oftewel grote bilspier is de grootste van de drie bilspieren en bepaalt een groot deel van de vorm van de billen. Tijdens de Peachy Bum les zullen we allerlei leuke oefeningen doen om deze spier optimaal te trainen en zo te werken aan de (nog mooiere) billen!
          </p>
          <div
              class="flex justify-start items-center gap-x-3"
              >
              <nuxt-link to="/yoga/lessen" class="emerald button">
                    Les schema
              </nuxt-link>
              <nuxt-link to="/yoga/tarieven" class="emerald-outlined button">
                    Tarieven
              </nuxt-link>
          </div>
      </Header>
  </div>
</template>