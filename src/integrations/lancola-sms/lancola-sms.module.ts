/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { LancolaSmsService } from './services/lancola-sms/lancola-sms.service';
// import { DatabaseService } from 'src/database/database.service';

const providers: any[] = [LancolaSmsService,];


@Module({
  providers,
  exports: providers,
})
@Global()
export class LancolaSmsModule { }
