<script lang="ts" setup>
const title = ref("Yoga Ravennah | Jouw eerste les — ook zonder ervaring");
const description = ref(
    "Nog nooit yoga gedaan? Perfect. De lessen van Yoga Ravennah zijn laagdrempelig, kleinschalig en speciaal geschikt voor beginners. Maak een account aan, boek je eerste les en ontdek wat yoga voor jou kan doen.",
);
const ogImage = ref("https://www.ravennah.com/ravennah-social.jpg");
const pageUrl = ref("https://www.ravennah.com/eerste-les");

definePageMeta({
    // layout: 'yoga'
});

useHead({
    title,
    link: [{ rel: "canonical", href: pageUrl }],
    meta: [
        { hid: "description", name: "description", content: description },
        { hid: "og:title", property: "og:title", content: title },
        { hid: "og:url", property: "og:url", content: pageUrl },
        {
            hid: "og:description",
            property: "og:description",
            content: description,
        },
        { hid: "og:image", property: "og:image", content: ogImage },
        { hid: "twitter:title", name: "twitter:title", content: title },
        { hid: "twitter:url", name: "twitter:url", content: pageUrl },
        {
            hid: "twitter:description",
            name: "twitter:description",
            content: description,
        },
        { hid: "twitter:image", name: "twitter:image", content: ogImage },
    ],
});

useLocalBusinessSchema();

const worries = [
    {
        fear: "\u201CIk ben veel te stijf voor yoga.\u201D",
        answer: "Stijfheid is géén reden om géén yoga te doen — het is juist de reden om te beginnen. Hatha yoga is bij uitstek bedoeld voor mensen die niet soepel zijn. Na een paar lessen merk je zelf het verschil.",
        icon: "M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z",
    },
    {
        fear: "\u201CIk weet niet hoe het werkt en doe het vast fout.\u201D",
        answer: 'Elke houding wordt stap voor stap uitgelegd. Er is geen "fout" in mijn lessen. Ik kijk wie er voor me zit en pas de instructies aan op het niveau van de groep.',
        icon: "M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
    },
    {
        fear: "\u201CIk voel me opgelaten tussen mensen die het al kunnen.\u201D",
        answer: "De groepen zijn klein — maximaal 9 personen. Iedereen begint ergens en niemand let op de ander. De sfeer is warm en zonder oordeel. Dat is precies wat ik bewust creëer.",
        icon: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
    },
    {
        fear: "\u201CIk weet niet of yoga iets voor mij is.\u201D",
        answer: "Dat hoef je van tevoren ook niet te weten. Dat is precies waarom je gewoon één les kunt boeken — zonder abonnement, zonder verplichting. Ontdek het ter plekke.",
        icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z",
    },
];
</script>

