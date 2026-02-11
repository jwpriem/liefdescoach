<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const title = ref('Yoga Ravennah | Account');
const description = ref('Mijn accountdetails');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/account');

const store = useMainStore()

definePageMeta({
	// layout: 'yoga'
})

useHead({
	title,
	meta: [
		{ hid: 'description', name: 'description', content: description },
		{ hid: 'og:title', property: 'og:title', content: title },
		{ hid: 'og:url', property: 'og:url', content: pageUrl },
		{ hid: 'og:description', property: 'og:description', content: description },
		{ hid: 'og:image', property: 'og:image', content: ogImage },

		// twitter card
		{ hid: "twitter:title", name: "twitter:title", content: title },
		{ hid: "twitter:url", name: "twitter:url", content: pageUrl },
		{ hid: 'twitter:description', name: 'twitter:description', content: description },
		{ hid: "twitter:image", name: "twitter:image", content: ogImage },
	]
})
if (!store.loggedInUser) {
	navigateTo('/login')
}

const loggedInUser = computed(() => store.loggedInUser);
const isAdmin = computed(() => store.isAdmin);
const students = computed(() => store.students);
const lessons = computed(() => store.lessons);
const myBookings = computed(() => store.myBookings);
const isLoading = computed(() => store.isLoading);

const showBookingModal = ref(false)
provide('openBookingModal', () => showBookingModal.value = true)

const tabs = computed<TabsItem[]>(() => {
	const items: TabsItem[] = [
		{
			label: 'Mijn lessen',
			icon: 'i-heroicons-calendar-days',
			slot: 'lessen' as const,
		},
		{
			label: 'Credits',
			icon: 'i-heroicons-credit-card',
			slot: 'credits' as const,
		},
		{
			label: 'Mijn gegevens',
			icon: 'i-heroicons-user-circle',
			slot: 'gegevens' as const,
		},
	]

	if (isAdmin.value) {
		items.push(
			{
				label: 'Lessen',
				icon: 'i-heroicons-academic-cap',
				slot: 'admin-lessen' as const,
			},
			{
				label: 'Gebruikers',
				icon: 'i-heroicons-users',
				slot: 'gebruikers' as const,
			},
			{
				label: 'Omzet',
				icon: 'i-heroicons-chart-bar',
				slot: 'omzet' as const,
			},
		)
	}

	return items
})

const tabsUi = computed(() => ({
	list: {
		base: `grid w-full ${isAdmin.value ? 'grid-cols-6' : 'grid-cols-3'}`,
		tab: { base: 'justify-center' }
	}
}))
</script>

<template>
	<div>
		<IsLoading :loading="isLoading" />
		<div class="container mx-auto px-4 sm:px-8 pt-28 pb-12 sm:pt-32 sm:pb-20">
			<UTabs :items="tabs" :ui="tabsUi" :unmount-on-hide="false">
				<template #default="{ item, selected }">
					<span class="truncate hidden md:block">{{ item.label }}</span>
				</template>
				<template #lessen>
					<div class="pt-6">
						<AccountBookings />
					</div>
				</template>
				<template #credits>
					<div class="pt-6">
						<AccountCredits />
					</div>
				</template>
				<template #gegevens>
					<div class="pt-6">
						<AccountDetails v-if="loggedInUser" />
					</div>
				</template>
				<template #admin-lessen>
					<div class="pt-6">
						<AccountLessons v-if="isAdmin && lessons && students" />
					</div>
				</template>
				<template #gebruikers>
					<div class="pt-6">
						<AccountUsers v-if="isAdmin && students && loggedInUser" />
					</div>
				</template>
				<template #omzet>
					<div class="pt-6">
						<AccountRevenue v-if="isAdmin" />
					</div>
				</template>
			</UTabs>
		</div>

		<BookingModal v-model="showBookingModal" />
	</div>
</template>
