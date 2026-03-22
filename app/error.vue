<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
    <p class="text-6xl font-bold text-gray-300 dark:text-gray-600">{{ error?.statusCode ?? '?' }}</p>
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
      {{ title }}
    </h1>
    <p class="text-gray-500 dark:text-gray-400 max-w-sm">
      {{ message }}
    </p>
    <UButton @click="handleError" color="primary" variant="solid">
      Terug naar home
    </UButton>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number; message?: string } | null }>()

const title = computed(() => {
  if (props.error?.statusCode === 404) return 'Pagina niet gevonden'
  if (props.error?.statusCode === 403) return 'Geen toegang'
  return 'Er is iets misgegaan'
})

const message = computed(() => {
  if (props.error?.statusCode === 404) return 'De pagina die je zoekt bestaat niet of is verplaatst.'
  if (props.error?.statusCode === 403) return 'Je hebt geen toegang tot deze pagina.'
  return 'Probeer het later opnieuw of ga terug naar de homepagina.'
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>
