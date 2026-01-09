import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageLog } from 'src/schemas/message-log.schema';
import { NotificationType } from 'src/integrations/interfaces/notification.interface';

@Injectable()
export class MessageLogsService {
  constructor(@InjectModel('MessageLog') private messageLogModel: Model<MessageLog>) {}

  async logMessage(
    channel: NotificationType,
    senderUserId: string,
    senderOrgId: string,
    network: string,
    recipients: { recipient: string; status: string; error?: string; response?: string }[],
    messagePreview: string,
    messageLength: number,
    cost: number,
    attachments?: { filename: string; contentType: string }[],
  ): Promise<MessageLog> {
    const log = new this.messageLogModel({
      channel,
      senderUserId,
      senderOrgId,
      network,
      recipients,
      messagePreview,
      messageLength,
      cost,
      attachments,
    });
    return log.save();
  }

  async getLogs(
    orgId: string,
    filters: { channel?: NotificationType; status?: string; dateFrom?: Date; dateTo?: Date },
  ): Promise<MessageLog[]> {
    const query: any = { senderOrgId: orgId };
    if (filters.channel) query.channel = filters.channel;
    if (filters.status) query['recipients.status'] = filters.status;
    if (filters.dateFrom) query.createdAt = { $gte: filters.dateFrom };
    if (filters.dateTo) query.createdAt = { ...query.createdAt || {}, $lte: filters.dateTo };
    return this.messageLogModel.find(query).sort({ createdAt: -1 }).exec();
  }
}