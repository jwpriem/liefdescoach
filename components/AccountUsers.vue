<script lang="ts" setup>
const store = useMainStore();
const {$rav} = useNuxtApp()

const columns = [{
	key: 'name',
	label: 'Name',
	sortable: true
}, {
	key: 'email',
	label: 'Email',
	sortable: true
}, {
	key: 'phone',
	label: 'Phone'
}, {
	key: 'credits',
	label: 'Credits'
}, {
	key: 'registration',
	label: 'Geregistreerd',
	sortable: true
}, {
	key: 'actions'
}]

// Using a reactive object to group related states
const state = reactive({
	editMode: false,
	addCredits: null as number | null,
	user: null as any | null,
	showArchived: false
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

async function archiveUser(userId) {
	try {
		await $fetch('/api/updatePrefs', {
			method: 'post',
			body: {
				userId,
				prefs: {
					archive: true,
				},
			},
		});

		await store.getUser(); // Assuming getUser is an async operation
	} catch (error) {
		console.error('Failed to update preferences:', error);
	}
}

const items = (row) => [
	[
		// 		{
		// 	label: 'Bewerk',
		// 	icon: 'i-heroicons-pencil-square-20-solid',
		// 	click: () => console.log('Edit', row.id)
		// }, 
		{
			label: 'Voeg credits toe',
			icon: 'i-heroicons-plus-20-solid',
			click: () => setUser(row)
		}, {
		label: 'Archiveer',
		icon: 'i-heroicons-archive-box-20-solid',
		click: () => archiveUser(row.$id)
	}]
	// }], [{
	// 	label: 'Archiveer',
	// 	icon: 'i-heroicons-archive-box-20-solid'
	// }, {
	// 	label: 'Move',
	// 	icon: 'i-heroicons-arrow-right-circle-20-solid'
	// }], [{
	// 	label: 'Delete',
	// 	icon: 'i-heroicons-trash-20-solid'
	// }]
]

const q = ref('')

const filteredUsers = computed(() => {
	if (state.showArchived) {
		return students.value
	} else {
		return students.value.filter((student) => {
			// Check if the student is archived; if 'archive' is true, do not include them in the results
			return student.prefs && student.prefs['archive'] != true;
		})
	}
})

const filteredRows = computed(() => {
			if (!q.value) {
				return filteredUsers.value
			}

			return filteredUsers.value.filter((x) => {
				return Object.values(x).some((value) => {
					// Ensure value is a string before calling toLowerCase()
					return typeof value === 'string' && value.toLowerCase().includes(q.value.toLowerCase());
				});
			});
		}
)

</script>

<template>
	<div v-if="isAdmin && filteredRows.length">
		<h2 class="text-2xl md:text-4xl uppercase font-black">
			<span class="emerald-underline text-emerald-900">Gebruikers ({{ filteredRows.length }})</span><span
				class="text-emerald-700">.</span>
		</h2>

		<!--		<div v-if="students.length && loggedInUser" class="w-full">-->
		<!--			<div class="grid grid-cols-1 md:grid-cols-4 mt-8 gap-3">-->
		<!--				<div v-for="student in students" class="p-4 bg-gray-800 rounded flex flex-col gap-y-3 w-full" index="student.$id">-->
		<!--					<div>-->
		<!--						<sup class="text-emerald-500">Naam</sup>-->
		<!--						<span class="block -mt-2">{{ student.name }}</span>-->
		<!--					</div>-->
		<!--					<div>-->
		<!--						<sup class="text-emerald-500">Email</sup>-->
		<!--						<span class="block -mt-2">{{ student.email }}</span>-->
		<!--					</div>-->
		<!--					<div>-->
		<!--						<sup class="text-emerald-500">Telefoon</sup>-->
		<!--						<span v-if="student.phone" class="block -mt-2">{{ student.phone }}</span>-->
		<!--						<span v-else class="block -mt-2">Geen telefoonnummer</span>-->
		<!--					</div>-->
		<!--					<div>-->
		<!--						<sup class="text-emerald-500">Saldo</sup>-->
		<!--						<span v-if="student.prefs" class="block -mt-2 flex flex-no-wrap align-center justify-start gap-x-2">-->
		<!--         {{ student.prefs['credits'] }} {{ student.prefs['credits'] == 1 ? 'les' : 'lessen' }}-->
		<!--          <svg class="w-6 h-6 cursor-pointer" fill="none" stroke="currentColor" stroke-width="1.5"-->
		<!--               viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" @click="setUser(student)">-->
		<!--            <path d="M12 4.5v15m7.5-7.5h-15" stroke-linecap="round" stroke-linejoin="round"/>-->
		<!--          </svg>-->
		<!--         </span>-->
		<!--					</div>-->
		<!--					<div>-->
		<!--						<sup class="text-emerald-500">Geregistreerd</sup>-->
		<!--						<span class="block -mt-2">{{ $rav.formatDateInDutch(student.registration) }}</span>-->
		<!--					</div>-->
		<!--				</div>-->
		<!--			</div>-->
		<!--		</div>-->


		<div class="my-6 w-full flex items-center justify-start gap-x-6">
			<UFormGroup label="Filter gebruikers">
				<UInput id="naam" v-model="q" color="primary" placeholder="Zoek gebruiker" type="text" variant="outline"/>
			</UFormGroup>
			<UFormGroup label="Gearchiveerd">
				<UToggle
						v-model="state.showArchived"
						off-icon="i-heroicons-x-mark-20-solid"
						on-icon="i-heroicons-check-20-solid"
				/>
			</UFormGroup>
		</div>

		<UTable v-if="students.length" :columns="columns" :rows="filteredRows">
			<template #credits-data="{ row }">
				{{
					row.prefs['credits']
				}}
			</template>
			<template #registration-data="{ row }">
				{{
					$rav.formatDateInDutch(row.registration)
				}}
			</template>

			<template #actions-data="{ row }">
				<UDropdown :items="items(row)">
					<UButton color="gray" icon="i-heroicons-ellipsis-horizontal-20-solid" variant="ghost"/>
				</UDropdown>
			</template>
		</UTable>
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
						<UInput id="add-credits" v-model="state.addCredits" color="primary" placeholder="Aantal credits om toe te voegen"
						        type="number"
						        variant="outline"/>
					</div>
					<div class="flex gap-x-3">
						<UButton :disabled="!state.addCredits" color="primary" variant="solid"
						         @click="updatePrefs(state.user.$id, state.addCredits, state.user.prefs['credits']), state.editMode = false">
							Voeg credits toe
						</UButton>
						<UButton color="primary" variant="solid" @click="cancel()">Annuleer</UButton>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>