<script setup lang="ts">
const title = ref('Yoga Ravennah | Account');
const description = ref('Mijn accountdetails');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/account');

const store = useMainStore()

definePageMeta({
    layout: 'yoga'
})

useHead({
    title,
    meta: [
        {hid: 'description', name: 'description', content: description},
        {hid: 'og:title', property: 'og:title', content: title},
        {hid: 'og:url', property: 'og:url', content: pageUrl},
        {hid: 'og:description', property: 'og:description', content: description},
        {hid: 'og:image', property: 'og:image', content: ogImage},

        // twitter card
        {hid: "twitter:title", name: "twitter:title", content: title},
        {hid: "twitter:url", name: "twitter:url", content: pageUrl},
        {hid: 'twitter:description', name: 'twitter:description', content: description},
        {hid: "twitter:image", name: "twitter:image", content: ogImage},
        ]
})

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
    <div class="container mt-8 sm:mt-12 md:mt-24 mx-auto p-8 md:px-0 md:py-24">
      <div class="flex flex-col gap-y-24">
        <AccountDetails v-if="loggedInUser"/>
        <AccountBookings v-if="myBookings" />
        <AccountLessons v-if="isAdmin && lessons && students" />
        <AccountUsers v-if="isAdmin && students && loggedInUser" />
      </div>
    </div>
  </div>
</template>