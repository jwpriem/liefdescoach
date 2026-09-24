# Security verbeterplan

Dit verbeterplan beschrijft concrete securitymaatregelen voor de Nuxt 4-applicatie van Yoga Ravennah. De prioritering is gebaseerd op de huidige architectuur: server-side API-routes met sessiecookies, Neon PostgreSQL via Drizzle, SMTP-mail, web push en een boekingsflow met persoonsgegevens.

## 1. Versterk HTTP security headers en CSP

**Risico:** De applicatie laadt externe scripts, waaronder Google Tag Manager, en heeft nog geen expliciet Content Security Policy-beleid. Hierdoor is de impact van XSS of ongewenste third-party scripts groter.

**Verbetering:**

- Voeg centrale security headers toe voor alle routes:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` voor camera, microfoon, geolocatie en betaal-API's
  - `frame-ancestors 'none'` of een expliciet toegestane lijst
- Maak de CSP zo strikt mogelijk en documenteer uitzonderingen voor Google Tag Manager, fonts en eventuele PWA-assets.
- Gebruik nonces of hashes voor inline scripts waar mogelijk, zodat inline JavaScript niet breed wordt toegestaan.

**Acceptatiecriteria:**

- Security headers zijn zichtbaar op productie- en previewomgevingen.
- De CSP blokkeert onbekende script-, frame- en connect-bronnen.
- Er is een test of smoke-check die de aanwezigheid van de headers valideert.

## 2. Voeg CSRF-bescherming toe aan muterende API-routes

**Risico:** De applicatie gebruikt sessiecookies voor authenticatie. Muterende endpoints zoals boeken, annuleren, gebruikersbeheer en accountwijzigingen kunnen gevoelig zijn voor CSRF wanneer een browser automatisch cookies meestuurt.

**Verbetering:**

- Introduceer een server-side CSRF-helper voor alle `POST`, `PUT`, `PATCH` en `DELETE` API-routes.
- Gebruik een double-submit token of een sessiegebonden token dat via een veilige endpoint wordt opgehaald.
- Controleer daarnaast `Origin` en `Referer` voor muterende requests.
- Pas de helper DRY toe via gedeelde server-utils, zodat endpoints niet ieder hun eigen validatie kopiëren.

**Acceptatiecriteria:**

- Muterende API-routes weigeren requests zonder geldig CSRF-token.
- Bestaande boekings- en annuleringsflows blijven werken met tokenverversing.
- Er zijn unit- of integratietests voor geldige, ontbrekende en foutieve tokens.

## 3. Implementeer rate limiting en brute-force bescherming

**Risico:** Login, registratie, OTP, wachtwoordreset en boekingsacties kunnen worden misbruikt voor brute-force aanvallen, credential stuffing, spam of resource-uitputting.

**Verbetering:**

- Voeg rate limiting toe op IP-adres, gebruiker en waar relevant e-mailadres.
- Gebruik strengere limieten voor:
  - login
  - registratie
  - OTP-verificatie
  - wachtwoordreset
  - boekings- en annuleringsacties
- Voeg tijdelijke lockouts of progressieve vertraging toe na herhaalde mislukte pogingen.
- Log rate-limit events zonder wachtwoorden, tokens of andere geheimen vast te leggen.

**Acceptatiecriteria:**

- Herhaalde mislukte login- of OTP-pogingen worden tijdelijk geblokkeerd.
- Legitieme gebruikers krijgen een duidelijke Nederlandstalige foutmelding.
- Rate-limit configuratie is per endpoint instelbaar en centraal herbruikbaar.

## 4. Verhard sessies, cookies en geheimenbeheer

**Risico:** Sessies en runtime secrets zijn kritieke onderdelen van de applicatie. Zwakke cookie-attributen, langlevende sessies of ontbrekende secret-validatie vergroten de impact van sessiediefstal of configuratiefouten.

**Verbetering:**

- Controleer dat sessiecookies altijd `HttpOnly`, `Secure`, `SameSite=Lax` of `Strict` en een beperkte levensduur hebben.
- Roteer sessie-ID's na login, privilegewijzigingen en gevoelige accountacties.
- Valideer bij serverstart dat verplichte secrets zoals database URL, session secret, cron secret, VAPID private key en mailwachtwoorden aanwezig zijn in productie.
- Stel minimale entropie-eisen aan `NUXT_SESSION_SECRET` en `NUXT_CRON_SECRET`.
- Documenteer een procedure voor secret-rotatie en incidentrespons.

**Acceptatiecriteria:**

- Productiestart faalt veilig wanneer verplichte secrets ontbreken of te zwak zijn.
- Sessiecookies hebben aantoonbaar veilige attributen.
- Er is een beschreven rotatieproces voor gelekte of verlopen secrets.

## 5. Beperk data-exposure en versterk autorisatiecontroles

**Risico:** De applicatie verwerkt persoonsgegevens van studenten, boekingen, credits en gezondheidsinformatie. Te brede API-responses of ontbrekende object-level checks kunnen leiden tot datalekken.

**Verbetering:**

- Controleer alle API-routes op object-level authorization: een gebruiker mag alleen eigen gegevens lezen of wijzigen, behalve expliciete admin-acties.
- Introduceer response-mappers die alleen noodzakelijke velden teruggeven aan de client.
- Behandel gezondheidsinformatie als extra gevoelig en beperk toegang tot eigenaar en bevoegde admins.
- Voeg auditlogging toe voor admin-acties zoals credits aanpassen, lessen beheren en namens gebruikers boeken.
- Maak een privacygerichte loggingrichtlijn: geen tokens, wachtwoorden, OTP-codes of volledige gezondheidsdetails in logs.

**Acceptatiecriteria:**

- API-responses bevatten geen onnodige velden zoals interne IDs, tokens of gevoelige metadata.
- Admin-acties zijn herleidbaar in auditlogs.
- Er zijn regressietests voor toegang tot andermans boekingen, credits en profielgegevens.

## 6. Versterk dependency- en supply-chain security

**Risico:** De applicatie gebruikt meerdere Nuxt-, PWA-, mail-, database- en browserautomatiseringsdependencies. Kwetsbaarheden in dependencies kunnen direct impact hebben op de applicatie.

**Verbetering:**

- Voeg een periodieke dependency audit toe aan CI, bijvoorbeeld `yarn npm audit --severity moderate` of een vergelijkbare workflow passend bij Yarn.
- Activeer Dependabot of Renovate voor gecontroleerde dependency-updates.
- Pin Node.js 20 in CI en deployment, conform de projectvereiste.
- Controleer lockfile-wijzigingen expliciet in pull requests.
- Voeg een minimale build-check toe aan PR's, zodat supply-chain updates niet ongemerkt runtimeproblemen veroorzaken.

**Acceptatiecriteria:**

- CI faalt of waarschuwt bij bekende kwetsbaarheden boven de afgesproken severity.
- Dependency-updates worden als aparte PR's aangeboden.
- Elke dependency-PR bevat buildresultaten en waar relevant testresultaten.

## 7. Verbeter beveiliging van e-mail, OTP en wachtwoordreset

**Risico:** Transactionele e-mail en OTP-codes zijn onderdeel van accounttoegang. Zwakke OTP-opslag, lange geldigheid of onbeperkte verificatiepogingen verhogen het risico op accountovername.

**Verbetering:**

- Sla OTP- en resetcodes alleen gehasht op, met korte TTL en single-use gedrag.
- Koppel OTP-pogingen aan rate limiting en maximumaantallen per code.
- Maak resetlinks kortlevend en ongeldig na gebruik of wachtwoordwijziging.
- Voeg e-mailnotificaties toe voor gevoelige acties zoals wachtwoordwijziging en nieuwe login vanaf onbekende context.
- Controleer SPF, DKIM en DMARC voor het verzenddomein.

**Acceptatiecriteria:**

- OTP- en resetcodes zijn niet plaintext terug te vinden in database of logs.
- Hergebruik van een OTP- of resetcode faalt.
- Maildeliverability en domeinauthenticatie zijn gedocumenteerd.

## Aanbevolen volgorde

1. CSRF-bescherming voor muterende API-routes.
2. Rate limiting voor login, OTP en wachtwoordreset.
3. Sessiecookies en secret-validatie verharden.
4. HTTP security headers en CSP uitrollen in report-only modus, daarna afdwingen.
5. Autorisatie-audit en response-minimalisatie uitvoeren.
6. Dependency scanning en automatische updates in CI activeren.
7. OTP-, reset- en e-mailbeveiliging aanscherpen.

## Eerste uitvoerbare mijlpalen

- **Week 1:** Inventariseer alle muterende API-routes en voeg een gedeelde CSRF-helper plus tests toe.
- **Week 2:** Voeg rate limiting toe voor login, OTP en wachtwoordreset.
- **Week 3:** Voeg security headers toe en draai CSP eerst in report-only modus.
- **Week 4:** Voer een autorisatie-audit uit op endpoints die studenten, boekingen, credits en gezondheidsinformatie teruggeven.

## Week 1 uitgevoerd

De eerste mijlpaal is uitgevoerd met de volgende deliverables:

- Alle muterende API-routes zijn geïnventariseerd op basis van de `.post.ts` routes onder `server/api/`.
- Er is een gedeelde CSRF-helper toegevoegd die veilige HTTP-methodes overslaat, same-origin controleert en een double-submit token valideert.
- Er is een `/api/csrf-token` endpoint toegevoegd dat een kortlevend CSRF-cookie zet en het token aan de client teruggeeft.
- Er is server-middleware toegevoegd die CSRF-validatie centraal afdwingt voor muterende API-routes, met een expliciete uitzondering voor de cronroute die via `x-api-key` wordt beschermd.
- Er is een client-plugin toegevoegd die voor muterende `/api/` requests automatisch een CSRF-token ophaalt en meestuurt via de `x-csrf-token` header.
- Er zijn unit-tests toegevoegd voor tokenuitgifte, safe-method bypass, same-origin validatie en geldige/ontbrekende/foutieve tokens.

## Inventarisatie muterende API-routes

De volgende muterende API-routes vallen onder de centrale CSRF-middleware, behalve waar expliciet vermeld als server-to-server uitzondering:

- `/api/admin/createStudent`
- `/api/admin/request-phone`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/passkeys/[id]/delete`
- `/api/auth/passkeys/login/options`
- `/api/auth/passkeys/login/verify`
- `/api/auth/passkeys/register/options`
- `/api/auth/passkeys/register/verify`
- `/api/auth/register`
- `/api/auth/request-password-reset`
- `/api/auth/request-verification`
- `/api/auth/reset-password`
- `/api/auth/send-otp`
- `/api/auth/update-password`
- `/api/auth/update-profile`
- `/api/auth/verify-email`
- `/api/auth/verify-otp`
- `/api/bookTrailLesson`
- `/api/bookings`
- `/api/cancelBooking`
- `/api/createLesson`
- `/api/credits/add`
- `/api/credits/delete`
- `/api/credits/history`
- `/api/credits/welcome`
- `/api/deleteLesson`
- `/api/handleBooking`
- `/api/health/update`
- `/api/mail/send`
- `/api/passwordRecovery`
- `/api/push/subscribe`
- `/api/push/test`
- `/api/push/unsubscribe`
- `/api/sendBookingCancellation`
- `/api/sendBookingConfirmation`
- `/api/sendLessonReminders`
- `/api/studentCheck`
- `/api/students/create`
- `/api/students/skip-phone`
- `/api/students/submit-phone`
- `/api/students/update-profile`
- `/api/updateLesson`
- `/api/updatePrefs`

**Uitzondering:** `/api/sendLessonReminders` blijft uitgesloten van browser-CSRF-validatie omdat deze route server-to-server via `x-api-key` wordt aangeroepen en zelf de cron secret valideert.
