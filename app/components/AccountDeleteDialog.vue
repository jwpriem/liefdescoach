<script setup lang="ts">
import { DELETE_ACCOUNT_CONFIRMATION } from '~~/shared/account'

const props = defineProps<{ credits: number }>()
const emit = defineEmits<{ close: [] }>()

const { deleteAccount } = useAuth()
const { call, error, pending } = useApiCall()
const toast = useToast()

const typed = ref('')
const confirmed = computed(() => typed.value === DELETE_ACCOUNT_CONFIRMATION)

function close() {
  if (!pending.value) emit('close')
}

async function remove() {
  if (!confirmed.value) return
  await call(() => deleteAccount(typed.value))
  if (error.value) return
  toast.add({ title: 'Je account is verwijderd', color: 'primary' })
  await navigateTo('/')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title"
    class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4" @click.self="close()">
    <div
      class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
      <div class="w-full flex flex-col gap-y-5">
        <h2 id="delete-account-title" class="text-2xl font-bold text-emerald-100 tracking-tight">Account verwijderen</h2>

        <ul class="list-disc pl-5 space-y-2 text-sm text-gray-300">
          <li>Je naam, e-mailadres, telefoonnummer, geboortedatum en medische info worden gewist.</li>
          <li>Je komende boekingen worden geannuleerd.</li>
          <li v-if="props.credits > 0">
            {{ props.credits === 1 ? 'Je verliest 1 ongebruikte credit.' : `Je verliest ${props.credits} ongebruikte credits.` }}
          </li>
          <li>Je eerdere boekingen blijven zonder je naam bewaard voor onze administratie.</li>
        </ul>

        <p class="text-sm font-medium text-red-400">Dit kan niet ongedaan worden gemaakt.</p>

        <div>
          <label for="delete-account-confirmation" class="block text-sm font-medium text-gray-300 mb-1.5">Typ {{ DELETE_ACCOUNT_CONFIRMATION }} om te bevestigen</label>
          <UInput id="delete-account-confirmation" color="primary" v-model="typed" variant="outline" size="lg"
            autocomplete="off" autocapitalize="characters" />
        </div>

        <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>

        <div class="flex flex-wrap gap-3 mt-4">
          <UButton color="error" variant="solid" size="lg" :disabled="!confirmed" :loading="pending" @click="remove()">Account definitief verwijderen</UButton>
          <UButton color="primary" variant="outline" size="lg" :disabled="pending" @click="close()">Annuleer</UButton>
        </div>
      </div>
    </div>
  </div>
</template>
