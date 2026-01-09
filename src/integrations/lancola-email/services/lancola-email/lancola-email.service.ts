import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailPayload } from './email.interface';

@Injectable()
export class LancolaEmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      const isHtml = !!(payload.message && /<[^>]+>/.test(payload.message));

      const mailOptions: any = {
        to: payload.to,
        subject: payload.subject,
        ...(isHtml
          ? { html: payload.message, text: payload.message.replace(/<[^>]+>/g, '') }
          : { text: payload.message }),
        ...(payload.templateId && { template: payload.templateId }),
        ...(payload.attachments && {
          attachments: payload.attachments.map((attachment) => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.content, 'base64'),
            contentType: attachment.contentType,
          })),
        }),
      };

      await this.mailerService.sendMail(mailOptions);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }
}