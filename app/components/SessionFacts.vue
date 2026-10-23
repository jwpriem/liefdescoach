<script setup lang="ts">
const FACTS = [
    { icon: 'i-lucide-map-pin', label: 'Op elke locatie', sub: 'In de studio in Nesselande of bij jullie' },
    { icon: 'i-lucide-users', label: 'Elke groepsgrootte', sub: 'Van een handvol vrienden tot een heel bedrijf' },
    { icon: 'i-lucide-sparkles', label: 'Helemaal op maat', sub: 'Geen ervaring nodig, prijs op aanvraag' },
]
</script>

<template>
    <div class="p-8 md:px-0 md:py-12">
        <div class="container mx-auto">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                    v-for="fact in FACTS"
                    :key="fact.label"
                    class="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center space-x-4"
                >
                    <div class="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <UIcon :name="fact.icon" class="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p class="text-emerald-100 font-bold text-sm">{{ fact.label }}</p>
                        <p class="text-emerald-400/70 text-xs">{{ fact.sub }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
