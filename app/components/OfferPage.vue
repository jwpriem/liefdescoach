<script setup lang="ts">
const props = defineProps<{ path: string }>()

const offer = offerByPath(props.path)
const faqItems = offer.faq.map((item) => ({ label: item.question, content: item.answer }))

usePageSeo({ title: offer.title, description: offer.description, path: offer.path })
useServiceSchema({ name: offer.name, description: offer.description, path: offer.path })
</script>

<template>
    <div>
        <!-- HERO -->
        <Header>
            <div class="mb-2">
                <span class="bg-emerald-700/80 text-emerald-100 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Op locatie of in de studio
                </span>
            </div>
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">{{ offer.heroTitle }}</span><span class="text-emerald-600">.</span>
            </h1>
            <p class="intro">{{ offer.heroIntro }}</p>
            <div class="flex flex-wrap gap-3 pt-2">
                <nuxt-link class="emerald button" :to="requestLink(offer.type)">Vraag een sessie aan</nuxt-link>
                <nuxt-link class="emerald-outlined button" to="/tarieven">Tarieven</nuxt-link>
            </div>
            <template #visual>
                <OfferGraphic
                    :icon="offer.icon"
                    :accents="offer.highlights.map((h) => h.icon)"
                    class="h-64 mt-12 md:mt-0 md:h-[36rem] w-full md:w-1/2"
                />
            </template>
        </Header>

        <SessionFacts />

        <!-- HIGHLIGHTS -->
        <div class="p-8 md:px-0 md:pb-24">
            <div class="container mx-auto">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        v-for="highlight in offer.highlights"
                        :key="highlight.title"
                        class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
                    >
                        <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
                            <UIcon :name="highlight.icon" class="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 class="text-base font-bold uppercase text-emerald-100">{{ highlight.title }}</h2>
                        <p class="text-emerald-200/70 text-base font-light leading-relaxed">{{ highlight.text }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- PROGRAMMA + MOGELIJKHEDEN -->
        <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
            <div class="container mx-auto">
                <div class="md:flex justify-between items-start md:space-x-16 space-y-12 md:space-y-0">
                    <div class="w-full md:w-1/2 space-y-6">
                        <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                            <span class="emerald-underline">Zo ziet het eruit</span><span class="text-emerald-600">.</span>
                        </h2>
                        <ol class="space-y-5">
                            <li v-for="(step, index) in offer.program" :key="step.title" class="flex items-start space-x-4">
                                <span class="w-9 h-9 shrink-0 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center">
                                    {{ index + 1 }}
                                </span>
                                <div>
                                    <p class="font-bold text-emerald-900 text-sm uppercase">{{ step.title }}</p>
                                    <p class="text-emerald-800 text-base font-light">{{ step.text }}</p>
                                </div>
                            </li>
                        </ol>
                    </div>
                    <div class="w-full md:w-1/2">
                        <div class="bg-emerald-200/60 rounded-2xl p-6 space-y-4">
                            <h2 class="text-sm font-bold uppercase text-emerald-900">Mogelijkheden</h2>
                            <ul class="space-y-3">
                                <li v-for="option in offer.options" :key="option" class="flex items-start space-x-3 text-emerald-900">
                                    <UIcon name="i-lucide-circle-check" class="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
                                    <span>{{ option }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <AboutRavennah />

        <!-- FAQ -->
        <div class="p-8 md:px-0 md:pb-24">
            <div class="container mx-auto max-w-3xl space-y-8">
                <h2 class="text-2xl md:text-4xl uppercase font-black text-center">
                    <span class="emerald-underline">Veelgestelde vragen</span><span class="text-emerald-600">.</span>
                </h2>
                <UAccordion :items="faqItems" />
            </div>
        </div>

        <RequestCta :type="offer.type" />
    </div>
</template>
