import { Controller, Get, Put, Patch, Body, UseGuards, Request, Param, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard';
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard';
import { OrganizationsService } from '../../services/organizations/organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) { }

  // Super Admin: Get all organizations
  @Get()
  @UseGuards(SuperAdminGuard)
  async getAllOrganizations() {
    return this.organizationsService.findAll();
  }

  // Diagnostic endpoint
  @Get('ping')
  ping() {
    return { message: 'pong', timestamp: new Date().toISOString() };
  }

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

  // Get organization stats with detailed information (must come before generic :orgId route)
  @Get(':orgId/stats')
  async getOrganizationStats(@Param('orgId') orgId: string, @Request() req) {
    const user = req.user;

    // Super-admin can access any organization stats
    if (user.role === 'superadmin') {
      return this.organizationsService.getOrganizationStats(orgId);
    }

    // Admins can only access their own organization stats
    if (user.role === 'admin' && user.orgId === orgId) {
      return this.organizationsService.getOrganizationStats(orgId);
    }

    throw new ForbiddenException('You do not have access to this organization');
  }

  // Get organization by ID (Admin can view their own, Super-admin can view any)
  @Get(':orgId')
  async getOrganization(@Param('orgId') orgId: string, @Request() req) {
    const user = req.user;

    // Super-admin can access any organization
    if (user.role === 'superadmin') {
      return this.organizationsService.getById(orgId);
    }

    // Admins can only access their own organization
    if (user.role === 'admin' && user.orgId === orgId) {
      return this.organizationsService.getById(orgId);
    }

    throw new ForbiddenException('You do not have access to this organization');
  }

  // Update organization details
  @Patch(':orgId')
  async updateOrganization(
    @Param('orgId') orgId: string,
    @Body() updateData: any,
    @Request() req
  ) {
    const user = req.user;

    // Super-admin can update any
    // Or Admin can update their own
    if (user.role === 'superadmin' || (user.role === 'admin' && user.orgId === orgId)) {
      return this.organizationsService.update(orgId, updateData);
    }

    throw new ForbiddenException('You do not have access to update this organization');
  }

  // Update organization credentials
  @Patch(':orgId/credentials')
  async updateCredentialsById(
    @Param('orgId') orgId: string,
    @Body('credentials') credentials: Record<string, string>,
    @Request() req
  ) {
    const user = req.user;

    if (user.role === 'superadmin' || (user.role === 'admin' && user.orgId === orgId)) {
      return this.organizationsService.updateCredentials(orgId, credentials);
    }

    throw new ForbiddenException('You do not have access to update credentials for this organization');
  }

  // Super-admin: Suspend an organization
  @Patch(':orgId/suspend')
  @UseGuards(SuperAdminGuard)
  async suspendOrganization(@Param('orgId') orgId: string) {
    return this.organizationsService.setStatus(orgId, 'Suspended');
  }

  // Super-admin: Unsuspend (activate) an organization
  @Patch(':orgId/unsuspend')
  @UseGuards(SuperAdminGuard)
  async unsuspendOrganization(@Param('orgId') orgId: string) {
    return this.organizationsService.setStatus(orgId, 'Active');
  }

  // Super-admin: Soft-delete organization
  @Patch(':orgId/soft-delete')
  @UseGuards(SuperAdminGuard)
  async softDeleteOrganization(@Param('orgId') orgId: string) {
    return this.organizationsService.softDelete(orgId);
  }

  // Super-admin: Assign a payment method to an organization
  @Patch(':orgId/payment-method')
  @UseGuards(SuperAdminGuard)
  async assignPaymentMethod(
    @Param('orgId') orgId: string,
    @Body('paymentMethodId') paymentMethodId: string | null,
  ) {
    return this.organizationsService.assignPaymentMethod(orgId, paymentMethodId);
  }
}
