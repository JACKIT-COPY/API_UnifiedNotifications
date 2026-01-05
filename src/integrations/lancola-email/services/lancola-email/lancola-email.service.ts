import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailPayload } from './email.interface';

@Injectable()
export class LancolaEmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: payload.subject,
        text: payload.message,
        ...(payload.templateId && { template: payload.templateId }),
        ...(payload.attachments && {
          attachments: payload.attachments.map(attachment => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.content, 'base64'),
            contentType: attachment.contentType,
          })),
        }),
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }
}