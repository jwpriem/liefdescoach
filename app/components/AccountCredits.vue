<script setup lang="ts">
const { creditHistory: myCredits, availableCredits } = useCredits();

const showBuyCredits = ref(false);
</script>

<template>
  <div>
    <!-- Credit balance -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-emerald-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        </div>
        <div>
          <span class="text-sm text-gray-400">Beschikbaar saldo</span>
          <span class="block text-lg font-bold text-emerald-100">{{ availableCredits }} {{ availableCredits == 1 ? 'les' : 'lessen' }}</span>
        </div>
      </div>

      <UButton color="primary" variant="outline" size="lg" icon="i-lucide-shopping-cart" @click="showBuyCredits = true">
        Koop credits
      </UButton>
    </div>

    <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
      <span class="emerald-underline text-emerald-900">Credit historie</span><span class="text-emerald-700">.</span>
    </h2>

    <CreditTable :credits="myCredits" empty-message="Je hebt nog geen credits" />

    <BuyCreditsModal v-model="showBuyCredits" />
  </div>
</template>
