<script lang="ts" setup>
usePageSeo({
    title: "Tarieven | Yoga Ravennah",
    description:
        "Elke yogasessie van Yoga Ravennah is maatwerk, dus de prijs is op aanvraag. Ontdek wat de prijs bepaalt en vraag een voorstel aan voor jouw feest, team of event.",
    path: "/tarieven",
});
useLocalBusinessSchema();

const PRICE_FACTORS = [
    { icon: "i-lucide-users", title: "Groepsgrootte", text: "Een handvol vrienden of een hele afdeling: de groep bepaalt mee hoe ik de sessie inricht." },
    { icon: "i-lucide-clock", title: "Duur", text: "Een korte opstartsessie, een uitgebreide workshop of een programma met meerdere sessies." },
    { icon: "i-lucide-map-pin", title: "Locatie", text: "In de studio in Rotterdam Nesselande, of op jullie eigen locatie — dichtbij of verder weg." },
    { icon: "i-lucide-sliders-horizontal", title: "Maatwerk", text: "Een thema, eigen muziek of een programma dat aansluit op jullie event." },
];
</script>

<template>
    <div>
        <!-- HERO -->
        <Header>
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Prijs op aanvraag</span><span class="text-emerald-600">.</span>
            </h1>
            <p class="intro">
                Geen sessie is hetzelfde. Daarom maak ik voor elke aanvraag een voorstel op maat, met een prijs die
                past bij jullie groep, de duur en de locatie.
            </p>
            <div class="flex flex-wrap gap-3 pt-2">
                <nuxt-link class="emerald button" to="/aanvraag">Vraag een voorstel aan</nuxt-link>
                <nuxt-link class="emerald-outlined button" to="/#aanbod">Bekijk het aanbod</nuxt-link>
            </div>
            <template #visual>
                <OfferGraphic
                    icon="i-lucide-euro"
                    :accents="PRICE_FACTORS.map((f) => f.icon)"
                    class="h-64 mt-12 md:mt-0 md:h-[36rem] w-full md:w-1/2"
                />
            </template>
        </Header>

        <!-- WAT BEPAALT DE PRIJS -->
        <div class="p-8 md:px-0 md:pb-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Wat bepaalt de prijs</span><span class="text-emerald-600">?</span>
                    </h2>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div
                        v-for="factor in PRICE_FACTORS"
                        :key="factor.title"
                        class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3"
                    >
                        <div class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center">
                            <UIcon :name="factor.icon" class="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 class="text-sm font-bold uppercase text-emerald-100">{{ factor.title }}</h3>
                        <p class="text-emerald-200/70 text-sm font-light leading-relaxed">{{ factor.text }}</p>
                    </div>
                </div>
            </div>
        </div>

        <RequestSteps />

        <!-- AANBOD -->
        <div class="p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="text-center mb-12 space-y-4">
                    <h2 class="text-2xl md:text-4xl uppercase font-black">
                        <span class="emerald-underline">Het aanbod</span><span class="text-emerald-600">.</span>
                    </h2>
                </div>
                <LinkCards :links="OFFER_LINKS" />
            </div>
        </div>

        <RequestCta title="Vraag een voorstel aan" />
    </div>
</template>
