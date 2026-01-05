import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { NotificationsService } from './services/notifications/notifications.service';
import { NotificationsController } from './controllers/notifications/notifications.controller';
import { LancolaSmsModule } from 'src/integrations/lancola-sms/lancola-sms.module';
import { LancolaEmailModule } from 'src/integrations/lancola-email/lancola-email.module';
import { LancolaWhatsAppModule } from 'src/integrations/lancola-whatsapp/lancola-whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UsersModule,
    LancolaSmsModule,
    LancolaEmailModule,
    LancolaWhatsAppModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [],
})
export class NotificationsModule {}