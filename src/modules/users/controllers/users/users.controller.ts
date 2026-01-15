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

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}