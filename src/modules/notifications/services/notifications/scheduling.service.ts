import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { MessageLogsService } from 'src/modules/messages-logs/services/message-logs/message-logs.service';
import { NotificationPayload } from 'src/integrations/interfaces/notification.interface';
import { OrganizationsService } from 'src/modules/organizations/services/organizations/organizations.service';

@Injectable()
export class SchedulingService {
    private readonly logger = new Logger(SchedulingService.name);

    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly messageLogsService: MessageLogsService,
        private readonly organizationsService: OrganizationsService,
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
                    to: log.recipients.map((r) => (r as any).recipient),
                    message: log.fullMessage || log.messagePreview,
                    subject: (log as any).subject,
                };

                // Credits were already deducted when the message was scheduled.
                // Passing logId tells sendNotification to skip credit check/deduction.
                await this.notificationsService.sendNotification(
                    payload,
                    log.senderOrgId.toString(),
                    log.senderUserId.toString(),
                    log._id.toString(),
                );

                // Update cost on the existing log to reflect actual rate
                await this.messageLogsService.updateLogStatus(log._id.toString(), 'sent');
            } catch (error) {
                this.logger.error(`Failed to send scheduled notification ${log._id}: ${error.message}`);

                // Refund credits since the scheduled message failed to send
                // The cost was pre-deducted at schedule time
                if (log.cost > 0) {
                    try {
                        await this.organizationsService.updateCredits(
                            log.senderOrgId.toString(),
                            log.cost, // Refund the cost
                        );
                        this.logger.log(`Refunded ${log.cost} credit(s) to org ${log.senderOrgId} for failed scheduled notification ${log._id}`);
                    } catch (refundError) {
                        this.logger.error(`Failed to refund credits for notification ${log._id}: ${refundError.message}`);
                    }
                }

                await this.messageLogsService.updateLogStatus(log._id.toString(), 'failed');
            }
        }
    }
}
