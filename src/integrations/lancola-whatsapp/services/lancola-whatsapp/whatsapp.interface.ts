export interface WhatsAppPayload {
  to: string;
  message: string;
  type?: 'text' | 'template'; // For future template support
  templateId?: string; // Optional, for template-based messages
}