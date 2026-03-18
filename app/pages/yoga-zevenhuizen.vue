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
    meta: [
        { hid: 'description', name: 'description', content: description },
        { hid: 'og:title', property: 'og:title', content: title },
        { hid: 'og:url', property: 'og:url', content: pageUrl },
        { hid: 'og:description', property: 'og:description', content: description },
        { hid: 'og:image', property: 'og:image', content: ogImage },

        // twitter card
        { hid: "twitter:title", name: "twitter:title", content: title },
        { hid: "twitter:url", name: "twitter:url", content: pageUrl },
        { hid: 'twitter:description', name: 'twitter:description', content: description },
        { hid: "twitter:image", name: "twitter:image", content: ogImage },
    ]
})

useLocationPageSchema('Zevenhuizen', 'https://www.ravennah.com/yoga-zevenhuizen', description.value)
</script>

<template>
    <div>
        <Header image="/ravennah-zwart.jpg" alignment="object-top">
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Yoga Zevenhuizen</span><span class="text-emerald-700">.</span>
            </h1>
            <p class="intro">
                Woon je in Zevenhuizen en ben je op zoek naar yoga lessen in de buurt?
                Yoga Ravennah in Rotterdam Nesselande is slechts 10 minuten rijden.
                Ik bied laagdrempelige hatha yoga in kleine groepen.
            </p>
            <div class="flex justify-start items-center gap-x-3">
                <nuxt-link class="emerald button" to="/lessen">
                    Les schema
                </nuxt-link>
                <nuxt-link class="emerald-outlined button" to="/tarieven">
                    Tarieven
                </nuxt-link>
            </div>
        </Header>

        <div class="bg-emerald-100 title-dark">
            <div class="container mx-auto p-8 md:px-0 md:py-24">
                <div class="flex justify-center items-center">
                    <div class="w-full md:w-1/2 md:text-center space-y-8">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline text-emerald-900">Om de hoek</span><span
                                class="text-emerald-700">.</span>
                        </h2>
                        <p class="text-xl text-emerald-900">
                            Vanuit Zevenhuizen ben je in slechts <span class="text-emerald-700 font-bold">10
                                minuten</span>
                            bij de studio via de Rottekade of N219. Nesselande ligt direct naast jullie mooie dorp.
                            Gratis parkeren voor de deur.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2">
                        <NuxtImg class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                            src="/ravennah_side_plank.webp" />
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline">Ongedwongen sfeer</span><span
                                class="text-emerald-700">.</span>
                        </h2>
                        <p class="intro">
                            Bij Yoga Ravennah draait het om jezelf zijn. Geen prestatiedruk,
                            geen oordeel. Gewoon jij op je matje, bezig met ademhaling,
                            beweging en ontspanning.
                        </p>
                        <p class="intro">
                            Ik geloof dat yoga voor iedereen toegankelijk moet zijn. Ook als
                            je nog nooit yoga hebt gedaan, ben je van harte welkom.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-center md:space-x-12 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2 space-y-8">
                        <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                            <span class="emerald-underline">Wat kun je verwachten</span><span
                                class="text-emerald-700">?</span>
                        </h2>
                        <ul class="text-xl text-emerald-900 space-y-2">
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Hatha yoga in kleine groepen
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Persoonlijke begeleiding en correcties
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Focus op ademhaling en mindfulness
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Ontspannen sfeer zonder prestatiedruk
                            </li>
                        </ul>
                    </div>
                    <div class="w-full md:w-1/2">
                        <NuxtImg class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                            src="/ravennah-pose.jpg" />
                    </div>
                </div>
            </div>
        </div>

        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto text-center space-y-8">
                <h2 class="text-2xl md:text-4xl uppercase font-black">
                    <span class="emerald-underline">Probeer een les</span><span class="text-emerald-700">.</span>
                </h2>
                <p class="intro max-w-2xl mx-auto">
                    Elke zondag van 08:45 tot 09:45 geef ik les aan de Emmy van Leersumhof 24a
                    in Rotterdam Nesselande. Boek je eerste les en ervaar zelf wat yoga
                    voor je kan betekenen.
                </p>
                <div class="flex justify-center items-center gap-x-3">
                    <nuxt-link class="emerald button" to="/lessen">
                        Bekijk het lesrooster
                    </nuxt-link>
                    <nuxt-link class="emerald-outlined button" to="/contact">
                        Neem contact op
                    </nuxt-link>
                </div>
            </div>
        </div>
    </div>
</template>
