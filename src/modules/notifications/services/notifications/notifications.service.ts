// src/modules/notifications/services/notifications/notifications.service.ts
import { Injectable, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
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
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';

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
    private readonly organizationsService: OrganizationsService,
  ) { }

  /**
   * Get the per-message cost for a channel based on org rates.
   */
  private getChannelRate(
    rates: { sms: number; whatsapp: number; email: number },
    channel: NotificationType,
  ): number {
    switch (channel) {
      case NotificationType.SMS:
        return rates.sms ?? 1;
      case NotificationType.WHATSAPP:
        return rates.whatsapp ?? 1;
      case NotificationType.EMAIL:
        return rates.email ?? 0.5;
      default:
        return 1;
    }
  }

  // Map channel to provider name for logging
  private networkForChannel(type: NotificationType): string {
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
  }

  async sendNotification(
    payload: NotificationPayload,
    orgId: string,
    userId: string,
    logId?: string,
  ): Promise<void> {
    const recipient = Array.isArray(payload.to) ? payload.to[0] : payload.to;

    // ── Fetch org to get rates and credit balance ──
    const org = await this.organizationsService.getById(orgId);
    const rate = this.getChannelRate(org.rates, payload.type);

    // If scheduled for later, check credits and log it as scheduled
    if (payload.scheduledAt) {
      const scheduledDate = new Date(payload.scheduledAt);
      const now = new Date();

      if (scheduledDate <= now) {
        throw new BadRequestException('Scheduled time must be in the future');
      }

      // ── Credit check for scheduled messages ──
      if (org.credits < rate) {
        throw new ForbiddenException(
          `Insufficient credits. This ${payload.type} message costs ${rate} credit(s) but your organization only has ${org.credits} credit(s). Please purchase more credits.`,
        );
      }

      this.logger.log(
        `Scheduling ${payload.type} notification to ${payload.to} at ${payload.scheduledAt} (org: ${orgId}, user: ${userId}, cost: ${rate})`,
      );

      // Deduct credits upfront for scheduled messages
      await this.organizationsService.updateCredits(orgId, -rate);
      this.logger.log(`Deducted ${rate} credit(s) from org ${orgId} for scheduled ${payload.type} message. Remaining: ${org.credits - rate}`);

      await this.messageLogsService.logMessage(
        payload.type,
        userId,
        orgId,
        this.networkForChannel(payload.type),
        [{ recipient, status: 'pending' }],
        payload.message?.substring(0, 100) || '',
        payload.message?.length || 0,
        rate, // True cost from org rates
        payload.attachments?.map((a) => ({ filename: a.filename, contentType: a.contentType || 'application/octet-stream' })),
        undefined, // campaignId
        payload.scheduledAt,
        'scheduled',
        payload.message,
        payload.subject,
      );
      return;
    }

    // ── Credit balance check for immediate sends ──
    // Skip credit check when logId is provided — this is a scheduled message
    // being executed, and credits were already deducted at schedule time.
    const isScheduledExecution = !!logId;
    if (!isScheduledExecution && org.credits < rate) {
      throw new ForbiddenException(
        `Insufficient credits. This ${payload.type} message costs ${rate} credit(s) but your organization only has ${org.credits} credit(s). Please purchase more credits.`,
      );
    }

    this.logger.log(
      `Sending ${payload.type} notification to ${payload.to} (org: ${orgId}, user: ${userId}, cost: ${rate})`,
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

      // ── Deduct credits on success (only for immediate sends) ──
      // Scheduled sends already had credits deducted at schedule time.
      if (!isScheduledExecution) {
        await this.organizationsService.updateCredits(orgId, -rate);
        this.logger.log(`Deducted ${rate} credit(s) from org ${orgId} for ${payload.type}. Remaining: ${org.credits - rate}`);
      }

      // Log success (only if not a scheduled retry, to avoid duplicates)
      if (!logId) {
        await this.messageLogsService.logMessage(
          payload.type,
          userId,
          orgId,
          this.networkForChannel(payload.type),
          [
            {
              recipient,
              status: 'success',
              response: providerResponse ? JSON.stringify(providerResponse) : undefined,
            },
          ],
          payload.message?.substring(0, 100) || '',
          payload.message?.length || 0,
          rate, // True cost from org rates
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
      // Log failure (no credit deduction on failure)
      if (!logId) {
        try {
          await this.messageLogsService.logMessage(
            payload.type,
            userId,
            orgId,
            this.networkForChannel(payload.type),
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

    // Credits were already deducted when the message was scheduled.
    // We do NOT re-check/re-deduct here. If the send fails, credits
    // were already consumed (they paid to schedule it).

    // Prepare payload from log
    const payload: NotificationPayload = {
      type: log.channel as any,
      to: log.recipients.map((r) => r.recipient),
      message: log.fullMessage || log.messagePreview,
    };

    // Pass logId so sendNotification knows this is a scheduled execution
    // and skips credit check/deduction (credits were pre-deducted)
    await this.sendNotification(payload, orgId, userId, logId);
    await this.messageLogsService.updateLogStatus(logId, 'sent');
  }

  async sendNotificationToUsers(
    payload: NotificationPayload,
    orgId: string,
    userId: string,
  ): Promise<NotificationResult[]> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

    // ── Pre-check: ensure org has enough credits for ALL recipients ──
    const org = await this.organizationsService.getById(orgId);
    const rate = this.getChannelRate(org.rates, payload.type);
    const totalCost = rate * recipients.length;

    if (org.credits < totalCost) {
      // Calculate how many messages they CAN afford
      const affordable = Math.floor(org.credits / rate);
      throw new ForbiddenException(
        `Insufficient credits. Sending ${recipients.length} ${payload.type} message(s) costs ${totalCost} credit(s) but your organization only has ${org.credits} credit(s). You can afford to send ${affordable} message(s). Please purchase more credits.`,
      );
    }

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

    // ── Filter valid recipients first to calculate cost accurately ──
    const validContacts: { contact: Contact; recipient: string }[] = [];
    for (const contact of contacts) {
      const recipient =
        payload.type === NotificationType.SMS || payload.type === NotificationType.WHATSAPP
          ? contact.phone
          : contact.email;

      if (recipient) {
        validContacts.push({ contact, recipient });
      }
    }

    // ── Pre-check credits for ALL valid recipients ──
    const org = await this.organizationsService.getById(orgId);
    const rate = this.getChannelRate(org.rates, payload.type);
    const totalCost = rate * validContacts.length;

    if (org.credits < totalCost) {
      const affordable = Math.floor(org.credits / rate);
      throw new ForbiddenException(
        `Insufficient credits. Sending ${validContacts.length} ${payload.type} message(s) costs ${totalCost} credit(s) but your organization only has ${org.credits} credit(s). You can afford to send ${affordable} message(s). Please purchase more credits.`,
      );
    }

    const results: NotificationResult[] = [];

    // Add failed entries for contacts without valid info
    for (const contact of contacts) {
      const recipient =
        payload.type === NotificationType.SMS || payload.type === NotificationType.WHATSAPP
          ? contact.phone
          : contact.email;

      if (!recipient) {
        results.push({ recipient: '', status: 'failed', error: 'No contact info' });
      }
    }

    // Send to valid contacts
    for (const { recipient } of validContacts) {
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