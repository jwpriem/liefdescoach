<script setup lang="ts">
const title = ref('Yoga Ravennah | Account');
const description = ref('Mijn accountdetails');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/account');

const store = useMainStore()

definePageMeta({
 layout: 'yoga'
})

useHead({
 title,
 meta: [
  {hid: 'description', name: 'description', content: description},
  {hid: 'og:title', property: 'og:title', content: title},
  {hid: 'og:url', property: 'og:url', content: pageUrl},
  {hid: 'og:description', property: 'og:description', content: description},
  {hid: 'og:image', property: 'og:image', content: ogImage},

  // twitter card
  {hid: "twitter:title", name: "twitter:title", content: title},
  {hid: "twitter:url", name: "twitter:url", content: pageUrl},
  {hid: 'twitter:description', name: 'twitter:description', content: description},
  {hid: "twitter:image", name: "twitter:image", content: ogImage},
 ]
})

const loggedInUser = computed(() => store.loggedInUser);
const isAdmin = computed(() => store.isAdmin);
const isLoading = computed(() => store.isLoading);

const { data: archive } = await useFetch('/api/lessonsArchive')

function sortStudents(students) {
 if (!Array.isArray(students)) return [];

 return [...students].sort((a, b) => {
  const nameA = a.name || "";
  const nameB = b.name || "";
  return nameA.localeCompare(nameB);
 });
}
</script>

<template>
 <div>
  <IsLoading :loading="isLoading" />
  <div class="container mt-8 sm:mt-12 md:mt-24 mx-auto p-8 md:px-0 md:py-24">
    <div>
     <div class="md:flex justify-between items-center">
      <h2 class="text-2xl md:text-4xl uppercase font-black">
       <span class="emerald-underline text-emerald-900">Lessen archief</span><span class="text-emerald-700">.</span>
      </h2>
     </div>
     <div class="grid grid-cols-1 md:grid-cols-4 mt-8 gap-3">
      <div v-for="lesson in archive.rows" index="lesson.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3">
       <div>
        <sup class="text-emerald-500">Les</sup>
        <span class="block -mt-2 capitalize">{{lesson.type ? lesson.type : 'hatha yoga' }}</span>
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cursor-pointer w-5 h-5 ml-3 inline-block text-red-300" @click="removeBooking(booking, lesson)">
                <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </span>
            <span v-if="!lesson.bookings?.length">Geen boekingen</span>
          </span>
       </div>
      </div>
     </div>
    </div>
  </div>
 </div>
</template>