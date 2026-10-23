<script setup lang="ts">
const props = defineProps({
    cityName: { type: String, required: true },
    distance: { type: String, required: true },
    routeDescription: { type: String, required: true },
    heroImage: { type: String, required: true },
    heroImageAlt: { type: String, default: "" },
    sectionImage: { type: String, required: true },
    sectionImageAlt: { type: String, default: "" },
    approachTitle: { type: String, required: true },
    approachBody1: { type: String, required: true },
    approachBody2: { type: String, default: "" },
    ctaTitle: { type: String, default: "Plan jullie sessie" },
});
</script>

<template>
    <div>
        <!-- HERO -->
        <Header :image="heroImage" :alt="heroImageAlt">
            <div class="mb-2">
                <span
                    class="bg-emerald-700/80 text-emerald-100 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                >
                    Bij jullie of in de studio
                </span>
            </div>
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Yoga {{ cityName }}</span
                ><span class="text-emerald-700">.</span>
            </h1>
            <p class="intro">
                Een yogasessie in {{ cityName }}? Voor een vrijgezellenfeest,
                je team, een workshop of een event kom ik naar jullie toe. Of
                kom naar mijn studio in Rotterdam Nesselande: vanuit
                {{ cityName }} slechts {{ distance }} rijden.
            </p>
            <div class="flex flex-wrap gap-3">
                <nuxt-link class="emerald button" to="/aanvraag"
                    >Vraag een sessie aan</nuxt-link
                >
                <nuxt-link class="emerald-outlined button" to="/tarieven"
                    >Tarieven</nuxt-link
                >
            </div>
        </Header>

        <SessionFacts />

        <!-- BENEFITS -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-10 space-y-3">
                    <h2
                        class="text-2xl md:text-4xl uppercase font-black text-emerald-900"
                    >
                        <span class="emerald-underline">Wat brengt yoga je</span
                        ><span class="text-emerald-600">.</span>
                    </h2>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div
                        v-for="benefit in [
                            {
                                icon: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z',
                                title: 'Minder stress',
                                text: 'Door bewuste ademhaling en beweging komt je zenuwstelsel tot rust. Je hoofd leegt, je lichaam ontspant.',
                            },
                            {
                                icon: 'M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z',
                                title: 'Meer flexibiliteit',
                                text: 'Regelmatig stretchen maakt spieren en gewrichten soepeler. Je beweegt makkelijker, ook buiten de mat.',
                            },
                            {
                                icon: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z',
                                title: 'Betere slaap',
                                text: 'Yoga kalmeert je zenuwstelsel en bereidt je lichaam voor op rust. Veel beoefenaars slapen dieper.',
                            },
                            {
                                icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z',
                                title: 'Persoonlijke aandacht',
                                text: 'Ravennah stemt elke sessie af op de groep en past houdingen aan op ieders lichaam en tempo.',
                            },
                        ]"
                        :key="benefit.title"
                        class="bg-white/60 rounded-2xl p-5 flex items-start space-x-4"
                    >
                        <div
                            class="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5"
                        >
                            <svg
                                class="w-5 h-5 text-emerald-700 stroke-current"
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
                        <div>
                            <p
                                class="font-bold text-emerald-900 uppercase text-sm mb-1"
                            >
                                {{ benefit.title }}
                            </p>
                            <p
                                class="text-emerald-800 text-sm font-light leading-relaxed"
                            >
                                {{ benefit.text }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- AANBOD -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Yoga op maat in {{ cityName }}</span
                        ><span class="text-emerald-700">.</span>
                    </h2>
                </div>
                <LinkCards :links="OFFER_LINKS" />
            </div>
        </div>

        <!-- ROUTE -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-16">
            <div class="container mx-auto">
                <div
                    class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0"
                >
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2
                            class="text-2xl md:text-4xl uppercase font-black text-emerald-900"
                        >
                            <span class="emerald-underline">Naar de studio</span
                            ><span class="text-emerald-600">.</span>
                        </h2>
                        <p
                            class="text-lg text-emerald-900 font-light leading-relaxed"
                        >
                            {{ routeDescription }}
                        </p>
                    </div>
                    <div class="w-full md:w-1/2 space-y-4">
                        <div
                            class="bg-emerald-200/60 rounded-2xl p-6 space-y-3"
                        >
                            <h3
                                class="text-sm font-bold uppercase text-emerald-900"
                            >
                                Praktische info
                            </h3>
                            <ul class="space-y-2 text-emerald-900 text-base">
                                <li
                                    v-for="info in [
                                        `Op locatie in ${cityName}, of in de studio`,
                                        'Studio: Emmy van Leersumhof 24a, Rotterdam Nesselande',
                                        'Gratis parkeren voor de deur van de studio',
                                        'Elke groepsgrootte, geen ervaring nodig',
                                    ]"
                                    :key="info"
                                    class="flex items-center space-x-2"
                                >
                                    <span class="text-emerald-600 font-bold"
                                        >→</span
                                    >
                                    <span>{{ info }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- APPROACH -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div
                    class="md:flex justify-between items-center md:space-x-16 space-y-8 md:space-y-0"
                >
                    <div class="w-full md:w-1/2">
                        <img
                            class="w-full h-72 md:h-96 object-center object-cover rounded-3xl shadow-xl"
                            :src="sectionImage"
                            :alt="sectionImageAlt"
                        />
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black">
                            <span class="emerald-underline">{{
                                approachTitle
                            }}</span
                            ><span class="text-emerald-700">.</span>
                        </h2>
                        <p class="intro">{{ approachBody1 }}</p>
                        <p
                            v-if="approachBody2"
                            class="intro text-emerald-100/80"
                        >
                            {{ approachBody2 }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <RequestCta
            :title="ctaTitle"
            :text="`Vertel me wat je in gedachten hebt, in ${cityName} of in de studio. Ik stuur je graag een voorstel op maat — de prijs is op aanvraag.`"
        />
    </div>
</template>
