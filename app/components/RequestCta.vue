<script setup lang="ts">
import type { SessionType } from '~~/shared/sessionRequest'

const props = withDefaults(defineProps<{ title?: string; text?: string; type?: SessionType }>(), {
    title: 'Plan jullie sessie',
    text: 'Vertel me wat je in gedachten hebt. Ik denk graag mee en stuur je een voorstel op maat — de prijs is op aanvraag.',
})

const requestTo = computed(() => (props.type ? requestLink(props.type) : '/aanvraag'))
</script>

<template>
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
        <div class="container mx-auto">
            <div class="max-w-2xl mx-auto text-center space-y-8">
                <Yoga />
                <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                    <span class="emerald-underline">{{ title }}</span><span class="text-emerald-600">.</span>
                </h2>
                <p class="text-xl text-emerald-900 font-light leading-relaxed">{{ text }}</p>
                <div class="flex flex-wrap justify-center gap-3">
                    <nuxt-link class="emerald button" :to="requestTo">Vraag een sessie aan</nuxt-link>
                    <nuxt-link class="emerald-outlined button" to="/contact">Stel een vraag</nuxt-link>
                </div>
            </div>
        </div>
    </div>
</template>
