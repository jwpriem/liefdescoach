<template>
  <div class="yoga">
    <NavYoga />
    <Nuxt />
    <FooterYoga />
  </div>
</template>

<script>
import NavYoga from '@/components/NavYoga'
import FooterYoga from '@/components/FooterYoga'

export default {
  components: {
    NavYoga,
    FooterYoga
  }
}
</script>