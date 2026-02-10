// src/modules/usage/controllers/usage/usage.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
    async getMyUsage(@Param('user') user: any) {
        // This assumes user object is available in request, handled by guard/decorator
        // For now, let's assume we pass organizationId or get it from user
        // return this.usageService.getOrganizationUsage(user.organizationId);
        return { message: 'Not implemented yet' };
    }

    /**
     * Get specific organization usage
     */
    @Get('organization/:orgId')
    async getOrganizationUsage(@Param('orgId') orgId: string) {
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
