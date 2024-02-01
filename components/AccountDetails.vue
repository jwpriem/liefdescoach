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
              <sup class="text-emerald-500">Credits</sup>
              <span class="block -mt-2 flex flex-no-wrap align-center justify-start gap-x-2">{{ loggedInUser.credits }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Te betalen lessen</sup>
              <span class="block -mt-2 flex flex-no-wrap align-center justify-start gap-x-2">{{ loggedInUser.debits }}</span>
            </div>
            <div>
              <sup class="text-emerald-500">Geregistreerd op</sup>
              <span class="block -mt-2">{{ $rav.formatDateInDutch(loggedInUser.registration) }}</span>
            </div>
            <div>
              <div class="button button-small emerald" v-if="!editMode" @click="openEdit()">Gegevens bewerken</div>
              <div class="button button-small emerald mx-3" v-if="!editPassword" @click="editPassword = true">Wachtwoord wijzigen</div>
            </div>
            
            
            <!--Pop up for editing details-->
      <div v-if="editMode" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
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
            <input id="email"
              v-model="email"
              type="text"
              placeholder="Je e-mailadres"
              class="w-full"
            />
          </div>
          <div>
            <div class="flex items-center justify-start">
              <label>Naam</label>
            </div>
            <input id="name"
              v-model="name"
              type="text"
              placeholder="Je naam"
              class="w-full"
            />
          </div>
          <div>
            <div class="flex items-center justify-start">
              <label>Telefoonnummer</label>
            </div>
            <input id="phone"
              v-model="phone"
              type="text"
              placeholder="Je telefoonnummer"
              class="w-full"
            />
          </div>
          <div>
            <div class="flex items-center justify-start">
              <label>Wachtwoord (om de wijzigen op te slaan)</label>
            </div>
            <input id="password"
              v-model="password"
              type="password"
              placeholder="Je wachtwoord"
              class="w-full"
            />
          </div>
            <div class="flex gap-x-3">
              <button :disabled="!password" class="button emerald button-small" :class="!password ? 'disabled' : ''"
                      type="button" @click="update(), editMode = false">
                Opslaan
              </button>
              <button class="button emerald-outlined button-small" type="button" @click="cancel()">
                Annuleer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="editPassword" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
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
            <input id="password"
              v-model="password"
              type="password"
              placeholder="Je huidige wachtwoord"
              class="w-full"
            />
          </div>
          <div>
            <div class="flex items-center justify-start">
              <label>Nieuw wachtwoord</label>
            </div>
            <input id="newPassword"
              v-model="newPassword"
              type="password"
              placeholder="Je nieuwe wachtwoord"
              class="w-full"
            />
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
            <button :disabled="!passwordCheck" class="button emerald button-small" :class="!passwordCheck ? 'disabled' : ''"
                    type="button" @click="updatePassword(), editPassword = false">
              Opslaan
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

<script>
export default {
  props: {
    isAdmin: {
      type: Boolean,
      default: false
    },
    loggedInUser: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      name: null,
      email: null,
      phone: null,
      password: null,
      newPassword: null,
      editMode: false,
      editPassword: false,
      passwordCheck: false
    }
  },
  computed: {
    passwordStrength() {
      let res = ''
      if(this.newPassword) {
        if(this.newPassword.length < 8 ) {
          res = 'Minimaal 8 tekens'
        } else if(this.newPassword == this.password) {
          res = 'Je kunt niet twee keer hetzelfde wachtwoord kiezen'
        } else {
          res = this.newPassword ? 'Veilig wachtwoord' : ''
          this.passwordCheck = true
        }
      }
      
      return res
    }
  },
  methods: {
    openEdit() {
      this.name = this.loggedInUser.name
      this.email = this.loggedInUser.email
      this.phone = this.loggedInUser.phone
      this.editMode = true
    },
    
    cancel() {
      this.name = null
      this.email = null
      this.phone = null
      this.password = null
      this.newPassword = null
      this.editMode = false
      this.editPassword = false
      this.passwordCheck = false
    },
    
    async update() {
      try {
        await this.$store.dispatch('updateAccount', {
          name: this.name,
          password: this.password,
          phone: this.$rav.formatPhoneNumber(this.phone),
          email: this.email
        })
        this.cancel()
        await this.$store.dispatch('getAccountDetails', {route: this.$route.fullPath})

      } catch (error) {

      }
    },
    
    async updatePassword() {
      try {
        await this.$store.dispatch('updatePasswordUser', {
          password: this.password,
          newPassword: this.newPassword
        })
        this.cancel()

      } catch (error) {

      }
    }
  }
}
</script>