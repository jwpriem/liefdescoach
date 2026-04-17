<script lang="ts" setup>
const title = ref('Yoga Zevenhuizen | Yoga Ravennah - 10 minuten rijden');
const description = ref('Woon je in Zevenhuizen en zoek je yogalessen? Yoga Ravennah in Rotterdam Nesselande is slechts 10 minuten rijden. Ontdek ongedwongen hatha yoga met persoonlijke aandacht.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga-zevenhuizen');

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

useLocationPageSchema('Zevenhuizen', 'https://www.ravennah.com/yoga-zevenhuizen', description.value)
</script>

<template>
    <LocationPage
        city-name="Zevenhuizen"
        distance="10 minuten"
        route-description="Zevenhuizen ligt direct naast Nesselande. Via de Rottekade of de N219 rijd je in zo'n 10 minuten naar de studio. Je rijdt langs de Zevenhuizerplas en slaat af richting Nesselande. Vanuit het dorp zelf is het een van de kortste ritten naar een yogastudio in de regio."
        hero-image="/ravennah-zwart.jpg"
        hero-image-alt="Yoga docent Ravennah in zwartwit portret"
        section-image="/ravennah_side_plank.webp"
        section-image-alt="Yoga docent Ravennah in een zijwaartse plank houding"
        approach-title="Ongedwongen sfeer"
        approach-body1="Bij Yoga Ravennah draait alles om jezelf zijn. Geen prestatiedruk, geen vergelijken met anderen. Gewoon jij op je mat, bezig met ademhaling, beweging en ontspanning."
        approach-body2="Ik geloof dat yoga toegankelijk moet zijn voor iedereen. Ook als je nog nooit yoga hebt gedaan, ben je meer dan welkom."
        cta-title="Start je zondag vanuit Zevenhuizen"
    />
</template>
