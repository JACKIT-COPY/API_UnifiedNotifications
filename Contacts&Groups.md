```markdown
# NotifyHub – Contacts & Groups API Documentation

**Date**: January 08, 2026  
**Version**: 1.0.0  
**Base URL**: `http://localhost:3040` (development)  

This document covers the **Contacts** and **Groups** features for NotifyHub, a multi-tenant unified notifications platform. All endpoints are **protected** by JWT authentication and scoped to the authenticated organization.

## Authentication

All endpoints require a valid JWT token obtained from:

- `POST /auth/signup`
- `POST /auth/login`

**Header**:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

Unauthorized requests return `401 Unauthorized`.

---

## Groups API

Groups are used to organize contacts (e.g., "VIP Clients", "Marketing List").

### Create a Group

**POST** `/groups`

**Request Body**:
```json
{
  "name": "VIP Clients",
  "description": "High-value customers",
  "color": "bg-purple-500/10 text-purple-500 border-purple-500/20"
}
```

**Success Response (201)**:
```json
{
  "_id": "65a0b1c2d3e4f5g6h7i8j9k0",
  "name": "VIP Clients",
  "description": "High-value customers",
  "color": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "organization": "659f1a2b3c4d5e6f7g8h9i0k",
  "createdAt": "2026-01-08T08:00:00.000Z",
  "__v": 0
}
```

### List All Groups

**GET** `/groups`

**Success Response (200)**:
```json
[
  {
    "_id": "65a0b1c2d3e4f5g6h7i8j9k0",
    "name": "VIP Clients",
    "description": "High-value customers",
    "color": "bg-purple-500/10 text-purple-500 border-purple-500/20",
    "organization": "659f1a2b3c4d5e6f7g8h9i0k",
    "createdAt": "2026-01-08T08:00:00.000Z"
  }
]
```

### Delete a Group

**DELETE** `/groups/:id`

**Example**: `DELETE /groups/65a0b1c2d3e4f5g6h7i8j9k0`

**Success**: 204 No Content  
**Error**: 400 if group not found or not owned by your organization

---

## Contacts API

Contacts represent customers or recipients who receive notifications.

### Create a Contact

**POST** `/contacts`

**Request Body**:
```json
{
  "name": "Sarah Johnson",
  "email": "sarah.johnson@client.com",
  "phone": "+254712345678",
  "organization": "Client Corp Ltd",
  "tags": ["premium", "active"],
  "groups": ["65a0b1c2d3e4f5g6h7i8j9k0"]
}
```

**Success Response (201)**:
```json
{
  "_id": "65a0c3d4e5f6g7h8i9j0k1l2",
  "name": "Sarah Johnson",
  "email": "sarah.johnson@client.com",
  "phone": "+254712345678",
  "organization": "Client Corp Ltd",
  "tags": ["premium", "active"],
  "groups": ["65a0b1c2d3e4f5g6h7i8j9k0"],
  "notifyHubOrganization": "659f1a2b3c4d5e6f7g8h9i0k",
  "createdAt": "2026-01-08T08:15:00.000Z"
}
```

### List All Contacts

**GET** `/contacts`

**Success Response (200)**:
```json
[
  {
    "_id": "65a0c3d4e5f6g7h8i9j0k1l2",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@client.com",
    "phone": "+254712345678",
    "organization": "Client Corp Ltd",
    "tags": ["premium", "active"],
    "groups": [
      {
        "_id": "65a0b1c2d3e4f5g6h7i8j9k0",
        "name": "VIP Clients",
        "color": "bg-purple-500/10 text-purple-500 border-purple-500/20"
      }
    ],
    "createdAt": "2026-01-08T08:15:00.000Z"
  }
]
```

> Groups are populated with name and color.

### Update a Contact

**PUT** `/contacts/:id`

**Example Body**:
```json
{
  "tags": ["premium", "active", "loyal"],
  "organization": "Updated Client Ltd"
}
```

**Success**: Returns updated contact

### Delete a Contact

**DELETE** `/contacts/:id`

**Example**: `DELETE /contacts/65a0c3d4e5f6g7h8i9j0k1l2`

**Success**: 204 No Content  
**Error**: 400 if not found or not owned

---

## Multi-Tenancy & Security

- All operations are **automatically scoped** to your organization via JWT (`orgId` in payload).
- You **cannot** access or modify data from other organizations.
- Tested: Creating a second org → cannot see first org’s contacts/groups.

## Testing Tips (Postman / Thunder Client)

1. First: Login → copy token
2. Set global header: `Authorization: Bearer {{token}}`
3. Create group → copy `_id`
4. Create contact → use group `_id` in `groups` array
5. Verify list endpoints return populated groups
6. Try without token → get 401
