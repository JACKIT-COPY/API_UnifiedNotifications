import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { NotificationsService } from './services/notifications/notifications.service';
import { NotificationsController } from './controllers/notifications/notifications.controller';
import { LancolaSmsModule } from 'src/integrations/lancola-sms/lancola-sms.module';

@Module({
    imports: [],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [],
})
export class NotificationsModule {}
