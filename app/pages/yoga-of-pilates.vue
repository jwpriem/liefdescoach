<script lang="ts" setup>
const title = ref('Yoga Ravennah | Yoga als alternatief voor Pilates — Rotterdam Nesselande');
const description = ref('Zoek je pilates in Rotterdam? Hatha yoga is een geweldig alternatief: zelfde focus op ademhaling, core en flexibiliteit — met meer rust en persoonlijke aandacht. Kleine groepen, geen ervaring nodig.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga-of-pilates');

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
        { hid: 'twitter:title', name: 'twitter:title', content: title },
        { hid: 'twitter:url', name: 'twitter:url', content: pageUrl },
        { hid: 'twitter:description', name: 'twitter:description', content: description },
        { hid: 'twitter:image', name: 'twitter:image', content: ogImage },
    ]
})

useLocalBusinessSchema()

const similarities = [
    {
        icon: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z',
        title: 'Core en stabiliteit',
        text: 'Zowel pilates als yoga trainen de diepere rompspieren die je houding en rugkracht ondersteunen.',
    },
    {
        icon: 'M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53',
        title: 'Bewuste ademhaling',
        text: 'De adem staat centraal in beide disciplines. Je leert bewust te ademen als fundament voor beweging en ontspanning.',
    },
    {
        icon: 'M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z',
        title: 'Flexibiliteit',
        text: 'Beide methoden verbeteren de soepelheid van spieren en gewrichten via gerichte, gecontroleerde bewegingen.',
    },
    {
        icon: 'M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605',
        title: 'Betere houding',
        text: 'Rugpijn, stijve schouders, kantoorhouding — yoga en pilates pakken beiden de oorzaak aan via kracht en bewustzijn.',
    },
    {
        icon: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z',
        title: 'Lage belasting',
        text: 'Geen springen, geen blessurerisico. Beide zijn geschikt voor mensen die zacht maar effectief willen bewegen.',
    },
    {
        icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
        title: 'Voor iedereen',
        text: 'Geen sportachtergrond vereist. Zowel pilates als yoga zijn toegankelijk voor beginners en mensen van elke leeftijd.',
    },
]

const comparison = [
    { aspect: 'Focus', pilates: 'Core kracht & stabiliteit', yoga: 'Kracht, lenigheid & rust' },
    { aspect: 'Ademhaling', pilates: 'Techniektool tijdens beweging', yoga: 'Centraal in de hele les' },
    { aspect: 'Ontspanning', pilates: 'Beperkt', yoga: 'Uitgebreid (savasana, meditatie)' },
    { aspect: 'Materiaal', pilates: 'Vaak apparaten (reformer)', yoga: 'Alleen een mat' },
    { aspect: 'Filosofie', pilates: 'Bewegingsleer', yoga: 'Lichaam én geest' },
    { aspect: 'Stressreductie', pilates: 'Indirect', yoga: 'Direct doel van de les' },
]
</script>

