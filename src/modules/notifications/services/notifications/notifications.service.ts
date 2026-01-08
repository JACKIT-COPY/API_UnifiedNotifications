import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { LancolaSmsService } from 'src/integrations/lancola-sms/services/lancola-sms/lancola-sms.service';
import { LancolaEmailService } from 'src/integrations/lancola-email/services/lancola-email/lancola-email.service';
import { LancolaWhatsAppService } from 'src/integrations/lancola-whatsapp/services/lancola-whatsapp/lancola-whatsapp.service';
import { UsersService } from 'src/modules/users/services/users/users.service';
import { NotificationPayload, NotificationType } from 'src/integrations/interfaces/notification.interface';
import { User } from 'src/schemas/user.schema';
import { ContactsService } from 'src/modules/contacts/services/contacts/contacts.service';
import { Contact } from 'src/schemas/contact.schema';

interface NotificationResult {
  recipient: string;
  status: 'success' | 'failed';
  error?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  ContactsService: any;

  constructor(
    private readonly lancolaSmsService: LancolaSmsService,
    private readonly lancolaEmailService: LancolaEmailService,
    private readonly lancolaWhatsAppService: LancolaWhatsAppService,
    private readonly usersService: UsersService,
  ) {}

  async sendNotification(payload: NotificationPayload, orgId: string): Promise<void> {
    this.logger.log(`Sending ${payload.type} notification to ${payload.to} (org: ${orgId})`);
    try {
      switch (payload.type) {
        case NotificationType.SMS:
          if (!payload.message) {
            throw new BadRequestException('Message is required for SMS notifications');
          }
          await this.lancolaSmsService.sendSMS({ phone: payload.to as string, message: payload.message });
          break;
        case NotificationType.EMAIL:
          if (!payload.subject) {
            throw new BadRequestException('Subject is required for email notifications');
          }
          if (!payload.message) {
            throw new BadRequestException('Message is required for email notifications');
          }
          await this.lancolaEmailService.sendEmail({
            to: payload.to,
            subject: payload.subject,
            message: payload.message,
            templateId: payload.templateId,
            attachments: payload.attachments,
          });
          break;
        case NotificationType.WHATSAPP:
          await this.lancolaWhatsAppService.sendWhatsApp({ to: payload.to as string });
          break;
        default:
          throw new BadRequestException('Invalid or unsupported notification type');
      }
      this.logger.log(`Successfully sent ${payload.type} to ${payload.to}`);
    } catch (error) {
      this.logger.error(`Failed to send ${payload.type}: ${error.message}`);
      throw error;
    }
  }

  async sendNotificationToUsers(payload: NotificationPayload, orgId: string): Promise<NotificationResult[]> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const results: NotificationResult[] = [];

    for (const recipient of recipients) {
      try {
        await this.sendNotification({ ...payload, to: recipient }, orgId);
        results.push({ recipient, status: 'success' });
      } catch (error) {
        results.push({ recipient, status: 'failed', error: error.message });
      }
    }
    return results;
  }

  // Update sendNotificationToAllUsers
async sendNotificationToAllUsers(payload: NotificationPayload, orgId: string): Promise<NotificationResult[]> {
  const contacts: Contact[] = await this.ContactsService.getContacts(orgId);
  const results: NotificationResult[] = [];

  for (const contact of contacts) {
    const recipient =
      payload.type === NotificationType.SMS || payload.type === NotificationType.WHATSAPP
        ? contact.phone
        : contact.email;

    if (!recipient) continue;

    try {
      await this.sendNotification({ ...payload, to: recipient }, orgId);
      results.push({ recipient, status: 'success' });
    } catch (error) {
      results.push({ recipient, status: 'failed', error: error.message });
    }
  }
  return results;
}
}