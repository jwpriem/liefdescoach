<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const title = ref('Yoga Ravennah | Archief');
const description = ref('Lessen archief');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/archief');

const { isAdmin } = useAuth()
const { cancelBooking, pending: isLoading } = useBookingActions()
const dayjs = useDayjs()
const { $rav } = useNuxtApp()

definePageMeta({
  layout: 'app'
})

useHead({
  title,
  meta: [
    { hid: 'description', name: 'description', content: description },
    { hid: 'og:title', property: 'og:title', content: title },
    { hid: 'og:url', property: 'og:url', content: pageUrl },
    { hid: 'og:description', property: 'og:description', content: description },
    { hid: 'og:image', property: 'og:image', content: ogImage },
    { hid: "twitter:title", name: "twitter:title", content: title },
    { hid: "twitter:url", name: "twitter:url", content: pageUrl },
    { hid: 'twitter:description', name: 'twitter:description', content: description },
    { hid: "twitter:image", name: "twitter:image", content: ogImage },
  ]
})

if (!isAdmin.value) {
  navigateTo('/')
}

const dateFrom = ref(dayjs().subtract(3, 'month').format('YYYY-MM-DD'))
const dateTo = ref(dayjs().format('YYYY-MM-DD'))

const { data: archive, refresh } = await useFetch('/api/lessonsArchive', {
  query: computed(() => ({ from: dateFrom.value, to: dateTo.value }))
})

const page = ref(1)
const pageSize = 25

watch([dateFrom, dateTo], () => {
  page.value = 1
})

const allLessons = computed(() => archive.value?.rows ?? [])
const totalPages = computed(() => Math.ceil(allLessons.value.length / pageSize))
const paginatedLessons = computed(() =>
  allLessons.value
    .slice((page.value - 1) * pageSize, page.value * pageSize)
    .map((l: any) => ({ ...l, processedBookings: getLessonBookingsWithLabels(l.bookings || []) }))
)

function formatArchiveDateInDutch(date: string): string {
  const lessonDate = dayjs(date).utc()
  const startTime = lessonDate.format('H.mm')
  const endTime = lessonDate.add(1, 'hour').format('H.mm')
  const includeYear = lessonDate.year() !== dayjs().year()
  const datePart = lessonDate.format(includeYear ? 'dddd D MMMM YYYY' : 'dddd D MMMM')
  return `${datePart} van ${startTime} tot ${endTime} uur`
}

const { getLessonBookingsWithLabels } = useLessonBookings()

const confirmRemoveBooking = ref(false)
const pendingRemoveBooking = ref<any>(null)

function removeBooking(booking: any) {
  pendingRemoveBooking.value = booking
  confirmRemoveBooking.value = true
}

async function onConfirmRemoveBooking() {
  if (pendingRemoveBooking.value) {
    await cancelBooking(pendingRemoveBooking.value)
    pendingRemoveBooking.value = null
    await refresh()
  }
}

// Bottom nav: clicking any tab navigates back to account
const activeTab = ref(0)
const tabs: TabsItem[] = [
  { label: 'Boekingen', icon: 'i-lucide-calendar-days', slot: 'lessen' as const },
  { label: 'Credits', icon: 'i-lucide-credit-card', slot: 'credits' as const },
  { label: 'Lessen', icon: 'i-lucide-graduation-cap', slot: 'admin-lessen' as const },
  { label: 'Studenten', icon: 'i-lucide-users', slot: 'gebruikers' as const },
  { label: 'Omzet', icon: 'i-lucide-bar-chart-2', slot: 'omzet' as const },
]
watch(activeTab, (newVal) => {
  const slot = tabs[newVal]?.slot
  navigateTo(slot ? `/account?tab=${slot}` : '/account')
})
</script>

<template>
  <div class="min-h-screen">
    <ClientOnly>
      <IsLoading :loading="isLoading" />
    </ClientOnly>

    <div class="container mx-auto px-4 sm:px-8 pt-1 md:pt-32"
      style="padding-bottom: calc(6rem + max(env(safe-area-inset-bottom), 0px))">
      <div class="pt-3">
        <div class="md:flex justify-between items-center mb-8">
          <h2
            class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent uppercase tracking-wide">
            Lessen Archief
          </h2>
          <UButton color="primary" icon="i-lucide-arrow-left" variant="outline" size="lg" to="/account?tab=admin-lessen"
            class="mt-4 md:mt-0">
            Terug
          </UButton>
        </div>

        <!-- Date range pickers -->
        <div class="flex flex-wrap gap-4 mb-8">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Van</label>
            <UInput type="date" v-model="dateFrom" color="primary" variant="outline" size="lg" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Tot</label>
            <UInput type="date" v-model="dateTo" color="primary" variant="outline" size="lg" />
          </div>
        </div>

        <!-- Results count -->
        <p class="text-sm text-gray-500 mb-4">
          {{ allLessons.length }} {{ allLessons.length === 1 ? 'les' : 'lessen' }} gevonden
        </p>

        <!-- Lessons grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="lesson in paginatedLessons" :key="lesson.$id"
            class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6">
            <div class="space-y-3">
              <!-- Les -->
              <div>
                <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
                <span class="block text-gray-100 mt-0.5" v-html="$rav.getLessonDescription(lesson)"></span>
              </div>

              <!-- Datum -->
              <div>
                <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Datum</span>
                <span class="block text-gray-100 mt-0.5">{{ formatArchiveDateInDutch(lesson.date) }}</span>
              </div>

              <!-- Boekingen -->
              <div>
                <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">
                  Boekingen ({{ lesson.bookings?.length || 0 }}/9)
                </span>
                <div class="mt-1">
                  <span v-for="booking in lesson.processedBookings" :key="booking.$id"
                    class="flex items-center gap-1 text-base text-gray-300 group/booking py-0.5">
                    <span class="hover:text-emerald-400 transition-colors cursor-pointer flex-1"
                      @click="navigateTo(`/admin/users/${booking.students?.$id}`)">
                      {{ booking.students?.name || 'Onbekende gebruiker' }}<span v-if="booking.isFirstTime" class="text-amber-400"> (eerste keer)</span><span v-if="booking.isExtraSpot" class="text-emerald-400"> (extra plek)</span>
                    </span>
                    <UIcon v-if="booking.students?.injury" name="i-lucide-heart-pulse"
                      class="w-4 h-4 text-red-500 flex-shrink-0" />
                    <UTooltip v-if="booking.students?.pregnancy" text="Zwanger">
                      <UIcon name="i-lucide-baby" class="w-4 h-4 text-pink-500 flex-shrink-0" />
                    </UTooltip>
                    <button @click="removeBooking(booking)" aria-label="Verwijder boeking"
                      class="opacity-0 group-hover/booking:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all flex-shrink-0"
                      title="Verwijder boeking">
                      <UIcon name="i-heroicons-trash-20-solid" class="w-4 h-4 text-red-400 hover:text-red-300" />
                    </button>
                  </span>
                  <span v-if="!lesson.bookings?.length" class="text-sm text-gray-500">Geen boekingen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="allLessons.length === 0" class="text-center py-16 text-gray-500">
          Geen lessen gevonden voor deze periode.
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center mt-8">
          <UPagination v-model:page="page" :total="allLessons.length" :items-per-page="pageSize" />
        </div>
      </div>
    </div>

    <AccountBottomNav :tabs="tabs" v-model="activeTab" />

    <ConfirmModal v-model="confirmRemoveBooking" message="Weet je zeker dat je deze boeking wilt verwijderen?"
      @confirm="onConfirmRemoveBooking" />
  </div>
</template>
