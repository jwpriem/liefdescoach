<script setup lang="ts">
const title = ref("Yoga Ravennah | Privacyverklaring");
const description = ref(
    "Lees welke persoonsgegevens Yoga Ravennah verzamelt via de website en de app, waarvoor we ze gebruiken, met wie we ze delen en hoe je ze kunt inzien of laten verwijderen.",
);
const ogImage = ref("https://www.ravennah.com/ravennah-social.jpg");
const pageUrl = ref("https://www.ravennah.com/privacy");
const privacyEmail = "info@ravennah.com";

useHead({
    title,
    link: [{ rel: "canonical", href: pageUrl }],
    meta: [
        { hid: "description", name: "description", content: description },
        { hid: "og:title", property: "og:title", content: title },
        { hid: "og:url", property: "og:url", content: pageUrl },
        {
            hid: "og:description",
            property: "og:description",
            content: description,
        },
        { hid: "og:image", property: "og:image", content: ogImage },
        { hid: "twitter:title", name: "twitter:title", content: title },
        { hid: "twitter:url", name: "twitter:url", content: pageUrl },
        {
            hid: "twitter:description",
            name: "twitter:description",
            content: description,
        },
        { hid: "twitter:image", name: "twitter:image", content: ogImage },
    ],
});
</script>

