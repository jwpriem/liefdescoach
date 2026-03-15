<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const pricingPlans = [
  { name: 'Losse les', credits: '1 les', price: '€ 16,00', perClass: null, highlight: false, gold: false },
  { name: 'Kleine kaart', credits: '5 lessen', price: '€ 72,50', perClass: '€ 14,50 p/les', highlight: false, gold: false },
  { name: 'Strippenkaart', credits: '10 lessen', price: '€ 135,00', perClass: '€ 13,50 p/les', highlight: true, gold: false },
  { name: 'Grote kaart', credits: '20 lessen', price: '€ 250,00', perClass: '€ 12,50 p/les', highlight: false, gold: true },
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
      class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
      @click.self="close"
    >
      <div class="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6 sm:p-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Koop credits</h2>
          <button @click="close" class="text-gray-400 hover:text-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Plans -->
        <div class="flex flex-col gap-3">
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
              <div>
                <span class="font-semibold" :class="plan.gold ? 'text-yellow-300' : plan.highlight ? 'text-emerald-300' : 'text-white'">
                  {{ plan.name }}
                </span>
                <span v-if="plan.perClass" class="block text-xs text-gray-500 mt-0.5">{{ plan.perClass }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-sm text-gray-400">{{ plan.credits }}</span>
                <span class="font-bold" :class="plan.gold ? 'text-yellow-300' : plan.highlight ? 'text-emerald-300' : 'text-white'">
                  {{ plan.price }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <!-- Footer note -->
        <p class="text-xs text-gray-500 text-center mt-6">
          Je wordt doorgestuurd naar WhatsApp om de aankoop te bevestigen
        </p>
      </div>
    </div>
  </Teleport>
</template>
