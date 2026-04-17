<script setup lang="ts">
const title = ref('Yoga Ravennah | Bo Bol — Gastdocent Yin Yoga');
const description = ref('Maak kennis met Bo Bol, gastdocent yin yoga bij Yoga Ravennah. Met 15 jaar leservaring en een opleiding bij Ram Jain brengt Bo diepgang, rust en balans in elke les. "Geen yin zonder yang."');
const ogImage = ref('https://www.ravennah.com/bo-bol-social.webp');
const pageUrl = ref('https://www.ravennah.com/bo-bol');

definePageMeta({
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
</script>

<template>
    <div>

        <!-- HERO -->
        <Header image="/bo-bol.webp" alignment="object-top">
            <div class="mb-2">
                <span class="bg-emerald-700/80 text-emerald-100 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Gastdocent
                </span>
            </div>
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Bo Bol</span><span class="text-emerald-600">.</span>
            </h1>
            <p class="intro">
                Graag stel ik jullie voor aan Bo Bol — gastdocent en de man achter het motto:
                <span class="italic text-emerald-400">"Geen yin zonder yang."</span>
                Bo combineert jarenlange yogaervaring met een rijke achtergrond in de zorg, en dat voel je in elke les.
            </p>
            <div class="flex flex-wrap gap-3 pt-2">
                <nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
                <nuxt-link class="emerald-outlined button" to="/contact">Neem contact op</nuxt-link>
            </div>
        </Header>

        <!-- WIE IS BO -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                            <span class="emerald-underline">Wie is Bo</span><span class="text-emerald-600">?</span>
                        </h2>
                        <p class="text-lg text-emerald-900 font-light leading-relaxed">
                            Bo geeft inmiddels zo'n <span class="font-bold text-emerald-700">15 jaar yogales</span>,
                            waarvan de laatste 10 jaar met een sterke focus op <span class="font-bold">yin yoga</span>.
                            Hij volgde zijn opleiding bij de gerenommeerde yogaleraar Ram Jain en zijn allereerste
                            yogales had hij al begin jaren '70.
                        </p>
                        <p class="text-lg text-emerald-900 font-light leading-relaxed">
                            Met yoga wil Bo deelnemers iets meegeven voor hun welzijn — iets wat je niet alleen op de
                            mat, maar ook daarbuiten kunt voelen. Zijn lessen zijn gegrond, menselijk en altijd met
                            aandacht voor de mens die voor hem staat.
                        </p>
                        <blockquote class="border-l-4 border-emerald-600 pl-5 italic text-emerald-800 text-lg">
                            "Geen yin zonder yang."
                        </blockquote>
                    </div>
                    <div class="w-full md:w-1/2 space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-white/60 rounded-2xl p-5 text-center space-y-1">
                                <p class="text-3xl font-black text-emerald-700">15</p>
                                <p class="text-sm font-bold uppercase text-emerald-900">Jaar leservaring</p>
                            </div>
                            <div class="bg-white/60 rounded-2xl p-5 text-center space-y-1">
                                <p class="text-3xl font-black text-emerald-700">10</p>
                                <p class="text-sm font-bold uppercase text-emerald-900">Jaar yin focus</p>
                            </div>
                            <div class="bg-white/60 rounded-2xl p-5 col-span-2 space-y-1">
                                <p class="text-sm font-bold uppercase text-emerald-900">Opleiding</p>
                                <p class="text-emerald-800 font-light text-base">Ram Jain — internationaal erkend yoga-opleider</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- LES OPBOUW -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-start md:space-x-16 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline">Een les van Bo</span><span class="text-emerald-600">.</span>
                        </h2>
                        <p class="intro">
                            Bo's lessen volgen een vaste, rustige opbouw — altijd gericht op balans tussen activiteit
                            en rust, tussen spanning en loslaten.
                        </p>
                        <ol class="space-y-5">
                            <li v-for="(step, i) in [
                                { title: 'Welkom & ontspanningsritueel', text: 'De les begint bewust en rustig. Een moment om te landen, de buitenwereld los te laten en aanwezig te zijn.' },
                                { title: '3 à 4 yin-asana\'s', text: 'Lange, passieve houdingen die diep inwerken op bindweefsel en gewrichten. Hier zit de kern van Bo\'s les.' },
                                { title: 'Yang-oefeningen', text: 'Aanvullend op het yin-gedeelte: actievere bewegingen die het lichaam opwarmen en in balans brengen met de rustige houdingen.' },
                                { title: 'Afsluiting', text: 'ZEN-zitten (3–5 minuten), een ontspanningsmeditatie of een ademhalingsoefening. De les sluit zo bewust af als hij begint.' },
                            ]" :key="step.title" class="flex items-start space-x-4">
                                <div class="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                    <span class="text-emerald-400 text-sm font-bold">{{ i + 1 }}</span>
                                </div>
                                <div>
                                    <p class="font-bold text-emerald-300 uppercase text-sm">{{ step.title }}</p>
                                    <p class="text-emerald-100/70 text-base font-light leading-relaxed">{{ step.text }}</p>
                                </div>
                            </li>
                        </ol>
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                            <h3 class="text-sm font-bold uppercase text-emerald-400">Aandacht voor ademhaling</h3>
                            <p class="text-emerald-100/80 text-base font-light leading-relaxed">
                                Gedurende de hele les — maar met name tijdens het yin-gedeelte — is er doorlopend aandacht
                                voor de ademhaling. De adem is het kompas: hij vertelt je wanneer je te ver gaat en wanneer
                                je verder kunt gaan.
                            </p>
                        </div>
                        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                            <h3 class="text-sm font-bold uppercase text-emerald-400">Geen yin zonder yang</h3>
                            <p class="text-emerald-100/80 text-base font-light leading-relaxed">
                                Bo's lesmotto is meer dan een uitdrukking. Het is een filosofie: pas als je rust kent,
                                kun je activiteit waarderen. En andersom. In elke les brengt hij deze balans bewust tot leven.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ACHTERGROND -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0">
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                            <span class="emerald-underline">Achtergrond</span><span class="text-emerald-600">.</span>
                        </h2>
                        <p class="text-lg text-emerald-900 font-light leading-relaxed">
                            Maatschappelijk gezien heeft Bo een rijke en brede achtergrond in de zorg. Die levenservaring
                            voel je terug in zijn lessen: gegrond, menselijk en met aandacht voor wie er voor hem zit.
                        </p>
                        <ul class="space-y-3">
                            <li v-for="item in [
                                'Begonnen als fysiotherapeut',
                                'Overgestapt naar verpleegkunde — waaronder 3 jaar op de Intensive Care',
                                'Groepswerk en diverse functies in de zorgsector',
                                'De laatste 7 jaar werkzaam als maatschappelijk werker, met accent op schuldhulpverlening en begeleiding achter de voordeur',
                            ]" :key="item" class="flex items-start space-x-3">
                                <svg class="w-5 h-5 mt-0.5 shrink-0 text-emerald-600 stroke-current" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <span class="text-emerald-900 text-base">{{ item }}</span>
                            </li>
                        </ul>
                    </div>
                    <div class="w-full md:w-1/2">
                        <div class="bg-emerald-200/60 rounded-2xl p-8 space-y-4 text-center">
                            <Yoga />
                            <p class="text-emerald-900 text-lg font-light italic leading-relaxed">
                                "Met yoga wil Bo deelnemers iets meegeven voor hun welzijn — iets wat je niet alleen
                                op de mat, maar ook daarbuiten kunt voelen."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- CTA -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto text-center space-y-8">
                <h2 class="text-2xl md:text-4xl uppercase font-black">
                    <span class="emerald-underline">Ervaar het zelf</span><span class="text-emerald-600">.</span>
                </h2>
                <p class="intro max-w-2xl mx-auto">
                    Benieuwd wanneer Bo de volgende gastles geeft? Bekijk het lesrooster of neem contact
                    op met Ravennah voor meer informatie over de planning.
                </p>
                <div class="flex flex-wrap justify-center gap-3">
                    <nuxt-link class="emerald button" to="/lessen">Bekijk het rooster</nuxt-link>
                    <nuxt-link class="emerald-outlined button" to="/contact">Neem contact op</nuxt-link>
                </div>
            </div>
        </div>

    </div>
</template>
