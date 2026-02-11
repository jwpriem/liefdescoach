<script setup lang="ts">
const store = useMainStore();
const router = useRouter();
const { $rav } = useNuxtApp();

import type { User } from '@/stores/index'

const props = defineProps<{
  user?: User | null
}>()

const state = reactive({
  name: null as string | null,
  email: null as string | null,
  phone: null as string | null,
  dateOfBirth: null as string | null,
  injury: null as string | null,
  pregnancy: false,
  dueDate: null as string | null,
  password: null as string | null,
  newPassword: null as string | null,
  editAccountDetails: false,
  editHealthDetails: false,
  editDateOfBirth: false,
  editPassword: false,
  passwordCheck: false,
});

const loggedInUser = computed(() => store.loggedInUser);
const targetUser = computed(() => props.user || loggedInUser.value);
const isAdmin = computed(() => store.isAdmin);
const myCredits = computed(() => store.myCredits);
const availableCredits = computed(() => props.user ? (store.studentCreditSummary[props.user.$id] || 0) : store.availableCredits);

const remindersEnabled = computed({
  get: () => targetUser.value?.prefs?.reminders !== false,
  set: async (value: boolean) => {
    await store.updatePrefs(targetUser.value, { ...targetUser.value.prefs, reminders: value });
  },
});

const creditTypeLabels: Record<string, string> = {
  credit_1: 'Losse les',
  credit_5: 'Kleine kaart (5)',
  credit_10: 'Grote kaart (10)',
};

function getCreditStatus(credit: any) {
  if (credit.bookingId) return 'Gebruikt';
  if (new Date(credit.validTo) <= new Date()) return 'Verlopen';
  return 'Beschikbaar';
}

function getCreditBadgeColor(credit: any): string {
  if (credit.bookingId) return 'error';
  if (new Date(credit.validTo) <= new Date()) return 'warning';
  return 'success';
}

function openEdit() {
  state.name = targetUser.value.name || null;
  state.phone = targetUser.value.phone || null;
  state.dateOfBirth = targetUser.value?.dateOfBirth
    ? new Date(targetUser.value.dateOfBirth).toISOString().slice(0, 10)
    : null;
  state.editAccountDetails = true;
}

function openEditHealth() {
  state.injury = targetUser.value.health?.injury || null;
  state.pregnancy = targetUser.value.health?.pregnancy || false;
  state.dueDate = targetUser.value.health?.dueDate ? new Date(targetUser.value.health.dueDate).toISOString().slice(0, 10) : null;
  state.editHealthDetails = true;
}

function cancel() {
  state.editAccountDetails = false;
  state.editHealthDetails = false;
  state.editDateOfBirth = false;
  state.editPassword = false;
  state.passwordCheck = false;
  state.name = null;
  state.email = null;
  state.phone = null;
  state.dateOfBirth = null;
  state.injury = null;
  state.pregnancy = false;
  state.dueDate = null;
  state.password = null;
  state.newPassword = null;
}

