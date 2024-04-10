<script setup lang="ts">
import { format } from 'date-fns'
const store = useMainStore()
const { $rav } = useNuxtApp()

const onlyFutureLessons = ref(false)
const bookForUser = ref(false)
const addBookingUser = ref(null)
const addBookingLesson = ref(null)
const createLesson = ref(false)
const createLessonDate = ref(new Date())
const createLessonType = ref('hatha yoga')
const types = [{
    label: 'Hatha Yoga',
    value: 'hatha yoga'
  },{
    label: 'Peachy Bum',
    value: 'peachy bum'
  }]

const lessons = computed(() => store.lessons);
const students = computed(() => store.students);
const isAdmin = computed(() => store.isAdmin);

function cancel() {
    this.addBookingUser = null
    this.addBookingLesson = null
    this.bookForUser = false
}

function cancelLesson() {
  this.createLessonDate = new Date()
  this.createLessonType = 'hatha yoga'
  this.createLesson = false
}

async function book() {
    try {
      await store.setOnBehalfOf(JSON.parse(this.addBookingUser))
      await store.handleBooking(JSON.parse(this.addBookingLesson))
      await store.getStudents()
      await store.getLessons()
      this.cancel()
    }
      catch(error) {

      }
}

async function createNewLesson() {
  await store.setLoading(true)
  this.createLessonType == 'hatha yoga' ? this.createLessonDate.setUTCHours(9, 45, 0, 0) : this.createLessonDate.setUTCHours(10, 0, 0, 0)

  const { res } = await $fetch('/api/createLesson', {
    method: 'post',
    body: {
      date: this.createLessonDate.toISOString(),
      type: this.createLessonType
    }
  })

  this.cancel()
  await store.getLessons()
  await store.setLoading(false)
}

async function removeBooking(booking, lesson) {
    await store.cancelBooking(booking, lesson);
}

function sortStudents(students) {
    const arr = [...students]
    return arr.sort((a, b) => a.students.name.localeCompare(b.students.name) )
}

function getLessons(lessons) {
  return lessons.map(lesson => {
    const bookingsLength = lesson.bookings.length;
    const spots = 9 - bookingsLength;
    const isFull = bookingsLength === 9;
    const spotsContext = bookingsLength === 8 ? 'plek' : 'plekken';
    const spotsText = isFull ? ' (Vol)' : ` (Nog ${spots} ${spotsContext})`;

    return {
      label: $rav.formatDateInDutch(lesson.date) + spotsText,
      value: JSON.stringify(lesson),
      disabled: isFull
    };
  });
}

function getStudents(students) {
  return students.map(student => {
//    const isDisabled = this.addBookingLesson ? !$rav.checkAvailability(JSON.parse(this.addBookingLesson), student) : false
    return {
      label: student.name,
      value: JSON.stringify(student),
      disabled: false
    };
  });
}

</script>

<template>
  <div v-if="isAdmin && lessons && students">


   <div class="w-full">
    <div class="md:flex justify-between items-center">
      <h2 class="text-2xl md:text-4xl uppercase font-black">
       <span class="emerald-underline text-emerald-900">Lessen</span><span class="text-emerald-700">.</span>
     </h2>
     <div class="flex items-center gap-x-3">
       <UButton color="primary" variant="solid" @click="createLesson = !createLesson">Voeg les toe</UButton>
       <UButton color="primary" variant="solid" @click="bookForUser = true">Maak boeking voor gebruiker</UButton>
       <UToggle
         on-icon="i-heroicons-check-20-solid"
         off-icon="i-heroicons-x-mark-20-solid"
         v-model="onlyFutureLessons"
         />
      <span>Alleen toekomstige lessen</span>
     </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 mt-8 gap-3">
      <div v-for="lesson in onlyFutureLessons ? $rav.upcomingLessons(lessons) : lessons" index="lesson.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3" :class="$rav.isFutureBooking(lesson.date) ? '' : 'opacity-20 hover:opacity-100'">
        <div>
          <sup class="text-emerald-500">Les</sup>
          <span class="block -mt-2 capitalize">{{lesson.type ? lesson.type : 'hatha yoga' }}</span>
        </div>
        <div>
          <sup class="text-emerald-500">Datum</sup>
          <span class="block -mt-2">{{ $rav.formatDateInDutch(lesson.date, true) }}</span>
        </div>
        <div>
          <sup class="text-emerald-500">Boekingen ( {{ lesson.bookings.length }}/9 )</sup>
          <span class="block -mt-2">
            <span v-for="booking in sortStudents(lesson.bookings)" index="booking.$id" class="block">
              {{ booking.students.name }}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cursor-pointer w-5 h-5 ml-3 inline-block text-red-300" @click="removeBooking(booking, lesson)">
                <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </span>
            <span v-if="!lesson.bookings.length">Geen boekingen</span>
          </span>
        </div>
      </div>
    </div>
   </div>

   <!--Book for user-->
    <div v-if="bookForUser && lessons.length && students.length" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Voeg boeking toe</span
              ><span class="text-emerald-700">.</span>
          </h2>
          <USelect
            icon="i-heroicons-academic-cap-20-solid"
            size="md"
            color="primary"
            variant="outline"
            v-model="addBookingLesson"
            :options="getLessons($rav.upcomingLessons(lessons))"
            />

          <USelect
            v-if="addBookingLesson"
            icon="i-heroicons-user-20-solid"
            size="md"
            color="primary"
            variant="outline"
            v-model="addBookingUser"
            :options="getStudents(students)"
            />

          <div class="flex gap-x-3">
            <UButton color="primary" variant="solid" @click="book()" :disabled="!addBookingUser && !addBookingLesson">Voeg toe</UButton>
            <UButton color="primary" variant="outline" @click="cancel()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>
    <!--Create lesson-->
    <div v-if="createLesson && isAdmin" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
            <span class="emerald-underline text-emerald-900"
              >Voeg les toe</span
              ><span class="text-emerald-700">.</span>
          </h2>

          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton icon="i-heroicons-calendar-days-20-solid" :label="format(createLessonDate, 'd MMM, yyy')" />

            <template #panel="{ close }">
              <DatePicker v-model="createLessonDate" is-required @close="close" />
            </template>
          </UPopover>

          <USelect
            icon="i-heroicons-academic-cap-20-solid"
            size="md"
            color="primary"
            variant="outline"
            v-model="createLessonType"
            :options="types"
          />

          <div class="flex gap-x-3">
            <UButton color="primary" variant="solid" @click="createNewLesson()">Voeg toe</UButton>
            <UButton color="primary" variant="outline" @click="cancelLesson()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>