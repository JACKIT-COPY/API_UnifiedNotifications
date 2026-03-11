# Payments and API Usage Guide

This guide explains how the credit/token system works, how to purchase credits, and how to authenticate API requests using API keys.

---

## 1. Credit & Token System

The Uniflow Notifications platform uses a credit-based system (referred to as **Tokens**) to manage messaging costs. Each organization has its own balance of tokens.

### Exchange Rate
The default exchange rate is:
**1 KES = 1 Token**

### Usage Rates (Deductions)
When a notification is sent, tokens are deducted from your organization's balance according to the following rates:

| Channel | Tokens per Message |
| :--- | :--- |
| **SMS** | 1.0 Token |
| **WhatsApp** | 1.0 Token |
| **Email** | 0.5 Token |

---

## 2. Purchasing Credits (Token Recharge)

Currently, the system supports credit purchases via **M-Pesa STK Push**.

### How it Works:
1. **Initiate Payment**: Through the Admin/Client dashboard, you trigger a payment request by providing your phone number and the amount in KES.
2. **STK Push**: A prompt appears on your phone (M-Pesa) asking you to enter your PIN to authorize the payment.
3. **Automatic Credit**: Once the payment is successful, the equivalent amount in tokens is automatically added to your organization's balance.

### Manual API Initiation (Experimental)
If you wish to initiate a payment via API:
**Endpoint**: `POST /transactions/initiate`
**Payload**:
```json
{
  "amount": 100,
  "phoneNumber": "254712345678",
  "organizationId": "your_org_id"
}
```

---

## 3. API Key Authentication

To interact with the Uniflow API programmatically, you must use an **API Key**.

### Generating an API Key
1. Log in to the Uniflow Dashboard.
2. Navigate to **Organization Settings** > **API Keys**.
3. Click **Generate New Key**.
4. **Copy the key immediately** as it will not be shown again for security reasons.

### Using the API Key in Requests
You can authenticate your requests in two ways:

#### A. HTTP Header (Recommended)
Add the `unified-api-key` or `X-API-Key` header to your request.
```http
unified-api-key: your_api_key_here
# OR
X-API-Key: your_api_key_here
```

#### B. Query Parameter
Append `apikey` to the request URL.
```
https://api.solby.io/notifications/send?apikey=your_api_key_here
```

---

## 4. Example Request

Below is an example of how to send an SMS notification using the API key.

### Endpoint
`POST /notifications/send`

### Example using cURL
```bash
curl -X POST https://api.solby.io/notifications/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "type": "sms",
    "to": "254712345678",
    "message": "Hello from Uniflow! Your token balance has been updated."
  }'
```

### Example using JavaScript (Fetch)
```javascript
const sendNotification = async () => {
  const response = await fetch('https://api.solby.io/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your_api_key_here'
    },
    body: JSON.stringify({
      type: 'email',
      to: 'client@example.com',
      subject: 'Monthly Invoice',
      message: 'Hello, please find your monthly invoice attached to your dashboard.'
    })
  });

  const data = await response.json();
  console.log(data);
};

sendNotification();
```

---

## 5. Checking Your Balance

You can check your remaining credits by calling the usage endpoint with your API key:

**Endpoint**: `GET /usage/me`

**Response Example**:
```json
{
  "organizationId": "...",
  "organizationName": "Acme Corp",
  "remainingCredits": 450.5,
  "usedTokens": 120.0,
  "totalMessagesCount": 150
}
```
