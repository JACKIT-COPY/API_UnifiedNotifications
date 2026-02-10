// src/modules/notifications/services/notifications/notifications.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { LancolaSmsService } from 'src/integrations/lancola-sms/services/lancola-sms/lancola-sms.service';
import { LancolaEmailService } from 'src/integrations/lancola-email/services/lancola-email/lancola-email.service';
import { LancolaWhatsAppService } from 'src/integrations/lancola-whatsapp/services/lancola-whatsapp/lancola-whatsapp.service';
import { UsersService } from 'src/modules/users/services/users/users.service';
import {
  NotificationPayload,
  NotificationType,
} from 'src/integrations/interfaces/notification.interface';
import { ContactsService } from 'src/modules/contacts/services/contacts/contacts.service';
import { Contact } from 'src/schemas/contact.schema';
import { MessageLogsService } from 'src/modules/messages-logs/services/message-logs/message-logs.service';

interface NotificationResult {
  recipient: string;
  status: 'success' | 'failed';
  error?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly lancolaSmsService: LancolaSmsService,
    private readonly lancolaEmailService: LancolaEmailService,
    private readonly lancolaWhatsAppService: LancolaWhatsAppService,
    private readonly usersService: UsersService,
    private readonly contactsService: ContactsService,
    private readonly messageLogsService: MessageLogsService,
  ) { }

  async sendNotification(
    payload: NotificationPayload,
    orgId: string,
    userId: string,
    logId?: string,
  ): Promise<void> {
    const recipient = Array.isArray(payload.to) ? payload.to[0] : payload.to;

    // Map channel to provider name for logging
    const networkForChannel = (type: NotificationType) => {
      switch (type) {
        case NotificationType.SMS:
          return 'Lancola SMS';
        case NotificationType.EMAIL:
          return 'Lancola Email';
        case NotificationType.WHATSAPP:
          return 'Lancola WhatsApp';
        default:
          return 'Unknown Provider';
      }
    };

    // If scheduled for later, just log it as scheduled
    if (payload.scheduledAt) {
      const scheduledDate = new Date(payload.scheduledAt);
      const now = new Date();

      if (scheduledDate <= now) {
        throw new BadRequestException('Scheduled time must be in the future');
      }

      this.logger.log(
        `Scheduling ${payload.type} notification to ${payload.to} at ${payload.scheduledAt} (org: ${orgId}, user: ${userId})`,
      );
      await this.messageLogsService.logMessage(
        payload.type,
        userId,
        orgId,
        networkForChannel(payload.type),
        [{ recipient, status: 'pending' }],
        payload.message?.substring(0, 100) || '',
        payload.message?.length || 0,
        0, // No cost yet
        payload.attachments?.map((a) => ({ filename: a.filename, contentType: a.contentType || 'application/octet-stream' })),
        undefined, // campaignId
        payload.scheduledAt,
        'scheduled',
        payload.message,
        payload.subject,
      );
      return;
    }

    this.logger.log(
      `Sending ${payload.type} notification to ${payload.to} (org: ${orgId}, user: ${userId})`,
    );

    let providerResponse: any = undefined;

    try {
      switch (payload.type) {
        case NotificationType.SMS:
          if (!payload.message) {
            throw new BadRequestException('Message is required for SMS notifications');
          }
          providerResponse = await this.lancolaSmsService.sendSMS(
            {
              phone: payload.to as string,
              message: payload.message,
            },
            orgId,
          );
          break;

        case NotificationType.EMAIL:
          if (!payload.subject) {
            throw new BadRequestException('Subject is required for email notifications');
          }
          if (!payload.message) {
            throw new BadRequestException('Message is required for email notifications');
          }
          providerResponse = await this.lancolaEmailService.sendEmail(
            {
              to: payload.to,
              subject: payload.subject,
              message: payload.message,
              templateId: payload.templateId,
              attachments: payload.attachments,
            },
            orgId,
          );
          break;

        case NotificationType.WHATSAPP:
          providerResponse = await this.lancolaWhatsAppService.sendWhatsApp(
            {
              to: payload.to as string,
            },
            orgId,
          );
          break;

        default:
          throw new BadRequestException('Invalid or unsupported notification type');
      }

      // Log success (only if not a scheduled retry, to avoid duplicates)
      if (!logId) {
        await this.messageLogsService.logMessage(
          payload.type,
          userId,
          orgId,
          networkForChannel(payload.type),
          [
            {
              recipient,
              status: 'success',
              response: providerResponse ? JSON.stringify(providerResponse) : undefined,
            },
          ],
          payload.message?.substring(0, 100) || '',
          payload.message?.length || 0,
          1, // cost
          payload.attachments?.map((a) => ({ filename: a.filename, contentType: a.contentType || 'application/octet-stream' })),
          undefined, // campaignId
          undefined, // scheduledAt
          'sent',
          payload.message,
          payload.subject,
        );
      }

      this.logger.log(`Successfully sent ${payload.type} to ${recipient}`);
    } catch (error) {
      // Log failure
      if (!logId) {
        try {
          await this.messageLogsService.logMessage(
            payload.type,
            userId,
            orgId,
            networkForChannel(payload.type),
            [
              {
                recipient,
                status: 'failed',
                error: error?.message || String(error),
              },
            ],
            payload.message?.substring(0, 100) || '',
            payload.message?.length || 0,
            0, // no cost on failure
            payload.attachments?.map((a) => ({ filename: a.filename, contentType: a.contentType || 'application/octet-stream' })),
            undefined, // campaignId
            undefined, // scheduledAt
            'failed',
            payload.message,
            payload.subject,
          );
        } catch (logError) {
          this.logger.error(`Failed to log failure: ${logError?.message || logError}`);
        }
      }

      if (logId) {
        await this.messageLogsService.updateLogStatus(logId, 'failed');
      }
      this.logger.error(`Failed to send ${payload.type} to ${recipient}: ${error.message}`);
      throw error;
    }
  }

  async sendNow(logId: string, orgId: string, userId: string): Promise<void> {
    const log = await this.messageLogsService.findLogById(logId);
    if (!log) {
      throw new BadRequestException('Log not found');
    }
    if (log.status !== 'scheduled') {
      throw new BadRequestException('Message is not scheduled');
    }

    // Prepare payload from log
    const payload: NotificationPayload = {
      type: log.channel as any,
      to: log.recipients.map((r) => r.recipient),
      message: log.fullMessage || log.messagePreview,
    };

    // For now, let's assume messagePreview is the full message for simplicity or fix the schema.
    // Actually, I should probably add fullMessage to the schema if I want to support scheduling properly.

    await this.sendNotification(payload, orgId, userId);
    await this.messageLogsService.updateLogStatus(logId, 'sent');
  }

  async sendNotificationToUsers(
    payload: NotificationPayload,
    orgId: string,
    userId: string,
  ): Promise<NotificationResult[]> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const results: NotificationResult[] = [];

    for (const recipient of recipients) {
      try {
        await this.sendNotification({ ...payload, to: recipient }, orgId, userId);
        results.push({ recipient, status: 'success' });
      } catch (error) {
        results.push({ recipient, status: 'failed', error: error.message });
      }
    }
    return results;
  }

  async sendNotificationToAllUsers(
    payload: NotificationPayload,
    orgId: string,
    userId: string,
  ): Promise<NotificationResult[]> {
    const contacts: Contact[] = await this.contactsService.getContacts(orgId);
    const results: NotificationResult[] = [];

    for (const contact of contacts) {
      const recipient =
        payload.type === NotificationType.SMS || payload.type === NotificationType.WHATSAPP
          ? contact.phone
          : contact.email;

      if (!recipient) {
        results.push({ recipient: '', status: 'failed', error: 'No contact info' });
        continue;
      }

      try {
        await this.sendNotification({ ...payload, to: recipient }, orgId, userId);
        results.push({ recipient, status: 'success' });
      } catch (error) {
        results.push({ recipient, status: 'failed', error: error.message });
      }
    }
    return results;
  }
}