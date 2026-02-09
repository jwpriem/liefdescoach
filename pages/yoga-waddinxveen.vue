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

useLocationPageSchema('Waddinxveen', 'https://www.ravennah.com/yoga-waddinxveen', description.value)
</script>

<template>
    <div>
        <Header image="/ravennah-donker.jpg">
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Yoga Waddinxveen</span><span class="text-emerald-700">.</span>
            </h1>
            <p class="intro">
                Woon je in Waddinxveen en ben je op zoek naar yoga lessen? Yoga Ravennah in Rotterdam
                Nesselande is slechts 15 minuten rijden. Ik bied laagdrempelige hatha yoga lessen in
                kleine groepen met veel persoonlijke aandacht.
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
                            <span class="emerald-underline text-emerald-900">Waarom Yoga Ravennah</span><span
                                class="text-emerald-700">?</span>
                        </h2>
                        <p class="text-xl text-emerald-900">
                            Vanuit Waddinxveen bereik je de studio in slechts <span
                                class="text-emerald-700 font-bold">15 minuten</span>
                            via de N219. Pak de A12 richting Rotterdam en neem afslag Nesselande. Gratis parkeren voor
                            de deur.
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
                            src="/ravennah_squat_2.webp" />
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline">Small group lessen</span><span
                                class="text-emerald-700">.</span>
                        </h2>
                        <p class="intro">
                            In tegenstelling tot grote yoga studio's werk ik met kleine groepen.
                            Zo krijg je de persoonlijke aandacht die je verdient en kan ik je
                            helpen met jouw specifieke doelen.
                        </p>
                        <p class="intro">
                            Of je nu stress wilt verminderen, flexibeler wilt worden, of gewoon
                            een moment van rust zoekt - je bent van harte welkom.
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
                            <span class="emerald-underline">Wat biedt hatha yoga</span><span
                                class="text-emerald-700">?</span>
                        </h2>
                        <ul class="text-xl text-emerald-900 space-y-2">
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Stressvermindering en innerlijke rust
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Verbeterde flexibiliteit en mobiliteit
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Versterking van spieren en balans
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="text-emerald-600">✓</span> Betere ademhaling en slaap
                            </li>
                        </ul>
                    </div>
                    <div class="w-full md:w-1/2">
                        <NuxtImg class="w-full h-64 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                            src="/yoga-sfeer.jpg" />
                    </div>
                </div>
            </div>
        </div>

        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto text-center space-y-8">
                <h2 class="text-2xl md:text-4xl uppercase font-black">
                    <span class="emerald-underline">Kom langs vanuit Waddinxveen</span><span
                        class="text-emerald-700">.</span>
                </h2>
                <p class="intro max-w-2xl mx-auto">
                    Elke zondag van 08:45 tot 09:45 geef ik les in mijn studio aan de
                    Emmy van Leersumhof 24a in Rotterdam Nesselande. Boek je eerste les
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
