<script setup lang="ts">
const store = useMainStore()
const dayjs = useDayjs()
const { $rav } = useNuxtApp()

const state = reactive({
  onlyFutureLessons: false,
  bookForUser: false,
  addBookingUser: null,
  addBookingLesson: null,
  createLesson: false,
  createLessonDate: new Date(),
  createLessonHours: '09',
  createLessonMinutes: '45',
  createLessonType: 'hatha yoga',
  createLessonTeacher: null,
  teachers: [
    {
      label: 'Ravennah',
      value: null,
    }, {
      label: 'Bo Bol',
      value: 'Bo Bol',
    }
  ],
  types: [
    {
      label: 'Hatha Yoga',
      value: 'hatha yoga',
    }, {
      label: 'Gastles',
      value: 'guest lesson',
    },
    {
      label: 'Peachy Bum',
      value: 'peachy bum',
    },
  ],
  hours: [
    "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
    "20", "21", "22", "23", "24"
  ],
  minutes: ['00', '15', '30', '45']
})

const lessons = computed(() => store.lessons)
const students = computed(() => store.students)
const isAdmin = computed(() => store.isAdmin)

function cancel() {
  state.addBookingUser = null
  state.addBookingLesson = null
  state.bookForUser = false
}

function cancelLesson() {
  state.createLessonDate = new Date()
  state.createLessonType = 'hatha yoga'
  state.createLessonTeacher = null
  state.createLesson = false
}

async function book() {
  state.bookForUser = false
  store.setLoading(true)

  await store.setOnBehalfOf(state.addBookingUser)
  await store.handleBooking(state.addBookingLesson, { extraSpot: true })
  await store.fetchStudents()
  await store.fetchLessons()

  state.addBookingUser = null
  state.addBookingLesson = null
  store.setLoading(false)
}

async function createNewLesson() {
  store.setLoading(true)
  state.createLessonDate.setUTCHours(parseInt(state.createLessonHours, 10), parseInt(state.createLessonMinutes, 10), 0, 0)

  await $fetch('/api/createLesson', {
    method: 'post',
    body: {
      date: state.createLessonDate.toISOString(),
      type: state.createLessonType,
      teacher: state.createLessonTeacher,
    },
  })

  cancelLesson() // Resets the lesson creation form
  await store.fetchLessons()
  store.setLoading(false)
}

async function removeBooking(booking, lesson) {
  // state.addBookingUser is likely null here unless we are in the middle of booking? 
  // Preserving logic but removing JSON.parse, assuming store handles object or null.
  await store.setOnBehalfOf(state.addBookingUser)
  await store.cancelBooking(booking, lesson)
}

function sortStudents(students) {
  if (!Array.isArray(students)) return [];

  return [...students].sort((a, b) => {
    const nameA = a?.students?.name || a?.name || "";
    const nameB = b?.students?.name || b?.name || "";
    return nameA.localeCompare(nameB);
  });
}


function getLessonBookingsWithLabels(lessonBookings) {
  if (!Array.isArray(lessonBookings)) return []

  const counters = new Map<string, number>()
  return sortStudents(lessonBookings).map((booking) => {
    const studentId = booking?.students?.$id || booking?.students?.id || booking?.$id
    const currentCount = counters.get(studentId) ?? 0
    counters.set(studentId, currentCount + 1)

    return {
      ...booking,
      isExtraSpot: currentCount >= 1,
    }
  })
}

const computedLessons = computed(() => {
  return lessons.value.map(lesson => {
    const bookingsLength = lesson.bookings?.length || 0
    const spots = 9 - bookingsLength
    const isFull = bookingsLength === 9
    const spotsContext = bookingsLength === 8 ? 'plek' : 'plekken'
    const spotsText = isFull ? ' (Vol)' : ` (Nog ${spots} ${spotsContext})`

    return {
      label: $rav.formatDateInDutch(lesson.date) + spotsText,
      value: lesson,
      disabled: isFull,
    }
  })
})

