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
      await store.nameUpdate(state.name, state.password);
    }
    if (state.email !== loggedInUser.value.email) {
      await store.emailUpdate(state.email, state.password);
    }
    if (state.phone !== loggedInUser.value.phone) {
      await store.phoneUpdate($rav.formatPhoneNumber(state.phone), state.password);
    }

    cancel();
    await store.getUser();
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
    <!--User info-->
          <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Mijn gegevens</span
              ><span class="text-emerald-700">.</span>
          </h2>
          <div class="p-4 bg-gray-800 rounded flex flex-col gap-y-3 w-full md:w-1/2 mt-8 mb-4">
            <div>
              <sup class="text-emerald-500">Naam</sup>
              <span class="block -mt-2">{{ loggedInUser.name }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Email</sup>
              <span class="block -mt-2">{{ loggedInUser.email }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Telefoon</sup>
              <span class="block -mt-2" v-if="loggedInUser.phone">{{ loggedInUser.phone }}</span>
              <span class="block -mt-2" v-else>Geen telefoonnummer</span>
            </div>
            <div>
              <sup class="text-emerald-500">Saldo</sup>
              <span class="block -mt-2" >{{ loggedInUser.prefs['credits'] }} {{ loggedInUser.prefs['credits'] == 1 ? 'les' : 'lessen' }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Geregistreerd op</sup>
              <span class="block -mt-2">{{ $rav.formatDateInDutch(loggedInUser.registration) }}</span>
            </div>
            <div class="flex gap-x-3">
              <UButton color="primary" variant="solid"  v-if="!state.editAccountDetails" @click="openEdit()">Gegevens bewerken</UButton>
              <UButton color="primary" variant="solid" v-if="!state.editPassword" @click="state.editPassword = true">Wachtwoord wijzigen</UButton>
            </div>


            <!--Pop up for editing details-->
            <div v-if="state.editAccountDetails" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
        <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
          <!-- Your form content goes here -->
          <div class="w-full flex flex-col gap-y-5">
            <h2 class="text-2xl md:text-4xl uppercase font-black">
                <span class="emerald-underline text-emerald-900"
                >Bewerk gegevens</span
                ><span class="text-emerald-700">.</span>
            </h2>
            <div>
            <div class="flex items-center justify-start">
              <label>E-mail</label>
            </div>
              <UInput id="email" color="primary" v-model="state.email" variant="outline" placeholder="Je e-mailadres" />
          </div>
          <div>
            <div class="flex items-center justify-start">
              <label>Naam</label>
            </div>
            <UInput id="name" color="primary" v-model="state.name" variant="outline" placeholder="Je naam" />
          </div>
          <div>
            <div class="flex items-center justify-start">
              <label>Telefoonnummer</label>
            </div>
            <UInput id="phone" color="primary" v-model="state.phone" variant="outline" placeholder="Je telefoonnummer" />
          </div>
          <div>
            <div class="flex items-center justify-start">
              <label>Wachtwoord (om de wijzigen op te slaan)</label>
            </div>
            <UInput id="password" color="primary" v-model="state.password" variant="outline" type="password" placeholder="Je wachtwoord" />
          </div>
            <div class="flex gap-x-3">
              <UButton color="primary" variant="solid"  @click="update(), state.editAccountDetails = false" :disabled="!state.password">Opslaan</UButton>
              <UButton color="primary" variant="outline" @click="cancel()">Annuleer</UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="state.editPassword" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Wachtwoord wijzigen</span
              ><span class="text-emerald-700">.</span>
          </h2>

          <div>
            <div class="flex items-center justify-start">
              <label>Huidige wachtwoord</label>
            </div>
            <UInput id="password" color="primary" v-model="state.password" variant="outline" type="password" placeholder="Je wachtwoord" />
          </div>
          <div>
            <div class="flex items-center justify-start">
              <label>Nieuw wachtwoord</label>
            </div>
            <UInput id="newPassword" color="primary" v-model="state.newPassword" variant="outline" type="password" placeholder="Je nieuwe wachtwoord" />

            <div v-if="passwordStrength" class="mt-3">
              <svg v-if="passwordStrength == 'Veilig wachtwoord'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 stroke-green-600 inline-block">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 stroke-red-600 inline-block">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span class="ml-2" :class="passwordStrength == 'Veilig wachtwoord' ? 'text-green-600' : 'text-red-600'">{{ passwordStrength }} </span>
            </div>
          </div>
          <div class="flex gap-x-3">
            <UButton color="primary" variant="solid"  @click="updatePassword(), state.editPassword = false" :disabled="!state.passwordCheck">Opslaan</UButton>
            <UButton color="primary" variant="outline" @click="cancel()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>