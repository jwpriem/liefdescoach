<script lang="ts" setup>
const title = ref('Yoga Capelle aan den IJssel | Yoga Ravennah - 8 minuten rijden');
const description = ref('Woon je in Capelle aan den IJssel en zoek je yogalessen? Yoga Ravennah in Rotterdam Nesselande is slechts 8 minuten rijden. Ontdek ongedwongen hatha yoga met persoonlijke aandacht.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga-capelle-aan-den-ijssel');

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

useLocationPageSchema('Capelle aan den IJssel', 'https://www.ravennah.com/yoga-capelle-aan-den-ijssel', description.value)
</script>

<template>
    <LocationPage
        city-name="Capelle aan den IJssel"
        distance="8 minuten"
        route-description="Vanuit Capelle aan den IJssel — of je nu in Schollevaar, Oostgaarde, Fascinatio of het centrum woont — ben je in slechts 8 minuten bij de studio. Via de Capelsebrug of de Abram van Rijckevorselweg rijd je rechtstreeks naar Nesselande. Volg daarna de bordjes richting Emmy van Leersumhof."
        hero-image="/ravennah-rug.jpg"
        hero-image-alt="Yoga docent Ravennah op de rug gezien"
        section-image="/ravennah_een_been.webp"
        section-image-alt="Yoga docent Ravennah in een staande balanshouding"
        approach-title="Even ontsnappen"
        approach-body1="In de drukte van het dagelijks leven is het fijn om even volledig los te laten. Een uurtje yoga op zondagochtend geeft je de rust en energie om de week daarna vol aan te gaan."
        approach-body2="Bij Yoga Ravennah werk ik in kleine groepen zodat iedereen de aandacht krijgt die nodig is. Geen massales, maar echte persoonlijke begeleiding — of je nu net begint of al langer beweegt."
        cta-title="Start je zondag vanuit Capelle"
    />
</template>
