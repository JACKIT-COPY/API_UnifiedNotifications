// src/integrations/lancola-email/services/lancola-email/lancola-email.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';
import { EmailPayload } from './email.interface';

@Injectable()
export class LancolaEmailService {
  private readonly logger = new Logger(LancolaEmailService.name);

  constructor(private readonly organizationsService: OrganizationsService) {}

  async sendEmail(payload: EmailPayload, orgId: string): Promise<void> {
    this.logger.log(
      `[EMAIL START] Attempting to send email to ${payload.to} for org ${orgId}`,
    );

    const org = await this.organizationsService.getById(orgId);
    const creds = org.credentials || {};

    const host =
      creds.email_host || process.env.MAIL_HOST || process.env.EMAIL_HOST || '';
    const port = Number(
      creds.email_port ||
        process.env.MAIL_PORT ||
        process.env.EMAIL_PORT ||
        '587',
    );
    const user =
      creds.email_user || process.env.MAIL_USER || process.env.EMAIL_USER || '';
    const pass =
      creds.email_pass ||
      process.env.MAIL_PASSWORD ||
      process.env.EMAIL_PASS ||
      '';
    const fromEmail =
      creds.email_from ||
      process.env.MAIL_FROM ||
      process.env.EMAIL_USER ||
      user; // fallback

    this.logger.debug(
      `[EMAIL CONFIG] Host: ${host}, Port: ${port}, User: ${user}, From: ${fromEmail}`,
    );
    this.logger.debug(
      `[EMAIL CONFIG] Using org credentials: ${Object.keys(creds).length > 0 ? 'Yes' : 'No (using env vars)'}`,
    );

    if (!host || !user || !pass) {
      this.logger.error(
        `[EMAIL ERROR] Missing credentials - Host: ${!!host}, User: ${!!user}, Pass: ${!!pass}`,
      );
      throw new InternalServerErrorException(
        'Missing required email credentials',
      );
    }

    const isSecure = port === 465;
    this.logger.debug(
      `[EMAIL TRANSPORT] Creating transporter with secure=${isSecure}`,
    );

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure, // implicit SSL only on 465
      auth: { user, pass },
      tls: { rejectUnauthorized: false }, // common for self-signed cPanel certs
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      logger: false, // enable nodemailer debug logs
      debug: false, // enable SMTP protocol debug
    });

    this.logger.log(`[EMAIL TRANSPORT] Transporter created successfully`);

    const isHtml = payload.message && /<[^>]+>/.test(payload.message);

    // ── Dynamic From Name ──
    const fromName = org.emailFromName || org.name || 'NotifyHub'; // Org name or fallback
    const fromField = `"${fromName}" <${fromEmail}>`;

    const mailOptions: any = {
      from: fromField, // ← This line makes it dynamic
      to: payload.to,
      subject: payload.subject,
      ...(isHtml
        ? {
            html: payload.message,
            text: payload.message.replace(/<[^>]+>/g, ''),
          }
        : { text: payload.message }),
      ...(payload.attachments && {
        attachments: payload.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType,
        })),
      }),
    };

    this.logger.debug(
      `[EMAIL OPTIONS] From: ${fromField}, To: ${payload.to}, Subject: ${payload.subject}`,
    );
    this.logger.debug(
      `[EMAIL OPTIONS] Attachments: ${payload.attachments?.length || 0}, IsHTML: ${isHtml}`,
    );

    try {
      this.logger.log(
        `[EMAIL SEND] Attempting to send email via ${host}:${port}`,
      );
      const startTime = Date.now();

      // Verify transporter connectivity first
      this.logger.debug(`[EMAIL VERIFY] Verifying SMTP connection...`);
      try {
        await transporter.verify();
        this.logger.log(`[EMAIL VERIFY] SMTP connection verified successfully`);
      } catch (verifyError) {
        this.logger.error(`[EMAIL VERIFY FAILED] ${verifyError.message}`);
        this.logger.error(`[EMAIL VERIFY ERROR STACK] ${verifyError.stack}`);
        throw new InternalServerErrorException(
          `SMTP verification failed: ${verifyError.message}`,
        );
      }

      const result = await transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;

      this.logger.log(
        `[EMAIL SUCCESS] Email sent successfully in ${duration}ms. MessageId: ${result.messageId}`,
      );
      this.logger.debug(`[EMAIL RESULT] ${JSON.stringify(result)}`);
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      };

      this.logger.error(`[EMAIL ERROR] Failed to send email: ${error.message}`);
      this.logger.error(
        `[EMAIL ERROR DETAILS] ${JSON.stringify(errorDetails)}`,
      );
      this.logger.error(`[EMAIL ERROR STACK] ${error.stack}`);

      throw new InternalServerErrorException(
        `Failed to send email: ${error.message}`,
      );
    }
  }
}
