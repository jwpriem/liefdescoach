<script setup lang="ts">
const title = ref('Liefdescoach Ravennah | Hulp met dates of in de liefde');
const description = ref('Problemen in de liefde kennen we allemaal en soms hebben we iemand nodig die naar je luistert en je onafhankelijk adviseert. Dingen die je misschien niet direct van je vrienden of vriendinnen hoort.');
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
      <Header image="https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" alignment="object-bottom">
          <h1 class="text-3xl md:text-6xl uppercase font-black text-gray-800">
              <span class="pink-underline">Kosten</span><span class="text-rose-600">.</span>
          </h1>
          <p class="intro">
        Ik vind het belangrijk dat je comfortabel en vertrouwt bij me voelt. Om dit te ervaren plan ik graag vrijblijvend en kosteloos een kennismakingsgesprek in waar we in 20 minuutjes elkaar iets beter leren kennen. Ben je overtuigt? Dan plannen we gelijk de eerste sessie. Een sessie duurt circa een uur en kost &euro; 85,- inclusief BTW. We kunnen bellen, met of zonder beeld (via Zoom) of ga je liever een rondje samen lopen. Wat jij prettig vind.
          </p>
          <nuxt-link to="/liefdescoach/intake" class="rose button">
        Plan gesprek
          </nuxt-link>
      </Header>
  </div>
</template>