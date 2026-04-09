<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const { $rav } = useNuxtApp()

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
}

const bucketOptions = [
  { label: 'Week', value: 'week' },
  { label: 'Maand', value: 'month' },
  { label: 'Jaar', value: 'year' },
]

const selectedBucket = ref('week')
const loading = ref(false)
const testNotifLoading = ref(false)
const testNotifResult = ref<string | null>(null)

async function sendTestNotification() {
  testNotifLoading.value = true
  testNotifResult.value = null
  try {
    const res = await $fetch('/api/push/test', { method: 'POST' })
    testNotifResult.value = res.sent > 0 ? `Verstuurd naar ${res.sent} apparaat(en).` : 'Geen actieve abonnementen gevonden.'
  } catch {
    testNotifResult.value = 'Mislukt. Controleer VAPID-configuratie.'
  } finally {
    testNotifLoading.value = false
  }
}

// Default: current month
const now = new Date()
const dateFrom = ref(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10))
const dateTo = ref(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10))

const revenueData = ref<any>(null)

async function fetchRevenue() {
  loading.value = true
  try {
    const res = await $fetch('/api/revenue', {
      params: {
        from: new Date(dateFrom.value).toISOString(),
        to: new Date(dateTo.value + 'T23:59:59').toISOString(),
        bucket: selectedBucket.value,
      },
    })
    revenueData.value = res
  } catch (e) {
    console.error('Failed to fetch revenue:', e)
  } finally {
    loading.value = false
  }
}

const chartData = computed(() => {
  if (!revenueData.value?.data?.length) {
    return { labels: [], datasets: [] }
  }

  const items = revenueData.value.data

  // ⚡ Bolt: Consolidated 4 separate Array.map() calls into a single loop
  // Expected impact: Transforms O(4N) array iterations into O(N), reducing CPU overhead and allocation during dashboard re-renders.
  const labels = []
  const revenueDataArr = []
  const costDataArr = []
  const profitDataArr = []

  for (let i = 0; i < items.length; i++) {
    const d = items[i]
    labels.push(d.label)
    revenueDataArr.push(d.revenue)
    costDataArr.push(d.cost)
    profitDataArr.push(d.profit)
  }

  return {
    labels,
    datasets: [
      {
        label: 'Omzet',
        data: revenueDataArr,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Kosten',
        data: costDataArr,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Winst',
        data: profitDataArr,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#d1fae5',
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.dataset.label}: ${formatEuro(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#6ee7b7' },
      grid: { color: 'rgba(107, 114, 128, 0.3)' },
    },
    y: {
      ticks: {
        color: '#6ee7b7',
        callback: (value: number) => formatEuro(value),
      },
      grid: { color: 'rgba(107, 114, 128, 0.3)' },
    },
  },
}))

const totals = computed(() => {
  if (!revenueData.value?.data?.length) return null
  const items = revenueData.value.data

  // ⚡ Bolt: Consolidated 5 separate Array.reduce() calls into a single loop
  // Expected impact: Transforms O(5N) array iterations into O(N), reducing CPU overhead and allocation during dashboard re-renders.
  let revenue = 0
  let cost = 0
  let profit = 0
  let bookings = 0
  let lessons = 0

  for (const item of items) {
    revenue += item.revenue
    cost += item.cost
    profit += item.profit
    bookings += item.bookings
    lessons += item.lessons
  }

  return { revenue, cost, profit, bookings, lessons }
})

// Fetch on mount and when params change
onMounted(fetchRevenue)
watch([dateFrom, dateTo, selectedBucket], fetchRevenue)
</script>

<template>
  <div>
    <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
      <span class="emerald-underline text-emerald-900">Omzet</span><span class="text-emerald-700">.</span>
    </h2>

    <!-- Controls -->
    <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4 sm:p-6 mb-6">
      <div class="flex items-start justify-start gap-x-6 flex-wrap gap-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Van</label>
          <UInput v-model="dateFrom" type="date" color="primary" variant="outline" size="lg" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Tot</label>
          <UInput v-model="dateTo" type="date" color="primary" variant="outline" size="lg" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Periode</label>
          <USelect v-model="selectedBucket" :items="bucketOptions" value-key="value" color="primary" variant="outline" size="lg" />
        </div>
      </div>
    </div>

    <!-- Summary cards -->
    <div v-if="totals" class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <div class="bg-gray-800 rounded p-4">
        <sup class="text-emerald-500">Omzet</sup>
        <span class="block -mt-2 text-lg font-medium">{{ formatEuro(totals.revenue) }}</span>
      </div>
      <div class="bg-gray-800 rounded p-4">
        <sup class="text-emerald-500">Kosten</sup>
        <span class="block -mt-2 text-lg font-medium">{{ formatEuro(totals.cost) }}</span>
      </div>
      <div class="bg-gray-800 rounded p-4">
        <sup class="text-emerald-500">Winst</sup>
        <span class="block -mt-2 text-lg font-medium" :class="totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'">{{ formatEuro(totals.profit) }}</span>
      </div>
      <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4 sm:p-5">
        <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Boekingen</span>
        <span class="block text-lg font-semibold text-gray-100 mt-1">{{ totals.bookings }}</span>
      </div>
      <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4 sm:p-5">
        <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Lessen</span>
        <span class="block text-lg font-semibold text-gray-100 mt-1">{{ totals.lessons }}</span>
      </div>
    </div>

    <!-- Chart -->
    <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-4 sm:p-6" style="height: 350px; position: relative;">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <UIcon name="i-lucide-refresh-cw" class="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
      <Line v-else-if="chartData.labels.length" :data="chartData" :options="chartOptions" />
      <div v-else class="flex items-center justify-center h-full text-gray-500">
        Geen data voor deze periode
      </div>
    </div>

    <!-- TEMP: Test push notification -->
    <div class="mt-6 flex items-center gap-3">
      <UButton
        color="warning"
        variant="soft"
        icon="i-lucide-bell"
        :loading="testNotifLoading"
        @click="sendTestNotification"
      >
        Test pushmelding
      </UButton>
      <span v-if="testNotifResult" class="text-sm text-gray-400">{{ testNotifResult }}</span>
    </div>

    <!-- Settings info -->
    <p v-if="revenueData" class="text-sm text-emerald-100/50 mt-3">
      Berekend met {{ formatEuro(revenueData.revenuePerBooking) }} per boeking en {{ formatEuro(revenueData.costPerLesson) }} per les.
    </p>
  </div>
</template>
