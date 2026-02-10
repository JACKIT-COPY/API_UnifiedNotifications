// src/modules/campaigns/controllers/campaigns/campaigns.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CombinedAuthGuard } from 'src/modules/auth/guards/combined-auth.guard';
import { CampaignsService } from '../../services/campaigns/campaigns.service';

@Controller('campaigns')
@UseGuards(CombinedAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Post()
  async createCampaign(@Body() data: any, @Request() req) {
    return this.campaignsService.createCampaign(data, req.user.orgId, req.user.userId);
  }

  @Get()
  async getCampaigns(@Request() req) {
    return this.campaignsService.getCampaigns(req.user.orgId);
  }

  @Get(':id')
  async getCampaignById(@Param('id') id: string, @Request() req) {
    return this.campaignsService.getCampaignById(id, req.user.orgId);
  }

  @Put(':id')
  async updateCampaign(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.campaignsService.updateCampaign(id, data, req.user.orgId);
  }

  @Post(':id/launch')
  async launchCampaign(@Param('id') id: string, @Request() req) {
    return this.campaignsService.launchCampaign(id, req.user.orgId, req.user.userId);
  }

  @Post(':id/cancel')
  async cancelCampaign(@Param('id') id: string, @Request() req) {
    return this.campaignsService.cancelCampaign(id, req.user.orgId);
  }
}