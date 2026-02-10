# Unified Notifications Platform

## Overview
This is a NestJS-based unified notifications platform that provides a single API endpoint for sending notifications across multiple channels: SMS (via Lancola SMS), Email (with attachment support), and WhatsApp (via Meta Cloud API, using templates). The goal is to centralize notification handling, making it scalable and maintainable.

Key features:
- **Single Endpoint**: Send notifications to one or multiple recipients with a unified payload.
- **Channels Supported**:
  - SMS: Text messages with phone number formatting.
  - Email: Supports subject, message, templates, and file attachments (base64-encoded).
  - WhatsApp: Template-based messaging (e.g., "hello_world" for testing; custom templates can be added).
- **User Management**: Simple hardcoded users (phone/email); extendable to a database.
- **Validation & Error Handling**: Input validation with `class-validator`, detailed success/failure responses.
- **Configuration**: Managed via `.env` for API keys and secrets.
- **Logging**: Built-in NestJS logging for debugging.

This project is built with NestJS, using modules for modularity and dependency injection.

## Prerequisites
- Node.js (v18+)
- npm or yarn
- A `.env` file with configurations (see Configuration section below)
- For testing:
  - Lancola SMS account for SMS
  - Gmail/SMTP credentials for email
  - Meta WhatsApp Business App for WhatsApp (with test number and access token)

## Installation
1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd unified-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory (see Configuration section).

4. Run the application:
   - Development mode: `npm run start:dev`
   - Production mode: `npm run start:prod`

The server runs on `http://localhost:3040` by default.

## Authentication (API Keys)
For external developers and server-to-server integrations, we support **API Key** authentication. 

You can manage your API keys from the **Developers > API Keys** section of the dashboard. Once you have a key, you can use it to access endpoints securely without requiring a browser session.

For detailed documentation and examples, see the [**API Guide**](./API_GUIDE.md).


## Configuration (.env)
Copy the following template to `.env` and fill in your credentials:

```
# SMS Configuration
LANCOLA_SMS_APIURL=https://sms.lancolatech.com/api/services/sendsms/?apikey=
LANCOLA_SMS_apiKey=your-lancola-api-key
LANCOLA_SMS_partnerID=your-partner-id
LANCOLA_SMS_shortCode=your-shortcode

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_API_VERSION=v22.0
```

- **SMS**: Obtain from Lancola dashboard.
- **Email**: Use Gmail App Password for secure auth.
- **WhatsApp**: From Meta for Developers (test setup provided in code).

## File Structure
```
unified-api/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── integrations/
│   │   ├── lancola-sms/
│   │   │   ├── lancola-sms.module.ts
│   │   │   ├── lancola-sms.config.ts
│   │   │   └── services/lancola-sms/
│   │   │       ├── lancola-sms.service.ts
│   │   │       ├── lancola-sms.functions.ts
│   │   │       ├── sms.interface.ts
│   │   ├── lancola-email/
│   │   │   ├── lancola-email.module.ts
│   │   │   └── services/lancola-email/
│   │   │       ├── lancola-email.service.ts
│   │   │       ├── email.interface.ts
│   │   ├── lancola-whatsapp/
│   │   │   ├── lancola-whatsapp.module.ts
│   │   │   ├── lancola-whatsapp.config.ts
│   │   │   └── services/lancola-whatsapp/
│   │   │       ├── lancola-whatsapp.service.ts
│   │   │       ├── whatsapp.interface.ts
│   │   └── interfaces/
│   │       └── notification.interface.ts
│   ├── modules/
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── controllers/notifications/
│   │   │   │   └── notifications.controller.ts
│   │   │   └── services/notifications/
│   │   │       └── notifications.service.ts
│   │   └── users/
│   │       ├── users.module.ts
│   │       ├── controllers/users/
│   │       │   └── users.controller.ts
│   │       └── services/users/
│   │           └── users.service.ts
│   └── integrations/http.ts  # Shared HTTP utility
└── .env  # Configuration
```

## API Endpoints
All endpoints are under `/notifications`. Use POST requests with JSON payloads.

### 1. Send Notification to Specific Recipient(s)
- **Endpoint**: `POST /notifications/send`
- **Description**: Send a notification to one or more recipients. Supports SMS, Email, WhatsApp.
- **Payload** (JSON body):
  ```json
  {
    "type": "sms|email|whatsapp",  // Required
    "to": "recipient|["recipient1", "recipient2"]",  // Required (phone/email/user ID)
    "message": "Your message",  // Required for SMS/Email, optional for WhatsApp
    "subject": "Email subject",  // Required for Email
    "attachments": [  // Optional for Email: array of attachments
      {
        "filename": "file.pdf",
        "content": "base64-encoded-string",
        "contentType": "application/pdf"
      }
    ]
  }
  ```
- **Response** (200 OK):
  - Single recipient: `{ "recipient": "user@example.com", "status": "success" }`
  - Multiple: Array of results, e.g., `[{ "recipient": "...", "status": "success" }, ...]`
  - Error (400/500): `{ "message": "Error details" }`

- **Examples**:
  - SMS: `{"type": "sms", "to": "254759154322", "message": "Test SMS"}`
  - Email with Attachment: `{"type": "email", "to": "user@example.com", "subject": "Test", "message": "Body", "attachments": [{"filename": "doc.pdf", "content": "base64...", "contentType": "application/pdf"}]}`
  - WhatsApp: `{"type": "whatsapp", "to": "254759154322"}` (uses "hello_world" template)

### 2. Send Notification to All Users
- **Endpoint**: `POST /notifications/send-to-all`
- **Description**: Broadcast to all users from `UsersService` (hardcoded phones/emails; extend to DB).
- **Payload**: Same as above, but omit `to` (uses all users automatically).
- **Response**: Array of `NotificationResult` (success/failure per user).
- **Examples**:
  - SMS: `{"type": "sms", "message": "Broadcast SMS"}`
  - Email: `{"type": "email", "subject": "Broadcast", "message": "Body", "attachments": [...]}`

### 3. Get Users (For Testing)
- **Endpoint**: `GET /users`
- **Description**: Returns hardcoded users (phones/emails).
- **Response**: `[{"phone": "0759154322", "email": "user1@example.com"}, ...]`

## Usage Notes
- **Base64 for Attachments**: Encode files to base64 (e.g., via `base64 file.pdf > file.base64`).
- **WhatsApp Limits**: Uses templates; custom messages require user reply (24hr window).
- **Error Handling**: Logs errors; returns detailed results for bulk sends.
- **Extensibility**: Add push/system notifications by mirroring integration modules.

## Running Tests
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Manual: Use Postman/cURL with examples above.

## Contributing
Fork the repo, create a branch, and submit a PR. Ensure tests pass.

## License
MIT License. See LICENSE file for details.