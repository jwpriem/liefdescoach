<script setup lang="ts">
const title = ref('Yoga Ravennah | Tarieven');
const description = ref('Je kunt een losse les meedoen voor € 15,- of je kunt een strippenkaart kopen van € 125,-');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/tarieven');

const store = useMainStore()

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

const loggedInUser = computed(() => store.loggedInUser);

</script>

<template>
  <div>
    <Header image="/ravennah-pose.jpg" alignment="object-center">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Tarieven</span><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">Je kunt een losse les meedoen voor <span
        class="text-emerald-700 font-bold">&euro; 15,- per les</span> of je kunt een strippenkaart kopen van <span
        class="text-emerald-700 font-bold">10 lessen voor &euro; 125,-</span> (&euro; 12,50 per les). Een strippenkaart is 12 maanden geldig en is te gebruiken voor zowel yoga als Peachy Bum lessen.</p>

        <p class="intro">Een les annuleren kan tot 24 uur voor de les kosteloos.</p>

      <p class="intro" v-if="!loggedInUser">
        Boeken kan door
        <nuxt-link to="/yoga/login"><u>in te loggen</u></nuxt-link>. Heb je nog geen account dan kun je een account aanmaken.
      </p>

      <nuxt-link to="/yoga/lessen" class="emerald button">
          Les schema
        </nuxt-link>
    </Header>
  </div>
</template>