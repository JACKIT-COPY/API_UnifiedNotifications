/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LancolaSmsService } from './services/lancola-sms/lancola-sms.service';
import { OrganizationsModule } from 'src/modules/organizations/organizations.module';

@Module({
  imports: [ConfigModule, OrganizationsModule],
  providers: [LancolaSmsService],
  exports: [LancolaSmsService],
})
@Global()
export class LancolaSmsModule {}