async function update() {
  if (!targetUser.value) return;
  try {
    // Call the new update-profile API (no password required)
    await $fetch('/api/students/update-profile', {
      method: 'POST',
      body: {
        userId: targetUser.value.$id,
        name: state.name,
        phone: state.phone ? $rav.formatPhoneNumber(state.phone) : null,
        dateOfBirth: state.dateOfBirth ? new Date(state.dateOfBirth).toISOString() : null
      }
    });
    await store.getUser(); // Refresh user details
    cancel();
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
}

async function updateHealth() {
  if (!targetUser.value) return;
  try {
    const currentHealth = targetUser.value.health || {};
    const newHealth = {
      injury: state.injury || undefined,
      pregnancy: state.pregnancy,
      dueDate: state.pregnancy ? state.dueDate : null
    };

    if (
      currentHealth.injury !== newHealth.injury ||
      currentHealth.pregnancy !== newHealth.pregnancy ||
      currentHealth.dueDate !== newHealth.dueDate
    ) {
      await store.updateHealth(targetUser.value, newHealth);
    }
    cancel();
  } catch (error) {
    // Handle errors
  }
}

async function updatePassword() {
  try {
    if (state.passwordCheck) {
      await store.updatePasswordUser(state.password, state.newPassword);
      cancel();
    }
  } catch (error) {
    // Handle your errors here
  }
}

const passwordStrength = computed(() => {
  let res = '';
  if (state.newPassword) {
    if (state.newPassword.length < 8) {
      res = 'Minimaal 8 tekens';
    } else if (state.newPassword === state.password) {
      res = 'Je kunt niet twee keer hetzelfde wachtwoord kiezen';
    } else {
      res = 'Veilig wachtwoord';
      state.passwordCheck = true;
    }
  }
  return res;
});

const verificationSent = ref(false)
const toast = useToast()

async function requestVerification() {
  verificationSent.value = true
  try {
    await store.requestEmailVerification()
    toast.add({
      title: 'Verificatie verzonden',
      description: 'Check je e-mailinbox (en spam) voor de verificatielink.',
      color: 'success',
      icon: 'i-heroicons-paper-airplane'
    })
  } catch (e) {
    verificationSent.value = false
    toast.add({
      title: 'Fout bij verzenden',
      description: 'Kon verificatiemail niet versturen.',
      color: 'error'
    })
  }
}
</script>

<template>
  <div v-if="targetUser">
    <!-- Section heading -->
    <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
      <span class="emerald-underline text-emerald-900">Mijn gegevens</span><span class="text-emerald-700">.</span>
    </h2>

    <!-- User info card -->
    <div
      class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6 sm:p-8 w-full md:w-1/2">
      <div class="space-y-4">
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Naam</span>
          <span class="block text-gray-100 mt-0.5">{{ targetUser.name }}</span>
        </div>
        <div>
          <div class="flex items-center gap-x-2">
            <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Email</span>
            <div class="flex items-center gap-x-2">
              <UBadge v-if="targetUser.emailVerification" color="success" variant="subtle" size="xs">Geverifieerd</UBadge>
              <template v-else>
                <UBadge color="warning" variant="subtle" size="xs">Ongeverifieerd</UBadge>
                <button @click="requestVerification" :disabled="verificationSent"
                  class="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ verificationSent ? 'Verzonden' : 'Verifieer nu' }}
                </button>
              </template>
            </div>
          </div>
          <span class="block text-gray-100 mt-0.5">{{ targetUser.email }}</span>
        </div>
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Telefoon</span>
          <span class="block text-gray-100 mt-0.5" v-if="targetUser.phone">{{ targetUser.phone }}</span>
          <span class="block text-gray-400 mt-0.5" v-else>Geen telefoonnummer</span>
        </div>
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geboortedatum</span>
          <span class="block text-gray-100 mt-0.5" v-if="targetUser.dateOfBirth">{{
            $rav.formatDateInDutch(targetUser.dateOfBirth) }}</span>
          <span class="block text-gray-400 mt-0.5" v-else>Niet opgegeven</span>
        </div>
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Saldo</span>
          <span class="block text-gray-100 mt-0.5">{{ availableCredits }} {{ availableCredits == 1 ? 'les' : 'lessen'
          }}</span>
        </div>
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geregistreerd op</span>
          <span class="block text-gray-100 mt-0.5">{{ $rav.formatDateInDutch(targetUser.registration) }}</span>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-gray-800/50">
          <div>
            <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Herinneringsmail</span>
            <span class="block text-gray-400 text-xs mt-0.5">Ontvang een e-mail de avond voor je les</span>
          </div>
          <USwitch v-model="remindersEnabled" color="primary" />
        </div>
      </div>
      <div class="flex flex-col gap-3 mt-6">
        <UButton color="primary" variant="solid" size="lg" class="justify-center" v-if="!state.editAccountDetails"
          @click="openEdit()">Gegevens
          bewerken</UButton>
        <UButton color="primary" variant="outline" size="lg" class="justify-center" v-if="!state.editPassword"
          @click="state.editPassword = true">
          Wachtwoord wijzigen</UButton>
      </div>
    </div>

    <h2 class="text-2xl md:text-4xl uppercase font-black my-6">
      <span class="emerald-underline text-emerald-900">Medische info</span><span class="text-emerald-700">.</span>
    </h2>

    <div
      class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6 sm:p-8 w-full md:w-1/2">
      <div class="space-y-4">
        <!-- Medical Info Section -->

        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Blessures /
            bijzonderheden</span>
          <p class="text-gray-100 mt-0.5 whitespace-pre-wrap" v-if="targetUser.health?.injury">{{
            targetUser.health.injury }}</p>
          <span class="block text-gray-400 text-sm mt-0.5 italic" v-else>Geen bijzonderheden opgegeven</span>
        </div>
        <div v-if="targetUser.health?.pregnancy">
          <span class="text-xs font-medium text-rose-400/80 uppercase tracking-wide">Zwangerschap</span>
          <p class="text-gray-100 mt-0.5">Uitgerekende datum: <span class="font-medium">{{ targetUser.health.dueDate ?
            $rav.formatDateInDutch(targetUser.health.dueDate) : 'Niet opgegeven' }}</span></p>
        </div>

      </div>
      <div class="flex flex-col gap-3 mt-6">
        <UButton color="primary" variant="solid" size="lg" class="justify-center" @click="openEditHealth()">
          Medische info bewerken</UButton>
      </div>
    </div>

    <!-- Credit history -->
    <div v-if="myCredits.length" class="mt-10">
      <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
        <span class="emerald-underline text-emerald-900">Mijn credits</span><span class="text-emerald-700">.</span>
      </h2>

      <!-- Mobile: card layout -->
      <div class="flex flex-col gap-y-3 md:hidden">
        <div v-for="credit in myCredits" :key="credit.$id"
          class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-200">{{ creditTypeLabels[credit.type] || credit.type }}</span>
            <UBadge :color="getCreditBadgeColor(credit)" variant="subtle" size="xs">{{ getCreditStatus(credit) }}
            </UBadge>
          </div>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <template v-if="credit.lesson">
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
              <span class="text-gray-300">{{ credit.lesson?.type ?
                $rav.getLessonTitle(credit.lesson) : '-' }}</span>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Docent</span>
              <span class="text-gray-300">{{ credit.lesson.teacher }}</span>
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Lesdatum</span>
              <span class="text-gray-300">{{ $rav.formatDateInDutch(credit.lesson.date) }}</span>
            </template>
            <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geldig tot</span>
            <span class="text-gray-300">{{ $rav.formatDateInDutch(credit.validTo) }}</span>
          </div>
        </div>
      </div>

      <!-- Desktop: table layout -->
      <div
        class="hidden md:block rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-gray-700/50">
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Type</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Status</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Docent</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Lesdatum</th>
              <th class="py-3 px-4 text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geldig tot</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="credit in myCredits" :key="credit.$id" class="border-b border-gray-800/50 last:border-b-0">
              <td class="py-3 px-4 text-sm text-gray-200">{{ creditTypeLabels[credit.type] || credit.type }}</td>
              <td class="py-3 px-4 text-sm">
                <UBadge :color="getCreditBadgeColor(credit)" variant="subtle" size="xs">{{ getCreditStatus(credit) }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson?.type ?
                $rav.getLessonTitle(credit.lesson) : '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson?.teacher || '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson ? $rav.formatDateInDutch(credit.lesson.date)
                : '-'
              }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ $rav.formatDateInDutch(credit.validTo) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Edit details -->
    <div v-if="state.editAccountDetails" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
      <div
        class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Bewerk gegevens</h2>

          <div>
            <label for="name" class="block text-sm font-medium text-gray-300 mb-1.5">Naam</label>
            <UInput id="name" color="primary" v-model="state.name" variant="outline" size="lg" placeholder="Je naam" />
          </div>
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-300 mb-1.5">Telefoonnummer</label>
            <UInput id="phone" color="primary" v-model="state.phone" variant="outline" size="lg"
              placeholder="Je telefoonnummer" />
          </div>
          <div>
            <label for="dateOfBirth" class="block text-sm font-medium text-gray-300 mb-1.5">Geboortedatum</label>
            <UInput type="date" id="dateOfBirth" color="primary" v-model="state.dateOfBirth" variant="outline"
              size="lg" />
          </div>
        </div>


        <div class="flex gap-3 mt-4">
          <UButton color="primary" variant="solid" size="lg" @click="update()">Opslaan</UButton>
          <UButton color="primary" variant="outline" size="lg" @click="cancel()">Annuleer</UButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Change password -->
  <div v-if="state.editPassword" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
    <div
      class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
      <div class="w-full flex flex-col gap-y-5">
        <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Wachtwoord wijzigen</h2>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-1.5">Huidige wachtwoord</label>
          <UInput id="password" color="primary" v-model="state.password" variant="outline" size="lg" type="password"
            placeholder="Je wachtwoord" />
        </div>
        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-300 mb-1.5">Nieuw wachtwoord</label>
          <UInput id="newPassword" color="primary" v-model="state.newPassword" variant="outline" size="lg"
            type="password" placeholder="Je nieuwe wachtwoord" />

          <div v-if="passwordStrength" class="flex items-center gap-2 mt-3">
            <svg v-if="passwordStrength == 'Veilig wachtwoord'" class="w-4 h-4 text-emerald-400 shrink-0" fill="none"
              stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2"
              viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="text-xs"
              :class="passwordStrength == 'Veilig wachtwoord' ? 'text-emerald-400' : 'text-red-400'">{{
                passwordStrength
              }}</span>
          </div>
        </div>
        <div class="flex gap-3 mt-2">
          <UButton color="primary" variant="solid" size="lg" @click="updatePassword(), state.editPassword = false"
            :disabled="!state.passwordCheck">Opslaan</UButton>
          <UButton color="primary" variant="outline" size="lg" @click="cancel()">Annuleer</UButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Edit Health Details -->
  <div v-if="state.editHealthDetails" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
    <div
      class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
      <div class="w-full flex flex-col gap-y-5">
        <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Medische info bewerken</h2>

        <div class="space-y-4">
          <div>
            <label for="injury" class="block text-sm font-medium text-gray-300 mb-1.5">Blessures of
              bijzonderheden</label>
            <UTextarea id="injury" color="primary" v-model="state.injury" variant="outline" size="lg"
              placeholder="Heb je blessures of ben je zwanger? Laat het ons weten." />
          </div>
          <div class="flex items-center justify-between">
            <label for="pregnancy" class="block text-sm font-medium text-gray-300">Ben je zwanger?</label>
            <USwitch v-model="state.pregnancy" color="primary" />
          </div>
          <div v-if="state.pregnancy">
            <label for="dueDate" class="block text-sm font-medium text-gray-300 mb-1.5">Uitgerekende datum</label>
            <UInput type="date" id="dueDate" color="primary" v-model="state.dueDate" variant="outline" size="lg" />
          </div>
        </div>

        <div class="flex gap-3 mt-4">
          <UButton color="primary" variant="solid" size="lg" @click="updateHealth()">Opslaan</UButton>
          <UButton color="primary" variant="outline" size="lg" @click="cancel()">Annuleer</UButton>
        </div>
      </div>
    </div>
  </div>
</template>
