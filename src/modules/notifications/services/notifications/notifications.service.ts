import { Injectable } from '@nestjs/common';
import { LancolaSmsService } from 'src/integrations/lancola-sms/services/lancola-sms/lancola-sms.service';
import { UsersService } from 'src/modules/users/services/users/users.service';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly lancolaSmsService: LancolaSmsService,
        private readonly usersService: UsersService
    ) { }



   async sendNotificationToAllUsers(body:any) {
    const message = body.message;
        const users = await this.usersService.getUsers();
        // const message="Hello from Unified API";
        for (const user of users) {
            await this.lancolaSmsService.sendSMS({ phone: user, message });
        }
}
}
