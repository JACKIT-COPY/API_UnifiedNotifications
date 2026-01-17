// src/integrations/lancola-email/services/lancola-email/lancola-email.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';
import { EmailPayload } from './email.interface';

@Injectable()
export class LancolaEmailService {
  constructor(private readonly organizationsService: OrganizationsService) {}

  async sendEmail(payload: EmailPayload, orgId: string): Promise<void> {
    const org = await this.organizationsService.getById(orgId);
    const creds = org.credentials || {};

    const host = creds.email_host || process.env.EMAIL_HOST || '';
    const port = Number(creds.email_port || process.env.EMAIL_PORT || '587');
    const user = creds.email_user || process.env.EMAIL_USER || '';
    const pass = creds.email_pass || process.env.EMAIL_PASS || '';
    const fromEmail = creds.email_from || process.env.EMAIL_USER || user; // fallback

    if (!host || !user || !pass) {
      throw new InternalServerErrorException('Missing required email credentials');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // implicit SSL only on 465
      auth: { user, pass },
      tls: { rejectUnauthorized: false }, // common for self-signed cPanel certs
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    const isHtml = payload.message && /<[^>]+>/.test(payload.message);

    // ── Dynamic From Name ──
    const fromName = org.emailFromName || org.name || 'NotifyHub'; // Org name or fallback
    const fromField = `"${fromName}" <${fromEmail}>`;

    const mailOptions: any = {
      from: fromField,  // ← This line makes it dynamic
      to: payload.to,
      subject: payload.subject,
      ...(isHtml
        ? { html: payload.message, text: payload.message.replace(/<[^>]+>/g, '') }
        : { text: payload.message }),
      ...(payload.attachments && {
        attachments: payload.attachments.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType,
        })),
      }),
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }
}