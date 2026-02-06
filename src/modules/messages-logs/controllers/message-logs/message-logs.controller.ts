import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard';
import { MessageLogsService } from '../../services/message-logs/message-logs.service';

@Controller('message-logs')
@UseGuards(JwtAuthGuard)
export class MessageLogsController {
  constructor(private messageLogsService: MessageLogsService) { }

  @Get('')
  async getLogs(@Request() req, @Query() filters: any) {
    return this.messageLogsService.getLogs(req.user.orgId, filters);
  }

  @Get('all')
  @UseGuards(SuperAdminGuard)
  async getAllLogs(@Query() filters: any) {
    return this.messageLogsService.getAllLogs(filters);
  }
}