<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const pricingPlans = [
  { name: 'Losse les', credits: '1 les', price: '€ 16,00', tag: null, highlight: false, gold: false },
  { name: 'Kleine kaart', credits: '5 lessen', price: '€ 72,50', tag: 'Probeer het uit', highlight: false, gold: false },
  { name: 'Strippenkaart', credits: '10 lessen', price: '€ 135,00', tag: 'Meest gekozen', highlight: true, gold: false },
  { name: 'Grote kaart', credits: '20 lessen', price: '€ 250,00', tag: 'Meest voordelig', highlight: false, gold: true },
]

function buyPlan(plan: typeof pricingPlans[0]) {
  window.location.href = `https://wa.me/+31647699709?text=Hi Ravennah, ik wil graag een ${plan.name.toLowerCase()} kopen t.w.v. ${plan.price} euro voor ${plan.credits}`
  emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black/75 flex justify-center items-end sm:items-center z-50 p-4"
      @click.self="close"
    >
      <div class="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800/80 shadow-2xl shadow-black/50 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-5 border-b border-gray-800/80">
          <div>
            <h2 class="text-lg font-bold text-white">Koop credits</h2>
            <p class="text-sm text-gray-400 mt-0.5">Kies een kaart via WhatsApp</p>
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            @click="close"
          >
            <UIcon name="i-heroicons-x-mark" class="size-5" />
          </button>
        </div>

        <!-- Plans -->
        <div class="p-4 flex flex-col gap-3">
          <button
            v-for="plan in pricingPlans"
            :key="plan.name"
            class="w-full text-left rounded-xl p-4 border transition-all"
            :class="[
              plan.gold
                ? 'bg-yellow-950/40 border-yellow-700/50 hover:border-yellow-500/80'
                : plan.highlight
                  ? 'bg-emerald-950/40 border-emerald-700/50 hover:border-emerald-400/80'
                  : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-500/80'
            ]"
            @click="buyPlan(plan)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-semibold" :class="plan.gold ? 'text-yellow-300' : plan.highlight ? 'text-emerald-300' : 'text-white'">
                  {{ plan.name }}
                </span>
                <span
                  v-if="plan.tag"
                  class="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  :class="plan.gold ? 'bg-yellow-700/50 text-yellow-200' : 'bg-emerald-700/50 text-emerald-200'"
                >
                  {{ plan.tag }}
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-sm text-gray-400">{{ plan.credits }}</span>
                <span class="font-bold" :class="plan.gold ? 'text-yellow-300' : plan.highlight ? 'text-emerald-300' : 'text-white'">
                  {{ plan.price }}
                </span>
                <UIcon name="i-heroicons-arrow-right" class="size-4 text-gray-500" />
              </div>
            </div>
          </button>
        </div>

        <!-- Footer note -->
        <div class="px-5 pb-5">
          <p class="text-xs text-gray-500 text-center">
            Je wordt doorgestuurd naar WhatsApp om de aankoop te bevestigen
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
