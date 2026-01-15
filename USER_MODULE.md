# NotifyHub – Users Module API Documentation

**Date**: January 15, 2026  
**Version**: 1.0.0  
**Base URL**: `http://localhost:3000` (development)  

This document covers the **Users** module in NotifyHub – a multi-tenant unified notifications platform.  
Users represent people who can log in to the dashboard (admins, team members, etc.).  
All operations are **scoped to the authenticated organization** via JWT.

## Authentication

All protected endpoints require a valid JWT token obtained from:

- `POST /auth/signup`
- `POST /auth/login`

**Header**:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

Unauthorized requests return `401 Unauthorized`.  
Admin-only endpoints return `403 Forbidden` if role ≠ 'admin'.

---

## User Endpoints

### 1. Signup – Create Organization + First Admin User

**POST** `/auth/signup`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@acme.com",
  "password": "SecurePass123!",
  "countryCode": "+254",
  "phoneNumber": "712345678",
  "companyName": "Acme Corp Kenya",
  "sector": "Technology",
  "country": "Kenya",
  "role": "admin"           // optional, defaults to 'admin'
}
```

**Success Response** (200/201):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "_id": "659f1a2b3c4d5e6f7g8h9i0j",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@acme.com",
    "role": "admin",
    "organization": "659f1a2b3c4d5e6f7g8h9i0k",
    "isActive": true,
    ...
  }
}
```

**Errors**:
- 400 – Email already exists  
- 400 – Missing required fields

---

### 2. Login

**POST** `/auth/login`

**Request Body**:
```json
{
  "email": "john.doe@acme.com",
  "password": "SecurePass123!"
}
```

**Success Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": { ... }
}
```

**Errors**:
- 400 – Invalid credentials

---

### 3. Get All Active Users in Organization

**GET** `/users`

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200):
```json
[
  {
    "_id": "659f1a2b3c4d5e6f7g8h9i0j",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@acme.com",
    "role": "admin",
    "countryCode": "+254",
    "phoneNumber": "712345678",
    "isActive": true,
    "createdAt": "2026-01-15T...",
    "updatedAt": "2026-01-15T..."
  },
  {
    "_id": "659f1a2b3c4d5e6f7g8h9i0m",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@acme.com",
    "role": "user",
    "isActive": true,
    ...
  }
]
```

---

### 4. Get Current User Profile

**GET** `/users/me`

**Headers**: Authorization Bearer token

**Success Response**:
```json
{
  "_id": "659f1a2b3c4d5e6f7g8h9i0j",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@acme.com",
  "role": "admin",
  ...
}
```

---

### 5. Create New User (Admin Only)

**POST** `/users`

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Request Body** (minimum required fields):
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@acme.com",
  "password": "SecurePass456!",
  "countryCode": "+254",
  "phoneNumber": "723456789",
  "role": "user"                  // optional, defaults to 'user'
}
```

**Success Response** (201):
```json
{
  "_id": "659f1a2b3c4d5e6f7g8h9i0m",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@acme.com",
  "role": "user",
  "isActive": true,
  ...
}
```

**Errors**:
- 403 – Not an admin
- 400 – Email already exists

---

### 6. Update User (Admin Only)

**PUT** `/users/:id`

**Example**: `PUT /users/659f1a2b3c4d5e6f7g8h9i0m`

**Request Body** (partial update):
```json
{
  "firstName": "Jane Updated",
  "role": "admin",
  "phoneNumber": "723456789"
}
```

**Success Response**:
Updated user object

**Errors**:
- 403 – Not admin
- 404 – User not found in your organization

---

### 7. Deactivate User (Admin Only)

**PUT** `/users/:id/deactivate`

**Example**: `PUT /users/659f1a2b3c4d5e6f7g8h9i0m/deactivate`

**Success Response**:
```json
{
  "_id": "659f1a2b3c4d5e6f7g8h9i0m",
  "isActive": false,
  ...
}
```

**Errors**:
- 403 – Not admin
- 400 – Already deactivated

---

### 8. Reactivate User (Admin Only)

**PUT** `/users/:id/reactivate`

**Example**: `PUT /users/659f1a2b3c4d5e6f7g8h9i0m/reactivate`

**Success Response**:
Updated user with `isActive: true`

---

### 9. Delete User (Admin Only – Hard Delete)

**DELETE** `/users/:id`

**Example**: `DELETE /users/659f1a2b3c4d5e6f7g8h9i0m`

**Success Response** (200):
```json
{ "message": "User deleted successfully" }
```

**Errors**:
- 403 – Not admin
- 404 – Not found

---

## Security & Multi-Tenancy Notes

- All operations are **scoped** to the authenticated organization (`req.user.orgId`).
- Only **admin** role can create, update, deactivate, reactivate, or delete users.
- `isActive: false` prevents login (add check in `AuthService.login` if not already).
- Passwords are **never** returned in responses.
- No cross-organization access.

## Testing Tips (Postman / Thunder Client)

1. **Login as admin** → copy token
2. Set global header: `Authorization: Bearer {{token}}`
3. **GET /users** → see list
4. **POST /users** → create new user
5. **PUT /users/:id** → update role
6. **PUT /users/:id/deactivate** → set isActive false
7. **PUT /users/:id/reactivate** → set isActive true
8. **DELETE /users/:id** → remove user
9. Try as non-admin → get 403

## Next Steps

- Frontend: Users management page (list, add, edit, deactivate/reactivate)
- Add password change endpoint
- Invite flow (email + accept link – future)
- Role-based permissions (e.g., hide delete for self)

**Users module is now complete with full team management capabilities.**

Ready for frontend or next feature (Wallet / Message History / Send Message polish)?