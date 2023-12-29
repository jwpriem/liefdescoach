<template>
  <div class="liefdescoach">
    <NavLiefdescoach />
    <Nuxt />
    <FooterLiefdescoach />
  </div>
</template>

<script>
import NavLiefdescoach from '@/components/NavLiefdescoach'
import FooterLiefdescoach from '@/components/FooterLiefdescoach'

export default {
  components: {
    NavLiefdescoach,
    FooterLiefdescoach
  }
}
</script>
