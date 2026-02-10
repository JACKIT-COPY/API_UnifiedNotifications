# Unified Notifications API Guide

This guide provides instructions and examples on how to use the Unified Notifications API using an **API Key**. 

## Recommended Setup

To keep your credentials secure, it is recommended to store your API details in a `.env` file within your project:

```bash
Unified_API_URL=http://localhost:3040
Unified_API_KEY=your_generated_api_key
```

---

## Authentication

All requests to the Unified Notifications API must be authenticated. You can provide your API key in one of two ways:

### 1. HTTP Header (Recommended)
Add the `UNIFIED-API-Key` header to your requests.
```bash
UNIFIED-API-Key: your_api_key_here
```

### 2. Query Parameter
Append `apikey` to your request URL.
```
http://localhost:3040/notifications/send?apikey=your_api_key_here
```

---

## Base URL
Default local development URL: `http://localhost:3040`

---

## 1. Notifications

### Send a Notification
**Endpoint**: `POST /notifications/send`

**Node.js Example (Axios)**:
```javascript
const axios = require('axios');
require('dotenv').config();

async function sendNotification() {
  try {
    const response = await axios.post(`${process.env.Unified_API_URL}/notifications/send`, {
      type: 'sms',
      to: '254712345678',
      message: 'Hello! This is an automated notification.'
    }, {
      headers: { 'UNIFIED-API-Key': process.env.Unified_API_KEY }
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}
```

**Success Response**:
```json
{
  "recipient": "254712345678",
  "status": "success"
}
```

---

## 2. Contacts

### Create a Contact
**Endpoint**: `POST /contacts`

**Node.js Example (Axios)**:
```javascript
const axios = require('axios');

async function createContact() {
  const payload = {
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "254700000000",
    organization: "Acme Corp",
    tags: ["vip", "early-adopter"]
  };

  const response = await axios.post(`${process.env.Unified_API_URL}/contacts`, payload, {
    headers: { 'UNIFIED-API-Key': process.env.Unified_API_KEY }
  });

  return response.data;
}
```

---

## 3. Groups

### Create a Group
**Endpoint**: `POST /groups`

**Node.js Example**:
```javascript
const response = await axios.post(`${process.env.Unified_API_URL}/groups`, {
  name: "Marketing List",
  description: "Subscribers for weekly newsletter",
  color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
}, {
  headers: { 'UNIFIED-API-Key': process.env.Unified_API_KEY }
});
```

---

## 4. Templates

### List Templates
**Endpoint**: `GET /templates`

**Node.js Example**:
```javascript
const response = await axios.get(`${process.env.Unified_API_URL}/templates`, {
  headers: { 'UNIFIED-API-Key': process.env.Unified_API_KEY }
});
```

---

## Error Handling

| Code | Meaning | Description |
| :--- | :--- | :--- |
| `400` | Bad Request | Missing required fields or invalid data. |
| `401` | Unauthorized | Missing or invalid API Key. |
| `403` | Forbidden | Insufficient permissions for the given key. |
| `429` | Rate Limited | Too many requests in a short period. |

**Example Error Response**:
```json
{
  "statusCode": 401,
  "message": "Invalid or expired API key",
  "error": "Unauthorized"
}
```