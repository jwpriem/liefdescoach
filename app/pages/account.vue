<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const title = ref('Yoga Ravennah | Account');
const description = ref('Mijn accountdetails');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/account');

const { user: loggedInUser, isAdmin, pending: isLoading } = useAuth()

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
if (!loggedInUser.value) {
	navigateTo('/login')
}

const showBookingModal = ref(false)
provide('openBookingModal', () => showBookingModal.value = true)

const route = useRoute()
const activeTab = ref(0)
const currentSlot = computed(() => tabs.value[activeTab.value]?.slot)

onMounted(() => {
  if (route.query.tab) {
    const idx = tabs.value.findIndex(t => t.slot === route.query.tab)
    if (idx !== -1) activeTab.value = idx
  }
})

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
	const items: TabsItem[] = []

	if (!isAdmin.value) {
		items.push({
			label: 'Dashboard',
			icon: 'i-lucide-house',
			slot: 'dashboard' as const,
		})
	}

	items.push({
		label: 'Boekingen',
		icon: 'i-lucide-calendar-days',
		slot: 'lessen' as const,
	})

	items.push({
		label: 'Credits',
		icon: 'i-lucide-credit-card',
		slot: 'credits' as const,
		...(isAdmin.value ? { hidden: true } : {}),
	} as TabsItem & { hidden?: boolean })

	if (isAdmin.value) {
		items.push(
			{
				label: 'Lessen',
				icon: 'i-lucide-graduation-cap',
				slot: 'admin-lessen' as const,
			},
			{
				label: 'Studenten',
				icon: 'i-lucide-users',
				slot: 'gebruikers' as const,
			},
			{
				label: 'Omzet',
				icon: 'i-lucide-bar-chart-2',
				slot: 'omzet' as const,
			},
		)
	}

	items.push({
		label: 'Instellingen',
		icon: 'i-lucide-settings',
		slot: 'gegevens' as const,
	})

	return items
})
</script>

<template>
	<div class="min-h-screen">
		<IsLoading :loading="isLoading" />
		<div class="container mx-auto px-4 sm:px-8 pt-1 md:pt-32"
			style="padding-bottom: calc(6rem + max(env(safe-area-inset-bottom), 0px))"
			@touchstart.passive="onSwipeStart" @touchend.passive="onSwipeEnd">
			<div v-show="currentSlot === 'dashboard'" class="pt-3">
				<AccountDashboard v-if="!isAdmin && loggedInUser" />
			</div>
			<div v-show="currentSlot === 'lessen'" class="pt-3">
				<AccountBookings />
			</div>
			<div v-show="currentSlot === 'credits'" class="pt-3">
				<AccountCredits />
			</div>
			<div v-show="currentSlot === 'gegevens'" class="pt-3">
				<div v-if="isAdmin" class="mb-4">
					<UButton icon="i-lucide-credit-card" label="Credits" variant="outline"
						@click="activeTab = tabs.findIndex((t: any) => t.slot === 'credits')" />
				</div>
				<AccountDetails v-if="loggedInUser" />
			</div>
			<div v-show="currentSlot === 'admin-lessen'" class="pt-3">
				<AccountLessons v-if="isAdmin" />
			</div>
			<div v-show="currentSlot === 'gebruikers'" class="pt-3">
				<AccountUsers v-if="isAdmin && loggedInUser" />
			</div>
			<div v-show="currentSlot === 'omzet'" class="pt-3">
				<LazyAccountRevenue v-if="isAdmin" />
			</div>
		</div>

		<AccountBottomNav :tabs="tabs" v-model="activeTab" />
		<BookingModal v-model="showBookingModal" />
	</div>
</template>
