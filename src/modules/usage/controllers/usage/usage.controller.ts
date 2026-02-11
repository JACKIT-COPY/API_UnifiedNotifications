// src/modules/usage/controllers/usage/usage.controller.ts
import { Controller, Get, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsageService } from '../../services/usage/usage.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard';

@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageController {
    constructor(private readonly usageService: UsageService) { }

    /**
     * Get usage for all organizations (Admin Dashboard)
     */
    @Get('organizations')
    @UseGuards(SuperAdminGuard) // Restrict to super admin or adjust based on role
    async getAllUsage() {
        return this.usageService.getAllUsage();
    }

    /**
     * Get user's own organization usage
     */
    @Get('me')
    async getMyUsage(@Req() req: any) {
        const user = req.user;
        if (!user || !user.orgId) {
            return { message: 'Organization not found for user' };
        }
        return this.usageService.getOrganizationUsage(user.orgId);
    }

    /**
     * Get specific organization usage
     */
    @Get('organization/:orgId')
    async getOrganizationUsage(@Param('orgId') orgId: string, @Req() req: any) {
        const user = req.user;
        // Ownership check
        if (user.role !== 'superadmin' && user.orgId !== orgId) {
            throw new ForbiddenException('You do not have access to this organization usage');
        }
        return this.usageService.getOrganizationUsage(orgId);
    }

    /**
     * Get global stats (Total SMS, Email, WhatsApp)
     */
    @Get('stats')
    @UseGuards(SuperAdminGuard)
    async getGlobalStats() {
        return this.usageService.getGlobalStats();
    }
}
