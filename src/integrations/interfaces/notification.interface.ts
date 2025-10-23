export enum NotificationType {
  SMS = 'sms',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  PUSH = 'push',
  SYSTEM = 'system',
}

export interface NotificationPayload {
  type: NotificationType;
  to: string | string[];
  message?: string; // Made optional to support WhatsApp templates
  subject?: string; // Optional, mainly for email
  templateId?: string; // Optional, for templated notifications
  data?: Record<string, any>; // Optional, for extra metadata (e.g., push notification data)
}