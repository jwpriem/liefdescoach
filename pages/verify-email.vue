<script setup lang="ts">
const route = useRoute()
const store = useMainStore()
const token = route.query.token as string
const verifying = ref(true)
const success = ref(false)
const error = ref('')

onMounted(async () => {
    if (!token) {
        error.value = 'Geen verificatietoken gevonden.'
        verifying.value = false
        return
    }

    try {
        await store.verifyEmail(token)
        if (store.errorMessage) {
            throw new Error(store.errorMessage)
        }
        success.value = true
        setTimeout(() => {
            navigateTo('/account')
        }, 3000)
    } catch (e: any) {
        error.value = e.message || 'Verificatie mislukt.'
    } finally {
        verifying.value = false
    }
})
</script>

<template>
    <div class="min-h-screen flex items-center justify-center px-4">
        <div
            class="w-full max-w-md p-8 rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm text-center">

            <div v-if="verifying" class="py-8">
                <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                <h2 class="text-xl font-bold text-white mb-2">Verifiëren...</h2>
                <p class="text-gray-400">Een moment geduld aub.</p>
            </div>

            <div v-else-if="success" class="py-8">
                <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 class="text-2xl font-bold text-white mb-2">E-mail geverifieerd!</h2>
                <p class="text-gray-300 mb-6">Je e-mailadres is succesvol bevestigd. Je wordt nu doorgestuurd naar je
                    account.</p>
                <UButton to="/account" color="primary" variant="solid" block>Naar mijn account</UButton>
            </div>

            <div v-else class="py-8">
                <UIcon name="i-heroicons-x-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 class="text-xl font-bold text-white mb-2">Verificatie mislukt</h2>
                <p class="text-gray-300 mb-6">{{ error }}</p>
                <UButton to="/contact" color="neutral" variant="solid" block>Neem contact op</UButton>
            </div>

        </div>
    </div>
</template>
