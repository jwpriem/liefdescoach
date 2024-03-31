<script setup lang="ts">
const title = ref('Yoga Ravennah | Ongedwongen yogales in Rotterdam Nesselande');
const description = ref('De perfecte plek om kennis te maken met yoga en jezelf te verwelkomen in een laagdrempelige en ongedwongen omgeving. In Rotterdam Nesselande bied ik small group lessen met veel aandacht en ruimte voor persoonlijke groei.');
const ogImage = ref('https://www.ravennah.com/ravennah-social-liefdescoach.jpg');
const pageUrl = ref('https://www.ravennah.com/liefdescoach');

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

</script>

<template>
  <div>
      <Header image="/ravennah.jpeg" alignment="object-top">
          <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
              <span class="pink-underline">Ravennah</span><span class="text-rose-600">.</span>
          </h1>
          <p class="intro">
        Ravennah helpt mensen, stellen en singels als liefdescoach als ze vastlopen op het gebied van liefde. Mensen met vragen over daten, relatieproblemen, jaloezieen seksualiteit kunnen bij haar terecht voor begeleiding. Volgens haar kan online daten best slim zijn: “Het is vooral heel fijn dat online daten kan en bestaat. Het kan een hoop tijd, geld en teleurstelling voorkomen als je het slim aanpakt!”
          </p>
          <a href="https://openrotterdam.nl/rotterdamse-liefdescoach-ravennah-geeft-tips-voor-dating-sunday-als-je-iets-wil-moet-je-er-voor-durven-gaan/" target="_blank" class="button rose">
        Dating tips
          </a>
      </Header>
  </div>
</template>