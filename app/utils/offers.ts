import type { SessionType } from '~~/shared/sessionRequest'

/** A card on the homepage and an entry in the menu. */
export interface OfferLink {
  path: string
  icon: string
  name: string
  tagline: string
}

/** A one-time session with its own page, rendered by OfferPage.vue. */
export interface Offer extends OfferLink {
  /** Preselected in the request form on /aanvraag */
  type: SessionType
  title: string
  description: string
  heroTitle: string
  heroIntro: string
  highlights: { icon: string; title: string; text: string }[]
  program: { title: string; text: string }[]
  options: string[]
  faq: { question: string; answer: string }[]
}

const LOCATION_FAQ = {
  question: 'Waar vindt de sessie plaats?',
  answer:
    'Waar jullie willen. In mijn studio in Rotterdam Nesselande, of ik kom naar jullie toe: thuis, op kantoor, in een vakantiehuis, in een park of op een eventlocatie.',
}

const EXPERIENCE_FAQ = {
  question: 'Moet je ervaring hebben met yoga?',
  answer:
    'Nee. Ik stem de sessie af op de groep, zodat iedereen mee kan doen — van complete beginner tot ervaren yogi.',
}

const PRICE_FAQ = {
  question: 'Wat kost het?',
  answer:
    'Elke sessie is maatwerk, dus de prijs is op aanvraag. Die hangt af van de groepsgrootte, de duur en de locatie. Stuur een aanvraag en je ontvangt een voorstel op maat.',
}

