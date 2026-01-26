// src/modules/campaigns/campaigns.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignsController } from './controllers/campaigns/campaigns.controller';
import { CampaignsService } from './services/campaigns/campaigns.service';
import { CampaignSchema } from 'src/schemas/campaign.schema';
import { NotificationsModule } from 'src/modules/notifications/notifications.module'; // Must be here
import { MessageLogsModule } from 'src/modules/messages-logs/message-logs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ContactsModule } from 'src/modules/contacts/contacts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Campaign', schema: CampaignSchema }]),
    NotificationsModule,          // ← Ensure this is imported (provides NotificationsService)
    MessageLogsModule,            // Provides MessageLogsService
    ScheduleModule.forRoot(),     // For @Cron
    ContactsModule,               // Provides ContactsService
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}