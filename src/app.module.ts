import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LancolaSmsModule } from './integrations/lancola-sms/lancola-sms.module';

@Module({
  imports: [UsersModule, NotificationsModule, LancolaSmsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
