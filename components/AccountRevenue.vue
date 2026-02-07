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

const bucketOptions = [
  { label: 'Week', value: 'week' },
  { label: 'Maand', value: 'month' },
  { label: 'Jaar', value: 'year' },
]

const selectedBucket = ref('week')
const loading = ref(false)

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
  return {
    labels: items.map((d: any) => d.label),
    datasets: [
      {
        label: 'Omzet',
        data: items.map((d: any) => d.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Kosten',
        data: items.map((d: any) => d.cost),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Winst',
        data: items.map((d: any) => d.profit),
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
        label: (ctx: any) => `${ctx.dataset.label}: €${ctx.parsed.y}`,
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
        callback: (value: number) => `€${value}`,
      },
      grid: { color: 'rgba(107, 114, 128, 0.3)' },
    },
  },
}))

const totals = computed(() => {
  if (!revenueData.value?.data?.length) return null
  const items = revenueData.value.data
  return {
    revenue: items.reduce((s: number, d: any) => s + d.revenue, 0),
    cost: items.reduce((s: number, d: any) => s + d.cost, 0),
    profit: items.reduce((s: number, d: any) => s + d.profit, 0),
    bookings: items.reduce((s: number, d: any) => s + d.bookings, 0),
    lessons: items.reduce((s: number, d: any) => s + d.lessons, 0),
  }
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
          <USelectMenu v-model="selectedBucket" :options="bucketOptions" value-attribute="value" option-attribute="label" color="primary" variant="outline" size="lg" />
        </div>
      </div>
    </div>

    <!-- Summary cards -->
    <div v-if="totals" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4 sm:p-5">
        <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Omzet</span>
        <span class="block text-lg font-semibold text-gray-100 mt-1">€{{ totals.revenue }}</span>
      </div>
      <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4 sm:p-5">
        <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Kosten</span>
        <span class="block text-lg font-semibold text-gray-100 mt-1">€{{ totals.cost }}</span>
      </div>
      <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4 sm:p-5">
        <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Winst</span>
        <span class="block text-lg font-semibold mt-1" :class="totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'">€{{ totals.profit }}</span>
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
        <UIcon name="i-heroicons-arrow-path-20-solid" class="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
      <Line v-else-if="chartData.labels.length" :data="chartData" :options="chartOptions" />
      <div v-else class="flex items-center justify-center h-full text-gray-500">
        Geen data voor deze periode
      </div>
    </div>

    <!-- Settings info -->
    <p v-if="revenueData" class="text-sm text-gray-500 mt-3">
      Berekend met €{{ revenueData.revenuePerBooking }} per boeking en €{{ revenueData.costPerLesson }} per les.
    </p>
  </div>
</template>
