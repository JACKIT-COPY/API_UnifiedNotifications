import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageLogsController } from './controllers/message-logs/message-logs.controller';
import { MessageLogsService } from './services/message-logs/message-logs.service';
import { MessageLogSchema } from 'src/schemas/message-log.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'MessageLog', schema: MessageLogSchema }])],
  controllers: [MessageLogsController],
  providers: [MessageLogsService],
  exports: [MessageLogsService],  // Export for NotificationsService
})
export class MessageLogsModule {}