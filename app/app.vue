<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <PhoneRequestModal v-if="user?.phoneRequested" />
  </UApp>
</template>
