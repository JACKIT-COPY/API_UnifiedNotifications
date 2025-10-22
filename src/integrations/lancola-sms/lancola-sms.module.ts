/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LancolaSmsService } from './services/lancola-sms/lancola-sms.service';

@Module({
  imports: [ConfigModule],
  providers: [LancolaSmsService],
  exports: [LancolaSmsService],
})
@Global()
export class LancolaSmsModule {}