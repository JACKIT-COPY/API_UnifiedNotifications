import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemLogsService } from '../services/system-logs.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard';

@Controller('system-logs')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SystemLogsController {
    constructor(private readonly systemLogsService: SystemLogsService) { }

    @Get()
    async getLogs(@Query() filters: any) {
        return this.systemLogsService.getLogs(filters);
    }
}
