// src/modules/campaigns/services/campaigns/campaigns.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign } from 'src/schemas/campaign.schema';
import { NotificationsService } from 'src/modules/notifications/services/notifications/notifications.service';
import { MessageLogsService } from 'src/modules/messages-logs/services/message-logs/message-logs.service';
import { ContactsService } from 'src/modules/contacts/services/contacts/contacts.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from 'src/integrations/interfaces/notification.interface';
import { Contact } from 'src/schemas/contact.schema';

@Injectable()
export class CampaignsService {
  [x: string]: any;
  constructor(
    @InjectModel('Campaign') private campaignModel: Model<Campaign>,
    private notificationsService: NotificationsService,
    private messageLogsService: MessageLogsService,
    private contactsService: ContactsService,
  ) {}

  async createCampaign(data: any, orgId: string, userId: string): Promise<Campaign> {
    // Map frontend recipients structure to backend
    if (data.recipients) {
      if (data.recipients.groups.length > 0) {
        data.recipientType = 'group';
        data.selectedGroup = data.recipients.groups[0];  // Assume first group, or handle multiple
      } else if (data.recipients.contacts.length > 0) {
        data.recipientType = 'selected';
        data.selectedContacts = data.recipients.contacts;
      } else if (data.recipients.manual.length > 0) {
        data.recipientType = 'selected';
        data.selectedContacts = [];  // Manual not supported yet – convert to contacts?
      } else {
        data.recipientType = 'all';
      }
      delete data.recipients;  // Clean up
    }

    // Combine schedule
    if (data.scheduling?.type === 'immediate') {
      data.scheduleDate = null;
    } else if (data.scheduling?.type === 'scheduled' && data.scheduleDate && data.scheduleTime) {
      data.scheduleDate = new Date(`${data.scheduleDate}T${data.scheduleTime}`);
    }
    delete data.scheduling;

    const campaign = new this.campaignModel({
      ...data,
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(userId),
    });
    return campaign.save();
  }

  async getCampaigns(orgId: string): Promise<Campaign[]> {
    return this.campaignModel
      .find({
        organization: { $eq: new Types.ObjectId(orgId) },
      } as any)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCampaignById(id: string, orgId: string): Promise<Campaign> {
    const campaign = await this.campaignModel
      .findOne({
        _id: { $eq: new Types.ObjectId(id) },
        organization: { $eq: new Types.ObjectId(orgId) },
      } as any)
      .exec();
    if (!campaign) throw new BadRequestException('Campaign not found');
    return campaign;
  }

  async updateCampaign(
    id: string,
    data: any,
    orgId: string,
  ): Promise<Campaign> {
    const campaign = await this.getCampaignById(id, orgId);
    // Recombine schedule if updated
    if (data.scheduleDate && data.scheduleTime) {
      data.scheduleDate = new Date(`${data.scheduleDate}T${data.scheduleTime}`);
    }
    Object.assign(campaign, data);
    return campaign.save();
  }

  async launchCampaign(
    id: string,
    orgId: string,
    userId: string,
  ): Promise<Campaign> {
    const campaign = await this.getCampaignById(id, orgId);
    if (campaign.status !== 'draft')
      throw new BadRequestException('Campaign not in draft state');

    if (campaign.saveAsDraft) {
      campaign.status = 'draft';
    } else {
      campaign.status = 'active';
    }
    await campaign.save();

    if (
      !campaign.saveAsDraft &&
      (!campaign.scheduleDate || new Date(campaign.scheduleDate) <= new Date())
    ) {
      await this.executeCampaign(campaign, orgId, userId);
    }

    return campaign;
  }

  private async executeCampaign(campaign: Campaign, orgId: string, userId: string) {
    let contacts: Contact[] = [];

    if (campaign.recipientType === 'all') {
      contacts = await this.contactsService.getContacts(orgId);
    } else if (campaign.recipientType === 'selected') {
      contacts = await this.contactsService.getContactsByIds(campaign.selectedContacts, orgId);
    } else if (campaign.recipientType === 'group') {
      if (!campaign.selectedGroup) throw new BadRequestException('No group selected');
      contacts = await this.contactsService.getContactsByGroup(campaign.selectedGroup, orgId);
    } else if (campaign.recipientType === 'segments') {
      throw new BadRequestException('Segments not implemented yet');
    } else {
      throw new BadRequestException('Invalid recipient type');
    }

    if (contacts.length === 0) {
      throw new BadRequestException('No valid contacts found');
    }

    for (const channel of campaign.channels) {
      const channelMessage = campaign.messages[channel];
      if (!channelMessage) continue;

      // Channel-specific recipients
      let recipients: string[] = [];
      if (channel === NotificationType.SMS || channel === NotificationType.WHATSAPP) {
        recipients = contacts.map(c => c.phone).filter(Boolean);
      } else if (channel === NotificationType.EMAIL) {
        recipients = contacts.map(c => c.email).filter(Boolean);
      }

      if (recipients.length === 0) {
        this.logger.warn(`No recipients for channel ${channel} in campaign ${campaign._id}`);
        continue;
      }

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

  @Cron('*/5 * * * *') // Every 5 minutes
  async handleScheduledCampaigns() {
    const now = new Date();
    const scheduled = await this.campaignModel
      .find({
        status: 'scheduled',
        scheduleDate: { $lte: now },
      })
      .exec();
    for (const camp of scheduled) {
      await this.executeCampaign(
        camp,
        camp.organization.toString(),
        camp.createdBy.toString(),
      );
    }
  }

  async updateAnalytics(id: string, orgId: string) {
    const campaign = await this.getCampaignById(id, orgId);
    const logs = await this.messageLogsService.getLogsForCampaign(id, orgId);
    campaign.analytics = {
      sent: logs.length,
      delivered: logs.filter((l) =>
        l.recipients.some((r) => r.status === 'success'),
      ).length,
      failed: logs.filter((l) =>
        l.recipients.some((r) => r.status === 'failed'),
      ).length,
      opened: 0,
      clicked: 0,
    };
    await campaign.save();
  }

  async cancelCampaign(id: string, orgId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id, orgId);
    if (campaign.status === 'completed')
      throw new BadRequestException('Cannot cancel completed campaign');
    campaign.status = 'canceled';
    return campaign.save();
  }
}
