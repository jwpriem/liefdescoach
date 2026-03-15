<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const title = ref('Yoga Ravennah | Account');
const description = ref('Mijn accountdetails');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/account');

const store = useMainStore()

definePageMeta({
	layout: 'app'
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
const isLoading = computed(() => store.isLoading);

const showBookingModal = ref(false)
provide('openBookingModal', () => showBookingModal.value = true)

const activeTab = ref(0)

// Swipe gesture navigation between tabs
const touchStartX = ref(0)
const touchStartY = ref(0)
const swiping = ref(false)

function onSwipeStart(e: TouchEvent) {
	touchStartX.value = e.touches[0].clientX
	touchStartY.value = e.touches[0].clientY
	swiping.value = true
}

function onSwipeEnd(e: TouchEvent) {
	if (!swiping.value) return
	swiping.value = false

	const deltaX = e.changedTouches[0].clientX - touchStartX.value
	const deltaY = e.changedTouches[0].clientY - touchStartY.value

	// Only trigger if horizontal movement is dominant and exceeds threshold
	if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return

	if (deltaX < 0 && activeTab.value < tabs.value.length - 1) {
		activeTab.value++
	} else if (deltaX > 0 && activeTab.value > 0) {
		activeTab.value--
	}
}

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
</script>

<template>
	<div class="min-h-screen">
		<IsLoading :loading="isLoading" />
		<div
			class="container mx-auto px-4 sm:px-8 pt-1 md:pt-32"
			style="padding-bottom: calc(6rem + max(env(safe-area-inset-bottom), 0px))"
			@touchstart.passive="onSwipeStart"
			@touchend.passive="onSwipeEnd"
		>
			<div v-show="activeTab === 0" class="pt-3">
				<AccountBookings />
			</div>
			<div v-show="activeTab === 1" class="pt-3">
				<AccountCredits />
			</div>
			<div v-show="activeTab === 2" class="pt-3">
				<AccountDetails v-if="loggedInUser" />
			</div>
			<div v-show="activeTab === 3" class="pt-3">
				<AccountLessons v-if="isAdmin && lessons && students" />
			</div>
			<div v-show="activeTab === 4" class="pt-3">
				<AccountUsers v-if="isAdmin && students && loggedInUser" />
			</div>
			<div v-show="activeTab === 5" class="pt-3">
				<AccountRevenue v-if="isAdmin" />
			</div>
		</div>

		<AccountBottomNav :tabs="tabs" v-model="activeTab" />
		<BookingModal v-model="showBookingModal" />
	</div>
</template>
