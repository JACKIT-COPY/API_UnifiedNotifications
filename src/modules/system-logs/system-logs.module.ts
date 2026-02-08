import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemLogsService } from './services/system-logs.service';
import { SystemLogsController } from './controllers/system-logs.controller';
import { RequestLogSchema } from 'src/schemas/request-log.schema';
import { MessageLogsModule } from '../messages-logs/message-logs.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'RequestLog', schema: RequestLogSchema }]),
    MessageLogsModule,
  ],
  providers: [SystemLogsService, LoggingInterceptor],
  controllers: [SystemLogsController],
  exports: [SystemLogsService, LoggingInterceptor],
})
export class SystemLogsModule { }
