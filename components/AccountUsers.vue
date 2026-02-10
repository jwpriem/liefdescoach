<script lang="ts" setup>
const store = useMainStore()
const router = useRouter()
const { $rav } = useNuxtApp()
const toast = useToast()

const columns = [{
	accessorKey: 'name',
	header: 'Name',
}, {
	accessorKey: 'email',
	header: 'Email',
}, {
	accessorKey: 'status',
	header: 'Status'
}, {
	accessorKey: 'credits',
	header: 'Credits'
}, {
	accessorKey: 'registration',
	header: 'Geregistreerd',
}, {
	accessorKey: 'actions',
	header: ''
}]

const creditTypes = [
	{ label: 'Losse les (1 credit, 6 maanden)', value: 'credit_1' },
	{ label: 'Kleine kaart (5 credits, 6 maanden)', value: 'credit_5' },
	{ label: 'Strippenkaart (10 credits, 6 maanden)', value: 'credit_10' },
	{ label: 'Grote kaart (20 credits, 12 maanden)', value: 'credit_20' },
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
			title: 'Migratie voltooid',
			icon: 'i-heroicons-check-badge',
			color: 'success',
			description: `${res.totalMigrated} credits gemigreerd, ${res.totalSkipped} overgeslagen.`
		})
	} catch (error) {
		console.error('Migration failed:', error)
		toast.add({
			title: 'Migratie mislukt',
			icon: 'i-heroicons-x-circle',
			color: 'error',
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
	if (user.phone) {
		const telephone = user.phone.slice(1)
		window.location.href = `https://wa.me/${telephone}?text=Hi`
	} else {
		toast.add({
			title: 'Geen telefoonnummer',
			icon: 'i-heroicons-x-circle',
			color: 'error',
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
		<h2 class="text-2xl md:text-4xl uppercase font-black mb-6">
			<span class="emerald-underline text-emerald-900">Gebruikers ({{ filteredRows.length }})</span><span
				class="text-emerald-700">.</span>
		</h2>

		<!-- Controls bar -->
		<div
			class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4 sm:p-6 mb-6">
			<div class="flex items-start justify-start gap-x-6 flex-wrap gap-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-300 mb-1.5">Filter gebruikers</label>
					<UInput id="naam" v-model="q" color="primary" placeholder="Zoek gebruiker" type="text"
						variant="outline" size="lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-300 mb-1.5">Gearchiveerd</label>
					<USwitch v-model="state.showArchived" unchecked-icon="i-heroicons-x-mark-20-solid"
						checked-icon="i-heroicons-check-20-solid" />
				</div>
			</div>
		</div>

		<!-- Mobile: card layout -->
		<div v-if="students.length" class="flex flex-col gap-y-3 md:hidden">
			<div v-for="row in filteredRows" :key="row.$id"
				class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-lg shadow-emerald-950/10 p-4">
				<div class="flex items-center justify-between mb-3">
					<span class="font-medium text-gray-100 flex items-center gap-2">
						{{ row.name }}
						<UTooltip v-if="row.health?.injury" :text="row.health.injury">
							<UIcon name="i-heroicons-exclamation-triangle-20-solid" class="w-5 h-5 text-red-500" />
						</UTooltip>
						<UTooltip v-if="row.health?.pregnancy" text="Zwanger">
							<UIcon name="i-heroicons-heart-20-solid" class="w-5 h-5 text-pink-500" />
						</UTooltip>
					</span>
					<span class="text-emerald-400 text-sm font-medium">{{ getAvailableCredits(row.$id) }} credits</span>
				</div>
				<div class="text-sm text-gray-400 mb-4 space-y-2">
					<div>
						<div class="text-xs uppercase font-bold text-gray-500 mb-0.5">Contact</div>
						<div class="text-gray-200">{{ row.email }} <span class="mt-1">
								<UBadge v-if="row.emailVerification" color="success" variant="subtle" size="xs">
									Geverifieerd
								</UBadge>
								<UBadge v-else color="warning" variant="subtle" size="xs">Ongeverifieerd</UBadge>
							</span></div>

					</div>
					<div>
						<div class="text-xs uppercase font-bold text-gray-500 mb-0.5">Geregistreerd</div>
						<div>{{ $rav.formatDateInDutch(row.registration) }}</div>
					</div>
				</div>
				<div class="grid grid-cols-4 gap-2 border-t border-gray-800/50 pt-3 mt-3">
					<UButton block color="primary" icon="i-heroicons-eye-20-solid" variant="soft" size="lg"
						class="justify-center text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20"
						:to="`/admin/users/${row.$id}`" />
					<UButton block color="primary" icon="i-heroicons-plus-20-solid" variant="soft" size="lg"
						class="justify-center text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20"
						@click="setUser(row)" />
					<UButton block color="primary" icon="i-heroicons-archive-box-20-solid" variant="soft" size="lg"
						class="justify-center text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20"
						@click="archiveUser(row.$id)" />
					<UButton :disabled="!row.phone" block color="primary"
						icon="i-heroicons-chat-bubble-bottom-center-text-20-solid" variant="soft" size="lg"
						class="justify-center text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
						@click="sendWhatsapp(row)" />
				</div>
			</div>
		</div>
	</div>

	<!-- Desktop: table layout -->
	<div
		class="hidden md:block rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 overflow-hidden">
		<UTable v-if="students.length" :columns="columns" :data="filteredRows">
			<template #name-cell="{ row }">
				<div class="flex items-center gap-2">
					<UButton variant="link" :to="`/admin/users/${row.original.$id}`" color="neutral"
						class="p-0 font-medium hover:text-emerald-400">
						{{ row.original.name }}
					</UButton>
					<UTooltip v-if="row.original.health?.injury" :text="row.original.health.injury">
						<UIcon name="i-heroicons-exclamation-triangle-20-solid" class="w-5 h-5 text-red-500" />
					</UTooltip>
					<UTooltip v-if="row.original.health?.pregnancy" text="Zwanger">
						<UIcon name="i-heroicons-heart-20-solid" class="w-5 h-5 text-pink-500" />
					</UTooltip>
				</div>
			</template>
			<template #credits-cell="{ row }">
				{{ getAvailableCredits(row.original.$id) }}
			</template>
			<template #status-cell="{ row }">
				<UBadge v-if="row.original.emailVerification" color="success" variant="subtle" size="xs">Geverifieerd</UBadge>
				<UBadge v-else color="warning" variant="subtle" size="xs">Ongeverifieerd</UBadge>
			</template>
			<template #registration-cell="{ row }">
				{{ $rav.formatDateInDutch(row.original.registration) }}
			</template>
			<template #actions-cell="{ row }">
				<div class="flex items-center gap-x-1">
					<UTooltip text="Bekijk details">
						<UButton icon="i-heroicons-eye-20-solid" variant="ghost" size="sm" class="text-emerald-100"
							:to="`/admin/users/${row.original.$id}`" />
					</UTooltip>
					<UTooltip text="Voeg credits toe">
						<UButton icon="i-heroicons-plus-20-solid" variant="ghost" size="sm" class="text-emerald-100"
							@click="setUser(row.original)" />
					</UTooltip>
					<UTooltip text="Archiveer">
						<UButton icon="i-heroicons-archive-box-20-solid" variant="ghost" size="sm"
							class="text-emerald-100" @click="archiveUser(row.original.$id)" />
					</UTooltip>
					<UTooltip text="WhatsApp" v-if="row.original.phone">
						<UButton icon="i-heroicons-chat-bubble-bottom-center-text-20-solid" variant="ghost" size="sm"
							class="text-emerald-100" @click="sendWhatsapp(row.original)" />
					</UTooltip>
				</div>
			</template>
		</UTable>
	</div>

	<!-- Modal: Add credits -->
	<div v-if="state.editMode" class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
		<div
			class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10">
			<div class="w-full flex flex-col gap-y-5">
				<h2 class="text-2xl font-bold text-emerald-100 tracking-tight">Voeg credits toe</h2>

				<p class="text-gray-300">Voor: <strong class="text-gray-100">{{ state.user?.name }}</strong> <span
						class="text-gray-400">(huidig saldo: {{ getAvailableCredits(state.user?.$id) }})</span></p>

				<div>
					<label class="block text-sm font-medium text-gray-300 mb-2">Kies type</label>
					<div class="flex flex-col gap-y-2">
						<label v-for="ct in creditTypes" :key="ct.value"
							class="flex items-center gap-x-3 cursor-pointer text-gray-200 hover:text-gray-100 transition-colors">
							<input type="radio" :value="ct.value" v-model="state.selectedCreditType"
								class="accent-emerald-500" />
							<span class="text-sm">{{ ct.label }}</span>
						</label>
					</div>
				</div>

				<div class="flex gap-3 mt-2">
					<UButton color="primary" variant="solid" size="lg"
						@click="addCredits(state.user.$id, state.selectedCreditType)">
						Voeg credits toe
					</UButton>
					<UButton color="primary" variant="outline" size="lg" @click="cancel()">Annuleer</UButton>
				</div>
			</div>
		</div>
	</div>
</template>
