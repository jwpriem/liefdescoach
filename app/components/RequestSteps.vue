<script setup lang="ts">
const STEPS = [
    { icon: 'i-lucide-send', title: 'Je stuurt een aanvraag', text: 'Vertel wat je in gedachten hebt: de gelegenheid, de groep, een datum en de locatie.' },
    { icon: 'i-lucide-message-circle', title: 'Ik doe een voorstel', text: 'We stemmen samen de wensen af en je ontvangt een voorstel met prijs, helemaal op maat.' },
    { icon: 'i-lucide-calendar-check', title: 'Samen op de mat', text: 'Op de afgesproken dag verzorg ik de sessie, in de studio of op jullie locatie.' },
]
</script>

<template>
    <div class="bg-emerald-100 title-dark p-8 md:px-0 md:py-24">
        <div class="container mx-auto">
            <div class="text-center mb-12 space-y-4">
                <h2 class="text-2xl md:text-4xl uppercase font-black text-emerald-900">
                    <span class="emerald-underline">Zo werkt het</span><span class="text-emerald-600">.</span>
                </h2>
            </div>
            <ol class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <li v-for="(step, index) in STEPS" :key="step.title" class="bg-white/60 rounded-2xl p-6 space-y-3">
                    <div class="flex items-center space-x-3">
                        <span class="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center">
                            {{ index + 1 }}
                        </span>
                        <UIcon :name="step.icon" class="w-6 h-6 text-emerald-700" />
                    </div>
                    <h3 class="text-base font-bold uppercase text-emerald-900">{{ step.title }}</h3>
                    <p class="text-emerald-800 text-base font-light leading-relaxed">{{ step.text }}</p>
                </li>
            </ol>
        </div>
    </div>
</template>
