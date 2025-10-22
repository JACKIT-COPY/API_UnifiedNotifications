import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LancolaSmsModule } from './integrations/lancola-sms/lancola-sms.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
     UsersModule, 
     NotificationsModule, 
     LancolaSmsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

