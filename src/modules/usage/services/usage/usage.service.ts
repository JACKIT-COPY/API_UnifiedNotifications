// src/modules/usage/services/usage/usage.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageLog } from 'src/schemas/message-log.schema';
import { Organization } from 'src/schemas/organization.schema';

@Injectable()
export class UsageService {
    constructor(
        @InjectModel('MessageLog') private messageLogModel: Model<MessageLog>,
        @InjectModel('Organization') private organizationModel: Model<Organization>,
    ) { }

    /**
     * Get usage statistics for all organizations
     */
    async getAllUsage() {
        // 1. Get all organizations first (to ensure we show orgs even with 0 usage)
        const organizations = await this.organizationModel.find().lean().exec();

        // 2. Aggregate usage from logs
        const usageStats = await this.messageLogModel.aggregate([
            {
                $group: {
                    _id: '$senderOrgId',
                    totalTokensUsed: { $sum: '$cost' },
                    smsCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'sms'] }, 1, 0] },
                    },
                    emailCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'email'] }, 1, 0] },
                    },
                    whatsappCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'whatsapp'] }, 1, 0] },
                    },
                    lastActivity: { $max: '$createdAt' },
                },
            },
        ]);

        // 3. Map stats to organizations
        const usageMap = new Map(usageStats.map((stat) => [stat._id.toString(), stat]));

        return organizations.map((org) => {
            const stats = usageMap.get(org._id.toString()) || {
                totalTokensUsed: 0,
                smsCount: 0,
                emailCount: 0,
                whatsappCount: 0,
                lastActivity: null,
            };

            return {
                organizationId: org._id,
                organizationName: org.name,
                totalTokens: (org.credits || 0) + stats.totalTokensUsed, // Total needed? Or just current balance + used?
                // Let's assume 'totalTokens' means current balance + used (lifetime tokens)
                // Or maybe just show 'remainingCredits' and 'usedCredits'.
                // The mock data had 'totalTokens' and 'usedTokens'.
                // Let's return both.
                remainingCredits: org.credits || 0,
                usedTokens: stats.totalTokensUsed,
                smsCount: stats.smsCount,
                emailCount: stats.emailCount,
                whatsappCount: stats.whatsappCount,
                lastActivity: stats.lastActivity || org.updatedAt,
                // Trend calculation would require historic data, skipping for now
                trend: 'neutral',
                trendValue: '0%',
            };
        });
    }

    /**
     * Get usage for a specific organization
     */
    async getOrganizationUsage(orgId: string) {
        const org = await this.organizationModel.findById(orgId).lean().exec();
        if (!org) return null;

        const stats = await this.messageLogModel.aggregate([
            { $match: { senderOrgId: org._id } },
            {
                $group: {
                    _id: null,
                    totalTokensUsed: { $sum: '$cost' },
                    smsCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'sms'] }, 1, 0] },
                    },
                    emailCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'email'] }, 1, 0] },
                    },
                    whatsappCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'whatsapp'] }, 1, 0] },
                    },
                    lastActivity: { $max: '$createdAt' },
                },
            },
        ]);

        const stat = stats[0] || {
            totalTokensUsed: 0,
            smsCount: 0,
            emailCount: 0,
            whatsappCount: 0,
            lastActivity: null,
        };

        return {
            organizationId: org._id,
            organizationName: org.name,
            remainingCredits: org.credits || 0,
            usedTokens: stat.totalTokensUsed,
            smsCount: stat.smsCount,
            emailCount: stat.emailCount,
            whatsappCount: stat.whatsappCount,
            lastActivity: stat.lastActivity || org.updatedAt,
        };
    }

    /**
     * Get global stats summary
     */
    async getGlobalStats() {
        const stats = await this.messageLogModel.aggregate([
            {
                $group: {
                    _id: null,
                    smsCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'sms'] }, 1, 0] },
                    },
                    emailCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'email'] }, 1, 0] },
                    },
                    whatsappCount: {
                        $sum: { $cond: [{ $eq: ['$channel', 'whatsapp'] }, 1, 0] },
                    },
                },
            },
        ]);

        return stats[0] || { smsCount: 0, emailCount: 0, whatsappCount: 0 };
    }
}
