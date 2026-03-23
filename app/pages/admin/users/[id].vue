<script setup lang="ts">
const route = useRoute()
const userId = route.params.id as string

// Protect route
definePageMeta({
    middleware: ['auth', 'admin']
})

const { data: userStats } = await useFetch(`/api/users/${userId}/stats`)
const { data: adminUsers } = await useAsyncData('admin-users', () => $fetch<any>('/api/users'))
const { data: loginHistoryData } = await useFetch<{ logins: any[] }>(`/api/users/${userId}/login-history`)

const user = computed(() => (adminUsers.value as any)?.users?.find((u: any) => u.$id === userId))
const stats = computed(() => userStats.value)

function formatEuro(value: number) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
}

</script>

<template>
    <div>
        <div v-if="user" class="container mx-auto px-4 sm:px-8 pt-28 pb-12 sm:pt-32 sm:pb-20">

            <!-- Back button -->
            <UButton @click="navigateTo('/account?tab=gebruikers')" icon="i-lucide-arrow-left" variant="ghost"
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
                <AccountDetails :user="user" :credits="(stats as any)?.availableCredits" />

                <!-- Login History -->
                <div>
                    <h2 class="text-xl font-bold text-white mb-4">Inloggeschiedenis</h2>
                    <div v-if="loginHistoryData?.logins?.length"
                        class="bg-gray-900/50 border border-gray-800 rounded-xl divide-y divide-gray-800">
                        <div v-for="login in loginHistoryData.logins" :key="login.id" class="p-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                            <span class="text-sm font-medium text-white whitespace-nowrap">
                                {{ new Date(login.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                            </span>
                            <span class="text-xs text-gray-500">{{ login.ipAddress || 'Onbekend IP' }}</span>
                            <span class="text-xs text-gray-600 truncate max-w-xs hidden sm:inline">{{ login.userAgent?.substring(0, 80) }}</span>
                        </div>
                    </div>
                    <p v-else class="text-gray-500 text-sm">Geen inloggeschiedenis beschikbaar.</p>
                </div>

            </div>
        </div>
        <div v-else class="flex justify-center pt-40">
            <UIcon name="i-lucide-refresh-cw" class="animate-spin text-emerald-500 w-8 h-8" />
        </div>
    </div>
</template>
