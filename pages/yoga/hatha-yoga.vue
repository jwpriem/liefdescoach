<script setup lang="ts">
const title = ref('Yoga Ravennah | Hatha yoga');
const description = ref('Hatha yoga omvat houdingen en asanas die de mobiliteit van gewrichten vergroten en de spieren versterken. Kom snel een keer langs voor een ontspannen les in Rotterdam Nesselande');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/hatha-yoga');

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
      <Header image="/yoga-sfeer.jpg" alignment="object-middle">
          <div class="flex justify-start items-center gap-x-6">
              <h1 class="text-3xl md:text-6xl uppercase font-black">
                  <span class="emerald-underline">Hatha yoga</span
                      ><span class="text-emerald-600">.</span>
              </h1>
          </div>
          <p class="intro">
        Hatha yoga moedigt diepe ademhaling en ontspanning aan, wat kan helpen stress te verminderen. Door je aandacht te richten op je ademhaling en het beoefenen van mindfulness, kun je kalmeren en innerlijke rust vinden.
          </p>
          <p class="intro">
          Al met al bied Hatha yoga veel voordelen voor zowel je fysieke als mentale gezondheid. Het regelmatig beoefenen van deze yogastijlen kan een waardevolle aanvulling zijn op je levensstijl en bijdragen aan een gezonder en evenwichtiger leven.
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