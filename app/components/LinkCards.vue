<script setup lang="ts">
import type { OfferLink } from '~/utils/offers'

defineProps<{ links: OfferLink[] }>()
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <nuxt-link
            v-for="link in links"
            :key="link.path"
            :to="link.path"
            class="group bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 hover:-translate-y-1 hover:border-emerald-700 transition duration-300"
        >
            <div class="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center">
                <UIcon :name="link.icon" class="w-6 h-6 text-emerald-400" />
            </div>
            <h3 class="text-base font-bold uppercase text-emerald-100">{{ link.name }}</h3>
            <p class="text-emerald-200/70 text-base font-light leading-relaxed">{{ link.tagline }}</p>
            <span class="text-emerald-400 text-sm font-bold">Lees meer →</span>
        </nuxt-link>
    </div>
</template>
