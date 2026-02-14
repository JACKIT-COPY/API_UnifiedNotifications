# Backend API Endpoints Reference

Documentation of all HTTP endpoints for the **Unified Notifications (NotifyHub)** backend.  
Base URL: `http://localhost:3040` (or your deployed URL).  
Auth: **JWT** (`Authorization: Bearer <token>`) or **API Key** (`UNIFIED-API-Key: <key>`) where noted.

---

## Table of Contents

1. [Auth](#1-auth)
2. [Users](#2-users)
3. [Organizations](#3-organizations)
4. [API Keys](#4-api-keys)
5. [Contacts](#5-contacts)
6. [Groups](#6-groups)
7. [Templates](#7-templates)
8. [Campaigns](#8-campaigns)
9. [Notifications](#9-notifications)
10. [Message Logs](#10-message-logs)
11. [Transactions & Payments](#11-transactions--payments)
12. [Payment Methods](#12-payment-methods)
13. [Usage](#13-usage)
14. [System Logs](#14-system-logs)
15. [WebSocket](#15-websocket)
16. [Root](#16-root)

---

## 1. Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/signup` | — | Register a new user. Body: signup payload. |
| `POST` | `/auth/login` | — | Login. Body: `{ "email": string, "password": string }`. Returns JWT. |

---

## 2. Users

**Base path:** `/users`  
**Auth:** JWT. Some routes require **Admin** or **Super Admin**.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users` | JWT | List users in current organization. |
| `GET` | `/users/me` | JWT | Get current user profile. |
| `POST` | `/users` | JWT + Admin | Create user in current org. Body: user data. |
| `PUT` | `/users/:id` | JWT + Admin | Update user in current org. |
| `PUT` | `/users/:id/deactivate` | JWT + Admin | Deactivate user. |
| `PUT` | `/users/:id/reactivate` | JWT + Admin | Reactivate user. |
| `DELETE` | `/users/:id` | JWT + Admin | Delete user. |
| `PUT` | `/users/:id/password` | JWT | Change password (self or admin reset). Body: `{ "oldPassword?", "newPassword" }`. |
| `GET` | `/users/admin/all` | JWT + Super Admin | List all users across organizations. |
| `GET` | `/users/admin/stats` | JWT + Super Admin | User stats across orgs. |
| `POST` | `/users/admin` | JWT + Super Admin | Create user (any org). |
| `PUT` | `/users/admin/:id` | JWT + Super Admin | Update any user. |
| `PUT` | `/users/admin/:id/deactivate` | JWT + Super Admin | Deactivate any user. |
| `PUT` | `/users/admin/:id/reactivate` | JWT + Super Admin | Reactivate any user. |
| `PUT` | `/users/admin/:id/password` | JWT + Super Admin | Reset password. Body: `{ "newPassword" }`. |

---

## 3. Organizations

**Base path:** `/organizations`  
**Auth:** JWT. Access depends on role (admin = own org, superadmin = any).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/organizations` | JWT + Super Admin | List all organizations. |
| `GET` | `/organizations/ping` | JWT | Health check. Returns `{ message: "pong", timestamp }`. |
| `GET` | `/organizations/current` | JWT | Get current user's organization. |
| `PUT` | `/organizations/current/credentials` | JWT + Admin | Update current org credentials. Body: credentials object. |
| `GET` | `/organizations/:orgId` | JWT | Get organization by ID (own org or superadmin). |
| `GET` | `/organizations/:orgId/stats` | JWT | Get organization stats (users, contacts, groups, messages, credits spent, admin details). |
| `PATCH` | `/organizations/:orgId` | JWT | Update organization (admin own / superadmin any). |
| `PATCH` | `/organizations/:orgId/credentials` | JWT | Update org credentials by ID. Body: `{ "credentials": Record<string, string> }`. |

---

## 4. API Keys

**Base path:** `/api-keys`  
**Auth:** JWT + Admin (org admin only).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api-keys` | JWT + Admin | Create API key. Body: CreateApiKeyDto. Returns plaintext key once. |
| `GET` | `/api-keys` | JWT + Admin | List API keys for current organization (no key values). |
| `PUT` | `/api-keys/:id/revoke` | JWT + Admin | Revoke (deactivate) an API key. |
| `PUT` | `/api-keys/:id/activate` | JWT + Admin | Reactivate a revoked API key. |
| `DELETE` | `/api-keys/:id` | JWT + Admin | Permanently delete an API key. |

---

## 5. Contacts

**Base path:** `/contacts`  
**Auth:** JWT or API Key (CombinedAuthGuard).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/contacts` | JWT or API Key | Create contact. Body: contact payload. |
| `GET` | `/contacts` | JWT or API Key | List contacts for current organization. |
| `PUT` | `/contacts/:id` | JWT or API Key | Update contact. |
| `DELETE` | `/contacts/:id` | JWT or API Key | Delete contact. |

---

## 6. Groups

**Base path:** `/groups`  
**Auth:** JWT or API Key (CombinedAuthGuard).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/groups` | JWT or API Key | Create group. Body: group payload. |
| `GET` | `/groups` | JWT or API Key | List groups for current organization. |
| `DELETE` | `/groups/:id` | JWT or API Key | Delete group. |

---

## 7. Templates

**Base path:** `/templates`  
**Auth:** JWT or API Key (CombinedAuthGuard).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/templates` | JWT or API Key | Create template. Body: CreateTemplateDto. |
| `GET` | `/templates` | JWT or API Key | List templates for current organization. |
| `GET` | `/templates/:id` | JWT or API Key | Get template by ID. |
| `PUT` | `/templates/:id` | JWT or API Key | Update template. Body: UpdateTemplateDto. |
| `DELETE` | `/templates/:id` | JWT or API Key | Delete template. |

---

## 8. Campaigns

**Base path:** `/campaigns`  
**Auth:** JWT or API Key (CombinedAuthGuard).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/campaigns` | JWT or API Key | Create campaign. Body: campaign data. |
| `GET` | `/campaigns` | JWT or API Key | List campaigns for current organization. |
| `GET` | `/campaigns/:id` | JWT or API Key | Get campaign by ID. |
| `PUT` | `/campaigns/:id` | JWT or API Key | Update campaign. |
| `POST` | `/campaigns/:id/launch` | JWT or API Key | Launch campaign. |
| `POST` | `/campaigns/:id/cancel` | JWT or API Key | Cancel campaign. |

---

## 9. Notifications

**Base path:** `/notifications`  
**Auth:** JWT or API Key (CombinedAuthGuard).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/notifications/send` | JWT or API Key | Send notification (single or multiple recipients). Body: NotificationDto (type, to, message/subject, templateId?, data?, attachments?, scheduledAt?). |
| `POST` | `/notifications/send-to-all` | JWT or API Key | Send notification to all users in org. Body: NotificationDto. |
| `POST` | `/notifications/send-now` | JWT or API Key | Send a scheduled notification immediately. Body: `{ "logId": string }`. |

**Notification types:** `SMS`, `EMAIL`, `WHATSAPP` (from `NotificationType`).

---

## 10. Message Logs

**Base path:** `/message-logs`  
**Auth:** JWT or API Key (CombinedAuthGuard). Super Admin for “all” logs.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/message-logs` | JWT or API Key | Get message logs for current organization. Query: filters. |
| `GET` | `/message-logs/all` | JWT or API Key + Super Admin | Get all message logs (all orgs). Query: filters. |

---

## 11. Transactions & Payments

**Base path:** `/transactions`  
**Auth:** JWT (role-based). Callback is public.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/transactions` | JWT + Super Admin | List all transactions. |
| `GET` | `/transactions/me` | JWT | List transactions for current user's organization. |
| `GET` | `/transactions/organization/:orgId` | JWT | List transactions for an organization (own org or superadmin). |
| `GET` | `/transactions/:id` | JWT | Get transaction by ID (ownership checked). |
| `POST` | `/transactions/purchase` | JWT | Initiate payment. Body: InitiatePaymentDto. Returns payment initiation result. |
| `POST` | `/transactions/callback` | — (Public) | M-Pesa (or provider) webhook callback. Body: provider payload. |

---

## 12. Payment Methods

**Base path:** `/payment-methods`  
**Auth:** JWT + Super Admin only.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/payment-methods` | JWT + Super Admin | List all payment methods. |
| `GET` | `/payment-methods/default/active` | JWT + Super Admin | Get default active payment method. |
| `GET` | `/payment-methods/:id` | JWT + Super Admin | Get payment method by ID. |
| `POST` | `/payment-methods` | JWT + Super Admin | Create payment method. Body: CreatePaymentMethodDto. |
| `PUT` | `/payment-methods/:id` | JWT + Super Admin | Update payment method. Body: UpdatePaymentMethodDto. |
| `PUT` | `/payment-methods/:id/default` | JWT + Super Admin | Set as default payment method. |
| `PUT` | `/payment-methods/:id/toggle-active` | JWT + Super Admin | Toggle active status. |
| `DELETE` | `/payment-methods/:id` | JWT + Super Admin | Delete payment method. |

---

## 13. Usage

**Base path:** `/usage`  
**Auth:** JWT. Some routes require Super Admin.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/usage/organizations` | JWT + Super Admin | Usage for all organizations. |
| `GET` | `/usage/me` | JWT | Usage for current user's organization. |
| `GET` | `/usage/organization/:orgId` | JWT | Usage for specific org (own or superadmin). |
| `GET` | `/usage/stats` | JWT + Super Admin | Global stats (total SMS, Email, WhatsApp). |

---

## 14. System Logs

**Base path:** `/system-logs`  
**Auth:** JWT + Super Admin only.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/system-logs` | JWT + Super Admin | Get system logs. Query: filters. |

---

## 15. WebSocket

**Namespace:** `/logs`  
**Auth:** WsJwtGuard (JWT over WebSocket).

| Event | Direction | Description |
|-------|-----------|-------------|
| `new_log` | Server → Client | New message log entry. |
| `new_system_log` | Server → Client | New system log entry. |

Connect to: `ws://<host>/logs` (or your server’s WS path). Authenticate per your Socket.IO + JWT setup.

---

## 16. Root

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | — | Hello / root response from AppService. |

---

## Auth Summary

| Guard / Mechanism | Used by |
|-------------------|--------|
| **None** | `/auth/*`, `/transactions/callback`, `GET /` |
| **JWT** | Most `/users`, `/organizations`, `/transactions`, `/usage`, `/system-logs`, `/payment-methods`, `/api-keys` |
| **JWT + Admin** | `/api-keys`, `/users` (create/update/deactivate/delete), `/organizations/current/credentials` |
| **JWT + Super Admin** | `/users/admin/*`, `/organizations` list, `/transactions` list, `/usage/organizations`, `/usage/stats`, `/message-logs/all`, `/system-logs`, `/payment-methods` |
| **JWT or API Key (CombinedAuthGuard)** | `/contacts`, `/groups`, `/templates`, `/campaigns`, `/notifications`, `/message-logs` (org-scoped) |

---

## Headers

- **Authorization:** `Bearer <JWT>` for JWT-authenticated routes.
- **UNIFIED-API-Key:** `<API_KEY>` for API-key–authenticated routes (e.g. notifications, contacts, groups, templates, campaigns, message-logs).
- **Content-Type:** `application/json` for JSON bodies.

---

*Generated from backend controllers. Update this file when adding or changing endpoints.*
