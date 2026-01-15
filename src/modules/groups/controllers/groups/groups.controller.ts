import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GroupsService } from '../../services/groups/groups.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post('')
  async createGroup(@Body() payload: any, @Request() req) {
    return this.groupsService.createGroup(payload, req.user.orgId);
  }

  @Get('')
  async getGroups(@Request() req) {
    return this.groupsService.getGroups(req.user.orgId);
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string, @Request() req) {
    return this.groupsService.deleteGroup(id, req.user.orgId);
  }
}