# Net-On — API Reference

## Base URLs
- **Local Development:** `http://localhost:3001/api/v1`
- **Interactive Swagger Docs:** `http://localhost:3001/api/docs`

---

## Authentication Endpoints

### `POST /auth/login`
Authenticate with email and password.
- **Request Body:** `{ "email": "admin@neton.co.ke", "password": "..." }`
- **Response:** `{ "message": "Login successful", "tokens": { "accessToken": "...", "refreshToken": "..." }, "user": { "id": "...", "email": "...", "role": "..." } }`

### `POST /auth/refresh`
Rotate refresh token and receive a new token pair.
- **Request Body:** `{ "refreshToken": "..." }`

### `POST /auth/forgot-password`
Request password reset link/token.
- **Request Body:** `{ "email": "user@example.com" }`

### `POST /auth/reset-password`
Set new password using reset token.
- **Request Body:** `{ "token": "...", "newPassword": "NewPassword123!" }`

---

## Subscriber & Billing Endpoints

### `POST /customers` (Roles: SUPER_ADMIN, ADMIN, SUPPORT)
Create a new customer profile and linked user account.

### `GET /customers` (Roles: SUPER_ADMIN, ADMIN, FINANCE, TECHNICIAN, SUPPORT)
List customers with search, pagination, and status filters.

### `POST /subscriptions` (Roles: SUPER_ADMIN, ADMIN, SUPPORT)
Provision a new subscription for a customer.

### `POST /payments/stk-push` (Roles: SUPER_ADMIN, ADMIN, FINANCE)
Trigger M-Pesa STK Push payment prompt to customer's mobile phone.

### `POST /payments/mpesa/callback` (Public / Webhook)
Safaricom Daraja payment confirmation callback.

---

## Network & Router Endpoints

### `GET /network/sessions/live` (Roles: SUPER_ADMIN, ADMIN, TECHNICIAN)
Get active live PPPoE and Hotspot sessions across all connected routers.

### `GET /network/routers/:id/health` (Roles: SUPER_ADMIN, ADMIN, TECHNICIAN)
Query MikroTik RouterOS CPU, memory, uptime, and active connection metrics.

---

## Customer Portal Endpoints

### `GET /portal/dashboard` (Roles: CUSTOMER)
Retrieve customer's active subscription, unpaid invoices, latest payment, and support tickets.

### `POST /portal/pay` (Roles: CUSTOMER)
Initiate customer self-checkout via M-Pesa STK Push.
