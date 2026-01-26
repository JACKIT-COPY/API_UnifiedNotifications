// src/modules/campaigns/services/campaigns/campaigns.service.ts (fixed version)
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign } from 'src/schemas/campaign.schema';
import { NotificationsService } from 'src/modules/notifications/services/notifications/notifications.service';
import { MessageLogsService } from 'src/modules/messages-logs/services/message-logs/message-logs.service';
import { ContactsService } from 'src/modules/contacts/services/contacts/contacts.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from 'src/integrations/interfaces/notification.interface';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel('Campaign') private campaignModel: Model<Campaign>,
    private notificationsService: NotificationsService,
    private messageLogsService: MessageLogsService,
    private contactsService: ContactsService,
  ) {}

  async createCampaign(data: any, orgId: string, userId: string): Promise<Campaign> {
    const campaign = new this.campaignModel({
      ...data,
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(userId),
    });
    return campaign.save();
  }

  async getCampaigns(orgId: string): Promise<Campaign[]> {
    return this.campaignModel.find({
      organization: new Types.ObjectId(orgId),
    } as any).sort({ createdAt: -1 }).exec();
  }

  async getCampaignById(id: string, orgId: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    } as any).exec();
    if (!campaign) throw new BadRequestException('Campaign not found');
    return campaign;
  }

  async updateCampaign(id: string, data: any, orgId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id, orgId);
    Object.assign(campaign, data);
    return campaign.save();
  }

  async launchCampaign(id: string, orgId: string, userId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id, orgId);
    if (campaign.status !== 'draft') throw new BadRequestException('Campaign not in draft state');

    campaign.status = 'active';
    await campaign.save();

    if (!campaign.scheduleDate || new Date(campaign.scheduleDate) <= new Date()) {
      await this.executeCampaign(campaign, orgId, userId);
    }

    return campaign;
  }

  private async executeCampaign(campaign: Campaign, orgId: string, userId: string) {
    let recipients: string[] = [];

    if (campaign.groupId) {
      const contacts = await this.contactsService.getContactsByGroup(campaign.groupId, orgId);
      recipients = contacts.map(c => c.phone || c.email).filter(Boolean);
    } else if (campaign.recipients.length > 0) {
      const contacts = await this.contactsService.getContactsByIds(campaign.recipients, orgId);
      recipients = contacts.map(c => c.phone || c.email).filter(Boolean);
    } else {
      throw new BadRequestException('No recipients defined');
    }

    for (const channel of campaign.channels) {
      const channelMessage = campaign.messages[channel];
      if (!channelMessage) continue;

      const payload = {
        type: channel,
        to: recipients,
        message: channelMessage.content,
        subject: channelMessage.subject,
        attachments: channelMessage.attachments,
      };

      await this.notificationsService.sendNotificationToUsers(payload, orgId, userId);
    }

    await this.updateAnalytics(campaign._id.toString(), orgId);

    campaign.status = 'completed';
    await campaign.save();
  }

  @Cron('*/5 * * * *')  // Every 5 minutes
  async handleScheduledCampaigns() {
    const now = new Date();
    const scheduled = await this.campaignModel.find({
      status: 'scheduled',
      scheduleDate: { $lte: now },
    }).exec();
    for (const camp of scheduled) {
      await this.executeCampaign(camp, camp.organization.toString(), camp.createdBy.toString());
    }
  }

  async updateAnalytics(id: string, orgId: string) {
    const campaign = await this.getCampaignById(id, orgId);
    const logs = await this.messageLogsService.getLogsForCampaign(id, orgId);
    campaign.analytics = {
      sent: logs.length,
      delivered: logs.filter(l => l.recipients[0].status === 'success').length,  // Adjust based on structure
      failed: logs.filter(l => l.recipients[0].status === 'failed').length,
      opened: 0,  // From webhook
      clicked: 0,
    };
    await campaign.save();
  }

  async cancelCampaign(id: string, orgId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id, orgId);
    if (campaign.status === 'completed') throw new BadRequestException('Cannot cancel completed campaign');
    campaign.status = 'canceled';
    return campaign.save();
  }
}