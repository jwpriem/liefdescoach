<script setup lang="ts">
const title = ref('Yoga Ravennah | Account');
const description = ref('Mijn accountdetails');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/account');

const store = useMainStore()

definePageMeta({
  // layout: 'yoga'
})

useHead({
  title,
  meta: [
    { hid: 'description', name: 'description', content: description },
    { hid: 'og:title', property: 'og:title', content: title },
    { hid: 'og:url', property: 'og:url', content: pageUrl },
    { hid: 'og:description', property: 'og:description', content: description },
    { hid: 'og:image', property: 'og:image', content: ogImage },

    // twitter card
    { hid: "twitter:title", name: "twitter:title", content: title },
    { hid: "twitter:url", name: "twitter:url", content: pageUrl },
    { hid: 'twitter:description', name: 'twitter:description', content: description },
    { hid: "twitter:image", name: "twitter:image", content: ogImage },
  ]
})

const loggedInUser = computed(() => store.loggedInUser);
const isAdmin = computed(() => store.isAdmin);
const isLoading = computed(() => store.isLoading);

const { data: archive } = await useFetch('/api/lessonsArchive')

function sortStudents(students) {
  if (!Array.isArray(students)) return [];

  return [...students].sort((a, b) => {
    const nameA = a.students?.name || "";
    const nameB = b.students?.name || "";
    return nameA.localeCompare(nameB);
  });
}

async function removeBooking(booking, lesson) {
  if (confirm('Weet je zeker dat je deze boeking wilt verwijderen?')) {
    await store.cancelBooking(booking, lesson)
    await refreshNuxtData()
  }
}

if (!isAdmin.value) {
  navigateTo('/')
}
</script>

<template>
  <div>
    <ClientOnly>
      <IsLoading :loading="isLoading" />
    </ClientOnly>
    <div class="container mt-8 sm:mt-12 md:mt-24 mx-auto p-8 md:px-0 md:py-24">
      <div>
        <div class="md:flex justify-between items-center mb-8">
          <h2
            class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent uppercase tracking-wide">
            Lessen Archief
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="lesson in archive.rows" :key="lesson.$id"
            class="group relative overflow-hidden rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-950/20 p-6">
            <div class="space-y-4">
              <!-- Header -->
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
                  <span class="block text-lg font-semibold text-gray-100 mt-0.5 capitalize">{{ lesson.type ||
                    'hatha&nbsp;yoga' }}</span>
                </div>
                <div class="px-3 py-1 rounded-full bg-gray-900/50 border border-gray-800">
                  <span class="text-xs font-medium text-gray-400">{{ $rav.formatDateInDutch(lesson.date, true) }}</span>
                </div>
              </div>

              <!-- Content -->
              <div class="pt-4 border-t border-gray-800/50">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Boekingen</span>
                  <span class="text-xs font-medium px-2 py-0.5 rounded bg-gray-900 text-gray-400">{{
                    lesson.bookings?.length || 0 }}/9</span>
                </div>

                <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  <div v-for="booking in sortStudents(lesson.bookings || [])" :key="booking.$id"
                    class="flex items-center justify-between group/booking p-2 rounded hover:bg-gray-800/50 transition-colors">
                    <NuxtLink :to="`/admin/users/${booking.students?.$id}`"
                      class="text-sm text-gray-300 hover:text-emerald-400 transition-colors flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                      {{ booking.students?.name || 'Onbekende gebruiker' }}
                    </NuxtLink>
                    <button @click="removeBooking(booking, lesson)"
                      class="opacity-0 group-hover/booking:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all"
                      title="Verwijder boeking">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-4 h-4 text-red-400 hover:text-red-300">
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>

                  <div v-if="!lesson.bookings?.length" class="text-sm text-gray-500 italic text-center py-2">
                    Geen boekingen gevonden
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
