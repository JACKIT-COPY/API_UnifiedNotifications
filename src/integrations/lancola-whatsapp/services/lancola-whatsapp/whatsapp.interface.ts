// export interface WhatsAppPayload {
//   to: string;
//   message: string;
//   type?: 'text' | 'template'; // For future template support
//   templateId?: string; // Optional, for template-based messages
// }

export interface WhatsAppPayload {
  to: string;
  message?: string; // Optional, ignored for template-based messages
  type?: 'text' | 'template'; // Default to 'template' for now
  templateId?: string; // Default to 'hello_world' for now
}