<template>
    <div>

        <!-- HERO -->
        <Header image="/ravennah_staan.webp" alignment="object-top" alt="Yoga docent Ravennah in een staande balanshouding">
            <div class="mb-2">
                <span class="bg-emerald-700/80 text-emerald-100 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Pilates alternatief
                </span>
            </div>
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Yoga of pilates</span><span class="text-emerald-600">?</span>
            </h1>
            <p class="intro">
                Zoek je pilates lessen in de buurt? Hatha yoga is een geweldig alternatief — met dezelfde focus op
                ademhaling, core en flexibiliteit, maar met méér rust, meer variatie en meer aandacht voor jou als persoon.
            </p>
            <p class="intro text-emerald-300/80">
                In Rotterdam Nesselande geef ik yogalessen in kleine groepen. Geen ervaring nodig, geen abonnement verplicht.
            </p>
            <div class="flex flex-wrap gap-3 pt-2">
                <nuxt-link class="emerald button" to="/eerste-les">Probeer een eerste les</nuxt-link>
                <nuxt-link class="emerald-outlined button" to="/lessen">Bekijk het rooster</nuxt-link>
            </div>
        </Header>

        <!-- WAT HEBBEN ZE GEMEEN -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Meer gemeen dan je denkt</span><span class="text-emerald-600">.</span>
                    </h2>
                    <p class="intro max-w-2xl mx-auto">
                        Pilates en yoga worden vaak als aparte werelden gezien, maar de overeenkomsten zijn groot.
                        Als pilates jou aanspreekt, is de kans groot dat yoga ook bij jou past.
                    </p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div v-for="item in similarities" :key="item.title"
                        class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center">
                            <svg class="w-5 h-5 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                            </svg>
                        </div>
                        <h3 class="text-sm font-bold uppercase text-emerald-100">{{ item.title }}</h3>
                        <p class="text-emerald-200/70 text-base font-light leading-relaxed">{{ item.text }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- WAT YOGA MEER BIEDT -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2">
                        <img
                            class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
                            src="/ravennah-zwart.jpg"
                            alt="Yoga docent Ravennah in een rustgevende houding"
                        />
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                            <span class="emerald-underline">Wat yoga extra biedt</span><span class="text-emerald-600">.</span>
                        </h2>
                        <p class="text-lg text-emerald-900 font-light leading-relaxed">
                            Yoga deelt de kern van pilates, maar gaat verder. Het is een complete methode die lichaam
                            en geest verbindt — niet alleen op de mat, maar ook daarbuiten.
                        </p>
                        <ul class="space-y-4">
                            <li v-for="extra in [
                                { title: 'Diepe ontspanning', text: 'Elke les eindigt met savasana: een geleide ontspanning waarbij je lichaam en geest volledig tot rust komen. Uniek voor yoga.' },
                                { title: 'Stressvermindering als doel', text: 'Waar pilates primair gericht is op beweging, is stressreductie in yoga een bewust onderdeel van de les — via adem, houding en stilte.' },
                                { title: 'Geen apparaten of materiaal', text: 'Alleen een mat. Geen reformer, geen machines — yoga is overal te doen en vraagt geen extra investering.' },
                                { title: 'Persoonlijke aandacht', text: 'In kleine groepen van maximaal 8 personen krijg je échte aandacht. Geen anonieme studiosfeer.' },
                            ]" :key="extra.title" class="flex items-start space-x-3">
                                <svg class="w-5 h-5 mt-0.5 shrink-0 text-emerald-600 stroke-current" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <div>
                                    <p class="font-bold text-emerald-900 text-sm uppercase">{{ extra.title }}</p>
                                    <p class="text-emerald-800 text-base font-light">{{ extra.text }}</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- VERGELIJKING -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Pilates vs yoga</span><span class="text-emerald-600">.</span>
                    </h2>
                    <p class="intro max-w-xl mx-auto">
                        Een eerlijke vergelijking op de punten die het meest tellen.
                    </p>
                </div>
                <div class="max-w-3xl mx-auto">
                    <div class="grid grid-cols-3 gap-0 mb-3 px-4">
                        <p class="text-xs uppercase font-bold text-emerald-500 tracking-wide"></p>
                        <p class="text-xs uppercase font-bold text-emerald-500 tracking-wide text-center">Pilates</p>
                        <p class="text-xs uppercase font-bold text-emerald-400 tracking-wide text-center">Hatha Yoga</p>
                    </div>
                    <div class="space-y-2">
                        <div v-for="row in comparison" :key="row.aspect"
                            class="grid grid-cols-3 gap-0 bg-gray-900 border border-gray-800 rounded-xl p-4 items-start">
                            <p class="text-xs font-bold uppercase text-emerald-500 tracking-wide pt-0.5">{{ row.aspect }}</p>
                            <p class="text-sm text-emerald-200/60 font-light text-center px-2">{{ row.pilates }}</p>
                            <p class="text-sm text-emerald-300 font-medium text-center px-2">{{ row.yoga }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- HATHA IS DE DICHTSTBIJZIJNDE STIJL -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-start md:space-x-16 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                            <span class="emerald-underline">Waarom hatha yoga</span><span class="text-emerald-600">?</span>
                        </h2>
                        <p class="text-lg text-emerald-900 font-light leading-relaxed">
                            Van alle yogastijlen sluit hatha yoga het dichtst aan bij pilates. De lessen zijn rustig,
                            gestructureerd en gericht op de verbinding tussen lichaam en adem — zonder dat je acrobatische
                            houdingen hoeft te maken.
                        </p>
                        <p class="text-lg text-emerald-900 font-light leading-relaxed">
                            Je werkt aan kracht, soepelheid en balans via houdingen die je stap voor stap opbouwt.
                            Hatha yoga is bij uitstek geschikt voor mensen die van pilates houden maar iets nieuws
                            willen proberen — of gewoon eens willen uitrusten.
                        </p>
                        <blockquote class="border-l-4 border-emerald-600 pl-5 italic text-emerald-800 text-lg">
                            "Ha" staat voor zon, "tha" voor maan — activiteit én rust in balans.
                        </blockquote>
                        <nuxt-link class="emerald-outlined button inline-block" to="/hatha-yoga">
                            Meer over hatha yoga
                        </nuxt-link>
                    </div>
                    <div class="w-full md:w-1/2 space-y-4">
                        <div class="bg-emerald-200/60 rounded-2xl p-6 space-y-5">
                            <h3 class="text-sm font-bold uppercase text-emerald-900">Hatha yoga is ideaal als je...</h3>
                            <ul class="space-y-3">
                                <li v-for="point in [
                                    'Van pilates houdt maar iets nieuws wil proberen',
                                    'Rust en herstel zoekt naast andere sporten',
                                    'Last hebt van een stijve rug, nek of schouders',
                                    'Wil bewegen zonder hoge impact of blessurerisico',
                                    'Behoefte hebt aan een moment voor jezelf',
                                    'Stress wil verminderen op een actieve manier',
                                ]" :key="point" class="flex items-start space-x-3">
                                    <svg class="w-5 h-5 mt-0.5 shrink-0 text-emerald-600 stroke-current" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    <span class="text-emerald-900 text-base font-light">{{ point }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- YOGA BIJ RAVENNAH -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline">Yoga bij Ravennah</span><span class="text-emerald-600">.</span>
                        </h2>
                        <p class="intro">
                            In Rotterdam Nesselande geef ik hatha yogalessen in een rustige, huiselijke setting.
                            Herkenbaar voor iedereen die van pilates houdt: aandacht voor uitlijning, bewuste
                            ademhaling en een opbouw die je lichaam respecteert.
                        </p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div v-for="info in [
                                { icon: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z', label: 'Kleine groep', value: 'Maximaal 8 personen' },
                                { icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5', label: 'Dag & tijd', value: 'Zondag 08:45 – 09:45' },
                                { icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z', label: 'Locatie', value: 'Rotterdam Nesselande' },
                                { icon: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', label: 'Ervaring nodig', value: 'Nee — beginners welkom' },
                            ]" :key="info.label"
                                class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center space-x-3">
                                <div class="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center shrink-0">
                                    <svg class="w-4 h-4 text-emerald-400 stroke-current" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" :d="info.icon" />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-xs uppercase text-emerald-400 font-bold tracking-wide">{{ info.label }}</p>
                                    <p class="text-emerald-100 text-sm font-medium">{{ info.value }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="w-full md:w-1/2">
                        <img
                            class="w-full h-72 md:h-[30rem] object-cover object-top rounded-3xl shadow-xl"
                            src="/yoga-sfeer.jpg"
                            alt="Sfeerimpressie yogales bij Ravennah"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- CTA -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="max-w-2xl mx-auto text-center space-y-8">
                    <Yoga />
                    <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                        <span class="emerald-underline">Probeer het zelf</span><span class="text-emerald-600">.</span>
                    </h2>
                    <p class="text-xl text-emerald-900 font-light leading-relaxed">
                        Boek een losse les voor € 16,00 en ontdek of yoga jouw nieuwe pilates wordt.
                        Geen abonnement, geen verplichting — gewoon een uur voor jezelf.
                    </p>
                    <div class="flex flex-wrap justify-center gap-3">
                        <nuxt-link class="emerald button" to="/eerste-les">Jouw eerste les</nuxt-link>
                        <nuxt-link class="emerald-outlined button" to="/lessen">Bekijk het rooster</nuxt-link>
                        <nuxt-link class="emerald-outlined button" to="/tarieven">Tarieven</nuxt-link>
                    </div>
                    <p class="text-sm text-emerald-700">Geen abonnement. Geen verplichting. Gewoon komen.</p>
                </div>
            </div>
        </div>

    </div>
</template>
