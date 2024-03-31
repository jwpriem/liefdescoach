<script setup lang="ts">
const store = useMainStore()

const editMode = ref(false)
const addCredits = ref(null)
const user = ref(null)

const props = defineProps({
  isAdmin: {
    type: Boolean,
    default: false
  },
  loggedInUser: {
    type: Object,
    default: null
  },
  students: {
    type: Array,
    default: []
  }
});

function setUser(user) {
  this.user = user
  this.editMode = true
}

function cancel() {
  this.user = null
  this.addCredits = null
  this.editMode = false
}

async function update() {
  try {
    await store.addCredits(
      this.addCredits,
      this.user
    );
    loggedInUser
    this.cancel()
  } catch (error) {

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
         <sup class="text-emerald-500">Credits - Te betalen</sup>
         <span class="block -mt-2 flex flex-no-wrap align-center justify-start gap-x-2">
          {{ student.credits }} - {{ student.debits }}
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
    <div v-if="editMode" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
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
            <input id="add-credits"
              v-model="addCredits"
              type="number"
              placeholder="Aantal credits om toe te voegen"
              class="w-full"
            />
          </div>
          <div class="flex gap-x-3">
            <button class="button emerald button-small" type="button" @click="update(), editMode = false">
              Voeg credits toe
            </button>
            <button class="button emerald-outlined button-small" type="button" @click="cancel()">
              Annuleer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>