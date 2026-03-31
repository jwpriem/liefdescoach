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

## 2024-05-18 - [Fix Email Enumeration in OTP Request]
**Vulnerability:** The `/api/auth/send-otp` endpoint threw a 404 error when a requested email address was not found in the database. This allowed an unauthenticated attacker to enumerate whether a specific email address is registered.
**Learning:** Any endpoint that accepts a user identifier (email, username, etc.) and performs an action (like sending a password reset link or OTP) must return a consistent, generic response regardless of whether the identifier exists. Otherwise, the differing responses leak the existence of the user.
**Prevention:** Always return a generic success response (e.g., `{ success: true }`) from authentication-related request endpoints, and handle the actual sending logic silently if the user exists.

## 2024-05-18 - [Fix Timing Attack User Enumeration in Login Endpoint]
**Vulnerability:** The login endpoint (`server/api/auth/login.post.ts`) immediately returned a 401 error if a user was not found, completely skipping the expensive `bcrypt.compare` operation. This allowed an attacker to enumerate valid users based on server response times. Furthermore, the rate-limiting counter was bypassed for non-existent users, allowing unlimited probing attempts to map out existing accounts.
**Learning:** Authentication endpoints must complete at roughly the same constant time regardless of whether the user exists or not. Differences in response times explicitly leak information about the underlying database records and allow brute-forcing the namespace of user accounts. Returning early prevents the IP/email combination rate limit from protecting against namespace enumeration.
**Prevention:** Always execute the expensive operation (like `bcrypt.compare`) against a dummy hash when a user isn't found. Also ensure that rate limiting counters are appropriately incremented for both invalid passwords AND missing accounts.
## 2024-05-18 - [Add Rate Limiting to Verification Endpoints]
**Vulnerability:** The password reset (`/api/auth/reset-password.post.ts`) and email verification (`/api/auth/verify-email.post.ts`) endpoints verified HMAC-SHA256 tokens and checked the database without any rate limits.
**Learning:** Even though the tokens are securely signed (HMAC-SHA256 is computationally cheap but secure), an attacker could spam these endpoints with invalid tokens. This creates an application-layer DoS vector because the endpoints perform database lookups upon token signature validation failures if not handled early.
**Prevention:** Implement IP-based rate limiting on sensitive state-changing endpoints like password resets and email verification, even when the underlying tokens are cryptographically secure. Use in-memory maps with lazy cleanup to track IP attempts without interval-based memory leaks.
