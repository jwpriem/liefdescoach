<script lang="ts" setup>
const title = ref('Yoga Ravennah | Privé Yogalessen op Maat');
const description = ref('Privé yogalessen bij Yoga Ravennah in Rotterdam Nesselande. Volledig op maat, persoonlijke aandacht, flexibele tijden — voor individuen of kleine groepen. Ook bij jou thuis mogelijk.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/priveles');

definePageMeta({
    // layout: 'yoga'
})

useHead({
    title,
    link: [
        { rel: 'canonical', href: pageUrl },
    ],
    meta: [
        {hid: 'description', name: 'description', content: description},
        {hid: 'og:title', property: 'og:title', content: title},
        {hid: 'og:url', property: 'og:url', content: pageUrl},
        {hid: 'og:description', property: 'og:description', content: description},
        {hid: 'og:image', property: 'og:image', content: ogImage},
        {hid: "twitter:title", name: "twitter:title", content: title},
        {hid: "twitter:url", name: "twitter:url", content: pageUrl},
        {hid: 'twitter:description', name: 'twitter:description', content: description},
        {hid: "twitter:image", name: "twitter:image", content: ogImage},
    ]
})

useLocalBusinessSchema()
</script>

<template>
    <div>

        <!-- HERO -->
        <Header alignment="object-center" image="/priveles.jpeg" alt="Yoga docent Ravennah geeft privéles">
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Privé Yogalessen</span><span class="text-emerald-600">.</span>
            </h1>
            <p class="intro">
                Wil je dieper in yoga duiken met alle aandacht voor jou? Of gewoon kennismaken in een vertrouwde,
                besloten setting? Een privéles is volledig afgestemd op jouw wensen, tempo en doelen.
            </p>
            <div class="flex flex-wrap gap-3 pt-2">
                <nuxt-link class="emerald button" to="/contact">Plan een privéles</nuxt-link>
                <nuxt-link class="emerald-outlined button" to="/tarieven">Tarieven</nuxt-link>
            </div>
        </Header>

        <!-- WHY PRIVATE -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Waarom een privéles</span><span class="text-emerald-600">?</span>
                    </h2>
                    <p class="intro max-w-xl mx-auto">
                        Iedereen heeft andere redenen om voor een privéles te kiezen. Dit zijn de meest voorkomende.
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div v-for="card in [
                        { icon: 'M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z', title: 'Eigen doelen', text: 'Je hebt een specifiek doel — meer ontspanning, een sterkere rug, betere ademhaling — en wil daar gericht aan werken.' },
                        { icon: 'M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z', title: 'Comfortabel beginnen', text: 'Je wil yoga een keer proberen maar voelt je nog niet klaar voor een groepsles. In een privéles is alle ruimte voor vragen en onzekerheid.' },
                        { icon: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z', title: 'Samen met anderen', text: 'Je wil yoga samen met vrienden, familie of collega\'s beleven in een exclusieve groepssessie — op jullie eigen moment.' },
                    ]" :key="card.title"
                        class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
                            <svg class="w-6 h-6 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" :d="card.icon" />
                            </svg>
                        </div>
                        <h3 class="text-base font-bold uppercase text-emerald-100">{{ card.title }}</h3>
                        <p class="text-emerald-200/70 text-base font-light leading-relaxed">{{ card.text }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- OPTIONS -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2">
                        <img
                            class="w-full h-72 md:h-[30rem] object-center object-cover rounded-3xl shadow-xl"
                            src="/priveles-2.jpeg"
                            alt="Yoga docent Ravennah in meditatiehouding"
                        />
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                            <span class="emerald-underline">Locatie & mogelijkheden</span><span class="text-emerald-600">.</span>
                        </h2>
                        <p class="text-lg text-emerald-900 font-light leading-relaxed">
                            Privélessen zijn altijd op aanvraag en flexibel in te plannen. Samen kijken we wat het
                            beste bij jouw situatie past.
                        </p>
                        <ul class="space-y-4">
                            <li v-for="option in [
                                { title: 'In de studio', text: 'Bij mij thuis in Rotterdam Nesselande — rustig, vertrouwd en volledig ingericht voor yoga.' },
                                { title: 'Bij jou thuis', text: 'Ik kom naar jou toe. Prettig als je de verplaatsing wil beperken of liever in een vertrouwde omgeving start.' },
                                { title: 'Individueel of in een groep', text: 'Zowel 1-op-1 als met een kleine groep vrienden, familie of collega\'s.' },
                                { title: 'Flexibele timing', text: 'Geen vaste tijden — we plannen samen een moment dat past.' },
                            ]" :key="option.title" class="flex items-start space-x-3">
                                <svg class="w-5 h-5 mt-0.5 shrink-0 text-emerald-600 stroke-current" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <div>
                                    <p class="font-bold text-emerald-900 text-sm uppercase">{{ option.title }}</p>
                                    <p class="text-emerald-800 text-base font-light">{{ option.text }}</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- GALLERY -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto space-y-6">
                <div class="text-center space-y-3 mb-8">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Sfeerimpressie</span><span class="text-emerald-600">.</span>
                    </h2>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <img class="w-full h-48 md:h-64 object-cover rounded-2xl shadow-lg" src="/priveles-3.jpeg" alt="Sfeerimpressie privéles" />
                    <img class="w-full h-48 md:h-64 object-cover rounded-2xl shadow-lg" src="/priveles-4.jpeg" alt="Sfeerimpressie privéles — zittende houding" />
                    <img class="w-full h-48 md:h-64 object-cover rounded-2xl shadow-lg" src="/priveles-5.jpeg" alt="Sfeerimpressie privéles — meditatie" />
                    <img class="w-full h-48 md:h-64 object-cover rounded-2xl shadow-lg" src="/priveles-6.jpeg" alt="Sfeerimpressie privéles — asana" />
                    <img class="w-full h-48 md:h-64 object-cover rounded-2xl shadow-lg" src="/priveles-7.jpeg" alt="Sfeerimpressie privéles — stretch" />
                    <img class="w-full h-48 md:h-64 object-cover rounded-2xl shadow-lg" src="/priveles-8.jpeg" alt="Sfeerimpressie privéles — ontspanning" />
                </div>
            </div>
        </div>

        <!-- CTA -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="max-w-2xl mx-auto text-center space-y-8">
                    <Yoga />
                    <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                        <span class="emerald-underline">Plan jouw les</span><span class="text-emerald-600">.</span>
                    </h2>
                    <p class="text-xl text-emerald-900 font-light leading-relaxed">
                        Benieuwd naar de mogelijkheden of wil je direct een privéles plannen?
                        Stuur gerust een bericht — dan bespreken we samen jouw wensen, de locatie
                        en het aantal deelnemers.
                    </p>
                    <div class="flex flex-wrap justify-center gap-3">
                        <nuxt-link class="emerald button" to="/contact">Stuur een bericht</nuxt-link>
                        <nuxt-link class="emerald-outlined button" to="/tarieven">Bekijk tarieven</nuxt-link>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>
