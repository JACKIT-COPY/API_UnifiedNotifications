import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { ContactsModule } from '../contacts/contacts.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { NotificationsService } from './services/notifications/notifications.service';
import { NotificationsController } from './controllers/notifications/notifications.controller';
import { LancolaSmsModule } from 'src/integrations/lancola-sms/lancola-sms.module';
import { LancolaEmailModule } from 'src/integrations/lancola-email/lancola-email.module';
import { LancolaWhatsAppModule } from 'src/integrations/lancola-whatsapp/lancola-whatsapp.module';
import { MessageLogsModule } from '../messages-logs/message-logs.module';

import { SchedulingService } from './services/notifications/scheduling.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UsersModule,
    ContactsModule,
    LancolaSmsModule,
    LancolaEmailModule,
    LancolaWhatsAppModule,
    MessageLogsModule,
    OrganizationsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, SchedulingService],
  exports: [NotificationsService],
})
export class NotificationsModule { }