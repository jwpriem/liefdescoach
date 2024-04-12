<script setup lang="ts">
const store = useMainStore();

// Using a reactive object to group related states
const state = reactive({
  editMode: false,
  addCredits: null as number | null,
  user: null as any | null, // Adjust 'any' to the appropriate type for your user objects
});

const students = computed(() => store.students);
const loggedInUser = computed(() => store.loggedInUser);
const isAdmin = computed(() => store.isAdmin);

function setUser(selectedUser: any): void { // Adjust 'any' to your user type
  state.user = selectedUser;
  state.editMode = true;
}

function cancel(): void {
  state.user = null;
  state.addCredits = null;
  state.editMode = false;
}

async function updatePrefs(userId: string, credits: number, current: number): Promise<void> {
  try {
    await $fetch('/api/updatePrefs', {
      method: 'post',
      body: {
        userId,
        prefs: {
          credits: +current + credits,
        },
      },
    });

    cancel(); // Use cancel function to reset state
    await store.getUser(); // Assuming getUser is an async operation
  } catch (error) {
    console.error('Failed to update preferences:', error);
  }
}
</script>

<template>
  <div v-if="isAdmin && students.length">
    <h2 class="text-2xl md:text-4xl uppercase font-black">
     <span class="emerald-underline text-emerald-900">Gebruikers ({{students.length}})</span><span class="text-emerald-700">.</span>
   </h2>

   <div class="w-full" v-if="students.length && loggedInUser">
    <div class="grid grid-cols-1 md:grid-cols-4 mt-8 gap-3">
      <div v-for="student in students" index="student.$id" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3 w-full">
        <div>
          <sup class="text-emerald-500">Naam</sup>
          <span class="block -mt-2">{{ student.name }}</span>
        </div>
        <div>
          <sup class="text-emerald-500">Email</sup>
          <span class="block -mt-2">{{ student.email }}</span>
        </div>
        <div>
          <sup class="text-emerald-500">Telefoon</sup>
          <span class="block -mt-2" v-if="student.phone">{{ student.phone }}</span>
          <span class="block -mt-2" v-else>Geen telefoonnummer</span>
        </div>
        <div>
         <sup class="text-emerald-500">Saldo</sup>
         <span class="block -mt-2 flex flex-no-wrap align-center justify-start gap-x-2" v-if="student.prefs">
         {{ student.prefs['credits'] }} {{ student.prefs['credits'] == 1 ? 'les' : 'lessen' }}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 cursor-pointer" @click="setUser(student)">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
         </span>
        </div>
        <div>
          <sup class="text-emerald-500">Geregistreerd</sup>
          <span class="block -mt-2">{{ $rav.formatDateInDutch(student.registration) }}</span>
        </div>
      </div>
    </div>
   </div>

   <!--Pop up for adding credits-->
    <div v-if="state.editMode" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <!-- Your form content goes here -->
        <div class="w-full flex flex-col gap-y-5">
          <h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Voeg credits toe</span
              ><span class="text-emerald-700">.</span>
          </h2>
          <div>
            <div class="flex items-center justify-start">
              <label>Credits toevoegen</label>
            </div>
           <UInput id="add-credits" color="primary" v-model="state.addCredits" type="number" variant="outline" placeholder="Aantal credits om toe te voegen" />
          </div>
          <div class="flex gap-x-3">
           <UButton color="primary" variant="solid" :disabled="!state.addCredits"  @click="updatePrefs(state.user.$id, state.addCredits, state.user.prefs['credits']), state.editMode = false">Voeg credits toe</UButton>
           <UButton color="primary" variant="solid" @click="cancel()">Annuleer</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>