export const OFFERS: Offer[] = [
  {
    path: '/vrijgezellenfeest',
    type: 'vrijgezellenfeest',
    icon: 'i-lucide-party-popper',
    name: 'Vrijgezellenfeest',
    tagline: 'Een ontspannen en vrolijke start van het vrijgezellenfeest, samen op de mat.',
    title: 'Yoga vrijgezellenfeest | Yoga Ravennah',
    description:
      'Een yoga vrijgezellenfeest met Yoga Ravennah: een sessie op maat voor de bruid of bruidegom en vrienden. In de studio in Rotterdam Nesselande of op jullie eigen locatie.',
    heroTitle: 'Yoga vrijgezellenfeest',
    heroIntro:
      'Op zoek naar een vrijgezellenactiviteit die net even anders is? Een yogasessie brengt de groep samen, zorgt voor lachen én ontspanning — en geeft iedereen energie voor de rest van het feest.',
    highlights: [
      { icon: 'i-lucide-heart', title: 'Samen beleven', text: 'Een activiteit waar iedereen aan mee kan doen, wat de leeftijd of ervaring ook is.' },
      { icon: 'i-lucide-smile', title: 'Lachen en ontspannen', text: 'Speels waar het kan, rustig waar het moet. Ik stem de sfeer af op jullie groep.' },
      { icon: 'i-lucide-sparkles', title: 'Helemaal op maat', text: 'Een thema, een verrassing voor de bruid of bruidegom? We maken er samen iets bijzonders van.' },
    ],
    program: [
      { title: 'Aankomen', text: 'We beginnen rustig met een korte kennismaking en ademhaling, zodat iedereen landt.' },
      { title: 'Bewegen', text: 'Een toegankelijke flow met ruimte voor plezier, partneroefeningen en een uitdaging voor wie wil.' },
      { title: 'Ontspannen', text: 'We sluiten af met een diepe ontspanning — de perfecte opmaat naar de rest van de dag.' },
    ],
    options: [
      'In de studio of op jullie eigen locatie',
      'Binnen of buiten',
      'Een thema of eigen muziek in overleg',
      'Ook voor gemengde groepen',
    ],
    faq: [EXPERIENCE_FAQ, LOCATION_FAQ, PRICE_FAQ],
  },
  {
    path: '/bedrijfsyoga',
    type: 'bedrijfsyoga',
    icon: 'i-lucide-briefcase-business',
    name: 'Bedrijfsyoga',
    tagline: 'Minder stress en meer energie op de werkvloer, met een sessie op kantoor of in de studio.',
    title: 'Bedrijfsyoga | Yoga Ravennah',
    description:
      'Bedrijfsyoga van Yoga Ravennah: een yogasessie op kantoor of op locatie voor minder stress en meer energie. Voor elk team, elke groepsgrootte en zonder ervaring.',
    heroTitle: 'Bedrijfsyoga',
    heroIntro:
      'Een volle agenda, lange dagen achter het scherm en weinig tijd om te ademen. Een yogasessie op het werk geeft je collega’s rust, een soepeler lichaam en een helder hoofd.',
    highlights: [
      { icon: 'i-lucide-wind', title: 'Minder stress', text: 'Ademhaling en beweging brengen het zenuwstelsel tot rust, ook midden op een werkdag.' },
      { icon: 'i-lucide-person-standing', title: 'Soepeler lichaam', text: 'Oefeningen die stijve schouders, nek en rug van het bureauwerk losmaken.' },
      { icon: 'i-lucide-zap', title: 'Meer energie', text: 'Collega’s gaan opgeladen en gefocust terug aan het werk.' },
    ],
    program: [
      { title: 'Afstemmen', text: 'We bespreken wat jullie team nodig heeft: ontspanning, energie, of juist even afstand van het werk.' },
      { title: 'De sessie', text: 'Een les op maat, in een vergaderzaal, op het dak of in de studio. Werkkleding? Dan maak ik de les daarop af.' },
      { title: 'Meenemen', text: 'Iedereen krijgt eenvoudige oefeningen mee die ook achter het bureau werken.' },
    ],
    options: [
      'Op kantoor, op een eventlocatie of in de studio',
      'Als losse sessie, onderdeel van een vitaliteitsdag of terugkerend',
      'Voor kleine teams en grote groepen',
      'Ook als lunch- of opstartsessie',
    ],
    faq: [EXPERIENCE_FAQ, LOCATION_FAQ, PRICE_FAQ],
  },
  {
    path: '/teamuitje',
    type: 'teamuitje',
    icon: 'i-lucide-users',
    name: 'Teamuitje',
    tagline: 'Samen ontspannen als team: een uitje dat verbindt en waar iedereen aan mee kan doen.',
    title: 'Yoga teamuitje | Yoga Ravennah',
    description:
      'Een yoga teamuitje met Yoga Ravennah: verbinding, ontspanning en plezier voor je hele team. Op een locatie naar keuze of in de studio in Rotterdam Nesselande.',
    heroTitle: 'Yoga teamuitje',
    heroIntro:
      'Een teamuitje waar iedereen aan mee kan doen en waar je écht even uit de werkmodus stapt. Met yoga leer je elkaar op een andere manier kennen — met aandacht, humor en rust.',
    highlights: [
      { icon: 'i-lucide-handshake', title: 'Verbinding', text: 'Partner- en groepsoefeningen die zorgen voor vertrouwen en plezier.' },
      { icon: 'i-lucide-leaf', title: 'Even los van het werk', text: 'Een moment zonder laptop en telefoon, voor iedereen in het team.' },
      { icon: 'i-lucide-calendar-heart', title: 'Makkelijk te combineren', text: 'Als opening of afsluiter van een heidag, offsite of teamdag.' },
    ],
    program: [
      { title: 'Opwarmen', text: 'Een luchtige start waarin het team rustig in beweging komt.' },
      { title: 'Samen doen', text: 'Oefeningen in tweetallen en als groep — uitdagend waar het kan, lachen mag.' },
      { title: 'Tot rust komen', text: 'Een begeleide ontspanning, zodat iedereen fris aan de rest van de dag begint.' },
    ],
    options: [
      'Binnen of buiten, op elke locatie',
      'Als onderdeel van een heidag of offsite',
      'Elke groepsgrootte',
      'Een thema in overleg, zoals ontspanning of energie',
    ],
    faq: [EXPERIENCE_FAQ, LOCATION_FAQ, PRICE_FAQ],
  },
  {
    path: '/workshops',
    type: 'workshop',
    icon: 'i-lucide-presentation',
    name: 'Workshops',
    tagline: 'Een workshop met een thema, zoals ademhaling, ontspanning of yoga voor een betere nachtrust.',
    title: 'Yoga workshops | Yoga Ravennah',
    description:
      'Yoga workshops van Yoga Ravennah rond een thema: ademhaling, ontspanning, stress of slaap. Voor groepen, organisaties en evenementen, op locatie of in de studio.',
    heroTitle: 'Yoga workshops',
    heroIntro:
      'Dieper ingaan op één onderwerp? In een workshop combineer ik uitleg met oefeningen die je direct zelf kunt toepassen — ook als je nog nooit yoga hebt gedaan.',
    highlights: [
      { icon: 'i-lucide-wind', title: 'Ademhaling', text: 'Leer hoe je met je adem stress verlaagt en je energie stuurt.' },
      { icon: 'i-lucide-moon', title: 'Ontspanning en slaap', text: 'Oefeningen en technieken voor een rustig hoofd en een betere nachtrust.' },
      { icon: 'i-lucide-lightbulb', title: 'Jouw thema', text: 'Een eigen onderwerp in gedachten? Ik maak er graag een workshop op maat van.' },
    ],
    program: [
      { title: 'Uitleg', text: 'Een korte, praktische introductie op het thema: wat gebeurt er in je lichaam en hoofd?' },
      { title: 'Oefenen', text: 'We gaan aan de slag met oefeningen, rustig opgebouwd en voor iedereen te doen.' },
      { title: 'Toepassen', text: 'Je gaat naar huis met handvatten die je in je eigen dag kunt gebruiken.' },
    ],
    options: [
      'Voor bedrijven, verenigingen en vriendengroepen',
      'Op locatie of in de studio',
      'Als losse workshop of als reeks',
      'Thema en duur in overleg',
    ],
    faq: [EXPERIENCE_FAQ, LOCATION_FAQ, PRICE_FAQ],
  },
  {
    path: '/events',
    type: 'event',
    icon: 'i-lucide-tent',
    name: 'Events & samenwerkingen',
    tagline: 'Yoga op jouw event, festival of beurs — of een samenwerking met jouw merk of locatie.',
    title: 'Yoga op events en samenwerkingen | Yoga Ravennah',
    description:
      'Yoga Ravennah op jouw event, festival, beurs of in samenwerking met jouw merk of locatie. Yogasessies op maat voor groepen van elke grootte.',
    heroTitle: 'Events & samenwerkingen',
    heroIntro:
      'Organiseer je een event, festival, open dag of retreat, of heb je een merk of locatie die past bij rust en balans? Ik verzorg graag de yoga — van één sessie tot een volledig programma.',
    highlights: [
      { icon: 'i-lucide-tent', title: 'Op jouw event', text: 'Een yogasessie als onderdeel van een festival, beurs, open dag of feest.' },
      { icon: 'i-lucide-heart-handshake', title: 'Samenwerkingen', text: 'Samen iets neerzetten met jouw merk, winkel, sportschool of locatie.' },
      { icon: 'i-lucide-sun', title: 'Binnen en buiten', text: 'Op het strand, in een park, op een dakterras of in een zaal.' },
    ],
    program: [
      { title: 'Idee', text: 'Je vertelt wat je voor ogen hebt: het event, de doelgroep en de sfeer.' },
      { title: 'Voorstel', text: 'Ik werk een voorstel uit dat past bij jouw event of merk.' },
      { title: 'Uitvoering', text: 'Op de dag zelf verzorg ik de sessie of sessies, zodat jij je op de rest kunt richten.' },
    ],
    options: [
      'Eén sessie of een programma met meerdere sessies',
      'Kleine groepen en grote evenementen',
      'Binnen, buiten of op het water',
      'Samenwerkingen met merken en locaties',
    ],
    faq: [
      {
        question: 'Voor wat voor events kun je me vragen?',
        answer:
          'Festivals, beurzen, open dagen, retreats, sportevenementen, lanceringen en feesten. Twijfel je of yoga past bij jouw event? Stuur gerust een bericht.',
      },
      LOCATION_FAQ,
      PRICE_FAQ,
    ],
  },
]

/** Private lessons have their own page (pages/priveles.vue) but are part of the offer. */
export const PRIVATE_LESSON: OfferLink & { type: SessionType } = {
  path: '/priveles',
  type: 'priveles',
  icon: 'i-lucide-user',
  name: 'Privéles',
  tagline: 'Een les volledig afgestemd op jou, alleen of met een paar vrienden of familieleden.',
}

// concat instead of a spread: Nuxt's auto-import scanner misses the next export after `[...OFFERS, …]`
export const OFFER_LINKS: OfferLink[] = (OFFERS as OfferLink[]).concat(PRIVATE_LESSON)

export function offerByPath(path: string): Offer {
  const offer = OFFERS.find((o) => o.path === path)
  if (!offer) throw new Error(`Onbekend aanbod: ${path}`)
  return offer
}

/** The request form with this session type already chosen. */
export function requestLink(type: SessionType): string {
  return `/aanvraag?type=${type}`
}
