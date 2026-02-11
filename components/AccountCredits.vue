<script setup lang="ts">
const store = useMainStore();
const { $rav } = useNuxtApp();

const myCredits = computed(() => store.myCredits);
const availableCredits = computed(() => store.availableCredits);

const creditTypeLabels: Record<string, string> = {
  credit_1: 'Losse les',
  credit_5: 'Kleine kaart (5)',
  credit_10: 'Grote kaart (10)',
};

function getCreditStatus(credit: any) {
  if (credit.bookingId) return 'Gebruikt';
  if (new Date(credit.validTo) <= new Date()) return 'Verlopen';
  return 'Beschikbaar';
}

function getCreditBadgeColor(credit: any): string {
  if (credit.bookingId) return 'error';
  if (new Date(credit.validTo) <= new Date()) return 'warning';
  return 'success';
}
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

      <UButton to="/tarieven" color="primary" variant="outline" size="lg" icon="i-heroicons-shopping-cart-20-solid">
        Koop credits
      </UButton>
    </div>

    <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
      <span class="emerald-underline text-emerald-900">Credit historie</span><span class="text-emerald-700">.</span>
    </h2>

    <div v-if="myCredits.length">
      <!-- Mobile: card layout -->
      <div class="flex flex-col gap-y-3 md:hidden">
        <div v-for="credit in myCredits" :key="credit.$id"
          class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-200">{{ creditTypeLabels[credit.type] || credit.type }}</span>
            <UBadge :color="getCreditBadgeColor(credit)" variant="subtle" size="xs">{{ getCreditStatus(credit) }}
            </UBadge>
          </div>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <template v-if="credit.lesson">
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
              <span class="text-gray-300">{{ credit.lesson?.type ?
                $rav.getLessonTitle(credit.lesson) : '-' }}</span>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Docent</span>
              <span class="text-gray-300">{{ credit.lesson.teacher }}</span>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Lesdatum</span>
              <span class="text-gray-300">{{ $rav.formatDateInDutch(credit.lesson.date) }}</span>
            </template>
            <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geldig tot</span>
            <span class="text-gray-300">{{ $rav.formatDateInDutch(credit.validTo) }}</span>
          </div>
        </div>
      </div>

      <!-- Desktop: table layout -->
      <div
        class="hidden md:block rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-gray-700/50">
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Type</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Status</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Docent</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Lesdatum</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geldig tot</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="credit in myCredits" :key="credit.$id" class="border-b border-gray-800/50 last:border-b-0">
              <td class="py-3 px-4 text-sm text-gray-200">{{ creditTypeLabels[credit.type] || credit.type }}</td>
              <td class="py-3 px-4 text-sm">
                <UBadge :color="getCreditBadgeColor(credit)" variant="subtle" size="xs">{{ getCreditStatus(credit) }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson?.type ?
                $rav.getLessonTitle(credit.lesson) : '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson?.teacher || '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson ? $rav.formatDateInDutch(credit.lesson.date)
                : '-'
              }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ $rav.formatDateInDutch(credit.validTo) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty state -->
    <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm p-8 text-center" v-else>
      <p class="text-gray-400">Je hebt nog geen credits</p>
    </div>
  </div>
</template>
