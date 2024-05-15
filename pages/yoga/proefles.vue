<script setup lang="ts">
const mail = useMail()
const store = useMainStore();
const toast = useToast()
const { $rav } = useNuxtApp()

const title = ref('Yoga Ravennah | Proefles');
const description = ref('Zou je graag een keer yoga willen proberen maar ben je nog niet zeker of het iets voor je is? Geen nood! Je kunt voor slechts 7,50 euro een keertje komen proberen.');
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
		await $fetch('/api/bookTrailLesson', {
			method: 'POST',
			body: {
				name: name.value,
				email: email.value,
				lessonId: JSON.parse(lesson.value).$id
			}
		})
		
		await mail.send({
			config:0,
			from: 'Yoga Ravennah <info@ravennah.com>',
			subject: 'Proefles Yoga Ravennah',
			text: 'Naam:\n' + name.value + '\n\nEmail:\n' + email.value + '\n\nDatum:\n' + $rav.formatDateInDutch(JSON.parse(lesson.value).date, true)  + '\n\nLes:\n' + $rav.checkLessonType(JSON.parse(lesson.value).type),
		})
		
		// Clear form
		name.value = ''
		email.value = ''
		lesson.value = ''

		await store.fetchLessons()
        await store.setLoading(false)

		
		toast.add({
			id: 'non_duplicate',
			title: 'Tot snel',
			icon: 'i-heroicons-check-badge',
			color: 'primary',
			description: 'Je proefles is geboekt!'
		})
}

const computedLessons = computed(() => {
 return lessons.value.filter(x => x.type == 'peachy bum').map(lesson => {
  const bookingsLength = lesson.bookings.length
  const spots = 9 - bookingsLength
  const isFull = bookingsLength === 9
  const type = lesson.type != 'peachy bum' ? 'Hatha Yoga' : 'Peachy Bum' 
  const spotsContext = bookingsLength === 8 ? 'plek' : 'plekken'
  const spotsText = isFull ? ` - ${type} - (Vol)` : ` - ${type} - (Nog ${spots} ${spotsContext})`

  return {
   label: $rav.formatDateInDutch(lesson.date, true) + spotsText,
   value: JSON.stringify(lesson),
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
        <span class="emerald-underline">Proefles 7,50 euro!</span
        ><span class="text-emerald-600">.</span>
   </h1>
   <p class="intro">
    Zou je graag een keer Peachy Bum willen proberen maar ben je nog niet zeker of het iets voor je is? Geen nood! Je kunt voor slechts 7,50 euro een keertje komen proberen. Dat is 50% korting op een reguliere les.
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
   <Addresses :hide-yoga="true" />
  </Header>
 </div>
</template>