import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from '../../services/notifications/notifications.service';
import { LancolaSmsService } from 'src/integrations/lancola-sms/services/lancola-sms/lancola-sms.service';
import { UsersService } from 'src/modules/users/services/users/users.service';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,

    ) { }

    @Post('send')
    async sendNotificationToAllUsers(@Body() body:any): Promise<string> {
        console.log(body);
        await this.notificationsService.sendNotificationToAllUsers(body);
        return 'Notifications sent to all users';
    }
}
