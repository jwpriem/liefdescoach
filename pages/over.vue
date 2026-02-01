<script setup lang="ts">
const title = ref('Yoga Ravennah | Over mij');
const description = ref('Ik ben Ravennah Matser, een optimistische, energieke, creatieve verbinder die dagelijks streeft naar bijzondere momenten. Mijn focus ligt op het verspreiden van positiviteit, het vinden van innerlijke rust.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/over');

definePageMeta({
    // layout: 'yoga'
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
    <Header image="/ravennah-zwart.jpg" alignment="object-top">
      <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Ravennah</span
        ><span class="text-emerald-600">.</span>
      </h1>
      <p class="intro">
        Welkom! Ik ben Ravennah Matser, een optimistische, energieke, creatieve
        verbinder die dagelijks streeft naar bijzondere momenten. Mijn focus
        ligt op het verspreiden van positiviteit, het vinden van innerlijke rust
        en het bevorderen van balans tussen lichaam en geest. Als moeder van
        twee, getrouwd en zelf een workaholic, begrijp ik de complexiteit van
        het dagelijks leven.
      </p>
      <p class="intro">
        Mijn ervaring met yoga heeft me geleerd hoe essentieel het is om bewust
        te genieten en onvoorwaardelijke liefde voor jezelf te koesteren. Als
        yoga-instructeur probeer ik taboes te doorbreken en een vertrouwde sfeer
        te creëren waar iedereen zichzelf kan zijn en rust kan vinden. Ontdek
        jezelf en geef het waardevolle geschenk van zelfontdekking. Overweeg
        gerust een van mijn lessen – je bent van harte welkom.
      </p>
    </Header>
  </div>
</template>