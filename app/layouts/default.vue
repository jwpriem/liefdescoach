<script setup lang="ts">
const { isNativeApp } = useNativeApp()
</script>

<template>
  <div class="yoga">
    <NavYoga />
    <slot />
    <FooterYoga v-if="!isNativeApp" />
  </div>
</template>
