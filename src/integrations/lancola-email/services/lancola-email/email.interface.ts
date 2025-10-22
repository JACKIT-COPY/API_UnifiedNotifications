export interface EmailPayload {
  to: string | string[];
  subject: string;
  message: string;
  templateId?: string;
}