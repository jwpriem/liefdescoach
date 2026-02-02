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

const sortedArchive = computed(() => {
  if (!archive.value || !archive.value.documents) return [];
  return archive.value.documents.map(lesson => ({
    ...lesson,
    bookings: [...(lesson.bookings || [])].sort((a, b) => {
      const nameA = a.students.name || "";
      const nameB = b.students.name || "";
      return nameA.localeCompare(nameB);
    })
  }));
});
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
      <div v-for="lesson in sortedArchive" :key="lesson.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3">
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
            <span v-for="booking in lesson.bookings" :key="booking.$id" class="block">
              {{ booking.students.name }}
            </span>
            <span v-if="!lesson.bookings.length">Geen boekingen</span>
          </span>
       </div>
      </div>
     </div>
    </div>
  </div>
 </div>
</template>