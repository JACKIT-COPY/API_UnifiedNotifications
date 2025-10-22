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
        // Add template support if templateId is provided
        ...(payload.templateId && { template: payload.templateId }),
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }
}