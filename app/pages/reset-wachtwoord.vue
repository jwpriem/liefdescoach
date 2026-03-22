<script setup lang="ts">
const route = useRoute()
const { resetPassword } = useAuth()
const { call, error: errorMessage, pending: isLoading } = useApiCall()

const token = route.query.token as string
const password = ref('')
const confirmPassword = ref('')
const success = ref(false)

definePageMeta({ ssr: false })

useHead({ title: 'Wachtwoord herstellen | Yoga Ravennah' })

const passwordError = computed(() => {
    if (!password.value) return ''
    if (password.value.length < 8) return 'Minimaal 8 tekens'
    return ''
})

const confirmError = computed(() => {
    if (!confirmPassword.value) return ''
    if (confirmPassword.value !== password.value) return 'Wachtwoorden komen niet overeen'
    return ''
})

const canSubmit = computed(() =>
    password.value.length >= 8 &&
    confirmPassword.value === password.value &&
    !isLoading.value
)

async function submit() {
    await call(() => resetPassword(token, password.value))
    if (!errorMessage.value) {
        success.value = true
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center px-4">
        <div
            class="w-full max-w-md p-8 rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm">

            <!-- No token -->
            <div v-if="!token" class="py-8 text-center">
                <UIcon name="i-lucide-x-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 class="text-xl font-bold text-white mb-2">Geen reset-link gevonden</h2>
                <p class="text-gray-300 mb-6">Gebruik de link uit de e-mail die je hebt ontvangen.</p>
                <UButton to="/login" color="primary" variant="solid" block>Naar inloggen</UButton>
            </div>

            <!-- Success -->
            <div v-else-if="success" class="py-8 text-center">
                <UIcon name="i-lucide-check-circle" class="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 class="text-2xl font-bold text-white mb-2">Je wachtwoord is gewijzigd</h2>
                <p class="text-gray-300 mb-6">Je kunt nu inloggen met je nieuwe wachtwoord.</p>
                <UButton to="/login" color="primary" variant="solid" block>Inloggen</UButton>
            </div>

            <!-- Form -->
            <div v-else>
                <div class="text-center mb-8">
                    <h1 class="text-2xl font-bold text-emerald-100 tracking-tight">Nieuw wachtwoord instellen</h1>
                    <p class="mt-2 text-sm text-gray-400">Kies een nieuw wachtwoord voor je account.</p>
                </div>

                <IsLoading :loading="isLoading" />

                <form @submit.prevent="submit" class="space-y-5">
                    <!-- Error -->
                    <div v-if="errorMessage" class="rounded-xl bg-red-950/40 border border-red-800/50 p-4">
                        <p class="text-sm text-red-300">{{ errorMessage }}</p>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-300 mb-1.5">
                            Nieuw wachtwoord <span class="text-red-500">*</span>
                            <span class="font-normal text-gray-500">(min. 8 tekens)</span>
                        </label>
                        <UInput id="password" v-model="password" size="lg" color="primary"
                            placeholder="Je nieuwe wachtwoord" type="password" variant="outline" />
                        <p v-if="passwordError" class="mt-1 text-xs text-red-400">{{ passwordError }}</p>
                    </div>

                    <div>
                        <label for="confirm-password" class="block text-sm font-medium text-gray-300 mb-1.5">
                            Bevestig wachtwoord <span class="text-red-500">*</span>
                        </label>
                        <UInput id="confirm-password" v-model="confirmPassword" size="lg" color="primary"
                            placeholder="Herhaal je wachtwoord" type="password" variant="outline" />
                        <p v-if="confirmError" class="mt-1 text-xs text-red-400">{{ confirmError }}</p>
                    </div>

                    <UButton :disabled="!canSubmit" color="primary" variant="solid" size="lg" block type="submit">
                        Wachtwoord opslaan
                    </UButton>
                </form>
            </div>

        </div>
    </div>
</template>
