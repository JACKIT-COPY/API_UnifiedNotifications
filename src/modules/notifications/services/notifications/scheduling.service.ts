import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { MessageLogsService } from 'src/modules/messages-logs/services/message-logs/message-logs.service';
import { NotificationPayload } from 'src/integrations/interfaces/notification.interface';

@Injectable()
export class SchedulingService {
    private readonly logger = new Logger(SchedulingService.name);

    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly messageLogsService: MessageLogsService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleScheduledNotifications() {
        this.logger.debug('Checking for scheduled notifications...');
        const scheduledLogs = await this.messageLogsService.findScheduledLogs();

        if (scheduledLogs.length === 0) return;

        this.logger.log(`Found ${scheduledLogs.length} scheduled notifications to send.`);

        for (const log of scheduledLogs) {
            // Extra safety: only process if it's still marked as processing
            if (log.status !== 'processing') continue;

            try {
                this.logger.log(`Sending scheduled notification ${log._id}`);

                const payload: NotificationPayload = {
                    type: log.channel as any,
                    to: log.recipients.map((r) => r.recipient),
                    message: log.fullMessage || log.messagePreview,
                };

                await this.notificationsService.sendNotification(
                    payload,
                    log.senderOrgId.toString(),
                    log.senderUserId.toString(),
                    log._id.toString(),
                );

                await this.messageLogsService.updateLogStatus(log._id.toString(), 'sent');
            } catch (error) {
                this.logger.error(`Failed to send scheduled notification ${log._id}: ${error.message}`);
                await this.messageLogsService.updateLogStatus(log._id.toString(), 'failed');
            }
        }
    }
}
