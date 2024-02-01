<template>
  <div>
    <IsLoading :loading="isLoading" />
    
    <div class="container mt-8 sm:mt-12 md:mt-24 mx-auto p-8 md:px-0 md:py-24">
      <div class="flex flex-col gap-y-24">
        <AccountDetails :isAdmin="isAdmin" :loggedInUser="loggedInUser" />
        <AccountBookings :isAdmin="isAdmin" :bookings="myBookings" />
        <AccountLessons :isAdmin="isAdmin" :lessons="lessons" :students="students"/>
        <AccountUsers :isAdmin="isAdmin" :loggedInUser="loggedInUser" :students="students" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  layout: "yoga",

  computed: {
    loggedInUser() {
      return this.$store.getters.loggedInUser;
    },
    isAdmin() {
      return this.$store.getters.isAdmin;
    },
    students() {
      return this.$store.getters.students;
    },
    lessons() {
      return this.$store.getters.lessons;
    },
    myBookings() {
      return this.$store.getters.myBookings
    },
    isLoading() {
      return this.$store.getters.isLoading
    }
  }
};
</script>