<template>
    <div class="p-8 md:px-0 md:pt-40 md:pb-24">
        <div class="container mx-auto max-w-3xl space-y-10">
            <header class="space-y-4">
                <h1 class="text-3xl md:text-6xl uppercase font-black">
                    <span class="emerald-underline">Privacyverklaring</span
                    ><span class="text-emerald-600">.</span>
                </h1>
                <p class="intro">
                    Hier lees je welke gegevens Yoga Ravennah van je verzamelt
                    via de website en de app, waarvoor we ze gebruiken en wat
                    je er zelf over te zeggen hebt.
                </p>
                <p class="text-sm text-gray-400">
                    Laatst bijgewerkt: 6 oktober 2026
                </p>
            </header>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">
                    Wie is verantwoordelijk
                </h2>
                <p>
                    Yoga Ravennah is verantwoordelijk voor de verwerking van je
                    persoonsgegevens.
                </p>
                <address class="not-italic">
                    Yoga Ravennah<br />
                    Emmy van Leersumhof 24a<br />
                    3059 LT Rotterdam<br />
                    <a class="underline" :href="`mailto:${privacyEmail}`">{{
                        privacyEmail
                    }}</a>
                </address>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">
                    Welke gegevens we verzamelen
                </h2>
                <ul class="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Accountgegevens:</strong> je naam, e-mailadres
                        en wachtwoord. Je wachtwoord slaan we versleuteld op en
                        kunnen we zelf niet lezen. Je telefoonnummer en
                        geboortedatum zijn optioneel.
                    </li>
                    <li>
                        <strong>Boekingen en credits:</strong> welke lessen je
                        boekt of annuleert en hoeveel credits je hebt gekregen
                        en gebruikt.
                    </li>
                    <li>
                        <strong>Gezondheidsgegevens:</strong> blessures of
                        bijzonderheden, of je zwanger bent en je uitgerekende
                        datum. Deze gegevens vul je alleen in als je dat zelf
                        wilt.
                    </li>
                    <li>
                        <strong>Voorkeuren:</strong> of je herinneringen per
                        e-mail en meldingen wilt ontvangen. Zet je meldingen
                        aan, dan bewaren we het adres waarop je apparaat ze
                        ontvangt.
                    </li>
                    <li>
                        <strong>Beveiligingsgegevens:</strong> bij elke keer
                        inloggen bewaren we je IP-adres, het type browser of
                        apparaat en het tijdstip. Gebruik je een passkey, dan
                        bewaren we de publieke sleutel daarvan.
                    </li>
                    <li>
                        <strong>Berichten:</strong> je naam, e-mailadres en
                        bericht als je het contactformulier invult.
                    </li>
                    <li>
                        <strong>ClassPass:</strong> boek je een les via
                        ClassPass, dan ontvangen wij van ClassPass alleen je
                        volledige naam.
                    </li>
                </ul>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">
                    Waarvoor we je gegevens gebruiken
                </h2>
                <ul class="list-disc pl-5 space-y-2">
                    <li>
                        Om je account te beheren, lessen te boeken en te
                        annuleren en je credits bij te houden. Dat is nodig om
                        de afspraak die je met ons maakt uit te voeren.
                    </li>
                    <li>
                        Om je een bevestiging, een herinnering of een andere
                        melding over je les te sturen.
                    </li>
                    <li>
                        Om de les veilig en passend te maken met de
                        gezondheidsgegevens die je zelf hebt ingevuld. Dat doen
                        we alleen met je uitdrukkelijke toestemming.
                    </li>
                    <li>
                        Om je account te beveiligen en misbruik te herkennen.
                        Daar hebben wij een gerechtvaardigd belang bij.
                    </li>
                    <li>
                        Om te zien hoe de website wordt gebruikt, zodat we die
                        kunnen verbeteren.
                    </li>
                </ul>
                <p>
                    We verkopen je gegevens niet en gebruiken ze niet voor
                    advertenties.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">
                    Gezondheidsgegevens
                </h2>
                <p>
                    Gegevens over je gezondheid zijn extra gevoelig. Je bent
                    niet verplicht ze in te vullen. Alleen Yoga Ravennah kan ze
                    inzien. Je kunt ze op elk moment zelf
                    aanpassen of weghalen in je account, en daarmee trek je je
                    toestemming in.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">
                    Met wie we gegevens delen
                </h2>
                <p>
                    We schakelen andere bedrijven in om de website en de app te
                    laten werken. Zij verwerken je gegevens alleen in onze
                    opdracht.
                </p>
                <ul class="list-disc pl-5 space-y-2">
                    <li><strong>Neon:</strong> de database.</li>
                    <li>
                        <strong>DigitalOcean:</strong> de hosting van de
                        website.
                    </li>
                    <li>
                        <strong>Namecheap Private Email:</strong> het versturen
                        van e-mail.
                    </li>
                    <li>
                        <strong>Google:</strong> Google Analytics, alleen op de
                        website.
                    </li>
                    <li>
                        <strong>Apple, Google of Mozilla:</strong> het
                        afleveren van meldingen, alleen als je die zelf hebt
                        aangezet.
                    </li>
                </ul>
                <p>
                    Deze bedrijven kunnen gegevens buiten de Europese
                    Economische Ruimte verwerken.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">Cookies</h2>
                <ul class="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Functionele cookies:</strong> <code
                            >rav_session</code
                        > houdt je ingelogd en
                        <code>rav_csrf</code> beschermt formulieren tegen
                        misbruik. Log je in met een passkey, dan plaatsen we
                        daarvoor een tijdelijke cookie. Zonder deze cookies
                        werkt inloggen niet.
                    </li>
                    <li>
                        <strong>Analytische cookies:</strong> Google Analytics
                        plaatst cookies (zoals <code>_ga</code>) om bezoeken
                        aan de website te meten.
                    </li>
                </ul>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">De app</h2>
                <p>
                    De app van Yoga Ravennah gebruikt dezelfde gegevens als je
                    account op de website. De app bewaart een inlogsleutel in
                    de beveiligde sleutelhanger van je iPhone, zodat je
                    ingelogd blijft. De app bevat geen Google Analytics en geen
                    andere software van derden om je te volgen of advertenties
                    te tonen.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">
                    Hoe lang we gegevens bewaren
                </h2>
                <p>
                    We bewaren je gegevens zolang je een account hebt. Een
                    inlogsessie op de website verloopt na 30 dagen. In de app
                    blijf je ingelogd zolang je de app gebruikt, tot maximaal
                    een jaar na het inloggen.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">
                    Je gegevens laten verwijderen
                </h2>
                <p>
                    Wil je je account en je gegevens laten verwijderen? Stuur
                    een e-mail naar
                    <a class="underline" :href="`mailto:${privacyEmail}`">{{
                        privacyEmail
                    }}</a
                    >. We verwijderen je persoonsgegevens dan binnen 30 dagen.
                    Gegevens over boekingen en credits bewaren we zonder je
                    naam of andere persoonsgegevens voor onze administratie.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">Je rechten</h2>
                <p>Je hebt het recht om:</p>
                <ul class="list-disc pl-5 space-y-2">
                    <li>je gegevens in te zien en te laten corrigeren;</li>
                    <li>je gegevens te laten verwijderen;</li>
                    <li>
                        het gebruik van je gegevens te laten beperken of er
                        bezwaar tegen te maken;
                    </li>
                    <li>je gegevens op te vragen om ze mee te nemen;</li>
                    <li>een gegeven toestemming weer in te trekken.</li>
                </ul>
                <p>
                    Veel gegevens kun je zelf aanpassen in je account. Voor
                    andere verzoeken mail je naar
                    <a class="underline" :href="`mailto:${privacyEmail}`">{{
                        privacyEmail
                    }}</a
                    >. Ben je het niet eens met hoe we met je gegevens omgaan,
                    dan kun je een klacht indienen bij de
                    <a
                        class="underline"
                        href="https://www.autoriteitpersoonsgegevens.nl"
                        target="_blank"
                        rel="noopener"
                        >Autoriteit Persoonsgegevens</a
                    >.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl md:text-2xl font-bold">Wijzigingen</h2>
                <p>
                    We kunnen deze privacyverklaring aanpassen. De datum
                    bovenaan laat zien wanneer dat voor het laatst is gebeurd.
                </p>
            </section>
        </div>
    </div>
</template>
