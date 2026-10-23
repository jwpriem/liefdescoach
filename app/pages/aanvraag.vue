<script setup lang="ts">
import { SESSION_LOCATIONS, SESSION_TYPES, isSessionType, type SessionLocation, type SessionType } from '~~/shared/sessionRequest'

usePageSeo({
    title: 'Sessie aanvragen | Yoga Ravennah',
    description:
        'Vraag een yogasessie op maat aan voor een vrijgezellenfeest, bedrijf, teamuitje, workshop of event. In de studio in Rotterdam Nesselande of op jullie eigen locatie.',
    path: '/aanvraag',
})
useLocalBusinessSchema()

const route = useRoute()
const { call, pending: isLoading, error } = useApiCall()

const emptyForm = () => ({
    type: (isSessionType(route.query.type) ? route.query.type : undefined) as SessionType | undefined,
    name: '',
    email: '',
    phone: '',
    date: '',
    participants: '',
    location: 'onbekend' as SessionLocation,
    place: '',
    message: '',
})

const form = reactive(emptyForm())
const sent = ref(false)

const typeItems = SESSION_TYPES.map((t) => ({ label: t.label, value: t.value }))
const locationItems = SESSION_LOCATIONS.map((l) => ({ label: l.label, value: l.value }))

const canSubmit = computed(() => !!form.type && form.name.trim().length > 0 && form.email.trim().length > 0)

async function send() {
    const result = await call(() =>
        $fetch('/api/mail/send', { method: 'POST', body: { type: 'session-request', data: { ...form } } }),
    )
    if (result) {
        sent.value = true
        Object.assign(form, emptyForm())
    }
}
</script>

<template>
    <div>
        <IsLoading :loading="isLoading" />
        <Header>
            <h1 class="text-3xl md:text-6xl uppercase font-black">
                <span class="emerald-underline">Vraag een sessie aan</span><span class="text-emerald-600">.</span>
            </h1>
            <p class="intro">
                Vertel me wat je in gedachten hebt. Ik neem zo snel mogelijk contact met je op met een voorstel op
                maat. Nog niet alles bekend? Geen probleem — vul in wat je weet.
            </p>

            <UAlert
                v-if="sent"
                color="success"
                variant="subtle"
                icon="i-lucide-circle-check"
                title="Bedankt voor je aanvraag!"
                description="Ik heb je bericht ontvangen en neem zo snel mogelijk contact met je op."
            />

            <form class="space-y-3 darkForm" @submit.prevent="send">
                <UFormField label="Waarvoor wil je een sessie?" required>
                    <USelect v-model="form.type" :items="typeItems" placeholder="Kies een gelegenheid" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <UFormField label="Naam" required>
                        <UInput v-model="form.name" type="text" placeholder="Je naam" icon="i-lucide-user" class="w-full" />
                    </UFormField>
                    <UFormField label="E-mail" required>
                        <UInput v-model="form.email" type="email" placeholder="Je e-mailadres" icon="i-lucide-mail" class="w-full" />
                    </UFormField>
                    <UFormField label="Telefoon">
                        <UInput v-model="form.phone" type="tel" placeholder="Optioneel" icon="i-lucide-phone" class="w-full" />
                    </UFormField>
                    <UFormField label="Aantal deelnemers">
                        <UInput v-model="form.participants" type="text" placeholder="Bijv. 12" icon="i-lucide-users" class="w-full" />
                    </UFormField>
                </div>
                <UFormField label="Datum of periode">
                    <UInput v-model="form.date" type="text" placeholder="Bijv. zaterdag 14 juni, of ergens in het voorjaar" icon="i-lucide-calendar" class="w-full" />
                </UFormField>
                <UFormField label="Locatie">
                    <USelect v-model="form.location" :items="locationItems" class="w-full" />
                </UFormField>
                <UFormField v-if="form.location === 'op-locatie'" label="Plaats of adres">
                    <UInput v-model="form.place" type="text" placeholder="Waar vindt de sessie plaats?" icon="i-lucide-map-pin" class="w-full" />
                </UFormField>
                <UFormField label="Bericht">
                    <UTextarea v-model="form.message" :rows="4" placeholder="Vertel iets over de groep, de gelegenheid of je wensen" class="w-full" />
                </UFormField>

                <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

                <UButton type="submit" color="primary" variant="solid" size="xl" :loading="isLoading" :disabled="!canSubmit">
                    Aanvraag versturen
                </UButton>
            </form>

            <template #visual>
                <OfferGraphic
                    icon="i-lucide-send"
                    :accents="['i-lucide-party-popper', 'i-lucide-briefcase-business', 'i-lucide-users', 'i-lucide-tent']"
                    class="h-64 mt-12 md:mt-0 md:h-[36rem] w-full md:w-1/2"
                />
            </template>
        </Header>
    </div>
</template>
