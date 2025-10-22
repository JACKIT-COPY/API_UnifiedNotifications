import { Injectable, BadRequestException } from '@nestjs/common';
import { LancolaSmsService } from 'src/integrations/lancola-sms/services/lancola-sms/lancola-sms.service';
import { LancolaEmailService } from 'src/integrations/lancola-email/services/lancola-email/lancola-email.service';
import { UsersService } from 'src/modules/users/services/users/users.service';
import { NotificationPayload, NotificationType } from 'src/integrations/interfaces/notifications.interface';

interface User {
  phone: string;
  email: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly lancolaSmsService: LancolaSmsService,
    private readonly lancolaEmailService: LancolaEmailService,
    private readonly usersService: UsersService,
  ) {}

  async sendNotification(payload: NotificationPayload): Promise<void> {
    switch (payload.type) {
      case NotificationType.SMS:
        await this.lancolaSmsService.sendSMS({ phone: payload.to as string, message: payload.message });
        break;
      case NotificationType.EMAIL:
        if (!payload.subject) {
          throw new BadRequestException('Subject is required for email notifications');
        }
        await this.lancolaEmailService.sendEmail({
          to: payload.to,
          subject: payload.subject,
          message: payload.message,
          templateId: payload.templateId,
        });
        break;
      case NotificationType.WHATSAPP:
      case NotificationType.PUSH:
      case NotificationType.SYSTEM:
        throw new BadRequestException(`${payload.type} notifications not implemented yet`);
      default:
        throw new BadRequestException('Invalid notification type');
    }
  }

  async sendNotificationToUsers(payload: NotificationPayload): Promise<void> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    for (const recipient of recipients) {
      await this.sendNotification({ ...payload, to: recipient });
    }
  }

  async sendNotificationToAllUsers(payload: NotificationPayload): Promise<void> {
    const users = await this.usersService.getUsers();
    for (const user of users) {
      const recipient = payload.type === NotificationType.SMS ? user.phone : user.email;
      await this.sendNotification({ ...payload, to: recipient });
    }
  }
}