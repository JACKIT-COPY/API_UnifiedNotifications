export interface EmailPayload {
  to: string | string[];
  subject: string;
  message: string;
  templateId?: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64-encoded content
    contentType?: string; // Optional MIME type, e.g., 'application/pdf'
  }>;
}