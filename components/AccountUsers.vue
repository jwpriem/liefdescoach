<script lang="ts" setup>
const store = useMainStore()
const router = useRouter()
const {$rav} = useNuxtApp()
const toast = useToast()

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

const creditTypes = [
	{ label: 'Losse les (1 credit, 6 maanden)', value: 'credit_1' },
	{ label: 'Kleine kaart (5 credits, 6 maanden)', value: 'credit_5' },
	{ label: 'Grote kaart (10 credits, 6 maanden)', value: 'credit_10' },
]

// Using a reactive object to group related states
const state = reactive({
	editMode: false,
	selectedCreditType: 'credit_1' as string,
	user: null as any | null,
	showArchived: false
});

const students = computed(() => store.students);
const loggedInUser = computed(() => store.loggedInUser);
const isAdmin = computed(() => store.isAdmin);
const studentCreditSummary = computed(() => store.studentCreditSummary);

function getAvailableCredits(userId: string): number {
	return studentCreditSummary.value[userId] || 0;
}

function setUser(selectedUser: any): void {
	state.user = selectedUser;
	state.selectedCreditType = 'credit_1';
	state.editMode = true;
}

function cancel(): void {
	state.user = null;
	state.selectedCreditType = 'credit_1';
	state.editMode = false;
}

async function addCredits(userId: string, type: string): Promise<void> {
	try {
		await store.addCredits(userId, type);
		cancel();
	} catch (error) {
		console.error('Failed to add credits:', error);
	}
}

const migrating = ref(false)
const migrationResult = ref<any>(null)

async function migrateCredits(): Promise<void> {
	migrating.value = true
	migrationResult.value = null
	try {
		const res = await $fetch('/api/credits/migrate', { method: 'POST' })
		migrationResult.value = res
		await store.getUser()
		toast.add({
			id: 'migration',
			title: 'Migratie voltooid',
			icon: 'i-heroicons-check-badge',
			color: 'primary',
			description: `${res.totalMigrated} credits gemigreerd, ${res.totalSkipped} overgeslagen.`
		})
	} catch (error) {
		console.error('Migration failed:', error)
		toast.add({
			id: 'migration-error',
			title: 'Migratie mislukt',
			icon: 'i-heroicons-x-circle',
			color: 'red',
			description: 'Er ging iets mis bij het migreren van credits.'
		})
	} finally {
		migrating.value = false
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

		await store.getUser();
	} catch (error) {
		console.error('Failed to update preferences:', error);
	}
}

async function sendWhatsapp(user) {
	if(user.phone) {
		const telephone = user.phone.slice(1)
		window.location.href = `https://wa.me/${telephone}?text=Hi`
	} else {
		toast.add({
			id: 'no-telephone',
			title: 'Geen telefoonnummer',
			icon: 'i-x-circle',
			color: 'red',
			description: 'Helaas heeft deze gebruiker geen telefoonnummer in het account.'
		})
	}

}


const q = ref('')

const filteredUsers = computed(() => {
	if (state.showArchived) {
		return students.value
	} else {
		return students.value.filter((student) => {
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

		<div class="my-6 w-full flex items-center justify-start gap-x-6 flex-wrap gap-y-3">
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
			<UFormGroup label="Migratie">
				<UButton color="gray" variant="solid" :loading="migrating" @click="migrateCredits()">
					Migreer credits van prefs
				</UButton>
			</UFormGroup>
		</div>

		<!-- Mobile: card layout -->
		<div v-if="students.length" class="flex flex-col gap-y-3 md:hidden">
			<div v-for="row in filteredRows" :key="row.$id" class="bg-gray-800 rounded p-4">
				<div class="flex items-center justify-between mb-2">
					<span class="font-medium">{{ row.name }}</span>
					<span class="text-emerald-500 text-sm">{{ getAvailableCredits(row.$id) }} credits</span>
				</div>
				<div class="text-sm text-emerald-100/70 mb-3">
					<div>{{ row.email }}</div>
					<div v-if="row.phone">{{ row.phone }}</div>
					<div>{{ $rav.formatDateInDutch(row.registration) }}</div>
				</div>
				<div class="flex items-center gap-x-3">
					<UButton color="primary" icon="i-heroicons-plus-20-solid" variant="ghost" size="md" class="text-emerald-100" @click="setUser(row)" />
					<UButton color="primary" icon="i-heroicons-archive-box-20-solid" variant="ghost" size="md" class="text-emerald-100" @click="archiveUser(row.$id)" />
					<UButton color="primary" icon="i-heroicons-chat-bubble-bottom-center-text-20-solid" variant="ghost" size="md" class="text-emerald-100" @click="sendWhatsapp(row)" />
				</div>
			</div>
		</div>

		<!-- Desktop: table layout -->
		<UTable v-if="students.length" :columns="columns" :rows="filteredRows" class="hidden md:block">
			<template #credits-data="{ row }">
				{{ getAvailableCredits(row.$id) }}
			</template>
			<template #registration-data="{ row }">
				{{ $rav.formatDateInDutch(row.registration) }}
			</template>
			<template #actions-data="{ row }">
				<div class="flex items-center gap-x-1">
					<UTooltip text="Voeg credits toe">
						<UButton icon="i-heroicons-plus-20-solid" variant="ghost" size="sm" class="text-emerald-100" @click="setUser(row)" />
					</UTooltip>
					<UTooltip text="Archiveer">
						<UButton icon="i-heroicons-archive-box-20-solid" variant="ghost" size="sm" class="text-emerald-100" @click="archiveUser(row.$id)" />
					</UTooltip>
					<UTooltip text="WhatsApp">
						<UButton icon="i-heroicons-chat-bubble-bottom-center-text-20-solid" variant="ghost" size="sm" class="text-emerald-100" @click="sendWhatsapp(row)" />
					</UTooltip>
				</div>
			</template>
		</UTable>
		<!--Pop up for adding credits-->
		<div v-if="state.editMode" class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
			<div class="w-full max-height-75 overflow-y-scroll sm:w-2/3 md:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg">
				<div class="w-full flex flex-col gap-y-5">
					<h2 class="text-2xl md:text-4xl uppercase font-black">
              <span class="emerald-underline text-emerald-900"
              >Voeg credits toe</span
              ><span class="text-emerald-700">.</span>
					</h2>
					<p>Voor: <strong>{{ state.user?.name }}</strong> (huidig saldo: {{ getAvailableCredits(state.user?.$id) }})</p>
					<div>
						<div class="flex items-center justify-start mb-2">
							<label>Kies type</label>
						</div>
						<div class="flex flex-col gap-y-2">
							<label v-for="ct in creditTypes" :key="ct.value" class="flex items-center gap-x-2 cursor-pointer">
								<input type="radio" :value="ct.value" v-model="state.selectedCreditType" class="accent-emerald-500" />
								<span>{{ ct.label }}</span>
							</label>
						</div>
					</div>
					<div class="flex gap-x-3">
						<UButton color="primary" variant="solid"
						         @click="addCredits(state.user.$id, state.selectedCreditType)">
							Voeg credits toe
						</UButton>
						<UButton color="primary" variant="solid" @click="cancel()">Annuleer</UButton>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
