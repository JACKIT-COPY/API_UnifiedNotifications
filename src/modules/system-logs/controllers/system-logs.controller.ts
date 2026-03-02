import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SystemLogsService } from '../services/system-logs.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard';

@Controller('system-logs')
@UseGuards(JwtAuthGuard)
export class SystemLogsController {
    constructor(private readonly systemLogsService: SystemLogsService) { }

    @Get()
    async getLogs(@Request() req, @Query() filters: any) {
        // If not superadmin, force orgId filter
        const orgId = req.user.role === 'superadmin' ? filters.orgId : req.user.orgId;
        return this.systemLogsService.getLogs(orgId, filters);
    }

    @Get('all')
    @UseGuards(SuperAdminGuard)
    async getAllLogs(@Query() filters: any) {
        return this.systemLogsService.getLogs(null, filters);
    }
}
