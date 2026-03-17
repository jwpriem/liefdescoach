## 2024-05-18 - [Fix OTP brute-force vulnerability]
**Vulnerability:** In the OTP verification flow (`server/api/auth/verify-otp.post.ts`), a failed verification attempt did not invalidate the OTP code. This allowed an attacker to brute-force the 6-digit code within the 10-minute validity window.
**Learning:** Without explicit rate limiting or attempts tracking, any verifiable code must be single-use, even on failure. The previous implementation only deleted the code upon successful verification or expiry, overlooking the brute-force vector on failed attempts.
**Prevention:** Always ensure that authentication tokens/codes are invalidated immediately upon a failed verification attempt if no robust rate limiting or attempt counter is in place.
