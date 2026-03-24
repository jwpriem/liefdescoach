## 2024-05-18 - [Fix OTP brute-force vulnerability]
**Vulnerability:** In the OTP verification flow (`server/api/auth/verify-otp.post.ts`), a failed verification attempt did not invalidate the OTP code. This allowed an attacker to brute-force the 6-digit code within the 10-minute validity window.
**Learning:** Without explicit rate limiting or attempts tracking, any verifiable code must be single-use, even on failure. The previous implementation only deleted the code upon successful verification or expiry, overlooking the brute-force vector on failed attempts.
**Prevention:** Always ensure that authentication tokens/codes are invalidated immediately upon a failed verification attempt if no robust rate limiting or attempt counter is in place.
## 2026-03-18 - [Fix XSS in lesson titles/descriptions]
**Vulnerability:** The `getLessonTitle` and `getLessonDescription` helpers in `app/plugins/rav.ts` interpolated the `lesson.teacher` property without escaping it. Since these helpers are used with the `v-html` directive in components like `BookingModal.vue`, a malicious admin could inject scripts via the teacher name.
**Learning:** Even when data comes from an "internal" source (like the database, entered by admins), if it's rendered using `v-html`, it must be explicitly sanitized or escaped. Vue's default text interpolation (`{{ }}`) provides auto-escaping, but `v-html` bypasses this completely.
**Prevention:** Always sanitize or HTML-escape dynamic content before returning it from helpers that might be used with `v-html`. Prefer Vue's standard text interpolation (`{{ }}`) where HTML rendering is not strictly necessary.

## 2024-05-18 - [Fix IP Spoofing & Memory Leaks in Login Rate Limiting]
**Vulnerability:** The login endpoint rate limiter (`server/api/auth/login.post.ts`) used `getRequestIP(event, { xForwardedFor: true })` to extract user IP address and set `setInterval` for garbage collection.
**Learning:** Using `xForwardedFor: true` makes IP rate-limiting bypassable trivially if reverse proxy hasn't been strictly validated because attackers can forge the `X-Forwarded-For` header. Additionally, `setInterval` caused a memory leak on HMR and potential crashes in edge environments.
**Prevention:** Do not use `xForwardedFor: true` for IP-based rate limiting when using `getRequestIP()`. Use lazy cleanup (verifying entries size threshold before doing cleanup dynamically) to handle rate-limiting eviction without relying on background loops like `setInterval()`.
