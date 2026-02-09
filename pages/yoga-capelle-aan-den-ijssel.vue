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

useLocationPageSchema('Capelle aan den IJssel', 'https://www.ravennah.com/yoga-capelle-aan-den-ijssel', description.value)
</script>

<template>
    <div>
        <Header image="/ravennah-rug.jpg" alignment="object-center">
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Yoga Capelle</span><span class="text-emerald-700">.</span>
            </h1>
            <p class="intro">
                Woon je in Capelle aan den IJssel en ben je op zoek naar yoga lessen?
                Yoga Ravennah in Rotterdam Nesselande is slechts 8 minuten rijden.
                Ontdek laagdrempelige hatha yoga met veel persoonlijke aandacht.
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
                            <span class="emerald-underline text-emerald-900">Direct om de hoek</span><span
                                class="text-emerald-700">.</span>
                        </h2>
                        <p class="text-xl text-emerald-900">
                            Vanuit Capelle aan den IJssel - of je nu in Schollevaar, Oostgaarde
                            of het centrum woont - ben je in slechts <span class="text-emerald-700 font-bold">8
                                minuten</span>
                            bij de studio. Via de Capelsebrug of Abram van Rijckevorselweg rijd
                            je zo naar Nesselande. Gratis parkeren voor de deur.
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
                            src="/ravennah_een_been.webp" />
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline">Even ontsnappen</span><span
                                class="text-emerald-700">.</span>
                        </h2>
                        <p class="intro">
                            In de drukte van het dagelijks leven is het fijn om even te
                            ontsnappen. Een uurtje yoga geeft je de rust en energie om de
                            week weer aan te kunnen.
                        </p>
                        <p class="intro">
                            Bij Yoga Ravennah werk ik met kleine groepen, zodat ik iedereen
                            de aandacht kan geven die nodig is. Geen massa-lessen, maar
                            persoonlijke begeleiding.
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
                            <span class="emerald-underline">Hatha yoga helpt bij</span><span
                                class="text-emerald-700">:</span>
                        </h2>
                        <ul class="text-xl text-emerald-900 space-y-2">
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Stress en spanning verminderen
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Soepeler en flexibeler worden
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Sterker en meer in balans
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Beter slapen en meer energie
                            </li>
                        </ul>
                    </div>
                    <div class="w-full md:w-1/2">
                        <NuxtImg class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                            src="/ravennah_wind.webp" />
                    </div>
                </div>
            </div>
        </div>

        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto text-center space-y-8">
                <h2 class="text-2xl md:text-4xl uppercase font-black">
                    <span class="emerald-underline">Start je zondag goed</span><span class="text-emerald-700">.</span>
                </h2>
                <p class="intro max-w-2xl mx-auto">
                    Elke zondag van 08:45 tot 09:45 geef ik les aan de Emmy van Leersumhof 24a
                    in Rotterdam Nesselande. Begin je zondag met rust en balans. Boek je
                    eerste les en ontdek wat yoga voor jou kan betekenen.
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
