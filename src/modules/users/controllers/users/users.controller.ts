// src/modules/users/controllers/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../../services/users/users.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard';
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  async getAllUsers(@Request() req) {
    return this.usersService.getUsers(req.user.orgId);
  }

  @Get('me')
  async getCurrentUser(@Request() req) {
    return this.usersService.getUserById(req.user.userId, req.user.orgId);
  }

  // ── Admin-only endpoints ──

  @Post()
  @UseGuards(AdminGuard)
  async createUser(@Body() userData: any, @Request() req) {
    return this.usersService.createUser(userData, req.user.orgId);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async updateUser(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    return this.usersService.updateUser(id, updateData, req.user.orgId);
  }

  @Put(':id/deactivate')
  @UseGuards(AdminGuard)
  async deactivateUser(@Param('id') id: string, @Request() req) {
    return this.usersService.deactivateUser(id, req.user.orgId);
  }

  @Put(':id/reactivate')
  @UseGuards(AdminGuard)
  async reactivateUser(@Param('id') id: string, @Request() req) {
    return this.usersService.reactivateUser(id, req.user.orgId);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteUser(@Param('id') id: string, @Request() req) {
    await this.usersService.deleteUser(id, req.user.orgId);
    return { message: 'User deleted successfully' };
  }

  @Put(':id/password')
  async changeUserPassword(
    @Param('id') id: string,
    @Body() body: { oldPassword?: string; newPassword: string },
    @Request() req,
  ) {
    const isAdmin = req.user.role === 'admin';

    return this.usersService.changePassword(
      id,
      body.oldPassword || '', // Optional for admin reset
      body.newPassword,
      req.user.userId,
      req.user.orgId,
      isAdmin && id !== req.user.userId, // Admin resetting someone else
    );
  }

  // ── Super Admin endpoints ──

  @Get('admin/all')
  @UseGuards(SuperAdminGuard)
  async getAllUsersAcrossOrgs() {
    return this.usersService.getAllUsersAcrossOrgs();
  }

  @Get('admin/stats')
  @UseGuards(SuperAdminGuard)
  async getUsersStatsAcrossOrgs() {
    return this.usersService.getUsersStatsAcrossOrgs();
  }

  @Post('admin')
  @UseGuards(SuperAdminGuard)
  async adminCreateUser(@Body() userData: any) {
    return this.usersService.createUser(userData);
  }

  @Put('admin/:id')
  @UseGuards(SuperAdminGuard)
  async adminUpdateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.usersService.updateUser(id, updateData);
  }

  @Put('admin/:id/deactivate')
  @UseGuards(SuperAdminGuard)
  async adminDeactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Put('admin/:id/reactivate')
  @UseGuards(SuperAdminGuard)
  async adminReactivateUser(@Param('id') id: string) {
    return this.usersService.reactivateUser(id);
  }

  @Put('admin/:id/password')
  @UseGuards(SuperAdminGuard)
  async adminResetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Request() req,
  ) {
    return this.usersService.changePassword(
      id,
      '',
      body.newPassword,
      req.user.userId,
      undefined, // No org restriction
      true, // Admin reset
    );
  }
}