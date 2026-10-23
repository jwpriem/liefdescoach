<script lang="ts" setup>
usePageSeo({
    title: "Yoga Ravennah | Yoga op maat voor feesten, bedrijven en events",
    description:
        "Yogasessies op maat voor vrijgezellenfeesten, bedrijven, teamuitjes, workshops en events. In de studio in Rotterdam Nesselande of op elke locatie die jij kiest.",
    path: "/",
});
useLocalBusinessSchema();

const MORE = [
    {
        path: "/hatha-yoga",
        icon: "i-lucide-flower-2",
        name: "Wat is Hatha Yoga?",
        tagline: "De yogastijl die rust en activiteit in balans brengt. Alles over Ha, Tha en wat je kunt verwachten.",
    },
    {
        path: "/voordelen",
        icon: "i-lucide-heart",
        name: "Voordelen van yoga",
        tagline: "Van stressvermindering tot betere slaap. Wat yoga concreet voor je doet, fysiek en mentaal.",
    },
    {
        path: "/yoga-of-pilates",
        icon: "i-lucide-scale",
        name: "Yoga of pilates?",
        tagline: "Twijfel je tussen yoga en pilates? De verschillen en overeenkomsten op een rij.",
    },
];
</script>
<template>
    <div>
        <!-- HERO -->
        <Header
            image="/IMG_7917.JPG"
            alignment="object-top"
            alt="Yoga docent Ravennah in kleermakerszit"
        >
            <div class="mb-2">
                <span
                    class="bg-emerald-700/80 text-emerald-100 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                >
                    Op locatie of in de studio
                </span>
            </div>
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Yoga Ravennah</span
                ><span class="text-emerald-700">.</span>
            </h1>
            <p class="intro">
                Eén keer samen op de mat, helemaal afgestemd op jullie
                gelegenheid. Voor een vrijgezellenfeest, je team, een workshop
                of een event — in mijn studio in Rotterdam Nesselande of op
                elke locatie die jij kiest.
            </p>
            <div class="flex flex-wrap gap-3">
                <nuxt-link class="emerald button" to="/aanvraag"
                    >Vraag een sessie aan</nuxt-link
                >
                <nuxt-link class="emerald-outlined button" to="#aanbod"
                    >Bekijk de mogelijkheden</nuxt-link
                >
            </div>
        </Header>

        <SessionFacts />

        <!-- AANBOD -->
        <div id="aanbod" class="p-8 md:px-0 md:pb-24 scroll-mt-28">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Waar kan ik je mee helpen</span
                        ><span class="text-emerald-600">?</span>
                    </h2>
                    <p class="intro max-w-xl mx-auto">
                        Elke sessie is maatwerk. Kies wat bij jullie
                        gelegenheid past, of vraag gerust naar iets anders.
                    </p>
                </div>
                <LinkCards :links="OFFER_LINKS" />
            </div>
        </div>

        <RequestSteps />

        <AboutRavennah />

        <!-- VOORDELEN -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Wat yoga je brengt</span
                        ><span class="text-emerald-600">.</span>
                    </h2>
                    <p class="text-lg font-light text-emerald-900 max-w-xl mx-auto">
                        Hatha yoga werkt op lichaam én geest. Dit zijn de
                        voordelen die je het snelst merkt.
                    </p>
                </div>
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
                >
                    <div
                        v-for="benefit in [
                            {
                                icon: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z',
                                title: 'Minder stress',
                                text: 'Bewuste ademhaling brengt je zenuwstelsel tot rust.',
                            },
                            {
                                icon: 'M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z',
                                title: 'Meer flexibiliteit',
                                text: 'Soepelere spieren en gewrichten, minder blessurerisico.',
                            },
                            {
                                icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
                                title: 'Meer kracht',
                                text: 'Diepe spiergroepen die je anders overslaat worden geactiveerd.',
                            },
                            {
                                icon: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z',
                                title: 'Betere slaap',
                                text: 'Yoga kalmeert en bereidt je lichaam voor op diepe rust.',
                            },
                        ]"
                        :key="benefit.title"
                        class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 hover:-translate-y-1 transition-transform duration-300"
                    >
                        <div
                            class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center"
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
                                    :d="benefit.icon"
                                />
                            </svg>
                        </div>
                        <h3
                            class="text-sm font-bold uppercase text-emerald-100!"
                        >
                            {{ benefit.title }}
                        </h3>
                        <p
                            class="text-emerald-200/70 text-sm font-light leading-relaxed"
                        >
                            {{ benefit.text }}
                        </p>
                    </div>
                </div>
                <div class="text-center">
                    <nuxt-link
                        class="emerald-outlined button inline-block"
                        to="/voordelen"
                    >
                        Alle voordelen van yoga
                    </nuxt-link>
                </div>
            </div>
        </div>

        <!-- VERKEN VERDER -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-10 space-y-3">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Meer ontdekken</span
                        ><span class="text-emerald-600">.</span>
                    </h2>
                </div>
                <LinkCards :links="MORE" />
            </div>
        </div>

        <RequestCta />
    </div>
</template>
