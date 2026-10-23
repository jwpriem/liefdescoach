<script lang="ts" setup>
const title = ref('Yoga Waddinxveen | Yoga op maat op locatie | Yoga Ravennah');
const description = ref('Yoga in Waddinxveen voor een vrijgezellenfeest, bedrijf, teamuitje, workshop of event. Ravennah komt naar jullie toe, of kom naar de studio in Nesselande: 15 minuten rijden.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga-waddinxveen');

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

useLocationPageSchema('Waddinxveen', 'https://www.ravennah.com/yoga-waddinxveen', description.value)
</script>

<template>
    <LocationPage
        city-name="Waddinxveen"
        distance="15 minuten"
        route-description="Vanuit Waddinxveen rijd je via de N219 richting Rotterdam. Pak de A12 en neem afslag Nesselande. De studio aan de Emmy van Leersumhof 24a is goed bereikbaar vanuit het centrum van Waddinxveen, Groenswaard en omgeving. De rit duurt circa 15 minuten."
        hero-image="/ravennah-donker.jpg"
        hero-image-alt="Yoga docent Ravennah in kleermakerszit"
        section-image="/ravennah_squat_2.webp"
        section-image-alt="Yoga docent Ravennah in een squat yoga houding"
        approach-title="Echt op maat"
        approach-body1="Geen standaardles, maar een sessie die echt bij jullie past. Ik stem de oefeningen, het tempo en de sfeer af op de groep en de gelegenheid."
        approach-body2="Of jullie nu stress willen verminderen, samen iets bijzonders willen beleven of gewoon een moment van rust zoeken — iedereen is welkom, ook als beginner."
        cta-title="Plan jullie sessie in Waddinxveen"
    />
</template>
