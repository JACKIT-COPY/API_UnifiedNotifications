// src/modules/organizations/controllers/organizations/organizations.controller.ts
import { Controller, Get, Put, Body, UseGuards, Request, Param, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard';
import { OrganizationsService } from '../../services/organizations/organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  // Get the current user's organization
  @Get('current')
  async getCurrentOrganization(@Request() req) {
    return this.organizationsService.getById(req.user.orgId);
  }

  // Update credentials for current organization (admin only)
  @Put('current/credentials')
  @UseGuards(AdminGuard)
  async updateCredentials(@Request() req, @Body() credentials: Record<string, string>) {
    return this.organizationsService.updateCredentials(req.user.orgId, credentials);
  }

  // Optional: Admin can view any org (for super-admin features later)
  @Get(':orgId')
  @UseGuards(AdminGuard)  // Only admins can access other orgs
  async getOrganization(@Param('orgId') orgId: string, @Request() req) {
    // Extra safety: even admins can only access orgs they belong to (unless super-admin)
    if (req.user.orgId !== orgId) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return this.organizationsService.getById(orgId);
  }
}