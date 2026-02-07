<script setup lang="ts">
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
				{content: description},
				{content: title},
				{content: pageUrl},
				{content: description},
				{content: ogImage},

				// twitter card
				{content: title},
				{content: pageUrl},
				{content: description},
				{content: ogImage},
				]
})
if (!store.loggedInUser) {
  navigateTo('/yoga/login')
}

const loggedInUser = computed(() => store.loggedInUser);
const isAdmin = computed(() => store.isAdmin);
const students = computed(() => store.students);
const lessons = computed(() => store.lessons);
const myBookings = computed(() => store.myBookings);
const isLoading = computed(() => store.isLoading);
</script>

<template>
	<div>
		<IsLoading :loading="isLoading" />
		<div class="container mx-auto px-4 sm:px-8 pt-28 pb-12 sm:pt-32 sm:pb-20">
			<div class="flex flex-col gap-y-16">
				<AccountDetails v-if="loggedInUser"/>
				<AccountBookings v-if="myBookings" />
				<AccountLessons v-if="isAdmin && lessons && students" />
				<AccountUsers v-if="isAdmin && students && loggedInUser" />
				<AccountRevenue v-if="isAdmin" />
			</div>
		</div>
	</div>
</template>