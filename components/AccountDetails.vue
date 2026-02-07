<script setup lang="ts">
const store = useMainStore();
const router = useRouter();
const { $rav } = useNuxtApp();

const state = reactive({
  name: null,
  email: null,
  phone: null,
  password: null,
  newPassword: null,
  editAccountDetails: false,
  editPassword: false,
  passwordCheck: false,
});

const loggedInUser = computed(() => store.loggedInUser);
const isAdmin = computed(() => store.isAdmin);
const myCredits = computed(() => store.myCredits);
const availableCredits = computed(() => store.availableCredits);

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
  if (credit.bookingId) return 'red';
  if (new Date(credit.validTo) <= new Date()) return 'orange';
  return 'green';
}

function openEdit() {
  state.name = loggedInUser.value.name;
  state.email = loggedInUser.value.email;
  state.phone = loggedInUser.value.phone;
  state.editAccountDetails = true;
}

function cancel() {
  Object.keys(state).forEach(key => {
    if (typeof state[key] === 'boolean') state[key] = false;
    else state[key] = null;
  });
}

async function update() {
  try {
    if (state.name !== loggedInUser.value.name) {
	    await store.updateUserDetail('name', state.name, state.password)
    }
    if (state.email !== loggedInUser.value.email) {
	    await store.updateUserDetail('email', state.email, state.password)
    }
    if (state.phone !== loggedInUser.value.phone) {
	    await store.updateUserDetail('phone', $rav.formatPhoneNumber(state.phone), state.password)
    }

    cancel();
  } catch (error) {
    // Handle your errors here
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
</script>

<template>
  <div v-if="loggedInUser">
    <!-- Section heading -->
    <h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
      <span class="emerald-underline text-emerald-900">Mijn gegevens</span><span class="text-emerald-700">.</span>
    </h2>

    <!-- User info card -->
    <div class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6 sm:p-8 w-full md:w-1/2">
      <div class="space-y-4">
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Naam</span>
          <span class="block text-gray-100 mt-0.5">{{ loggedInUser.name }}</span>
        </div>
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Email</span>
          <span class="block text-gray-100 mt-0.5">{{ loggedInUser.email }}</span>
        </div>
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Telefoon</span>
          <span class="block text-gray-100 mt-0.5" v-if="loggedInUser.phone">{{ loggedInUser.phone }}</span>
          <span class="block text-gray-400 mt-0.5" v-else>Geen telefoonnummer</span>
        </div>
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Saldo</span>
          <span class="block text-gray-100 mt-0.5">{{ availableCredits }} {{ availableCredits == 1 ? 'les' : 'lessen' }}</span>
        </div>
        <div>
          <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Geregistreerd op</span>
          <span class="block text-gray-100 mt-0.5">{{ $rav.formatDateInDutch(loggedInUser.registration) }}</span>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <UButton color="primary" variant="solid" size="lg" v-if="!state.editAccountDetails" @click="openEdit()">Gegevens bewerken</UButton>
        <UButton color="primary" variant="outline" size="lg" v-if="!state.editPassword" @click="state.editPassword = true">Wachtwoord wijzigen</UButton>
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
            <UBadge :color="getCreditBadgeColor(credit)" variant="subtle" size="xs">{{ getCreditStatus(credit) }}</UBadge>
          </div>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <template v-if="credit.lesson">
              <span class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Les</span>
              <span class="text-gray-300">{{ credit.lesson.type }}</span>
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
      <div class="hidden md:block rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 overflow-hidden">
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
              <td class="py-3 px-4 text-sm"><UBadge :color="getCreditBadgeColor(credit)" variant="subtle" size="xs">{{ getCreditStatus(credit) }}</UBadge></td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson?.type || '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson?.teacher || '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ credit.lesson ? $rav.formatDateInDutch(credit.lesson.date) : '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-300">{{ $rav.formatDateInDutch(credit.validTo) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Edit details -->
    <div v-if="state.editAccountDetails" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
      <div class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Bewerk gegevens</h2>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
            <UInput id="email" color="primary" v-model="state.email" variant="outline" size="lg" placeholder="Je e-mailadres" />
          </div>
          <div>
            <label for="name" class="block text-sm font-medium text-gray-300 mb-1.5">Naam</label>
            <UInput id="name" color="primary" v-model="state.name" variant="outline" size="lg" placeholder="Je naam" />
          </div>
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-300 mb-1.5">Telefoonnummer</label>
            <UInput id="phone" color="primary" v-model="state.phone" variant="outline" size="lg" placeholder="Je telefoonnummer" />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-1.5">Wachtwoord (om de wijzigen op te slaan)</label>
            <UInput id="password" color="primary" v-model="state.password" variant="outline" size="lg" type="password" placeholder="Je wachtwoord" />
          </div>
          <div class="flex gap-3 mt-2">
            <UButton color="primary" variant="solid" size="lg" @click="update(), state.editAccountDetails = false" :disabled="!state.password">Opslaan</UButton>
            <UButton color="primary" variant="outline" size="lg" @click="cancel()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Change password -->
    <div v-if="state.editPassword" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
      <div class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Wachtwoord wijzigen</h2>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-1.5">Huidige wachtwoord</label>
            <UInput id="password" color="primary" v-model="state.password" variant="outline" size="lg" type="password" placeholder="Je wachtwoord" />
          </div>
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-300 mb-1.5">Nieuw wachtwoord</label>
            <UInput id="newPassword" color="primary" v-model="state.newPassword" variant="outline" size="lg" type="password" placeholder="Je nieuwe wachtwoord" />

            <div v-if="passwordStrength" class="flex items-center gap-2 mt-3">
              <svg v-if="passwordStrength == 'Veilig wachtwoord'" class="w-4 h-4 text-emerald-400 shrink-0" fill="none"
                   stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2"
                   viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="text-xs" :class="passwordStrength == 'Veilig wachtwoord' ? 'text-emerald-400' : 'text-red-400'">{{ passwordStrength }}</span>
            </div>
          </div>
          <div class="flex gap-3 mt-2">
            <UButton color="primary" variant="solid" size="lg" @click="updatePassword(), state.editPassword = false" :disabled="!state.passwordCheck">Opslaan</UButton>
            <UButton color="primary" variant="outline" size="lg" @click="cancel()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
