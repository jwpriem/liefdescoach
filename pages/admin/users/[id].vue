<script setup lang="ts">
const route = useRoute()
const userId = route.params.id as string
const store = useMainStore()

// Protect route
definePageMeta({
    middleware: ['auth', 'admin']
})

const { data: userStats, pending: loadingStats } = await useFetch(`/api/users/${userId}/stats`)
const { data: userData, pending: loadingUser } = await useFetch(`/api/users?userId=${userId}`) // Assuming exist or reusing users endpoint? 
// Actually, I should probably fetch the single user. 
// Existing /api/users returns all users if admin. 
// I can filter from store if already loaded, but safe to fetch specific user details.
// However, the store has `students` array.
// Let's rely on the store if possible, or fetch.
// The `users.get.ts` fetches all users.
// I will create a computed for the user from store or fetch if needed.

// Better: Ensure we have the user.
const user = computed(() => store.students.find(u => u.$id === userId))

onMounted(async () => {
    if (!store.students.length) {
        await store.fetchStudents()
    }
    // Also fetch credits for this user to populate store.myCredits/myBookings logic if I reuse components?
    // AccountBookings uses `store.myBookings`.
    // AccountDetails uses `props.user` now.

    // To reuse AccountBookings, it relies on `store.myBookings`. 
    // I should probably fetch bookings for this user and put them in a local state 
    // OR refactor AccountBookings to accept props. 
    // Refactoring AccountBookings is cleaner.
})

// For now, let's just use AccountDetails which I refactored.
// And for credits/bookings, I'll fetch them specifically.
// store.fetchCredits(userId) populates store.myCredits
await store.fetchCredits(userId)
// store.fetchBookings relies on loggedInUser usually, but I can check if it supports arg.
// store.fetchBookings:
// async fetchBookings() {
//      const bookings = await $fetch('/api/bookings', { body: { userId: this.loggedInUser.$id } })
// }
// It uses loggedInUser. I need to refactor store or fetch manually here.
// I'll fetch manually here for the "Mijn credits" view equivalent.

const credits = computed(() => store.myCredits) // store.fetchCredits(userId) updates this
const stats = computed(() => userStats.value)

function formatEuro(value: number) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
}

</script>

<template>
    <div>
        <div v-if="user" class="container mx-auto px-4 sm:px-8 pt-28 pb-12 sm:pt-32 sm:pb-20">

            <!-- Back button -->
            <UButton to="/account" icon="i-heroicons-arrow-left-20-solid" variant="ghost"
                class="mb-6 text-gray-400 hover:text-white">
                Terug naar overzicht
            </UButton>

            <div class="flex flex-col gap-y-10">

                <!-- Header & Stats -->
                <div>
                    <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-2">{{ user.name }}
                    </h1>
                    <p class="text-emerald-400 font-medium mb-8">Klantdetails & statistieken</p>

                    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <span class="text-xs font-medium text-gray-400 uppercase">Boekingen</span>
                            <span class="block text-2xl font-bold text-white mt-1">{{ stats.bookings }}</span>
                        </div>
                        <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <span class="text-xs font-medium text-gray-400 uppercase">Beschikbare credits</span>
                            <span class="block text-2xl font-bold text-emerald-400 mt-1">{{ stats.availableCredits
                            }}</span>
                        </div>
                        <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <span class="text-xs font-medium text-gray-400 uppercase">Gebruikte credits</span>
                            <span class="block text-2xl font-bold text-gray-200 mt-1">{{ stats.usedCredits }}</span>
                        </div>
                        <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <span class="text-xs font-medium text-gray-400 uppercase">Totale omzet</span>
                            <span class="block text-2xl font-bold text-emerald-400 mt-1">{{ formatEuro(stats.revenue)
                            }}</span>
                        </div>
                    </div>
                </div>

                <!-- Personal Details (Reused) -->
                <AccountDetails :user="user" />

                <!-- Credits/Bookings (Reused from store state which we updated) -->
                <!-- Note: AccountDetails already includes "Mijn credits" section! -->
                <!-- Since AccountDetails includes the credits table (myCredits computed), and we called store.fetchCredits(userId), 
             Use AccountDetails is enough! It shows both personal info and credits history. -->

            </div>
        </div>
        <div v-else class="flex justify-center pt-40">
            <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin text-emerald-500 w-8 h-8" />
        </div>
    </div>
</template>
