# Net-On — Security & Incident Response Runbook

## Overview
This runbook establishes standard operating procedures for key rotation, vulnerability remediation, access control audits, and M-Pesa webhook security.

---

## 1. Cryptographic Architecture

### Credentials & Keys
- **User Passwords:** Hashed with **Argon2id** (64MB memory cost, 3 iterations, 4 parallel threads).
- **Router & Network Passwords:** Encrypted at rest with **AES-256-GCM** using `ENCRYPTION_SECRET`. Each record has a unique 12-byte random initialization vector (IV) and a 16-byte authentication tag to detect tampering.
- **Access Tokens:** Signed JWT (15-minute expiration) using `JWT_ACCESS_SECRET`.
- **Refresh Tokens:** Signed JWT (7-day expiration) stored as SHA-256 hashes in PostgreSQL with family-based rotation to detect replay attacks.

---

## 2. Key Rotation Procedures

### JWT Signing Keys
1. Generate new 64-character secret strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
2. Update `.env` with new secrets.
3. Perform zero-downtime rolling restart:
   ```bash
   docker compose -f docker-compose.prod.yml restart api
   ```
4. Existing access tokens expire in 15 minutes. All active sessions will gracefully rotate refresh tokens or re-authenticate.

### AES-256-GCM Encryption Key
If `ENCRYPTION_SECRET` must be rotated:
1. Export current plaintext secrets temporarily using previous key.
2. Re-encrypt all router passwords and network credentials using the new key.
3. Update `.env` and restart the API service.

---

## 3. Webhook Security Checklist

### Safaricom M-Pesa Callback (`/api/v1/payments/mpesa/callback`)
- **Token Verification:** Pass `?token=${MPESA_WEBHOOK_SECRET}` in the registered Daraja callback URL.
- **Nginx IP Filtering:** In `infrastructure/nginx/conf.d/default.conf`, restrict `/api/v1/payments/mpesa/callback` to Safaricom subnets:
  ```nginx
  location /api/v1/payments/mpesa/callback {
      allow 196.201.214.0/24;
      allow 196.201.213.0/24;
      deny all;
      proxy_pass http://api_backend;
  }
  ```
- **Idempotency Check:** Built-in handler rejects duplicate `CheckoutRequestID` and `MpesaReceiptNumber` payments.

---

## 4. Incident Response Playbook

### Compromised Admin Account
1. Super Admin navigates to `/admin/staff` and clicks **Deactivate**.
2. Or execute via CLI:
   ```bash
   docker compose -f docker-compose.prod.yml exec api npx prisma db execute --stdin <<< "UPDATE users SET is_active = false WHERE email = 'compromised@neton.co.ke';"
   ```
3. Invalidate all user refresh tokens:
   ```bash
   docker compose -f docker-compose.prod.yml exec api npx prisma db execute --stdin <<< "UPDATE refresh_tokens SET is_revoked = true WHERE user_id = 'USER_UUID';"
   ```
