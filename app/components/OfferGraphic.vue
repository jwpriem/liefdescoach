<script setup lang="ts">
// Illustration in place of a photo: a large icon on rings, with smaller icons around it
withDefaults(defineProps<{ icon: string; accents?: string[] }>(), { accents: () => [] })

const ACCENT_POSITIONS = ['top-[10%] left-[8%]', 'top-[16%] right-[10%]', 'bottom-[22%] left-[12%]', 'bottom-[28%] right-[8%]']
</script>

<template>
    <div
        class="relative overflow-hidden rounded-3xl shadow-xl border border-emerald-900/60 bg-gradient-to-br from-emerald-900 via-gray-900 to-gray-950"
        aria-hidden="true"
    >
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" fill="none">
            <circle cx="200" cy="190" r="80" class="stroke-emerald-500/30" stroke-width="1.5" />
            <circle cx="200" cy="190" r="125" class="stroke-emerald-500/20" stroke-width="1.5" stroke-dasharray="4 8" />
            <circle cx="200" cy="190" r="170" class="stroke-emerald-500/10" stroke-width="1.5" />
            <path d="M0 330 C 70 300, 130 360, 200 330 S 330 300, 400 330" class="stroke-emerald-400/30" stroke-width="2" />
            <path d="M0 355 C 70 325, 130 385, 200 355 S 330 325, 400 355" class="stroke-emerald-400/15" stroke-width="2" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center pb-8">
            <div class="w-28 h-28 md:w-40 md:h-40 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30 flex items-center justify-center">
                <UIcon :name="icon" class="w-14 h-14 md:w-20 md:h-20 text-emerald-300" />
            </div>
        </div>
        <div
            v-for="(accent, index) in accents.slice(0, ACCENT_POSITIONS.length)"
            :key="accent"
            class="absolute w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gray-950/70 border border-emerald-800/60 flex items-center justify-center"
            :class="ACCENT_POSITIONS[index]"
        >
            <UIcon :name="accent" class="w-5 h-5 md:w-7 md:h-7 text-emerald-400" />
        </div>
    </div>
</template>
