<script setup lang="ts">
const { $rav } = useNuxtApp()
const { submitPhone, skipPhoneRequest } = useAuth()

const phoneInput = ref('')
const error = ref('')
const loading = ref(false)

const DUTCH_MOBILE_REGEX = /^\+316[0-9]{8}$/

function validateAndFormat(): string | null {
    const trimmed = phoneInput.value.trim()
    if (!trimmed) {
        error.value = 'Vul je mobiele telefoonnummer in'
        return null
    }
    const formatted = $rav.formatPhoneNumber(trimmed)
    if (!DUTCH_MOBILE_REGEX.test(formatted)) {
        error.value = 'Vul een geldig Nederlands mobiel nummer in (bijv. 0612345678)'
        return null
    }
    return formatted
}

async function onSave() {
    error.value = ''
    const formatted = validateAndFormat()
    if (!formatted) return

    loading.value = true
    try {
        await submitPhone(formatted)
    } catch (e: any) {
        error.value = e?.data?.statusMessage || 'Er is iets misgegaan, probeer opnieuw'
    } finally {
        loading.value = false
    }
}

async function onSkip() {
    loading.value = true
    try {
        await skipPhoneRequest()
    } catch {
        // Silent fail — refresh will clear the modal regardless
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
        <div
            class="w-full max-w-md rounded-2xl bg-gray-950 border border-gray-800 shadow-2xl shadow-emerald-950/20 p-8">

            <!-- Icon -->
            <div class="flex justify-center mb-5">
                <div class="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <UIcon name="i-lucide-smartphone" class="w-7 h-7 text-emerald-400" />
                </div>
            </div>

            <!-- Title -->
            <h2 class="text-xl font-bold text-white text-center mb-2">Telefoonnummer aanvullen</h2>
            <p class="text-gray-400 text-sm text-center mb-6">
                We hebben jouw mobiele nummer nog niet. Vul het hieronder in zodat we je direct kunnen bereiken als
                dat nodig is.
            </p>

            <!-- Input -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-300 mb-2">Mobiel nummer</label>
                <input v-model="phoneInput" type="tel" placeholder="06 12 34 56 78" @keyup.enter="onSave"
                    class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
                <p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>
            </div>

            <!-- Privacy notice -->
            <p class="text-xs text-gray-500 mb-6 leading-relaxed">
                <UIcon name="i-lucide-shield-check" class="inline w-3.5 h-3.5 mr-1 text-emerald-600" />
                Je telefoonnummer wordt <strong class="text-gray-400">niet</strong> gebruikt voor
                marketingdoeleinden. We nemen alleen contact op bij directe vragen over een les die je hebt geboekt
                of over jouw tegoed.
            </p>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3">
                <UButton @click="onSave" :loading="loading" :disabled="loading" color="primary" class="flex-1 justify-center font-semibold">
                    Opslaan
                </UButton>
                <UButton @click="onSkip" :disabled="loading" variant="ghost"
                    class="flex-1 justify-center text-gray-400 hover:text-white">
                    Overslaan
                </UButton>
            </div>

        </div>
    </div>
</template>
