// src/modules/message-logs/services/message-logs/message-logs.service.ts (add getLogsForCampaign)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessageLog } from 'src/schemas/message-log.schema';
import { NotificationType } from 'src/integrations/interfaces/notification.interface';
import { LogsGateway } from '../../gateways/logs.gateway';

@Injectable()
export class MessageLogsService {
  constructor(
    @InjectModel('MessageLog') private messageLogModel: Model<MessageLog>,
    private logsGateway: LogsGateway,
  ) { }

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
    campaignId?: string,
    scheduledAt?: Date,
    status: string = 'sent',
    fullMessage?: string,
  ): Promise<MessageLog> {
    const log = new this.messageLogModel({
      channel,
      senderUserId,
      senderOrgId,
      network,
      recipients,
      messagePreview,
      fullMessage,
      messageLength,
      cost,
      attachments,
      campaignId: campaignId ? new Types.ObjectId(campaignId) : null,
      scheduledAt,
      status,
    });
    const savedLog = await log.save();

    // Emit real-time log
    this.logsGateway.sendNewLog(savedLog);

    return savedLog;
  }

  async getLogs(
    orgId: string,
    filters: { channel?: NotificationType; status?: string; dateFrom?: Date; dateTo?: Date },
  ): Promise<MessageLog[]> {
    const query: any = { senderOrgId: orgId };
    if (filters.channel) query.channel = filters.channel;
    if (filters.status) {
      query.$or = [
        { status: filters.status },
        { 'recipients.status': filters.status }
      ];
    }
    if (filters.dateFrom) query.createdAt = { $gte: filters.dateFrom };
    if (filters.dateTo) query.createdAt = { ...query.createdAt || {}, $lte: filters.dateTo };
    return this.messageLogModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getAllLogs(filters: { channel?: NotificationType; status?: string; dateFrom?: Date; dateTo?: Date }): Promise<MessageLog[]> {
    const query: any = {};
    if (filters.channel) query.channel = filters.channel;
    if (filters.status) {
      query.$or = [
        { status: filters.status },
        { 'recipients.status': filters.status }
      ];
    }
    if (filters.dateFrom) query.createdAt = { $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) query.createdAt = { ...query.createdAt || {}, $lte: new Date(filters.dateTo) };
    return this.messageLogModel.find(query)
      .populate('senderUserId', 'name email')
      .populate('senderOrgId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  // ← New method for analytics
  async getLogsForCampaign(campaignId: string, orgId: string): Promise<MessageLog[]> {
    return this.messageLogModel.find({
      campaignId: new Types.ObjectId(campaignId),
      senderOrgId: orgId,
    } as any).exec();
  }

  async updateLogStatus(
    logId: string,
    status: string,
    recipients?: { recipient: string; status: string; error?: string; response?: string }[],
  ): Promise<MessageLog | null> {
    const update: any = { status };
    if (recipients) update.recipients = recipients;

    const updatedLog = await this.messageLogModel.findByIdAndUpdate(
      logId,
      update,
      { new: true }
    );

    if (updatedLog) {
      this.logsGateway.sendNewLog(updatedLog);
    }

    return updatedLog;
  }

  async findScheduledLogs(): Promise<MessageLog[]> {
    const now = new Date();
    const claimedLogs: MessageLog[] = [];
    let hasMore = true;

    // Use a loop to atomically claim logs one by one
    // This is safer for high concurrency than updateMany + find
    while (hasMore) {
      const log = await this.messageLogModel.findOneAndUpdate(
        {
          status: 'scheduled',
          scheduledAt: { $lte: now }
        },
        { $set: { status: 'processing' } },
        { new: true }
      ).exec();

      if (log) {
        claimedLogs.push(log);
      } else {
        hasMore = false;
      }

      // Safety limit to prevent infinite loops if something goes wrong
      if (claimedLogs.length >= 100) hasMore = false;
    }

    return claimedLogs;
  }

  async findLogById(id: string): Promise<MessageLog | null> {
    return this.messageLogModel.findById(id).exec();
  }
}