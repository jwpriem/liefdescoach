<script lang="ts" setup>
const title = ref('Yoga Waddinxveen | Yoga Ravennah - 15 minuten rijden');
const description = ref('Woon je in Waddinxveen en zoek je yogalessen? Yoga Ravennah in Rotterdam Nesselande is slechts 15 minuten rijden. Ontdek ongedwongen hatha yoga met persoonlijke aandacht.');
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
        approach-title="Small group lessen"
        approach-body1="In tegenstelling tot grote yogastudio's werk ik bewust met kleine groepen. Zo kun je altijd rekenen op persoonlijke aandacht en begeleiding die echt op jou is afgestemd."
        approach-body2="Of je nu stress wilt verminderen, flexibeler wilt worden of gewoon een moment van rust zoekt — je bent van harte welkom, ook als beginner."
        cta-title="Kom langs vanuit Waddinxveen"
    />
</template>
