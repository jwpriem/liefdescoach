<script lang="ts" setup>
const title = ref('Yoga Zuidplas | Yoga Ravennah - 12 minuten rijden');
const description = ref('Woon je in Zuidplas, Nieuwerkerk of Moordrecht en zoek je yogalessen? Yoga Ravennah in Rotterdam Nesselande is slechts 12 minuten rijden. Ontdek hatha yoga met persoonlijke aandacht.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga-zuidplas');

definePageMeta({
    // layout: 'yoga'
})

useHead({
    title,
    link: [
        { rel: 'canonical', href: pageUrl },
    ],
    meta: [
        { hid: 'description', name: 'description', content: description },
        { hid: 'og:title', property: 'og:title', content: title },
        { hid: 'og:url', property: 'og:url', content: pageUrl },
        { hid: 'og:description', property: 'og:description', content: description },
        { hid: 'og:image', property: 'og:image', content: ogImage },
        { hid: "twitter:title", name: "twitter:title", content: title },
        { hid: "twitter:url", name: "twitter:url", content: pageUrl },
        { hid: 'twitter:description', name: 'twitter:description', content: description },
        { hid: "twitter:image", name: "twitter:image", content: ogImage },
    ]
})

useLocationPageSchema('Zuidplas', 'https://www.ravennah.com/yoga-zuidplas', description.value)
</script>

<template>
    <LocationPage
        city-name="Zuidplas"
        distance="10–15 minuten"
        route-description="Vanuit Nieuwerkerk aan den IJssel ben je in circa 10 minuten bij de studio. Vanuit Moordrecht of Zevenhuizen rijd je via de N219 in 12 tot 15 minuten naar Nesselande. Volg richting Rotterdam en neem de afslag Nesselande. De studio is goed bereikbaar vanuit de hele gemeente Zuidplas."
        hero-image="/yoga-sfeer.jpg"
        hero-image-alt="Mensen in een yoga klas in de studio"
        section-image="/ravennah_staan.webp"
        section-image-alt="Yoga docent Ravennah staand op een mat in een yoga houding"
        approach-title="Persoonlijke aandacht"
        approach-body1="Ik ben Ravennah en geef lessen in kleine groepen — zodat ik iedereen écht de aandacht kan geven die nodig is. Of je nu net begint of al ervaring hebt: je bent welkom."
        approach-body2="In een ontspannen sfeer, zonder haast en zonder prestatiedruk, werk je aan rust, kracht en balans. Dat is yoga bij Ravennah."
        cta-title="Begin je yoga reis vanuit Zuidplas"
    />
</template>
