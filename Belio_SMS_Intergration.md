# Belio Bulk SMS Integration Guide

This document provides a comprehensive guide for integrating the **Belio Bulk SMS API** into the Unified Notifications system. It covers authentication, message dispatching, error handling, and security best practices.

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Prerequisites](#-prerequisites)
- [Base URLs](#-base-urls)
- [Authentication](#-authentication)
  - [Token Lifecycle Management](#token-lifecycle-management)
- [Sending SMS Messages](#-sending-sms-messages)
  - [1. Personalized Messages (SendToEach)](#1-personalized-messages-sendtoeach)
  - [2. Broadcast Messages (SendToMany)](#2-broadcast-messages-sendtomany)
- [API Specifications](#-api-specifications)
  - [Constraints & Limits](#constraints--limits)
  - [Error Handling](#error-handling)
- [Security Best Practices](#-security-best-practices)
- [Implementation Reference](#-implementation-reference)

---

## 🌍 Overview
Belio provides a robust REST API for high-throughput transactional and broadcast messaging. The API is secured using **OAuth2 Client Credentials Flow**, ensuring that all communication between our backend and Belio is authorized and encrypted.

## ⚙️ Prerequisites
Before starting the integration, ensure you have gathered the following credentials from the [Belio Dashboard](https://account.belio.co.ke):
- **Client ID**: Your unique API identifier.
- **Client Secret**: Your API secret key (keep this secure).
- **Service ID**: The identifier for your specific SMS service.

> [!CAUTION]
> **Security Warning:** Never expose these credentials in frontend code or client-side applications. They must be managed strictly server-side.

---

## 🔗 Base URLs
| Environment | Authentication Server | API Server |
| :--- | :--- | :--- |
| **Production** | `https://account.belio.co.ke` | `https://api.belio.co.ke` |

---

## 🔐 Authentication
Belio uses the **OAuth2 Client Credentials Flow** to issue Bearer tokens. These tokens are short-lived and must be included in the header of every API request.

### Token Endpoint
**POST** `https://account.belio.co.ke/realms/api/protocol/openid-connect/token`

**Headers:**
`Content-Type: application/x-www-form-urlencoded`

**Request Body:**
| Field | Description | Required |
| :--- | :--- | :--- |
| `client_id` | Your Belio API Client ID | Yes |
| `client_secret` | Your Belio API Client Secret | Yes |
| `grant_type` | Must be set to `client_credentials` | Yes |

### Successful Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "profile email"
}
```

### Token Lifecycle Management
*   **Expiration:** Tokens typically expire in **1 hour** (3600 seconds).
*   **Refresh:** Belio does **not** issue refresh tokens. A new access token must be requested once the current one expires.
*   **Strategy:** 
    *   Cache the token in memory or a fast-access store (like Redis).
    *   Store the calculated expiration timestamp.
    *   Initialize a renewal request **2-5 minutes** before the token expires.

---

## 📨 Sending SMS Messages
All messaging requests must include the Bearer token in the `Authorization` header:
`Authorization: Bearer <your_access_token>`

**Endpoint:**
**POST** `https://api.belio.co.ke/message/{serviceId}`

### 1. Personalized Messages (SendToEach)
Use this type when sending unique content to different recipients.
```json
{
  "type": "SendToEach",
  "messages": [
    {
      "text": "Hello John, your OTP is 123456",
      "phone": "254712345678"
    },
    {
      "text": "Hello Mary, your OTP is 654321",
      "phone": "254798765432"
    }
  ]
}
```

### 2. Broadcast Messages (SendToMany)
Use this type when sending the exact same message to multiple recipients.
```json
{
  "type": "SendToMany",
  "messages": [
    {
      "text": "System maintenance tonight at 10:00 PM.",
      "phone": [
        "254712345678",
        "254798765432",
        "254700000000"
      ]
    }
  ]
}
```

---

## 📊 API Specifications

### Constraints & Limits
| Constraint | Limit |
| :--- | :--- |
| **Max Recipients per Request** | 100 recipients |
| **Max Message Length** | 960 characters |
| **Throughput** | ~400 messages/sec per service |

### Error Handling
| Status | Meaning | Recommended Action |
| :--- | :--- | :--- |
| `400` | Invalid Request | Check payload structure and JSON formatting. |
| `401` | Unauthorized | Token is missing, invalid, or expired. Re-authenticate. |
| `403` | Forbidden | Verify your `serviceId` and IP allowlisting. |
| `404` | Not Found | Check if the endpoint URL or `serviceId` is correct. |
| `429` | Rate Limit Exceeded | Implement exponential backoff or throttle requests. |
| `500+`| Belio Server Error | Log the error and retry after a delay. |

---

## 🛡️ Security Best Practices
- **Environment Variables:** Store all secrets in `.env` files (e.g., `BELIO_CLIENT_ID`, `BELIO_CLIENT_SECRET`).
- **Token Masking:** Never log the full Bearer token in application logs.
- **Fail-Safe Mechanism:** Implement a fallback SMS provider if Belio becomes intermittently unavailable.
- **Payload Validation:** Validate phone numbers and message lengths before dispatching to the API to minimize failed requests.

---

## 💻 Implementation Reference (Node.js/Axios)
```javascript
async function sendSms(payload) {
    const token = await getCachedToken(); // Implement caching logic
    
    try {
        const response = await axios.post(
            `https://api.belio.co.ke/message/${process.env.BELIO_SERVICE_ID}`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Belio SMS Error:', error.response?.data || error.message);
        throw error;
    }
}
```

---

## 📖 References
- [Official Belio Documentation](https://docs.belio.co.ke/overview)
- [OAuth2 Client Credentials Flow RFC](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4)

---
*Maintained by Lancola Tech*
