// src/modules/organizations/services/organizations/organizations.service.ts (new service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization } from 'src/schemas/organization.schema';
import { User } from 'src/schemas/user.schema';
import { Contact } from 'src/schemas/contact.schema';
import { Group } from 'src/schemas/group.schema';
import { MessageLog } from 'src/schemas/message-log.schema';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel('Organization') private orgModel: Model<Organization>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Contact') private contactModel: Model<Contact>,
    @InjectModel('Group') private groupModel: Model<Group>,
    @InjectModel('MessageLog') private messageLogModel: Model<MessageLog>,
  ) { }

  async getById(id: string): Promise<Organization> {
    const org = await this.orgModel.findById(new Types.ObjectId(id)).exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findAll(): Promise<Organization[]> {
    // Exclude soft-deleted organizations by default
    return this.orgModel.find({ isDeleted: { $ne: true } }).exec();
  }

  async updateCredentials(id: string, newCredentials: Record<string, string>): Promise<Organization> {
    const org = await this.orgModel.findById(new Types.ObjectId(id));
    if (!org) throw new NotFoundException('Organization not found');

    org.credentials = { ...org.credentials, ...newCredentials };
    return org.save();
  }

  async update(id: string, updateData: any): Promise<Organization> {
    const org = await this.orgModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: updateData },
      { new: true }
    ).exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateCredits(id: string, amount: number): Promise<Organization> {
    const org = await this.orgModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $inc: { credits: amount } },
      { new: true }
    ).exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async getOrganizationStats(orgId: string) {
    const orgObjectId = new Types.ObjectId(orgId);
    const orgIdString = orgObjectId.toString();

    // Get organization details
    const org = await this.orgModel.findById(orgObjectId).exec();
    if (!org) throw new NotFoundException('Organization not found');

    // Count users
    const totalUsers = await this.userModel.countDocuments({ organization: orgObjectId, isActive: true });

    // Count contacts
    const totalContacts = await this.contactModel.countDocuments({ notifyHubOrganization: orgIdString } as any);

    // Count groups
    const totalGroups = await this.groupModel.countDocuments({ organization: orgIdString } as any);

    // Get message stats
    const messageStats = await this.messageLogModel.aggregate([
      {
        $match: { senderOrgId: orgObjectId }
      },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    // Initialize message counts
    let whatsappCount = 0;
    let emailCount = 0;
    let smsCount = 0;
    let creditsSpent = 0;

    // Process message stats
    messageStats.forEach(stat => {
      creditsSpent += stat.totalCost || 0;
      if (stat._id === 'whatsapp') {
        whatsappCount = stat.count;
      } else if (stat._id === 'email') {
        emailCount = stat.count;
      } else if (stat._id === 'sms') {
        smsCount = stat.count;
      }
    });

    // Get admin details (first admin user found)
    const adminUser = await this.userModel.findOne({
      organization: orgObjectId,
      role: 'admin',
      isActive: true
    }).exec();

    const adminDetails = adminUser ? {
      name: `${adminUser.firstName} ${adminUser.lastName}`,
      email: adminUser.email,
      phone: `${adminUser.countryCode} ${adminUser.phoneNumber}`,
    } : {
      name: 'N/A',
      email: 'N/A',
      phone: 'N/A',
    };

    return {
      organization: org,
      stats: {
        totalUsers,
        totalContacts,
        totalGroups,
        messagesSent: {
          whatsapp: whatsappCount,
          email: emailCount,
          sms: smsCount,
        },
        creditsSpent,
      },
      adminDetails,
    };
  }

  // Super-admin: set organization status (e.g., 'Suspended' or 'Active')
  async setStatus(id: string, status: string): Promise<Organization> {
    const org = await this.orgModel.findById(new Types.ObjectId(id));
    if (!org) throw new NotFoundException('Organization not found');

    org.status = status;
    return org.save();
  }

  // Super-admin: soft-delete organization (mark as deleted)
  async softDelete(id: string): Promise<Organization> {
    const org = await this.orgModel.findById(new Types.ObjectId(id));
    if (!org) throw new NotFoundException('Organization not found');

    org.isDeleted = true;
    org.status = 'Deleted';
    return org.save();
  }

  /**
   * Assign a payment method to an organisation.
   * Pass `null` to reset to the system default.
   */
  async assignPaymentMethod(orgId: string, paymentMethodId: string | null): Promise<Organization> {
    const org = await this.orgModel.findById(new Types.ObjectId(orgId));
    if (!org) throw new NotFoundException('Organization not found');

    org.paymentMethod = paymentMethodId ? new Types.ObjectId(paymentMethodId) : null;
    return org.save();
  }
}