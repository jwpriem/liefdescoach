<script setup lang="ts">
const props = withDefaults(defineProps<{
  credits: any[]
  emptyMessage?: string
}>(), {
  emptyMessage: 'Geen credits gevonden'
})

const { $rav } = useNuxtApp()

const creditTypeLabels: Record<string, string> = {
  credit_1: 'Losse les',
  credit_5: 'Kleine kaart (5)',
  credit_10: 'Grote kaart (10)',
}

const pageSize = 10
const page = ref(1)

watch(() => props.credits, () => {
  page.value = 1
})

// ⚡ Bolt: Move expensive data transformations out of the template render loop
const processedCredits = computed(() => {
  const now = Date.now()
  return props.credits.map((credit: any) => {
    let status = 'Beschikbaar'
    let badgeColor = 'success'

    if (credit.bookingId) {
      status = 'Gebruikt'
      badgeColor = 'neutral'
    } else if (new Date(credit.validTo).getTime() <= now) {
      status = 'Verlopen'
      badgeColor = 'error'
    }

    return {
      ...credit,
      _typeLabel: creditTypeLabels[credit.type] || credit.type,
      _status: status,
      _badgeColor: badgeColor,
      _lessonTitle: credit.lesson?.type ? $rav.getLessonTitle(credit.lesson) : '-',
      _lessonTeacher: credit.lesson?.teacher || '-',
      _lessonDate: credit.lesson ? $rav.formatDateInDutch(credit.lesson.date) : '-',
      _issuedAt: credit.createdAt ? $rav.formatDateInDutch(credit.createdAt) : '-',
      _validTo: $rav.formatDateInDutch(credit.validTo)
    }
  })
})

const paginatedCredits = computed(() =>
  processedCredits.value.slice((page.value - 1) * pageSize, page.value * pageSize)
)

const rangeStart = computed(() => processedCredits.value.length ? (page.value - 1) * pageSize + 1 : 0)
const rangeEnd = computed(() => Math.min(page.value * pageSize, processedCredits.value.length))
</script>

<template>
  <div>
    <div v-if="processedCredits.length">
      <!-- Stats -->
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-gray-400">
          Toont <span class="text-gray-200 font-medium">{{ rangeStart }}-{{ rangeEnd }}</span>
          van <span class="text-gray-200 font-medium">{{ processedCredits.length }}</span>
        </span>
      </div>

      <!-- Mobile: card layout -->
      <div class="flex flex-col gap-y-3 md:hidden">
        <div v-for="credit in paginatedCredits" :key="credit.$id"
          class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-200">{{ credit._typeLabel }}</span>
            <UBadge :color="credit._badgeColor" variant="subtle" size="xs">{{ credit._status }}
            </UBadge>
          </div>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <template v-if="credit.lesson">
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
              <span class="text-gray-300">{{ credit._lessonTitle }}</span>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Docent</span>
              <span class="text-gray-300">{{ credit._lessonTeacher }}</span>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Lesdatum</span>
              <span class="text-gray-300">{{ credit._lessonDate }}</span>
            </template>
            <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Uitgegeven</span>
            <span class="text-gray-300">{{ credit._issuedAt }}</span>
            <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geldig tot</span>
            <span class="text-gray-300">{{ credit._validTo }}</span>
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
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Uitgegeven</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geldig tot</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="credit in paginatedCredits" :key="credit.$id" class="border-b border-gray-800/50 last:border-b-0">
              <td class="py-3 px-4 text-sm text-gray-200">{{ credit._typeLabel }}</td>
              <td class="py-3 px-4 text-sm">
                <UBadge :color="credit._badgeColor" variant="subtle" size="xs">{{ credit._status }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit._lessonTitle }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit._lessonTeacher }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit._lessonDate }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit._issuedAt }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit._validTo }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="processedCredits.length > pageSize" class="flex justify-center mt-6">
        <UPagination v-model:page="page" :total="processedCredits.length" :items-per-page="pageSize" />
      </div>
    </div>

    <!-- Empty state -->
    <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm p-8 text-center" v-else>
      <p class="text-gray-400">{{ emptyMessage }}</p>
    </div>
  </div>
</template>
