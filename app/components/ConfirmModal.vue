<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  message: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

const modalRef = ref<HTMLElement | null>(null)

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      modalRef.value?.focus()
    })
  }
})

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
    @click.self="onCancel" @keydown.esc="onCancel">
    <div
      ref="modalRef"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      class="w-full max-w-sm rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 focus:outline-none">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-amber-400" />
          <h2 id="confirm-modal-title" class="text-lg font-bold text-emerald-100 tracking-tight">Bevestigen</h2>
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
