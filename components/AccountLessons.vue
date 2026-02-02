<script setup lang="ts">
import { Teams } from 'appwrite'
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

  await store.setOnBehalfOf(JSON.parse(state.addBookingUser))
  await store.handleBooking(JSON.parse(state.addBookingLesson))
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
    body: JSON.stringify({
      date: state.createLessonDate.toISOString(),
      type: state.createLessonType,
      teacher: state.createLessonTeacher,
    }),
  })

  cancelLesson() // Resets the lesson creation form
  await store.fetchLessons()
  store.setLoading(false)
}

async function removeBooking(booking, lesson) {
  await store.setOnBehalfOf(JSON.parse(state.addBookingUser))
  await store.cancelBooking(booking, lesson)
}

function sortStudents(students) {
  if (!Array.isArray(students)) return [];

  return [...students].sort((a, b) => {
    const nameA = a.name || "";
    const nameB = b.name || "";
    return nameA.localeCompare(nameB);
  });
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
      value: JSON.stringify(lesson),
      disabled: isFull,
    }
  })
})

const computedStudents = computed(() => {
  return students.value.map(student => {
    const isDisabled = state.addBookingLesson ? !$rav.checkAvailability(JSON.parse(state.addBookingLesson), student) : false
    return {
      label: student.name,
      value: JSON.stringify(student),
      disabled: isDisabled,
    }
  })
})
</script>

<template>
  <div v-if="isAdmin && lessons && students">
    <div class="w-full">
      <div class="md:flex justify-between items-center">
        <h2 class="text-2xl md:text-4xl uppercase font-black">
          <span class="emerald-underline text-emerald-900">Lessen</span><span class="text-emerald-700">.</span>
        </h2>
        <div class="flex flex-wrap items-center gap-x-3">
          <UButton color="primary" variant="solid" @click="state.createLesson = !state.createLesson">Voeg les toe
          </UButton>
          <UButton color="primary" variant="solid" @click="state.bookForUser = !state.bookForUser">Maak boeking voor
            gebruiker</UButton>
          <UButton color="primary" variant="outline" to="/yoga/archief">Archief</UButton>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 mt-8 gap-3">
        <div v-for="lesson in lessons" index="lesson.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3">
          <div>
            <sup class="text-emerald-500">Les</sup>
            <span class="block -mt-2" v-html="$rav.getLessonDescription(lesson)"></span>
          </div>
          <div>
            <sup class="text-emerald-500">Datum</sup>
            <span class="block -mt-2">{{ $rav.formatDateInDutch(lesson.date, true) }}</span>
          </div>
          <div>
            <sup class="text-emerald-500">Boekingen ( {{ lesson.bookings?.length || 0 }}/9 )</sup>
            <span class="block -mt-2">
              <span v-for="booking in sortStudents(lesson.bookings || [])" index="booking.$id" class="block">
                {{ booking.students.name }}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="cursor-pointer w-5 h-5 ml-3 inline-block text-red-300"
                  @click="removeBooking(booking, lesson)">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </span>
              <span v-if="!lesson.bookings?.length">Geen boekingen</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!--Book for user-->
    <div v-if="state.bookForUser && lessons.length && students.length"
      class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
            <span class="emerald-underline text-emerald-900">Voeg boeking toe</span><span
              class="text-emerald-700">.</span>
          </h2>
          <USelect icon="i-heroicons-academic-cap-20-solid" size="md" color="primary" variant="outline"
            v-model="state.addBookingLesson" :options="computedLessons" />

          <USelect v-if="state.addBookingLesson" icon="i-heroicons-user-20-solid" size="md" color="primary"
            variant="outline" v-model="state.addBookingUser" :options="computedStudents" />

          <div class="flex flex-wrap gap-x-3">
            <UButton color="primary" variant="solid" @click="book()"
              :disabled="!state.addBookingUser && !state.addBookingLesson">Voeg toe</UButton>
            <UButton color="primary" variant="outline" @click="cancel()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>
    <!--Create lesson-->
    <div v-if="state.createLesson && isAdmin"
      class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
            <span class="emerald-underline text-emerald-900">Voeg les toe</span><span class="text-emerald-700">.</span>
          </h2>

          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton icon="i-heroicons-calendar-days-20-solid" :label="dayjs(state.createLessonDate).format('D MMM, YYYY')" />

            <template #panel="{ close }">
              <DatePicker v-model="state.createLessonDate" is-required @close="close" />
            </template>
          </UPopover>

          <div class="flex justify-start items-center gap-x-3">
            <USelect icon="i-heroicons-clock-20-solid" size="md" color="primary" variant="outline"
              v-model="state.createLessonHours" :options="state.hours" />


            <USelect icon="i-heroicons-clock-20-solid" size="md" color="primary" variant="outline"
              v-model="state.createLessonMinutes" :options="state.minutes" />
          </div>

          <USelect icon="i-heroicons-academic-cap-20-solid" size="md" color="primary" variant="outline"
            v-model="state.createLessonType" :options="state.types" />

          <USelect icon="i-heroicons-academic-cap-20-solid" size="md" color="primary" variant="outline"
            v-model="state.createLessonTeacher" :options="state.teachers" />

          <div class="flex flex-wrap gap-x-3">
            <UButton color="primary" variant="solid" @click="createNewLesson()">Voeg toe</UButton>
            <UButton color="primary" variant="outline" @click="cancelLesson()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>