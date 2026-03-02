# Uniflow Notifications API Guide

This robust API guide details the endpoints, authentication, and usage examples for the Uniflow Notifications API.

## Base Configuration

Store your API credentials securely, preferably in a `.env` file:

```bash
Uniflow_API_URL=https://smsapi.solby.io:8443
Uniflow_API_KEY=your_generated_api_key
```

## Authentication

All requests must be authenticated.

### 1. HTTP Header (Recommended)
Pass your API User Key in the header:
```http
UNIFIED-API-Key: your_api_key_here
```

### 2. Query Parameter
Append `apikey` to the URL:
```
?apikey=your_api_key_here
```

---

## 1. Notifications

Send immediate or scheduled notifications via supported channels.

**Endpoint**: `POST /notifications/send`

### Global Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | Yes | `"sms"`, `"email"`, `"whatsapp"`, `"push"`, `"system"` |
| `to` | String/Array | Yes | Recipient identifier (Phone for SMS/WhatsApp, Email address for Email). Can be a single string or array of strings. |
| `scheduledAt` | DateString | No | ISO 8601 date (e.g., `2023-12-25T08:00:00Z`) for scheduled sending. |

### Channel Specifics

#### A. SMS
Required fields: `message`.

```json
{
  "type": "sms",
  "to": "254712345678",
  "message": "Your verification code is 4829."
}
```

#### B. Email
Required fields: `subject`, `message` (or `templateId`).
Optional: `attachments`.

```json
{
  "type": "email",
  "to": "user@example.com",
  "subject": "Invoice #1023",
  "message": "Please find your invoice attached.",
  "attachments": [
    {
      "filename": "invoice.pdf",
      "content": "JVBERi0xLjQK...", // Base64 encoded string
      "contentType": "application/pdf"
    }
  ]
}
```

#### C. WhatsApp
Commonly uses Templates.
Required fields: `templateId`, `data`.
Alternatively (if session active): `message`.

```json
{
  "type": "whatsapp",
  "to": "254712345678",
  "templateId": "welcome_msg",
  "data": {
    "name": "Jane",
    "company": "Acme Corp"
  }
}
```

---

## 2. Contacts

Manage your organization's contacts.

**Endpoint Base**: `/contacts`

### Create Contact
`POST /contacts`

```json
{
  "name": "John Doe",             // Required
  "email": "john@doe.com",        // Optional
  "phone": "254722000000",        // Optional
  "organization": "Partner Ltd",  // Optional (Company Name)
  "tags": ["vendor", "urgent"]    // Optional
}
```

### List Contacts
`GET /contacts`

### Update Contact
`PUT /contacts/:id`

### Delete Contact
`DELETE /contacts/:id`

---

## 3. Groups

Organize contacts into groups for bulk messaging.

**Endpoint Base**: `/groups`

### Create Group
`POST /groups`

```json
{
  "name": "Developers",           // Required
  "description": "Tech team updates",
  "color": "#00FF00"              // Optional (UI Color)
}
```

### List Groups
`GET /groups`

### Delete Group
`DELETE /groups/:id`

---

## 4. Templates

Manage reusable message content.

**Endpoint Base**: `/templates`

### Understanding Template Variables
Templates allow you to define dynamic placeholders using double curly braces (e.g., `{{name}}`). When you send a notification using the template, you provide values for these variables.

**1. Create a Template with Variables**
Define the variables in the `variables` list and use them in `content`.
`POST /templates`
```json
{
  "name": "Order Shipped",
  "category": "updates",
  "channel": "sms",
  "content": "Hi {{name}}, your order #{{orderId}} has been shipped via {{carrier}}.",
  "variables": ["name", "orderId", "carrier"]
}
```

**2. Use the Template (Send Notification)**
Pass a `data` object with keys matching the variables.
`POST /notifications/send`
```json
{
  "type": "sms",
  "to": "254712345678",
  "templateId": "TEMPLATE_ID_HERE",
  "data": {
    "name": "Alice",
    "orderId": "998877",
    "carrier": "DHL"
  }
}
```
*Resulting Message: "Hi Alice, your order #998877 has been shipped via DHL."*

### List Templates
`GET /templates`

### Update Template
`PUT /templates/:id`

### Delete Template
`DELETE /templates/:id`

---

## 5. Message Logs

Retrieve delivery history and status.

**Endpoint**: `GET /message-logs`

**Query Parameters**:
| Parameter | Description | Example |
| :--- | :--- | :--- |
| `channel` | Filter by channel type. | `sms`, `email` |
| `status` | Filter by delivery status. | `sent`, `delivered`, `failed` |
| `dateFrom` | Start date (ISO ISO 8601). | `2024-01-01` |
| `dateTo` | End date (ISO 8601). | `2024-01-31` |

### Examples

#### A. Retrieve All Logs
Get a comprehensive list of all message logs for your organization.
```http
GET /message-logs
```

#### B. Filter by Channel
Retrieve only SMS messages.
```http
GET /message-logs?channel=sms
```

#### C. Filter by Status
Retrieve only messages that failed to send.
```http
GET /message-logs?status=failed
```

#### D. Filter by Date Range
Retrieve messages sent within a specific timeframe (e.g., January 2026).
```http
GET /message-logs?dateFrom=2026-01-01&dateTo=2026-01-31
```

#### E. Combined Filters (Robus Query)
Retrieve all *failed SMS* messages sent *today*.
```http
GET /message-logs?channel=sms&status=failed&dateFrom=2026-02-17
```

**Node.js Example (Axios) with Filters**:
```javascript
const axios = require('axios');

async function getFailedSmsLogs() {
  try {
    const response = await axios.get(`${process.env.Uniflow_API_URL}/message-logs`, {
      params: {
        channel: 'sms',
        status: 'failed',
        dateFrom: '2026-02-01'
      },
      headers: { 'UNIFIED-API-Key': process.env.Uniflow_API_KEY }
    });
    console.log('Logs:', response.data);
  } catch (error) {
    console.error('Error fetching logs:', error.message);
  }
}
```

---

## Response Structure

**Success (201 Created / 200 OK)**:
```json
{
  "recipient": "2547...",
  "status": "success"
}
```

**Error**:
```json
{
  "statusCode": 400,
  "message": "Validation failed: 'to' must be a string",
  "error": "Bad Request"
}
```
