<script setup lang="ts">
defineProps<{
  modelValue: boolean
  message: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

function onConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function onCancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
    @click.self="onCancel">
    <div
      class="w-full max-w-sm rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-amber-400" />
          <h2 class="text-lg font-bold text-emerald-100 tracking-tight">Bevestigen</h2>
        </div>
        <UButton aria-label="Sluiten" icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="onCancel" />
      </div>
      <p class="text-base text-gray-200 mb-7">{{ message }}</p>
      <div class="flex gap-3 justify-end">
        <UButton color="neutral" variant="outline" size="md" @click="onCancel">Annuleer</UButton>
        <UButton color="error" variant="solid" size="md" @click="onConfirm">Verwijderen</UButton>
      </div>
    </div>
  </div>
</template>
