import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageLogsController } from './controllers/message-logs/message-logs.controller';
import { MessageLogsService } from './services/message-logs/message-logs.service';
import { MessageLogSchema } from 'src/schemas/message-log.schema';
import { LogsGateway } from './gateways/logs.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'MessageLog', schema: MessageLogSchema }]),
    AuthModule,
  ],
  controllers: [MessageLogsController],
  providers: [MessageLogsService, LogsGateway],
  exports: [MessageLogsService, LogsGateway],  // Export for NotificationsService
})
export class MessageLogsModule { }