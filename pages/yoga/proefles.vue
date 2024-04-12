<script setup lang="ts">
const mail = useMail()
const store = useMainStore();
const { $rav } = useNuxtApp()

const title = ref('Yoga Ravennah | Proefles');
const description = ref('Zou je graag een keer yoga willen proberen maar ben je nog niet zeker of het iets voor je is, of dat je mijn lessen niet leuk vind? Geen nood! Je kunt voor slechts 5 euro een keertje komen proberen.');
const ogImage = ref('https://www.ravennah.com/ravennah-social.jpg');
const pageUrl = ref('https://www.ravennah.com/yoga/proefles');
const name = ref('');
const email = ref('');
const lesson = ref('');

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

async function send(){
 await store.setLoading(true)
  
 await mail.send({
  config:0,
  from: 'Yoga Ravennah <info@ravennah.com>',
  subject: 'Proefles Yoga Ravennah',
  text: 'Naam:\n' + name.value + '\n\nEmail:\n' + email.value + '\n\nLes:\n' + lesson.value,
 })
 
 name.value = ''
 email.value = ''
 lesson.value = ''
 await store.setLoading(false)
}

const computedLessons = computed(() => {
 return lessons.value.map(lesson => {
  const bookingsLength = lesson.bookings.length
  const spots = 9 - bookingsLength
  const isFull = bookingsLength === 9
  const type = lesson.type != 'peachy bum' ? 'Hatha Yoga' : 'Peachy Bum' 
  const spotsContext = bookingsLength === 8 ? 'plek' : 'plekken'
  const spotsText = isFull ? ` - ${type} - (Vol)` : ` - ${type} - (Nog ${spots} ${spotsContext})`

  return {
   label: $rav.formatDateInDutch(lesson.date, true) + spotsText,
   value: $rav.formatDateInDutch(lesson.date, true),
   disabled: isFull,
  }
 })
})

const isLoading = computed(() => store.isLoading);
const lessons = computed(() => store.lessons)

</script>

<template>
 <div>
  <IsLoading :loading="isLoading" />
  <Header image="/yoga-sfeer2.jpg" alignment="object-center">
   <h1 class="text-3xl md:text-6xl uppercase font-black">
        <span class="emerald-underline">Proefles 5 euro!</span
        ><span class="text-emerald-600">.</span>
   </h1>
   <p class="intro">
    Zou je graag een keer yoga of peachy bum willen proberen maar ben je nog niet zeker of het iets voor je is, of dat je mijn lessen niet leuk vind? Geen nood! Je kunt voor slechts 7,50 euro een keertje komen proberen.
   </p>
   <p class="intro">Vul je naam en e-mail in en kom een keer vrijblijvend meedoen voor slechts 7,50 euro.</p>
   <UFormGroup label="Naam" required>
    <UInput id="naam" color="primary" v-model="name" variant="outline" type="text" placeholder="Je naam" />
   </UFormGroup>
   <UFormGroup label="Email" required>
    <UInput id="email" color="primary" v-model="email" variant="outline" type="email" placeholder="Je e-mailadres" />
   </UFormGroup>
   <UFormGroup label="Kies een les" required>
    <USelect
      icon="i-heroicons-academic-cap-20-solid"
      size="md"
      color="primary"
      variant="outline"
      v-model="lesson"
      :options="computedLessons"
      placeholder="Kies een les"
    />
   </UFormGroup>
   <UButton color="primary" variant="solid" size="xl" @click="send" :disabled="!name || !email || !lesson">Ik kom!</UButton>
   <div class="py-8">
    <p class="intro"><span
      class="text-emerald-700 text-xl md:text-2xl font-bold">Adres Studio YES Wellness</span><br>
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
          stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
      <path stroke-linecap="round" stroke-linejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
     </svg>
     Emmy van Leersumhof 24a
     Rotterdam (Nesselande)
    </p>
    <a class="intro" href="https://www.google.com/maps/place/Emmy+van+Leersumhof+24a,+3059+LT+Rotterdam/@51.9683125,4.585844,17z/data=!3m1!4b1!4m6!3m5!1s0x47c5cd7dec493187:0xd32480c3b7fa1581!8m2!3d51.9683092!4d4.5884189!16s%2Fg%2F11t40nxhs0?entry=ttu" target="_blank">
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2 inline-block stroke-current text-emerald-700">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
     </svg>
     <u>Bekijk op Google Maps</u>
    </a>
   </div>
  </Header>
 </div>
</template>