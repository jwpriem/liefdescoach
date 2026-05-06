<script setup lang="ts">
const props = withDefaults(defineProps<{
  requireEmail?: boolean
  submitLabel?: string
}>(), {
  requireEmail: false,
  submitLabel: 'Toevoegen',
})

const emit = defineEmits<{
  created: [student: { $id: string; name: string; email: string | null }]
  cancel: []
}>()

const name = ref('')
const email = ref('')
const isSubmitting = ref(false)
const errorMsg = ref<string | null>(null)

const trimmedName = computed(() => name.value.trim())
const trimmedEmail = computed(() => email.value.trim())
const canSubmit = computed(() =>
  trimmedName.value.length > 0 && (!props.requireEmail || trimmedEmail.value.length > 0)
)

async function submit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  errorMsg.value = null
  try {
    const res = await $fetch<any>('/api/admin/createStudent', {
      method: 'POST',
      body: {
        name: trimmedName.value,
        email: trimmedEmail.value || undefined,
      },
    })
    name.value = ''
    email.value = ''
    emit('created', res.student)
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || err?.statusMessage || 'Kon gebruiker niet aanmaken'
  } finally {
    isSubmitting.value = false
  }
}

function cancel() {
  name.value = ''
  email.value = ''
  errorMsg.value = null
  emit('cancel')
}
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">Naam</label>
      <UInput v-model="name" icon="i-lucide-user" size="lg" color="primary" variant="outline" class="w-full"
        placeholder="Naam" @keyup.enter="submit" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1.5">
        E-mail <span v-if="!requireEmail" class="text-gray-500 font-normal">(optioneel)</span>
      </label>
      <UInput v-model="email" icon="i-lucide-mail" size="lg" color="primary" variant="outline" class="w-full"
        type="email" placeholder="naam@voorbeeld.nl" @keyup.enter="submit" />
    </div>
    <p v-if="errorMsg" class="text-sm text-red-400">{{ errorMsg }}</p>
    <div class="flex gap-3 mt-1">
      <UTooltip :text="!canSubmit ? 'Vul alle verplichte velden in' : submitLabel">
        <div>
          <UButton :loading="isSubmitting" :disabled="!canSubmit" color="primary" variant="solid" size="lg" @click="submit">
            {{ submitLabel }}
          </UButton>
        </div>
      </UTooltip>
      <UButton color="primary" variant="outline" size="lg" @click="cancel">Annuleer</UButton>
    </div>
  </div>
</template>