<template>
    <div>
        <!-- HERO -->
        <Header
            image="/ravennah_staan.webp"
            alignment="object-center"
            alt="Yoga docent Ravennah in staande houding"
        >
            <div class="mb-2">
                <span
                    class="bg-emerald-700/80 text-emerald-100 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                >
                    Geen ervaring nodig
                </span>
            </div>
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Jouw eerste les</span
                ><span class="text-emerald-600">.</span>
            </h1>
            <p class="intro">
                Nog nooit yoga gedaan? Dat is de beste reden om te beginnen. De
                lessen bij Yoga Ravennah zijn kleinschalig, laagdrempelig en
                helemaal geschikt voor mensen die nog nooit een mat hebben
                uitgerold.
            </p>
            <p class="intro text-emerald-300/80">
                Maak een account aan, kies een les in het rooster en kom langs.
                Zo simpel is het.
            </p>
            <div class="flex flex-wrap gap-3 pt-2">
                <nuxt-link class="emerald button" to="/login"
                    >Maak een account aan</nuxt-link
                >
                <nuxt-link class="emerald-outlined button" to="/lessen"
                    >Bekijk het rooster</nuxt-link
                >
            </div>
        </Header>

        <!-- TWIJFELS WEGNEMEN -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Herken jij dit</span
                        ><span class="text-emerald-600">?</span>
                    </h2>
                    <p class="intro max-w-xl mx-auto">
                        Veel mensen twijfelen voor hun eerste les. Hier zijn de
                        meest voorkomende zorgen — en waarom ze je niet hoeven
                        te stoppen.
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div
                        v-for="worry in worries"
                        :key="worry.fear"
                        class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
                    >
                        <div class="flex items-start space-x-3">
                            <div
                                class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5"
                            >
                                <svg
                                    class="w-5 h-5 text-emerald-400 stroke-current"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        :d="worry.icon"
                                    />
                                </svg>
                            </div>
                            <p
                                class="text-emerald-300 font-bold italic text-base leading-snug"
                                v-html="worry.fear"
                            />
                        </div>
                        <p
                            class="text-emerald-100/70 text-base font-light leading-relaxed pl-13"
                        >
                            {{ worry.answer }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- HOE HET WERKT -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2
                        class="text-2xl md:text-4xl uppercase font-black text-emerald-900"
                    >
                        <span class="emerald-underline">Zo werkt het</span
                        ><span class="text-emerald-600">.</span>
                    </h2>
                    <p
                        class="text-lg text-emerald-900 font-light max-w-xl mx-auto"
                    >
                        Van nul naar je eerste les in drie stappen.
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div
                        v-for="(step, i) in [
                            {
                                title: 'Maak een gratis account',
                                text: 'Ga naar de inlogpagina en registreer je. Geen abonnement, geen verplichtingen — gewoon een account zodat je een les kunt reserveren.',
                                cta: 'Account aanmaken',
                                link: '/login',
                                icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
                            },
                            {
                                title: 'Kies een les in het rooster',
                                text: 'Bekijk het lesrooster en boek de zondag die jou uitkomt. Je ziet direct hoeveel plekken er nog vrij zijn.',
                                cta: 'Bekijk het rooster',
                                link: '/lessen',
                                icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
                            },
                            {
                                title: 'Kom langs op zondag',
                                text: 'Zondag 08:45 aan de Emmy van Leersumhof 24a in Rotterdam Nesselande. Gratis parkeren voor de deur. Neem comfortabele kleding en een waterflesje mee.',
                                cta: null,
                                link: null,
                                icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
                            },
                        ]"
                        :key="step.title"
                        class="bg-white/60 rounded-2xl p-6 space-y-4"
                    >
                        <div class="flex items-center space-x-3">
                            <div
                                class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0"
                            >
                                <span class="text-white font-black text-base">{{
                                    i + 1
                                }}</span>
                            </div>
                            <h3
                                class="text-base font-bold uppercase text-emerald-900"
                            >
                                {{ step.title }}
                            </h3>
                        </div>
                        <p
                            class="text-emerald-800 text-base font-light leading-relaxed"
                        >
                            {{ step.text }}
                        </p>
                        <nuxt-link
                            v-if="step.cta && step.link"
                            :to="step.link"
                            class="inline-flex items-center space-x-1 text-emerald-700 font-bold text-sm hover:text-emerald-900 transition-colors"
                        >
                            <span>{{ step.cta }}</span>
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                />
                            </svg>
                        </nuxt-link>
                        <div
                            v-else
                            class="flex items-center space-x-2 text-emerald-600 text-sm font-bold"
                        >
                            <svg
                                class="w-4 h-4 stroke-current"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                            <span>Klaar — je ziet je af!</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- WAT TE VERWACHTEN -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div
                    class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0"
                >
                    <div class="w-full md:w-1/2">
                        <img
                            class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
                            src="/warmingup.webp"
                            alt="Warming-up tijdens yogales"
                        />
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline"
                                >Wat gebeurt er in een les</span
                            ><span class="text-emerald-600">?</span>
                        </h2>
                        <p class="intro">
                            Een les duurt 60 minuten en heeft altijd dezelfde
                            rustige opbouw. Zo weet je precies wat je kunt
                            verwachten.
                        </p>
                        <ol class="space-y-5">
                            <li
                                v-for="(step, i) in [
                                    {
                                        title: 'Landen',
                                        text: 'De les begint rustig. Je arriveert op je mat, sluit je ogen en laat de buitenwereld even achter je. Geen haast.',
                                    },
                                    {
                                        title: 'Warming-up',
                                        text: 'Zachte bewegingen om je gewrichten los te draaien. Niks engs, niks acrobatisch — gewoon wakker worden.',
                                    },
                                    {
                                        title: 'Asana\'s',
                                        text: 'We doorlopen een reeks houdingen die kracht, lenigheid en balans combineren. Elke houding wordt uitgelegd en zo nodig aangepast.',
                                    },
                                    {
                                        title: 'Savasana',
                                        text: 'De les eindigt met een diepe ontspanning. Je legt je neer, sluit je ogen en laat alles gaan. Velen slapen bijna in.',
                                    },
                                ]"
                                :key="step.title"
                                class="flex items-start space-x-4"
                            >
                                <div
                                    class="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-700 flex items-center justify-center shrink-0 mt-0.5"
                                >
                                    <span
                                        class="text-emerald-400 font-bold text-sm"
                                        >{{ i + 1 }}</span
                                    >
                                </div>
                                <div>
                                    <p
                                        class="font-bold text-emerald-300 uppercase text-sm"
                                    >
                                        {{ step.title }}
                                    </p>
                                    <p
                                        class="text-emerald-100/70 text-base font-light leading-relaxed"
                                    >
                                        {{ step.text }}
                                    </p>
                                </div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>

        <!-- TARIEVEN + BELOFTE -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div
                    class="md:flex justify-between items-start md:space-x-16 space-y-8 md:space-y-0"
                >
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2
                            class="text-2xl md:text-4xl uppercase font-black text-emerald-900"
                        >
                            <span class="emerald-underline"
                                >Begin zonder risico</span
                            ><span class="text-emerald-600">.</span>
                        </h2>
                        <p
                            class="text-lg text-emerald-900 font-light leading-relaxed"
                        >
                            Je hoeft niets vooraf te beslissen. Boek één les
                            voor
                            <span class="font-bold text-emerald-700"
                                >€ 16,00</span
                            >
                            en ontdek of yoga iets voor jou is. Geen abonnement,
                            geen verplichting.
                        </p>
                        <div
                            class="bg-emerald-600 rounded-2xl p-6 space-y-3 text-white"
                        >
                            <div class="flex items-center space-x-2">
                                <svg
                                    class="w-5 h-5 shrink-0 stroke-current"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                                    />
                                </svg>
                                <p
                                    class="font-bold uppercase text-sm tracking-wide"
                                >
                                    De belofte
                                </p>
                            </div>
                            <p
                                class="text-white/90 text-base font-light leading-relaxed"
                            >
                                Bevalt het en besluit je na je eerste les een
                                strippenkaart te kopen? Dan wordt je eerste les
                                <strong class="text-white"
                                    >automatisch verrekend</strong
                                >
                                tegen het voordeligste tarief van die kaart. Je
                                betaalt dus nooit meer dan nodig voor je eerste
                                stap.
                            </p>
                        </div>
                    </div>
                    <div class="w-full md:w-1/2 space-y-4">
                        <div
                            v-for="plan in [
                                {
                                    name: 'Losse les',
                                    price: '€ 16,00',
                                    per: '€ 16,00 / les',
                                    tag: 'Begin hier',
                                    tagColor: 'bg-emerald-100 text-emerald-800',
                                    highlight: false,
                                },
                                {
                                    name: 'Kleine kaart',
                                    price: '€ 72,50',
                                    per: '€ 14,50 / les',
                                    tag: '5 lessen',
                                    tagColor: 'bg-gray-100 text-gray-700',
                                    highlight: false,
                                },
                                {
                                    name: 'Strippenkaart',
                                    price: '€ 135,00',
                                    per: '€ 13,50 / les',
                                    tag: '10 lessen — meest gekozen',
                                    tagColor: 'bg-emerald-600 text-white',
                                    highlight: true,
                                },
                                {
                                    name: 'Grote kaart',
                                    price: '€ 250,00',
                                    per: '€ 12,50 / les',
                                    tag: '20 lessen — meest voordelig',
                                    tagColor: 'bg-yellow-100 text-yellow-800',
                                    highlight: false,
                                },
                            ]"
                            :key="plan.name"
                            class="bg-white/70 rounded-xl p-4 flex items-center justify-between"
                            :class="
                                plan.highlight ? 'ring-2 ring-emerald-600' : ''
                            "
                        >
                            <div>
                                <p
                                    class="font-bold text-emerald-900 text-sm uppercase"
                                >
                                    {{ plan.name }}
                                </p>
                                <p class="text-emerald-700 text-xs">
                                    {{ plan.per }}
                                </p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span
                                    class="text-xs font-bold px-2 py-1 rounded-full"
                                    :class="plan.tagColor"
                                    >{{ plan.tag }}</span
                                >
                                <p
                                    class="font-black text-emerald-900 text-base"
                                >
                                    {{ plan.price }}
                                </p>
                            </div>
                        </div>
                        <nuxt-link
                            class="emerald button inline-block w-full text-center"
                            to="/tarieven"
                        >
                            Alle tarieven bekijken
                        </nuxt-link>
                    </div>
                </div>
            </div>
        </div>

        <!-- WAT NEEM JE MEE -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div
                    class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0"
                >
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline"
                                >Wat neem je mee</span
                            ><span class="text-emerald-600">?</span>
                        </h2>
                        <p class="intro">
                            De voorbereiding voor je eerste les is eenvoudig.
                            Hier is alles wat je nodig hebt:
                        </p>
                        <ul class="space-y-4">
                            <li
                                v-for="item in [
                                    {
                                        need: 'Comfortabele sportkleding',
                                        detail: 'Iets waarin je makkelijk kunt bewegen en buigen. Een joggingbroek of legging is perfect.',
                                    },
                                    {
                                        need: 'Een flesje water',
                                        detail: 'Je beweegt een uur lang, dus wat te drinken is fijn.',
                                    },
                                    {
                                        need: 'Een open houding',
                                        detail: 'Dat is echt alles. Geen sportgeschiedenis, geen bijzondere conditie, geen verwachtingen nodig.',
                                    },
                                ]"
                                :key="item.need"
                                class="flex items-start space-x-4"
                            >
                                <div
                                    class="w-8 h-8 rounded-lg bg-emerald-900 border border-emerald-700 flex items-center justify-center shrink-0 mt-0.5"
                                >
                                    <svg
                                        class="w-4 h-4 text-emerald-400 stroke-current"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="m4.5 12.75 6 6 9-13.5"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p
                                        class="font-bold text-emerald-200 text-sm uppercase"
                                    >
                                        {{ item.need }}
                                    </p>
                                    <p
                                        class="text-emerald-100/60 text-base font-light"
                                    >
                                        {{ item.detail }}
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div class="w-full md:w-1/2">
                        <img
                            class="w-full h-72 md:h-[30rem] object-cover object-center rounded-3xl shadow-xl"
                            src="/ravennah_squat.webp"
                            alt="Yoga houding in de les"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- VAN RAVENNAH -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="max-w-2xl mx-auto text-center space-y-8">
                    <Yoga />
                    <h2
                        class="text-2xl md:text-4xl uppercase font-black text-emerald-900"
                    >
                        <span class="emerald-underline">Van Ravennah</span
                        ><span class="text-emerald-600">.</span>
                    </h2>
                    <p
                        class="text-xl text-emerald-900 font-light leading-relaxed"
                    >
                        Ik begon zelf ook als beginner. Ik weet hoe het voelt om
                        niet te weten wat je doet, om je af te vragen of je wel
                        "goed genoeg" bent voor yoga.
                    </p>
                    <p
                        class="text-xl text-emerald-900 font-light leading-relaxed"
                    >
                        Mijn lessen zijn bewust kleinschalig en laagdrempelig.
                        Ik geef les aan mensen die yoga ontdekken, niet aan
                        mensen die het al beheersen. Dat maakt het verschil.
                    </p>
                    <blockquote
                        class="border-l-4 border-emerald-600 pl-6 text-left italic text-emerald-800 text-lg"
                    >
                        "Je hoeft het niet perfect te doen. Je hoeft het alleen
                        maar te proberen."
                    </blockquote>
                    <nuxt-link
                        class="emerald-outlined button inline-block"
                        to="/over"
                    >
                        Meer over Ravennah
                    </nuxt-link>
                </div>
            </div>
        </div>

        <!-- FINAL CTA -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto text-center space-y-8">
                <h2 class="text-2xl md:text-4xl uppercase font-black">
                    <span class="emerald-underline"
                        >Klaar voor je eerste stap</span
                    ><span class="text-emerald-600">?</span>
                </h2>
                <p class="intro max-w-2xl mx-auto">
                    Maak een gratis account aan, kies een zondag in het rooster
                    en kom langs. Je hoeft niets mee te nemen behalve jezelf en
                    een beetje nieuwsgierigheid.
                </p>
                <div class="flex flex-wrap justify-center gap-4">
                    <nuxt-link class="emerald button" to="/login"
                        >Maak een account aan</nuxt-link
                    >
                    <nuxt-link class="emerald-outlined button" to="/lessen"
                        >Bekijk het rooster</nuxt-link
                    >
                    <nuxt-link class="emerald-outlined button" to="/contact"
                        >Stel een vraag</nuxt-link
                    >
                </div>
                <p class="text-emerald-500/60 text-sm">
                    Geen abonnement. Geen verplichting. Gewoon één les proberen.
                </p>
            </div>
        </div>
    </div>
</template>
