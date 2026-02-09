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

useLocationPageSchema('Zuidplas', 'https://www.ravennah.com/yoga-zuidplas', description.value)
</script>

<template>
    <div>
        <Header image="/yoga-sfeer.jpg" alignment="object-middle">
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Yoga Zuidplas</span><span class="text-emerald-700">.</span>
            </h1>
            <p class="intro">
                Woon je in gemeente Zuidplas - Nieuwerkerk aan den IJssel, Moordrecht of Zevenhuizen -
                en ben je op zoek naar yoga lessen? Yoga Ravennah in Rotterdam Nesselande is slechts
                12 minuten rijden.
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
                            <span class="emerald-underline text-emerald-900">Dichtbij vanuit Zuidplas</span><span
                                class="text-emerald-700">.</span>
                        </h2>
                        <p class="text-xl text-emerald-900">
                            Vanuit Nieuwerkerk aan den IJssel ben je in <span class="text-emerald-700 font-bold">10
                                minuten</span> bij de studio.
                            Vanuit Moordrecht of Zevenhuizen rijd je via de N219 in ongeveer 12-15 minuten naar
                            Nesselande.
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
                            src="/ravennah_staan.webp" />
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline">Persoonlijke aandacht</span><span
                                class="text-emerald-700">.</span>
                        </h2>
                        <p class="intro">
                            Ik ben Ravennah en geef yoga lessen in kleine groepen. Zo kan ik
                            iedereen de aandacht geven die nodig is om te groeien in je
                            yogapraktijk.
                        </p>
                        <p class="intro">
                            Of je nu beginnend yogi bent of al ervaring hebt, je bent welkom
                            om in een ontspannen sfeer te werken aan rust en balans.
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
                            <span class="emerald-underline">Voordelen van hatha yoga</span><span
                                class="text-emerald-700">.</span>
                        </h2>
                        <ul class="text-xl text-emerald-900 space-y-2">
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Verminder stress en vind innerlijke rust
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Verbeter je flexibiliteit en mobiliteit
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Versterk je spieren en balans
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Slaap beter en adem dieper
                            </li>
                        </ul>
                    </div>
                    <div class="w-full md:w-1/2">
                        <NuxtImg class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                            src="/les-buiten.jpg" />
                    </div>
                </div>
            </div>
        </div>

        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto text-center space-y-8">
                <h2 class="text-2xl md:text-4xl uppercase font-black">
                    <span class="emerald-underline">Begin je yoga reis</span><span class="text-emerald-700">.</span>
                </h2>
                <p class="intro max-w-2xl mx-auto">
                    Elke zondag geef ik les van 08:45 tot 09:45 in mijn studio aan de
                    Emmy van Leersumhof 24a in Rotterdam Nesselande. Kom eens langs
                    en ontdek wat yoga voor jou kan betekenen.
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