const computedStudents = computed(() => {
  return students.value.map(student => {
    const isDisabled = false
    return {
      label: student.name,
      value: student,
      disabled: isDisabled,
    }
  })
})

const managedLesson = ref<any>(null)

function openManage(lesson: any) {
  managedLesson.value = lesson
}

function closeManage() {
  managedLesson.value = null
}

async function deleteManagedLesson(lesson: any) {
  closeManage()
  await store.deleteLesson(lesson.$id)
}
</script>

<template>
  <div v-if="isAdmin && lessons && students">
    <div class="w-full">
      <div class="md:flex justify-between items-center mb-6">
        <h2 class="text-2xl md:text-4xl uppercase font-black">
          <span class="emerald-underline text-emerald-900">Lessen</span><span class="text-emerald-700">.</span>
        </h2>
        <div class="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <UButton color="primary" variant="solid" size="lg" @click="state.createLesson = !state.createLesson">Voeg les
            toe</UButton>
          <UButton color="primary" variant="solid" size="lg" @click="state.bookForUser = !state.bookForUser">Maak
            boeking voor gebruiker</UButton>
          <UButton color="primary" variant="outline" size="lg" to="/archief">Archief</UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="lesson in lessons" :key="lesson.$id"
          class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6">
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
                <span class="block text-gray-100 mt-0.5" v-html="$rav.getLessonDescription(lesson)"></span>
              </div>
              <UButton icon="i-heroicons-cog-6-tooth-20-solid" variant="ghost" size="sm"
                class="text-gray-400 hover:text-white -mt-1 -mr-2" @click="openManage(lesson)" />
            </div>
            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Datum</span>
              <span class="block text-gray-100 mt-0.5">{{ $rav.formatDateInDutch(lesson.date, true) }}</span>
            </div>
            <div>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Boekingen ({{
                lesson.bookings?.length || 0 }}/9)</span>
              <div class="mt-1">
                <span v-for="booking in getLessonBookingsWithLabels(lesson.bookings || [])" :key="booking.$id"
                  class="flex items-center gap-1 text-sm text-gray-300">
                  <span
                    class="hover:text-emerald-400 transition-colors cursor-pointer"
                    @click="navigateTo(`/admin/users/${booking.students.$id}`)">
                    {{ booking.students.name }}<span v-if="booking.isExtraSpot" class="text-emerald-400"> (extra plek)</span>
                  </span>
                  <UTooltip v-if="booking.students.injury" :text="booking.students.injury">
                    <UIcon name="i-heroicons-plus-circle-20-solid" class="w-4 h-4 text-red-500 flex-shrink-0" />
                  </UTooltip>
                  <UTooltip v-if="booking.students.pregnancy" text="Zwanger">
                    <UIcon name="i-heroicons-sparkles-20-solid" class="w-4 h-4 text-pink-500 flex-shrink-0" />
                  </UTooltip>
                </span>
                <span v-if="!lesson.bookings?.length" class="text-sm text-gray-500">Geen boekingen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Book for user -->
    <div v-if="state.bookForUser && lessons.length && students.length"
      class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
      <div
        class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Voeg boeking toe</h2>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Les</label>
            <USelectMenu icon="i-heroicons-academic-cap-20-solid" size="lg" color="primary" variant="outline"
              v-model="state.addBookingLesson" :items="computedLessons" class="w-full" value-key="value"
              :search-input="false" />
          </div>

          <div v-if="state.addBookingLesson">
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Gebruiker</label>
            <USelectMenu icon="i-heroicons-user-20-solid" size="lg" color="primary" variant="outline"
              v-model="state.addBookingUser" :items="computedStudents" class="w-full" value-key="value"
              :search-input="{ placeholder: 'Zoek gebruiker...' }" />
          </div>

          <div class="flex gap-3 mt-2">
            <UButton color="primary" variant="solid" size="lg" @click="book()"
              :disabled="!state.addBookingUser && !state.addBookingLesson">Voeg toe</UButton>
            <UButton color="primary" variant="outline" size="lg" @click="cancel()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Manage lesson -->
    <div v-if="managedLesson" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
      <div
        class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Les beheren</h2>
            <p class="text-gray-400 text-sm mt-1">{{ $rav.formatDateInDutch(managedLesson.date, true) }}</p>
          </div>
          <UButton icon="i-heroicons-x-mark-20-solid" variant="ghost" size="sm" class="text-gray-400 hover:text-white -mt-1 -mr-2"
            @click="closeManage()" />
        </div>

        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Deelnemer verwijderen</h3>
          <div v-if="managedLesson.bookings?.length" class="flex flex-col gap-2">
            <div v-for="booking in getLessonBookingsWithLabels(managedLesson.bookings)" :key="booking.$id"
              class="flex items-center justify-between rounded-xl bg-gray-900/60 border border-gray-800/50 px-4 py-2.5">
              <span class="flex items-center gap-2 text-sm text-gray-200">
                {{ booking.students.name }}
                <span v-if="booking.isExtraSpot" class="text-emerald-400 text-xs">(extra plek)</span>
                <UTooltip v-if="booking.students.injury" :text="booking.students.injury">
                  <UIcon name="i-heroicons-plus-circle-20-solid" class="w-4 h-4 text-red-500" />
                </UTooltip>
                <UTooltip v-if="booking.students.pregnancy" text="Zwanger">
                  <UIcon name="i-heroicons-sparkles-20-solid" class="w-4 h-4 text-pink-500" />
                </UTooltip>
              </span>
              <UButton icon="i-heroicons-trash-20-solid" variant="ghost" size="xs"
                class="text-red-400 hover:text-red-300"
                @click="removeBooking(booking, managedLesson); closeManage()" />
            </div>
          </div>
          <p v-else class="text-sm text-gray-500">Geen deelnemers.</p>
        </div>

        <div class="border-t border-gray-800/50 pt-6">
          <UButton color="error" variant="soft" icon="i-heroicons-trash-20-solid"
            @click="deleteManagedLesson(managedLesson)">
            Les verwijderen
          </UButton>
        </div>
      </div>
    </div>

    <!-- Modal: Create lesson -->
    <div v-if="state.createLesson && isAdmin"
      class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
      <div
        class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Voeg les toe</h2>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Datum</label>
            <UPopover class="w-full">
              <UButton icon="i-heroicons-calendar-days-20-solid" size="lg"
                :label="dayjs(state.createLessonDate).format('D MMM, YYYY')" color="primary" variant="outline"
                class="w-full justify-between" />
              <template #content="{ close }">
                <DatePicker v-model="state.createLessonDate" is-required @close="close" />
              </template>
            </UPopover>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Tijd</label>
            <div class="flex items-center gap-3">
              <USelectMenu icon="i-heroicons-clock-20-solid" size="lg" color="primary" variant="outline"
                v-model="state.createLessonHours" :items="state.hours" class="w-full" />
              <USelectMenu icon="i-heroicons-clock-20-solid" size="lg" color="primary" variant="outline"
                v-model="state.createLessonMinutes" :items="state.minutes" class="w-full" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Type les</label>
            <USelectMenu icon="i-heroicons-academic-cap-20-solid" size="lg" color="primary" variant="outline"
              v-model="state.createLessonType" :items="state.types" class="w-full" value-key="value"
              :search-input="false" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Docent</label>
            <USelectMenu icon="i-heroicons-academic-cap-20-solid" size="lg" color="primary" variant="outline"
              v-model="state.createLessonTeacher" :items="state.teachers" class="w-full" value-key="value"
              :search-input="false" />
          </div>

          <div class="flex gap-3 mt-2">
            <UButton color="primary" variant="solid" size="lg" @click="createNewLesson()">Voeg toe</UButton>
            <UButton color="primary" variant="outline" size="lg" @click="cancelLesson()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
